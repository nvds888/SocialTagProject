const express = require('express');
const passport = require('passport');
const router = express.Router();

// In-memory store for OAuth tokens
const oauthTokens = new Map();

// Helper function to verify user exists/was created before session handling
async function ensureUserAndSession(req, res, next) {
  if (!req.user) {
    console.error('No user object found after authentication');
    return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
  }
  
  try {
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
router.get('/twitter', (req, res, next) => {
  // Generate a random token
  const tempToken = Math.random().toString(36).substring(7);
  
  // Store it in memory
  oauthTokens.set(tempToken, {
    timestamp: Date.now()
  });
  
  // Add it to the session
  req.session.oauthToken = tempToken;
  
  // Force session save before Twitter auth
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
    }
    console.log('Session saved with oauth token:', tempToken);
    passport.authenticate('twitter')(req, res, next);
  });
});

router.get('/twitter/callback',
  (req, res, next) => {
    console.log('Twitter callback - Session:', req.session);
    console.log('Stored OAuth tokens:', oauthTokens);
    
    passport.authenticate('twitter', { 
      failureRedirect: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login`
    })(req, res, next);
  },
  async (req, res) => {
    const username = req.user?.twitter?.username;
    if (username) {
      // Clear the temporary token
      if (req.session.oauthToken) {
        oauthTokens.delete(req.session.oauthToken);
        delete req.session.oauthToken;
      }
      
      try {
        await new Promise((resolve, reject) => {
          req.session.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        console.log('Twitter auth successful, redirecting to dashboard for:', username);
        res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${username}`);
      } catch (error) {
        console.error('Session save error in callback:', error);
        // Still redirect even if session save fails
        res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${username}`);
      }
    } else {
      console.error('No username found after successful authentication');
      res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
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
  if (req.isAuthenticated()) {
    const username = req.user.twitter?.username || req.user.username;
    res.json({ isAuthenticated: true, username: username });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of oauthTokens.entries()) {
    if (now - data.timestamp > 600000) { // 10 minutes
      oauthTokens.delete(token);
    }
  }
}, 60000); // Check every minute

module.exports = router;
