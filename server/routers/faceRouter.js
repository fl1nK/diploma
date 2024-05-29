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
  deleteDetectedUser,
} = require('../controllers/faceController');

const { exportUser } = require('../controllers/excelController');
const { registration, login } = require('../controllers/authController');

const authToken = require('../middleware/authMiddleware');
const {validateAuth} = require("../middleware/validateMiddleware");

const router = express.Router();

router.post('/registration', validateAuth , authToken, registration);
router.post('/login', validateAuth ,login);

router.get('/get-users', authToken, getAllUser);
router.post('/create-user', authToken, createUser);

router.get('/user/:id', authToken, getUser);
router.put('/user/:id', authToken, putUser);
router.delete('/user/:id', authToken, deleteUser);
router.post('/user/:id/upload-image', authToken, uploadImageForUser);
router.delete('/user/:userId/image/:imageId', authToken, deleteImageForUser);

router.get('/get-descriptors', authToken, getAllDescriptors);
router.post('/set-detected-user', authToken, setDetectedUser);
router.get('/get-detected-all-users', authToken, getDetectedAllUsers);
router.delete('/detected-user/:id', authToken, deleteDetectedUser);

router.post('/get-excel', exportUser);

module.exports = router;
