const FaceModel = require('../../models/Face');
const ImageModel = require('../../models/Image');

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const faceapi = require('@vladmandic/face-api');
const tf = require('@tensorflow/tfjs-node');
// const { image } = require('@tensorflow/tfjs-node');

const { Canvas, Image, createCanvas, loadImage } = require('canvas');
faceapi.env.monkeyPatch({ Canvas, Image });
const canvas = require('canvas');

const { exec } = require('child_process');

async function getAllDescriptorsFromDB() {
  // Get all the face data from mongodb and loop through each of them to read the data
  let faces = await FaceModel.find();
  for (i = 0; i < faces.length; i++) {
    // Change the face data descriptors from Objects to Float32Array type
    for (j = 0; j < faces[i].descriptions.length; j++) {
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
    // Loop through the images
    for (let i = 1; i <= filesCount; i++) {
      const fieldName = `photo${i}`;

      const img = await canvas.loadImage(files[fieldName].tempFilePath);

      // Read each face and save the face descriptions in the descriptions array
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      // Save image to server and get its URL
      let url = await savePhoto(files[fieldName]);

      const newImage = new ImageModel({
        url: url,
        descriptions: detections.descriptor, // Assuming this is how you want to store descriptions for each image
      });
      const newImageModel = await newImage.save();
      arrayIdImageModel.push(newImageModel._id);
    }

    // Create a new face document with the given label and save it in DB
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
      const url = uniqueFilename; // Assuming uploads directory is served statically
      resolve(url);
    });

    readStream.pipe(writeStream);
  });
}

async function uploadLabeledImages(images, label) {
  try {
    const { firstName, lastName, middleName } = label;
    const descriptions = [];
    // Loop through the images
    for (let i = 0; i < images.length; i++) {
      const img = await canvas.loadImage(images[i]);

      // Read each face and save the face descriptions in the descriptions array
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      descriptions.push(detections.descriptor);
    }

    // Create a new face document with the given label and save it in DB
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
  // Load the models
  // __dirname gives the root directory of the server
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
