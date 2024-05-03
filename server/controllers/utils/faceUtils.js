const FaceModel = require('../models/Face');
const fs = require('fs');
// const path = require('path');

const faceapi = require('@vladmandic/face-api/dist/face-api.node-gpu.js');
const tf = require('@tensorflow/tfjs-node-gpu');
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

async function uploadLabeledImages(images, label) {
  try {
    let counter = 0;
    const descriptions = [];
    // Loop through the images
    for (let i = 0; i < images.length; i++) {
      const img = await canvas.loadImage(images[i]);
      counter = (i / images.length) * 100;
      console.log(`Progress = ${counter}%`);
      // Read each face and save the face descriptions in the descriptions array
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      descriptions.push(detections.descriptor);
    }

    // Create a new face document with the given label and save it in DB
    const createFace = new FaceModel({
      label: label,
      descriptions: descriptions,
    });
    await createFace.save();
    return true;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function getDetectedFaceForVideo(image) {
  const match = image.match(/frame-(\d+)/);

  const frameNumber = match ? parseInt(match[1]) : 0;

  const faces = getAllDescriptorsFromDB();

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
  const faces = getAllDescriptorsFromDB();

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
};
