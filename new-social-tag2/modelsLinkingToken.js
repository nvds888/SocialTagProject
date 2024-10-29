const mongoose = require('mongoose');

const LinkingTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  twitterUsername: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['github', 'facebook', 'linkedin', 'spotify'] // platforms that need linking
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // document will be automatically deleted after 5 minutes
  }
});

const LinkingToken = mongoose.model('LinkingToken', LinkingTokenSchema);
module.exports = LinkingToken;