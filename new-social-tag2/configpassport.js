require('dotenv').config();
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const OAuth2Strategy = require('passport-oauth2');
const GitHubStrategy = require('passport-github2').Strategy;
const SpotifyStrategy = require('passport-spotify').Strategy;
const axios = require('axios');
const User = require('./modelsUser');

// Twitter Strategy
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: `${process.env.NEXT_PUBLIC_API_URL}/auth/twitter/callback`,
  passReqToCallback: true,
  proxy: true,
  includeEmail: true // Add this if you want email
},
async (req, token, tokenSecret, profile, done) => {
  try {
    console.log('Twitter profile received:', {
      id: profile.id,
      username: profile.username,
      sessionId: req.sessionID
    });

    // Try to find existing user
    let user = await User.findOne({ 'twitter.id': profile.id });
    
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
  profileFields: ['id', 'displayName', 'email']
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ $or: [{ 'facebook.id': profile.id }, { 'twitter.id': { $exists: true } }] });
    if (!user) {
      user = new User();
    }
    user.facebook = {
      id: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      token: accessToken
    };
    await user.save();
    return done(null, user);
  } catch (error) {
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
  state: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('LinkedIn profile:', profile);
    let user = await User.findOne({ $or: [{ 'linkedin.id': profile.id }, { 'twitter.id': { $exists: true } }] });
    if (!user) {
      user = new User({
        linkedin: {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          token: accessToken
        }
      });
    } else {
      user.linkedin = {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        token: accessToken
      };
    }
    await user.save();
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
  scope: ['user:email']
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ $or: [{ 'github.id': profile.id }, { 'twitter.id': { $exists: true } }] });
    if (!user) {
      user = new User();
    }
    user.github = {
      id: profile.id,
      username: profile.username,
      email: profile.emails[0].value,
      token: accessToken
    };
    await user.save();
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
},
async (accessToken, refreshToken, expires_in, profile, done) => {
  try {
    let user = await User.findOne({ $or: [{ 'spotify.id': profile.id }, { 'twitter.id': { $exists: true } }] });
    if (!user) {
      user = new User();
    }
    user.spotify = {
      id: profile.id,
      username: profile.username,
      email: profile.emails[0].value,
      token: accessToken
    };
    await user.save();
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
