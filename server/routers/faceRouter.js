const express = require('express');
const {
  handlerCheckFaceImage,
  handlerCheckFaceVideo,
  handlerCreateFaceUser,
} = require('../controllers/faceController');

const router = express.Router();

router.post('/check-face-image', handlerCheckFaceImage);

router.post('/check-face-video', handlerCheckFaceVideo);

router.post('/post-face', handlerCreateFaceUser);

module.exports = router;
