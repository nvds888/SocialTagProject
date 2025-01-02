const mongoose = require('mongoose');

// Define the view history schema
const ViewHistorySchema = new mongoose.Schema({
  ip: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Define schema for rewards from Immersve transactions
const ImmersveRewardSchema = new mongoose.Schema({
  assetId: Number,
  amount: Number,
  txId: String,
  timestamp: Date
});

// Define schema for Immersve transactions
const ImmersveTransactionSchema = new mongoose.Schema({
  usdcAmount: Number,
  timestamp: Date,
  txId: String,
  isInnerTx: {
    type: Boolean,
    default: false
  },
  rewards: [ImmersveRewardSchema],
  processed: {
    type: Boolean,
    default: false
  },
  isHistorical: {
    type: Boolean,
    default: false
  }
});

// Main User Schema
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
    assetId: String
  },
  walletAddress: {
    type: String,
    default: null
  },
  saveWalletAddress: {
    type: Boolean,
    default: true
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
  },
  immersveAddress: {
    type: String,
    default: null
  },
  immersveRewardAddress: {
    type: String,
    default: null
  },
  // Immersve related fields
  immersveTransactions: [ImmersveTransactionSchema],
  optedInAssets: [Number],
  lastProcessedTimestamp: {
    type: Date,
    default: null
  },
  // View history tracking
  viewHistory: [ViewHistorySchema]
}, {
  timestamps: true
});

// Add indexes for better performance
UserSchema.index({ 'twitter.id': 1 });
UserSchema.index({ 'facebook.id': 1 });
UserSchema.index({ 'linkedin.id': 1 });
UserSchema.index({ 'github.id': 1 });
UserSchema.index({ 'spotify.id': 1 });
UserSchema.index({ 'twitter.username': 1 }); // Add index for twitter username searches
UserSchema.index({ 'viewHistory.ip': 1, 'viewHistory.timestamp': 1 }); // Add index for view history
UserSchema.index({ 'immersveAddress': 1 }); // Add index for Immersve address lookups
UserSchema.index({ 'immersveRewardAddress': 1 }); // Add index for reward address lookups
UserSchema.index({ 'immersveTransactions.timestamp': 1 }); // Add index for transaction queries
UserSchema.index({ 'immersveTransactions.processed': 1 }); // Add index for unprocessed transaction queries

// Add a method to validate user
UserSchema.methods.isValid = function() {
  return !!(this.twitter?.id || this.facebook?.id || this.linkedin?.id || this.github?.id || this.spotify?.id);
};

const User = mongoose.model('User', UserSchema);
module.exports = User;