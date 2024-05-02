const { Schema, model } = require('mongoose');

const faceSchema = new Schema({
  label: {
    type: String,
    required: true,
    unique: true,
  },
  descriptions: {
    type: Array,
    required: true,
  },
});

module.exports = model('Face', faceSchema);
