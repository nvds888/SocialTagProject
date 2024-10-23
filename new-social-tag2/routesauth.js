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
    // Store OAuth token data exactly as passport-oauth1 expects
    req.session.oauth = {};
    req.session.oauth.twitter = {
      oauth_token: Math.random().toString(36).substring(7),
      oauth_token_secret: Math.random().toString(36).substring(7)
    };

    // Required by passport-twitter
    req.session.oauth.twitter.request_token = req.session.oauth.twitter.oauth_token;
    req.session.oauth.twitter.request_token_secret = req.session.oauth.twitter.oauth_token_secret;

    console.log('Pre-auth Session:', {
      sessionId: req.sessionID,
      oauth: req.session.oauth,
      oauth_data: req.session.oauth.twitter
    });

    // Force session save before proceeding
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          reject(err);
        } else {
          console.log('Session saved successfully');
          resolve();
        }
      });
    });

    return passport.authenticate('twitter', {
      callbackURL: `${process.env.NEXT_PUBLIC_API_URL}/auth/twitter/callback`,
      keepSessionInfo: true
    })(req, res, next);

  } catch (error) {
    console.error('Twitter auth error:', error);
    return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
  }
});

router.get('/twitter/callback',
  (req, res, next) => {
    console.log('Twitter callback - Session data:', {
      sessionId: req.sessionID,
      oauth: req.session?.oauth?.twitter,
      all_session_data: req.session
    });

    // Try to restore session if needed
    if (!req.session.oauth?.twitter?.oauth_token && req.query.oauth_token) {
      req.session.oauth = {
        twitter: {
          oauth_token: req.query.oauth_token,
          oauth_token_secret: req.session.oauth?.twitter?.oauth_token_secret
        }
      };
    }

    passport.authenticate('twitter', { 
      failureRedirect: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login`,
      keepSessionInfo: true,
      callbackURL: `${process.env.NEXT_PUBLIC_API_URL}/auth/twitter/callback`
    })(req, res, next);
  },
  async (req, res) => {
    try {
      console.log('Authentication successful, user:', {
        id: req.user?._id,
        username: req.user?.twitter?.username
      });

      if (!req.user) {
        console.error('No user object after authentication');
        return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
      }

      const username = req.user?.twitter?.username;
      if (!username) {
        console.error('No username in user data:', req.user);
        return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
      }

      // Save session
      await new Promise((resolve) => req.session.save(resolve));

      console.log('Redirecting to dashboard for:', username);
      return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${username}`);
    } catch (error) {
      console.error('Callback error:', error);
      return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
    }
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
    sessionKeys: req.session ? Object.keys(req.session) : [],
    oauth: req.session?.oauth,
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
    sessionKeys: req.session ? Object.keys(req.session) : [],
    oauth: req.session?.oauth,
    cookie: req.session?.cookie,
    user: req.user
  });
});

module.exports = router;
