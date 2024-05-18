const { Schema, model } = require('mongoose');

const faceSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  middleName: {
    type: String,
    required: true,
  },
  images: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Image',
    },
  ],
  entryTime: {
    type: String,
  },
  outTime: {
    type: String,
  },
});

module.exports = model('Face', faceSchema);
