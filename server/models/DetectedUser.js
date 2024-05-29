const { Schema, model } = require('mongoose');

const detectedUser = new Schema({
  userID: {
    type: Schema.Types.ObjectId,
    ref: 'Face',
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model('DetectedUser', detectedUser);
