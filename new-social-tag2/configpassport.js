require('dotenv').config();
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const OAuth2Strategy = require('passport-oauth2');
const GitHubStrategy = require('passport-github2').Strategy;
const SpotifyStrategy = require('passport-spotify').Strategy;
const axios = require('axios');
const User = require('./modelsUser');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      console.error('Error in deserializeUser:', err);
      done(err, null);
    });
});

// Twitter Strategy
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: "http://localhost:5000/auth/twitter/callback"
},
async (token, tokenSecret, profile, done) => {
  try {
    let user = await User.findOne({ 'twitter.id': profile.id });
    if (!user) {
      user = new User({
        twitter: {
          id: profile.id,
          username: profile.username,
          token: token,
          tokenSecret: tokenSecret
        },
        username: profile.username // Add this line to save the username at the top level
      });
    } else {
      user.twitter = {
        id: profile.id,
        username: profile.username,
        token: token,
        tokenSecret: tokenSecret
      };
      user.username = profile.username; // Update the top-level username
    }
    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:5000/auth/facebook/callback",
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

// Custom LinkedIn Strategy
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
  callbackURL: 'http://localhost:5000/auth/linkedin/callback',
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

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/auth/github/callback",
  scope: ['user:email']  // This scope allows access to the user's email
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
}
));

passport.use(new SpotifyStrategy({
  clientID: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/auth/spotify/callback"
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

module.exports = passport;
