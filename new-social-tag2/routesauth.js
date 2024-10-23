const express = require('express');
const passport = require('passport');
const router = express.Router();

// Helper function to verify user exists/was created before session handling
async function ensureUserAndSession(req, res, next) {
  if (!req.user) {
    console.error('No user object found after authentication');
    return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
  }
  
  try {
    console.log('Ensuring user session with user:', req.user);
    
    // Regenerate session for security
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Set session data
    req.session.user = req.user;
    
    // Save session
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    next();
  } catch (error) {
    console.error('Session handling error:', error);
    next(error);
  }
}

// Twitter Routes
router.get('/twitter', async (req, res, next) => {
  try {
    // Set up the session exactly as passport-twitter expects it
    const requestToken = Math.random().toString(36).substring(7);
    
    // This is the exact format passport-twitter looks for
    req.session['oauth:twitter:request_token'] = requestToken;
    req.session['oauth:twitter:request_token_secret'] = Math.random().toString(36).substring(7);

    console.log('Setting session data:', {
      requestToken,
      sessionKeys: Object.keys(req.session)
    });

    // Force save and verify
    await new Promise((resolve) => {
      req.session.save(() => {
        console.log('Session after save:', {
          hasToken: !!req.session['oauth:twitter:request_token'],
          keys: Object.keys(req.session)
        });
        resolve();
      });
    });

    // Authenticate with Twitter
    passport.authenticate('twitter')(req, res, next);

  } catch (error) {
    console.error('Error in Twitter auth:', error);
    return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
  }
});

router.get('/twitter/callback',
  (req, res, next) => {
    console.log('Callback session data:', {
      hasSession: !!req.session,
      requestToken: req.session['oauth:twitter:request_token'],
      sessionKeys: Object.keys(req.session)
    });

    passport.authenticate('twitter', { 
      failureRedirect: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login`
    })(req, res, next);
  },
  async (req, res) => {
    if (!req.user) {
      console.error('No user data after authentication');
      return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
    }

    const username = req.user?.twitter?.username;
    if (!username) {
      console.error('No username in user data:', req.user);
      return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
    }

    // Save updated session
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          reject(err);
        } else {
          console.log('Session saved with user:', username);
          resolve();
        }
      });
    });

    console.log('Auth successful, redirecting for user:', username);
    res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${username}`);
  }
);

// Facebook Routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  ensureUserAndSession,
  (req, res) => {
    const username = req.user?.facebook?.name;
    if (username) {
      res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${username}`);
    } else {
      res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
    }
  }
);

// LinkedIn Routes
router.get('/linkedin', passport.authenticate('linkedin', { 
  scope: ['openid', 'profile', 'email'],
  state: true 
}));

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  ensureUserAndSession,
  (req, res) => {
    const username = req.user?.linkedin?.name;
    if (username) {
      res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${username}`);
    } else {
      res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
    }
  }
);

// GitHub Routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  ensureUserAndSession,
  (req, res) => {
    const username = req.user?.github?.username;
    if (username) {
      res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${username}`);
    } else {
      res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
    }
  }
);

// Spotify Routes
router.get('/spotify', passport.authenticate('spotify', { 
  scope: ['user-read-private', 'user-read-email'] 
}));

router.get('/spotify/callback',
  passport.authenticate('spotify', { failureRedirect: '/login' }),
  ensureUserAndSession,
  (req, res) => {
    const username = req.user?.spotify?.username;
    if (username) {
      res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${username}`);
    } else {
      res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
    }
  }
);

router.get('/checkAuth', (req, res) => {
  console.log('CheckAuth - Session data:', {
    sessionExists: !!req.session,
    isAuthenticated: req.isAuthenticated(),
    sessionId: req.sessionID,
    sessionKeys: Object.keys(req.session),
    requestToken: req.session?.['oauth:twitter:request_token'],
    user: req.user
  });

  if (req.isAuthenticated()) {
    const username = req.user.twitter?.username || req.user.username;
    res.json({ isAuthenticated: true, username: username });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Debug route to check session
router.get('/debug-session', (req, res) => {
  res.json({
    sessionExists: !!req.session,
    sessionId: req.sessionID,
    sessionKeys: Object.keys(req.session),
    requestToken: req.session?.['oauth:twitter:request_token'],
    cookie: req.session?.cookie,
    user: req.user
  });
});

module.exports = router;
