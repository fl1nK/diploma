const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  descriptions: {
    type: Array,
    required: true,
  },
});

module.exports = mongoose.model('Image', imageSchema);
