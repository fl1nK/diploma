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
});

module.exports = model('DetectedUser', detectedUser);
