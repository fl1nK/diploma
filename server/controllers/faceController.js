const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const faceapi = require('@vladmandic/face-api');
const tf = require('@tensorflow/tfjs-node');

const { Canvas, Image, createCanvas, loadImage } = require('canvas');
faceapi.env.monkeyPatch({ Canvas, Image });
const canvas = require('canvas');

const { exec } = require('child_process');
const FaceModel = require('../models/Face');
const ImageModel = require('../models/Image');
const DetectedUser = require('../models/DetectedUser');

const {
  uploadLabeledImages,
  getDetectedFaceForVideo,
  getDetectedFaceForImage,
  getAllDescriptorsFromDB,
  createUserDB,
  savePhoto,
} = require('./utils/faceUtils');

async function handlerCheckFaceImage(req, res) {
  const File1 = req.files.File1.tempFilePath;
  let result = await getDetectedFaceForImage(File1);
  return res.json({ result });
}

async function handlerCheckFaceVideo(req, res) {
  if (!req.files.video) {
    return res.status(400).json({ message: 'No video file uploaded' });
  }

  const videoFile = req.files.video;
  const tempFilePath = videoFile.tempFilePath;

  // Move uploaded file to temp directory
  videoFile.mv(tempFilePath, async (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    // Use ffmpeg to extract frames from the video
    exec(
      `ffmpeg -i ${tempFilePath} -vf fps=1 ./tmp/frame-%d.jpg`,
      async (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          return res.status(500).send(error);
        }

        const files = fs.readdirSync('./tmp');
        const images = files.filter((file) => file.endsWith('.jpg')).map((file) => `./tmp/${file}`);

        // Process each frame to find faces
        let result = [];
        for (let i = 0; i < images.length; i++) {
          result.push(await getDetectedFaceForVideo(images[i]));
        }

        let finalResults = [];
        // Створити об'єкт, який буде містити групи за міткою
        let labelGroups = {};
        for (let i = 0; i < result.length; i++) {
          let item = result[i];
          if (item.length > 0) {
            let label = item[0]._label;
            if (!labelGroups[label]) {
              labelGroups[label] = [];
            }
            labelGroups[label].push(item[0].frame);
          }
        }

        // Створити об'єкти за групами міток та відповідними масивами frame
        for (const label in labelGroups) {
          finalResults.push({
            _label: label,
            frame: labelGroups[label],
          });
        }

        console.log(finalResults);

        // Remove temp files
        // fs.unlinkSync(tempFilePath);
        files.forEach((file) => fs.unlinkSync(`./tmp/${file}`));

        return res.json({ finalResults });
      },
    );
  });
}

async function handlerCreateFaceUser(req, res) {
  const File1 = req.files.File1.tempFilePath;
  const File2 = req.files.File2.tempFilePath;
  const File3 = req.files.File3.tempFilePath;
  const label = req.body.label;

  let result = await uploadLabeledImages([File1, File2, File3], label);
  if (result) {
    return res.json({ message: 'Face data stored successfully' });
  } else {
    return res.json({ message: 'Something went wrong, please try again.' });
  }
}

async function detectFace(req, res) {
  try {
    const video = req.files.video; // Assuming you are using Multer middleware for handling file uploads

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    return res.json({ detections });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
async function сreateFaceUser(req, res) {
  const label = req.body;

  const filesCount = Object.keys(req.files).length;

  const photos = [];
  for (let i = 1; i <= filesCount; i++) {
    const fieldName = `photo${i}`;
    if (req.files[fieldName]) {
      photos.push(req.files[fieldName].tempFilePath);
    }
  }

  let result = await test(photos, label);

  if (result) {
    return res.status(200).json({ message: 'Дані обличчя успішно збережено' });
  } else {
    return res.status(500).json({ message: 'Щось пішло не так, спробуйте ще раз.' });
  }
}
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
    // console.log(user);

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

    // Read each face and save the face descriptions in the descriptions array
    const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

    // Save image to server and get its URL
    let url = await savePhoto(files[fieldName]);

    const newImage = new ImageModel({
      url: url,
      descriptions: detections.descriptor, // Assuming this is how you want to store descriptions for each image
    });
    const newImageModel = await newImage.save();

    // Додавання фотографії до користувача
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

    // Видалення фотографії з диска
    const filePath = path.join(__dirname, '../data', image.url);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Не вдалося видалити файл: ${filePath}`, err);
      }
    });

    // Видалення фотографії з моделі користувача
    user.images.pull(imageId);
    await user.save();

    // Видалення фотографії з колекції ImageModel
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

    // Перебираємо кожен об'єкт у масиві
    users.forEach((obj) => {
      // Додаємо поле "descriptions" до кожного об'єкта
      obj['descriptions'] = [];
    });

    for (const user of users) {
      const images = [];
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

    // Знайдіть користувача за id
    const user = await FaceModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Користувач не знайдений' });
    }

    // Отримайте час початку і кінця роботи користувача
    const entryTime = user.entryTime;
    const outTime = user.outTime;

    // Отримайте поточний час
    const currentDate = new Date();
    const currentTime = currentDate.getHours() * 60 + currentDate.getMinutes(); // Переведемо поточний час в хвилини для зручності порівняння

    // Перетворіть час початку і кінця роботи користувача в хвилини
    const entryTimeMinutes = parseInt(entryTime.slice(0, 2)) * 60 + parseInt(entryTime.slice(3, 5));
    const outTimeMinutes = parseInt(outTime.slice(0, 2)) * 60 + parseInt(outTime.slice(3, 5));
    // Порівняйте час початку і кінця роботи з поточним часом
    let status;
    if (currentTime < entryTimeMinutes) {
      status = 'Раніше';
    } else if (currentTime >= entryTimeMinutes && currentTime <= outTimeMinutes) {
      status = 'Запізнюється';
    } else if (currentTime > outTimeMinutes) {
      status = 'Закінчив';
    }

    // Форматуйте поточну дату
    const formattedDate = currentDate.toLocaleDateString('uk-UA');
    // Форматуйте поточний час
    const formattedTime = currentDate.toLocaleTimeString('uk-UA');

    const createFace = new DetectedUser({
      userID: id,
      date: formattedDate,
      time: formattedTime,
      status: status,
    });
    await createFace.save();

    // return res.json({ id: id, date: formattedDate, time: formattedTime, status: status });
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
