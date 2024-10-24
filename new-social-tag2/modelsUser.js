const mongoose = require('mongoose');

// Define the view history schema
const ViewHistorySchema = new mongoose.Schema({
  ip: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: { expires: '6h' } // Automatically remove records after 6 hours
  }
});

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
    isPermanentafy: {
      type: Boolean,
      default: false
    }
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
  },
  // Add view history tracking
  viewHistory: [ViewHistorySchema],
  // Add hardcoded status fields
  isDataHardcoded: {
    type: Boolean,
    default: false
  },
  assetConfigurationTxId: {
    type: String
  }
}, { 
  timestamps: true 
});

// Add compound index for view history to improve query performance
UserSchema.index({ 'viewHistory.ip': 1, 'viewHistory.timestamp': 1 });

// Add indexes for better performance
UserSchema.index({ 'twitter.id': 1 });
UserSchema.index({ 'twitter.username': 1 }); // Add index for twitter username searches
UserSchema.index({ 'facebook.id': 1 });
UserSchema.index({ 'linkedin.id': 1 });
UserSchema.index({ 'github.id': 1 });
UserSchema.index({ 'spotify.id': 1 });

// Add a method to validate user
UserSchema.methods.isValid = function() {
  return !!(this.twitter?.id || this.facebook?.id || this.linkedin?.id || this.github?.id || this.spotify?.id);
};

// Add method to clean up old view history
UserSchema.methods.cleanupViewHistory = function() {
  const sixHoursAgo = new Date(Date.now() - (6 * 60 * 60 * 1000));
  this.viewHistory = this.viewHistory.filter(view => 
    view.timestamp > sixHoursAgo
  );
};

// Add method to check if IP has viewed recently
UserSchema.methods.hasRecentView = function(ip) {
  const sixHoursAgo = new Date(Date.now() - (6 * 60 * 60 * 1000));
  return this.viewHistory.some(view => 
    view.ip === ip && view.timestamp > sixHoursAgo
  );
};

// Add method to add new view
UserSchema.methods.addView = function(ip) {
  if (!this.hasRecentView(ip)) {
    this.viewHistory.push({
      ip: ip,
      timestamp: new Date()
    });
    this.profileViews += 1;
    return true;
  }
  return false;
};

// Pre-save middleware to clean up old view history
UserSchema.pre('save', function(next) {
  if (this.isModified('viewHistory')) {
    this.cleanupViewHistory();
  }
  next();
});

// Add virtual for formatted verification date
UserSchema.virtual('lastVerificationDate').get(function() {
  if (this.verifications && this.verifications.length > 0) {
    const lastVerification = this.verifications[this.verifications.length - 1];
    return lastVerification.timestamp.toISOString();
  }
  return null;
});

// Ensure virtuals are included in JSON output
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret, options) {
    delete ret.twitter.token;
    delete ret.twitter.tokenSecret;
    delete ret.facebook.token;
    delete ret.linkedin.token;
    delete ret.github.token;
    delete ret.spotify.token;
    return ret;
  }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;