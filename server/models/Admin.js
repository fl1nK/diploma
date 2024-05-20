const { unique } = require('@tensorflow/tfjs-node');
const { Schema, model } = require('mongoose');

const adminSchema = new Schema({
  login: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

module.exports = model('Admin', adminSchema);
