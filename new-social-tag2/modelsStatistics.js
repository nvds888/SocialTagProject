const mongoose = require('mongoose');

const RewardTransactionSchema = new mongoose.Schema({
  txId: String,
  amount: Number,
  assetId: Number,
  token: String,
  recipientAddress: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const StatisticsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['reward_pool']
  },
  socials_distributed: {
    type: Number,
    default: 0
  },
  rewardTransactions: [RewardTransactionSchema]
}, { 
  timestamps: true 
});

const Statistics = mongoose.model('Statistics', StatisticsSchema);
module.exports = Statistics;