const fs = require('fs');
const path = require('path');

const faceapi = require('@vladmandic/face-api');
require('@tensorflow/tfjs-node');

const { Canvas, Image } = require('canvas');
faceapi.env.monkeyPatch({ Canvas, Image });
const canvas = require('canvas');

const FaceModel = require('../models/Face');
const ImageModel = require('../models/Image');
const DetectedUser = require('../models/DetectedUser');

const { createUserDB, savePhoto } = require('./utils/faceUtils');

async function getAllUser(req, res) {
  try {
    const faces = await FaceModel.find();

    return res.json(faces);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function createUser(req, res) {
  const label = req.body;

  const result = await createUserDB(req.files, label);

  if (result) {
    return res.status(200).json({ message: 'Дані робітника успішно збережено' });
  } else {
    return res.status(500).json({ message: 'Щось пішло не так, спробуйте ще раз.' });
  }
}

async function getUser(req, res) {
  const { id } = req.params;

  try {
    const user = await FaceModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Користувач не знайдений' });
    }

    const images = await ImageModel.find({ _id: { $in: user.images } });
    user.images = images;

    return res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function putUser(req, res) {
  const { id } = req.params;
  const { firstName, lastName, middleName, entryTime, outTime } = req.body;

  try {
    const user = await FaceModel.findByIdAndUpdate(
      id,
      { firstName, lastName, middleName, entryTime, outTime },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: 'Користувач не знайдений' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const user = await FaceModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Користувач не знайдений' });
    }

    for (const imageId of user.images) {
      const image = await ImageModel.findById(imageId);

      if (image) {
        const filePath = path.join(__dirname, '../data', image.url);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Не вдалося видалити файл: ${filePath}`, err);
          }
        });

        await ImageModel.findByIdAndDelete(imageId);
      }
    }

    await DetectedUser.deleteMany({ userID: id });
    await FaceModel.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Дані успішно видалені' });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function uploadImageForUser(req, res) {
  const { id } = req.params;

  try {
    const user = await FaceModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Користувач не знайдений' });
    }

    const { files } = req;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: 'Файл не було завантажено' });
    }
    const fieldName = `image`;

    const img = await canvas.loadImage(files[fieldName].tempFilePath);

    const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

    let url = await savePhoto(files[fieldName]);

    const newImage = new ImageModel({
      url: url,
      descriptions: detections.descriptor,
    });
    const newImageModel = await newImage.save();

    user.images.push(newImageModel);
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function deleteImageForUser(req, res) {
  const { userId, imageId } = req.params;

  try {
    const user = await FaceModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Користувач не знайдений' });
    }

    const image = await ImageModel.findById(imageId);
    if (!image) {
      return res.status(404).json({ message: 'Фотографія не знайдена' });
    }

    const filePath = path.join(__dirname, '../data', image.url);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Не вдалося видалити файл: ${filePath}`, err);
      }
    });

    user.images.pull(imageId);
    await user.save();

    await ImageModel.findByIdAndDelete(imageId);

    res.status(200).json({ message: 'Фотографія успішно видалена' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function getAllDescriptors(req, res) {
  try {
    let users = await FaceModel.find().lean();

    users.forEach((obj) => {
      obj['descriptions'] = [];
    });

    for (const user of users) {
      for (const imageId of user.images) {
        const image = await ImageModel.findById(imageId);
        if (image) {
          user.descriptions.push(image.descriptions[0]);
        }
      }
      user.images = '';
    }

    // console.log(users);
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function setDetectedUser(req, res) {
  try {
    const { id } = req.body;

    const user = await FaceModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Користувач не знайдений' });
    }

    const entryTime = user.entryTime;
    const outTime = user.outTime;

    const currentDate = new Date();
    const currentTime = currentDate.getHours() * 60 + currentDate.getMinutes(); // Переведемо поточний час в хвилини для зручності порівняння

    const entryTimeMinutes = parseInt(entryTime.slice(0, 2)) * 60 + parseInt(entryTime.slice(3, 5));
    const outTimeMinutes = parseInt(outTime.slice(0, 2)) * 60 + parseInt(outTime.slice(3, 5));

    let status;
    if (currentTime < entryTimeMinutes) {
      status = 'Раніше';
    } else if (currentTime >= entryTimeMinutes && currentTime <= outTimeMinutes) {
      status = 'Запізнюється';
    } else if (currentTime > outTimeMinutes) {
      status = 'Закінчив';
    }

    const formattedDate = currentDate.toLocaleDateString('uk-UA');
    const formattedTime = currentDate.toLocaleTimeString('uk-UA');

    const createFace = new DetectedUser({
      userID: id,
      date: formattedDate,
      time: formattedTime,
      status: status,
    });
    await createFace.save();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getDetectedAllUsers(req, res) {
  try {
    const detectedUsers = await DetectedUser.find()
      .populate('userID', 'firstName lastName middleName entryTime outTime')
      .sort({ date: -1, time: -1 });

    return res.json(detectedUsers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function deleteDetectedUser(req, res) {
  try {
    const { id } = req.params;

    const detectedUser = await DetectedUser.findByIdAndDelete(id);

    if (!detectedUser) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    return res.status(200).json({ message: 'Дані успішно видалені' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
module.exports = {
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
};
