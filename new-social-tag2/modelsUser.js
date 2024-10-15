const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  twitter: {
    id: String,
    username: String,
    token: String,
    tokenSecret: String
  },
  facebook: {
    id: String,
    name: String,
    email: String,
    token: String
  },
  linkedin: {
    id: String,
    name: String,
    email: String,
    token: String
  },
  github: {
    id: String,
    username: String,
    email: String,
    token: String
  },
  spotify: {
    id: String,
    username: String,
    email: String,
    token: String
  },
  verifications: [{
    id: String,
    timestamp: Date,
    twitter: String,
    facebook: String,
    linkedin: String,
    github: String,
    spotify: String,
    algorandTransactionId: String,
    stellarTransactionHash: String, 
  }],
  theme: {
    type: String,
    default: 'SocialTag'
  },
  cardStyle: {
    type: String,
    default: 'Default'
  },
  purchasedItems: {
    type: [String],
    default: []
  },
  bio: {
    type: String,
    maxlength: 250,
  },
  profileNFT: {
    id: String,
    name: String,
    image: String,
    url: String
  },
  nfd: {
    id: String,
    name: String,
  },
  profileViews: {
    type: Number,
    default: 0
  },
  rewardPoints: {
    type: Number,
    default: 0
  },
  reverifyCount: { 
    type: Number,
    default: 0 
  },
  baseVerifyPoints: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('User', UserSchema);