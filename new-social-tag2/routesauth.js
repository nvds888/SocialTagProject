const express = require('express');
const passport = require('passport');
const router = express.Router();

// Helper function to handle authentication callbacks
function handleAuthCallback(req, res, platform) {
  req.session.justAuthenticated = true;
  req.session.authenticatedPlatform = platform;
  const username = req.user.twitter?.username || req.user.username;
  if (username) {
    res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/${username}`);
  } else {
    console.error('Username not found in user object:', req.user);
    res.redirect(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/error`);
  }
}

// Twitter Routes
router.get('/twitter', passport.authenticate('twitter'));

router.get('/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('Twitter authentication successful');
    handleAuthCallback(req, res, 'twitter');
  }
);

// Facebook Routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('Facebook authentication successful');
    handleAuthCallback(req, res, 'facebook');
  }
);

// LinkedIn Routes
router.get('/linkedin', passport.authenticate('linkedin', { 
  scope: ['openid', 'profile', 'email'],
  state: true 
}));

router.get('/linkedin/callback', 
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('LinkedIn authentication successful');
    handleAuthCallback(req, res, 'linkedin');
  }
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('GitHub authentication successful');
    handleAuthCallback(req, res, 'github');
  }
);

router.get('/spotify', passport.authenticate('spotify', { scope: ['user-read-private', 'user-read-email'] }));

router.get('/spotify/callback',
  passport.authenticate('spotify', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('Spotify authentication successful');
    handleAuthCallback(req, res, 'spotify');
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

module.exports = router;
