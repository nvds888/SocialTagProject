const express = require('express');
const passport = require('passport');
const router = express.Router();
const LinkingToken = require('./modelsLinkingToken');
const crypto = require('crypto');

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

router.post('/create-linking-token', async (req, res) => {
  try {
    const { twitterUsername, platform } = req.body;
    if (!twitterUsername || !platform) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await LinkingToken.create({
      token,
      twitterUsername,
      platform
    });

    res.json({ token });
  } catch (error) {
    console.error('Error creating linking token:', error);
    res.status(500).json({ error: 'Failed to create linking token' });
  }
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ error: 'Error logging out' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Error destroying session' });
      }
      res.clearCookie('socialtagsession');  // Clear the session cookie
      res.json({ success: true });
    });
  });
});

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
      callbackURL: "https://social-tag.xyz/api/auth/twitter/callback",
      keepSessionInfo: true
    })(req, res, next);

  } catch (error) {
    console.error('Twitter auth error:', error);
    return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
  }
});

router.get('/twitter/callback', async (req, res, next) => {
  try {
    // Log query parameters from Twitter
    console.log('Twitter callback query params:', {
      oauth_token: req.query.oauth_token,
      oauth_verifier: req.query.oauth_verifier
    });

    // Manually set the oauth token from the query parameters
    if (req.query.oauth_token) {
      if (!req.session.oauth) {
        req.session.oauth = { twitter: {} };
      }
      req.session.oauth.twitter = {
        oauth_token: req.query.oauth_token,
        oauth_verifier: req.query.oauth_verifier
      };

      await new Promise((resolve) => req.session.save(resolve));
    }

    // Now authenticate with the tokens we have
    passport.authenticate('twitter', {
      successRedirect: undefined,
      failureRedirect: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`,
      failureMessage: true,
      passReqToCallback: true
    })(req, res, (err) => {
      if (err) {
        console.error('Passport authentication error:', err);
        return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
      }
      
      // If we get here, authentication was successful
      const username = req.user?.twitter?.username;
      if (username) {
        return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${username}`);
      } else {
        console.error('No username after successful auth:', req.user);
        return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
      }
    });
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
  }
});

// Facebook Routes
router.get('/facebook', (req, res, next) => {
  const { token } = req.query;
  console.log('Received linking token for Facebook:', token);
  
  passport.authenticate('facebook', { 
    scope: ['email'],
    state: token // Pass token as state parameter
  })(req, res, next);
});

router.get('/facebook/callback', 
  passport.authenticate('facebook', { 
    failureRedirect: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard` 
  }),
  async (req, res) => {
    try {
      if (!req.user || !req.user.linkingToken) {
        console.error('No user or linking token found');
        return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard`);
      }

      // Mark token as used
      await LinkingToken.findOneAndUpdate(
        { token: req.user.linkingToken.token },
        { used: true }
      );

      // Redirect to the correct dashboard
      const redirectUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${req.user.twitter.username}`;
      console.log('Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in Facebook callback:', error);
      return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard`);
    }
  }
);

// LinkedIn Routes
router.get('/linkedin', (req, res, next) => {
  const { token } = req.query;
  console.log('Received linking token for LinkedIn:', token);
  
  passport.authenticate('linkedin', { 
    scope: ['openid', 'profile', 'email'],
    state: token // Pass token as state parameter
  })(req, res, next);
});

router.get('/linkedin/callback', 
  passport.authenticate('linkedin', { 
    failureRedirect: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard` 
  }),
  async (req, res) => {
    try {
      if (!req.user || !req.user.linkingToken) {
        console.error('No user or linking token found');
        return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard`);
      }

      // Mark token as used
      await LinkingToken.findOneAndUpdate(
        { token: req.user.linkingToken.token },
        { used: true }
      );

      // Redirect to the correct dashboard
      const redirectUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${req.user.twitter.username}`;
      console.log('Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in LinkedIn callback:', error);
      return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard`);
    }
  }
);

// GitHub Routes
router.get('/github', (req, res, next) => {
  const { token } = req.query;
  console.log('Received linking token:', token);
  
  // Store token in session and also pass it as state parameter
  req.session.linkingToken = token;
  
  passport.authenticate('github', { 
    scope: ['user:email'],
    state: token // Pass token as state parameter
  })(req, res, next);
});

router.get('/github/callback', 
  passport.authenticate('github', { 
    failureRedirect: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard` 
  }),
  async (req, res) => {
    try {
      if (!req.user || !req.user.linkingToken) {
        console.error('No user or linking token found');
        return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard`);
      }

      // Now mark token as used
      await LinkingToken.findOneAndUpdate(
        { token: req.user.linkingToken.token },
        { used: true }
      );

      // Redirect to the correct dashboard
      const redirectUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${req.user.twitter.username}`;
      console.log('Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in GitHub callback:', error);
      return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard`);
    }
  }
);

// Spotify Routes
router.get('/spotify', (req, res, next) => {
  const { token } = req.query;
  console.log('Received linking token for Spotify:', token);
  
  passport.authenticate('spotify', { 
    scope: ['user-read-private', 'user-read-email'],
    state: token, // Pass token as state parameter
    showDialog: true // Force Spotify to show login dialog
  })(req, res, next);
});

// Spotify Routes
router.get('/spotify/callback', async (req, res, next) => {
  console.log('Spotify callback session state:', {
    hasSession: !!req.session,
    sessionID: req.sessionID,
    hasUser: !!req.user,
    state: req.query.state,
    code: !!req.query.code
  });

  try {
    passport.authenticate('spotify', {
      failureRedirect: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard`,
      failureMessage: true,
      passReqToCallback: true
    })(req, res, async (err) => {
      if (err) {
        console.error('Passport authentication error:', err);
        return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
      }
      
      try {
        if (!req.user || !req.user.linkingToken) {
          console.error('No user or linking token found in callback');
          return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard`);
        }

        // Mark token as used
        await LinkingToken.findOneAndUpdate(
          { token: req.user.linkingToken.token },
          { used: true }
        );

        // Redirect to the correct dashboard
        const redirectUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${req.user.twitter.username}`;
        console.log('Redirecting to:', redirectUrl);
        return res.redirect(redirectUrl);
      } catch (error) {
        console.error('Error in Spotify callback handler:', error);
        return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
      }
    });
  } catch (error) {
    console.error('Error in Spotify callback route:', error);
    return res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
  }
});

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
