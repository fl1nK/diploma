const FaceModel = require('../../models/Face');
const ImageModel = require('../../models/Image');

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const faceapi = require('@vladmandic/face-api');
require('@tensorflow/tfjs-node');

const { Canvas, Image } = require('canvas');
faceapi.env.monkeyPatch({ Canvas, Image });
const canvas = require('canvas');

async function getAllDescriptorsFromDB() {
  let faces = await FaceModel.find();
  for (let i = 0; i < faces.length; i++) {
    for (let j = 0; j < faces[i].descriptions.length; j++) {
      faces[i].descriptions[j] = new Float32Array(Object.values(faces[i].descriptions[j]));
    }
    faces[i] = new faceapi.LabeledFaceDescriptors(faces[i].label, faces[i].descriptions);
  }
  return faces;
}

async function createUserDB(files, label) {
  try {
    const filesCount = Object.keys(files).length;

    const { firstName, lastName, middleName, entryTime, outTime } = label;
    const arrayIdImageModel = [];

    for (let i = 1; i <= filesCount; i++) {
      const fieldName = `photo${i}`;

      const img = await canvas.loadImage(files[fieldName].tempFilePath);

      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      let url = await savePhoto(files[fieldName]);

      const newImage = new ImageModel({
        url: url,
        descriptions: detections.descriptor,
      });
      const newImageModel = await newImage.save();
      arrayIdImageModel.push(newImageModel._id);
    }

    const createFace = new FaceModel({
      firstName: firstName,
      lastName: lastName,
      middleName: middleName,
      images: arrayIdImageModel,
      entryTime: entryTime,
      outTime: outTime,
    });
    await createFace.save();

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function savePhoto(photo) {
  return new Promise((resolve, reject) => {
    const tempPath = photo.tempFilePath;
    const uniqueFilename = uuidv4() + path.extname(photo.name);

    const targetPath = path.join('data', uniqueFilename);

    const readStream = fs.createReadStream(tempPath);
    const writeStream = fs.createWriteStream(targetPath);

    readStream.on('error', (err) => {
      reject(err);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });

    writeStream.on('finish', () => {
      resolve(uniqueFilename);
    });

    readStream.pipe(writeStream);
  });
}

async function uploadLabeledImages(images, label) {
  try {
    const { firstName, lastName, middleName } = label;
    const descriptions = [];

    for (let i = 0; i < images.length; i++) {
      const img = await canvas.loadImage(images[i]);

      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      descriptions.push(detections.descriptor);
    }

    const createFace = new FaceModel({
      firstName: firstName,
      lastName: lastName,
      middleName: middleName,
      descriptions: descriptions,
    });
    await createFace.save();
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function getDetectedFaceForVideo(image) {
  const match = image.match(/frame-(\d+)/);

  const frameNumber = match ? parseInt(match[1]) : 0;

  const faces = await getAllDescriptorsFromDB();

  const faceMatcher = new faceapi.FaceMatcher(faces, 0.6);

  const img = await canvas.loadImage(image);

  const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
  const results = detections.map((d) => {
    const match = faceMatcher.findBestMatch(d.descriptor);
    return { ...match, frame: frameNumber };
  });

  return results;
}

async function getDetectedFaceForImage(image) {
  const faces = await getAllDescriptorsFromDB();
  console.log(faces);

  const faceMatcher = new faceapi.FaceMatcher(faces, 0.6);

  const img = await canvas.loadImage(image);

  const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
  const results = detections.map((d) => faceMatcher.findBestMatch(d.descriptor));
  return results;
}

async function loadModels() {
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./models/faceApi');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./models/faceApi');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models/faceApi');
}

module.exports = {
  uploadLabeledImages,
  getDetectedFaceForVideo,
  getDetectedFaceForImage,
  loadModels,
  getAllDescriptorsFromDB,
  createUserDB,
  savePhoto,
};
