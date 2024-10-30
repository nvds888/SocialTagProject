require('dotenv').config();
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const OAuth2Strategy = require('passport-oauth2');
const GitHubStrategy = require('passport-github2').Strategy;
const SpotifyStrategy = require('passport-spotify').Strategy;
const LinkingToken = require('./modelsLinkingToken');
const axios = require('axios');
const User = require('./modelsUser');

// Twitter Strategy
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: `${process.env.NEXT_PUBLIC_API_URL}/auth/twitter/callback`,
  passReqToCallback: true
},
async (req, token, tokenSecret, profile, done) => {
  try {
    console.log('Twitter profile received:', {
      id: profile.id,
      username: profile.username,
      sessionId: req.sessionID
    });

    // Try to find existing user
    let user = await User.findOne({ 'twitter.username': profile.username });
    
    if (!user) {
      console.log('Creating new user for Twitter profile:', profile.id);
      user = new User({
        twitter: {
          id: profile.id,
          username: profile.username,
          token: token,
          tokenSecret: tokenSecret
        },
        username: profile.username,
        profileViews: 0,
        rewardPoints: 0
      });
    } else {
      console.log('Updating existing user:', user._id);
      user.twitter = {
        id: profile.id,
        username: profile.username,
        token: token,
        tokenSecret: tokenSecret
      };
      user.username = profile.username;
    }

    const savedUser = await user.save();
    console.log('User saved successfully:', {
      id: savedUser._id,
      username: savedUser.username
    });

    // Store in session
    req.session.user = savedUser;
    await new Promise((resolve) => req.session.save(resolve));

    return done(null, savedUser);
  } catch (error) {
    console.error('Twitter strategy error:', error);
    return done(error);
  }
}));

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${process.env.NEXT_PUBLIC_API_URL}/auth/facebook/callback`,
  profileFields: ['id', 'displayName', 'email'],
  passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
  try {
    const token = req.query.state;
    console.log('Processing Facebook auth with linking token:', token);

    // Find valid linking token with 5-minute validation
    const linkingToken = await LinkingToken.findOne({
      token: token,
      used: false,
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }
    });

    if (!linkingToken) {
      console.error('Invalid, expired, or used linking token');
      return done(null, false, { message: 'Invalid linking token' });
    }

    // Find user by Twitter username from token
    const user = await User.findOne({ 'twitter.username': linkingToken.twitterUsername });
    
    if (!user) {
      console.error('No user found with Twitter username:', linkingToken.twitterUsername);
      return done(null, false, { message: 'User not found' });
    }

    // Add Facebook to user
    user.facebook = {
      id: profile.id,
      name: profile.displayName,
      email: profile.emails[0]?.value,
      token: accessToken
    };

    await user.save();
    user.linkingToken = linkingToken;
    
    console.log('Successfully added Facebook to user:', linkingToken.twitterUsername);
    return done(null, user);
  } catch (error) {
    console.error('Error in Facebook strategy:', error);
    return done(error);
  }
}));

// LinkedIn Strategy
class LinkedInStrategy extends OAuth2Strategy {
  constructor(options, verify) {
    super(options, verify);
    this.name = 'linkedin';
    this._userProfileURL = 'https://api.linkedin.com/v2/userinfo';
  }

  userProfile(accessToken, done) {
    axios.get(this._userProfileURL, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(response => {
      const profile = response.data;
      done(null, profile);
    })
    .catch(error => {
      done(new Error('Failed to fetch user profile'));
    });
  }
}

passport.use('linkedin', new LinkedInStrategy({
  authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: `${process.env.NEXT_PUBLIC_API_URL}/auth/linkedin/callback`,
  scope: ['openid', 'profile', 'email'],
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const token = req.query.state;
    console.log('Processing LinkedIn auth with linking token:', token);

    // Find valid linking token with 5-minute validation
    const linkingToken = await LinkingToken.findOne({
      token: token,
      used: false,
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }
    });

    if (!linkingToken) {
      console.error('Invalid, expired, or used linking token');
      return done(null, false, { message: 'Invalid linking token' });
    }

    // Find user by Twitter username from token
    const user = await User.findOne({ 'twitter.username': linkingToken.twitterUsername });
    
    if (!user) {
      console.error('No user found with Twitter username:', linkingToken.twitterUsername);
      return done(null, false, { message: 'User not found' });
    }

    // Add LinkedIn to user
    user.linkedin = {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      token: accessToken
    };

    await user.save();
    user.linkingToken = linkingToken;
    
    console.log('Successfully added LinkedIn to user:', linkingToken.twitterUsername);
    return done(null, user);
  } catch (error) {
    console.error('Error in LinkedIn strategy:', error);
    return done(error);
  }
}));

// GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.NEXT_PUBLIC_API_URL}/auth/github/callback`,
  scope: ['user:email'],
  passReqToCallback: true
},
async (req, accessToken, refreshToken, profile, done) => {
  try {
    const token = req.query.state;
    console.log('Processing GitHub auth with linking token:', token);

    // Find valid linking token with 5-minute validation
    const linkingToken = await LinkingToken.findOne({
      token: token,
      used: false,
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }
    });

    if (!linkingToken) {
      console.error('Invalid, expired, or used linking token');
      return done(null, false, { message: 'Invalid linking token' });
    }

    // Find user by Twitter username from token
    const user = await User.findOne({ 'twitter.username': linkingToken.twitterUsername });
    
    if (!user) {
      console.error('No user found with Twitter username:', linkingToken.twitterUsername);
      return done(null, false, { message: 'User not found' });
    }

    // Add GitHub to user
    user.github = {
      id: profile.id,
      username: profile.username,
      email: profile.emails[0].value,
      token: accessToken
    };

    await user.save();
    user.linkingToken = linkingToken;
    
    console.log('Successfully added GitHub to user:', linkingToken.twitterUsername);
    return done(null, user);
  } catch (error) {
    console.error('Error in GitHub strategy:', error);
    return done(error);
  }
}));

// Spotify Strategy
passport.use(new SpotifyStrategy({
  clientID: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  callbackURL: `${process.env.NEXT_PUBLIC_API_URL}/auth/spotify/callback`,
  passReqToCallback: true
},
async (req, accessToken, refreshToken, expires_in, profile, done) => {
  try {
    // Get token from state parameter
    const token = req.query.state;
    console.log('Processing Spotify auth with linking token:', token);

    // Find valid linking token
    const linkingToken = await LinkingToken.findOne({
      token: token,
      used: false,
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }
    });

    if (!linkingToken) {
      console.error('Invalid, expired, or used linking token');
      return done(null, false, { message: 'Invalid linking token' });
    }

    // Find user by Twitter username from token
    const user = await User.findOne({ 'twitter.username': linkingToken.twitterUsername });
    
    if (!user) {
      console.error('No user found with Twitter username:', linkingToken.twitterUsername);
      return done(null, false, { message: 'User not found' });
    }

    // Add Spotify to user
    user.spotify = {
      id: profile.id,
      username: profile.username,
      email: profile.emails[0].value,
      token: accessToken
    };

    // Save user but DON'T mark token as used yet
    await user.save();
    
    // Add token to user object for the callback
    user.linkingToken = linkingToken;
    
    console.log('Successfully added Spotify to user:', linkingToken.twitterUsername);
    return done(null, user);
  } catch (error) {
    console.error('Error in Spotify strategy:', error);
    return done(error);
  }
}));

// Updated serialize/deserialize functions
passport.serializeUser((user, done) => {
  console.log('Serializing user:', {
    userId: user._id,
    username: user.username,
    timestamp: new Date()
  });
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user:', {
      userId: id,
      timestamp: new Date()
    });
    const user = await User.findById(id);
    if (!user) {
      console.warn('User not found during deserialization:', id);
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    console.error('Deserialization error:', err);
    done(err);
  }
});

module.exports = passport;
