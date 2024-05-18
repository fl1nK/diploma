const express = require('express');

const {
  getAllUser,
  getUser,
  createUser,
  putUser,
  deleteUser,
  uploadImageForUser,
  deleteImageForUser,
  getAllDescriptors,
  setDetectedUser,
  getDetectedAllUsers,
} = require('../controllers/faceController');

const { exportUser } = require('../controllers/excelController');

const router = express.Router();

// router.post('/check-face-image', handlerCheckFaceImage);

// router.post('/check-face-video', handlerCheckFaceVideo);

// router.post('/post-face', handlerCreateFaceUser);

// router.post('/detect-face', detectFace);
// router.post('/create-face-user', сreateFaceUser);

router.get('/get-users', getAllUser);
router.post('/create-user', createUser);

router.get('/user/:id', getUser);
router.put('/user/:id', putUser);
router.delete('/user/:id', deleteUser);
router.post('/user/:id/upload-image', uploadImageForUser);
router.delete('/user/:userId/image/:imageId', deleteImageForUser);

router.get('/get-descriptors', getAllDescriptors);
router.post('/set-detected-user', setDetectedUser);
router.get('/get-detected-all-users', getDetectedAllUsers);

router.post('/get-excel', exportUser);

module.exports = router;
