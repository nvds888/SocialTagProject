const mongoose = require('mongoose');

const StatisticsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['reward_pool']
  },
  socials_distributed: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

const Statistics = mongoose.model('Statistics', StatisticsSchema);
module.exports = Statistics;