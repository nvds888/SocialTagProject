const mongoose = require('mongoose');

const ImmersveUserSchema = new mongoose.Schema({
  twitterUsername: {
    type: String,
    required: true,
    unique: true
  },
  immersveAddress: {
    type: String,
    required: true
  },
  rewardAddress: {
    type: String,
    required: true
  },
  transactions: [{
    amount: Number,
    timestamp: Date,
    txId: String
  }]
}, { 
  timestamps: true 
});

const ImmersveUser = mongoose.model('ImmersveUser', ImmersveUserSchema);
module.exports = ImmersveUser;