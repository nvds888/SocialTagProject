const mongoose = require('mongoose');

const OptInWalletSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true
});

const OptInWallet = mongoose.model('OptInWallet', OptInWalletSchema);
module.exports = OptInWallet;