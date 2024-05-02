const express = require('express');
const mongoose = require('mongoose');
const FaceModel = require('../models/Face');

const router = express.Router();

const fs = require('fs');
// const path = require('path');

const faceapi = require('@vladmandic/face-api/dist/face-api.node-gpu.js');
const tf = require('@tensorflow/tfjs-node-gpu');
// const { image } = require('@tensorflow/tfjs-node');

const { Canvas, Image, createCanvas, loadImage } = require('canvas');
faceapi.env.monkeyPatch({ Canvas, Image });
const canvas = require('canvas');

const { exec } = require('child_process');

async function LoadModels() {
  // Load the models
  // __dirname gives the root directory of the server
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./models/faceApi');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./models/faceApi');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models/faceApi');
}
LoadModels();

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

async function getDescriptorsFromDB(image) {
  const match = image.match(/frame-(\d+)/);

  let frameNumber;
  if (match) {
    frameNumber = parseInt(match[1]);
  } else {
    frameNumber = 0;
  }

  // Get all the face data from mongodb and loop through each of them to read the data
  let faces = await FaceModel.find();
  for (i = 0; i < faces.length; i++) {
    // Change the face data descriptors from Objects to Float32Array type
    for (j = 0; j < faces[i].descriptions.length; j++) {
      faces[i].descriptions[j] = new Float32Array(Object.values(faces[i].descriptions[j]));
    }
    faces[i] = new faceapi.LabeledFaceDescriptors(faces[i].label, faces[i].descriptions);
  }

  // Load face matcher to find the matching face
  const faceMatcher = new faceapi.FaceMatcher(faces, 0.6);

  // Read the image using canvas or other method
  const img = await canvas.loadImage(image);
  console.log(img);
  // let temp = faceapi.createCanvasFromMedia(img);
  // console.log(temp);
  // // Process the image for the model
  // const displaySize = { width: img.width, height: img.height };
  // faceapi.matchDimensions(temp, displaySize);

  // Find matching faces
  const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
  // const resizedDetections = faceapi.resizeResults(detections, displaySize);
  const results = detections.map((d) => {
    const match = faceMatcher.findBestMatch(d.descriptor);
    return { ...match, frame: frameNumber }; // Додати поле image до кожного результату в масиві
  });
  // console.log(results[0]);
  return results;
}

async function getDescriptorsImage(image) {
  // Get all the face data from mongodb and loop through each of them to read the data
  let faces = await FaceModel.find();
  for (i = 0; i < faces.length; i++) {
    // Change the face data descriptors from Objects to Float32Array type
    for (j = 0; j < faces[i].descriptions.length; j++) {
      faces[i].descriptions[j] = new Float32Array(Object.values(faces[i].descriptions[j]));
    }
    // Turn the DB face docs to
    faces[i] = new faceapi.LabeledFaceDescriptors(faces[i].label, faces[i].descriptions);
  }

  // Load face matcher to find the matching face
  const faceMatcher = new faceapi.FaceMatcher(faces, 0.6);

  // Read the image using canvas or other method
  const img = await canvas.loadImage(image);

  // Find matching faces
  const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
  const results = resizedDetections.map((d) => faceMatcher.findBestMatch(d.descriptor));
  return results;
}

router.post('/check-face-image', async (req, res) => {
  const File1 = req.files.File1.tempFilePath;
  let result = await getDescriptorsImage(File1);
  res.json({ result });
});

router.post('/check-face-video', async (req, res) => {
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

        // console.log(images);

        // Process each frame to find faces
        let result = [];
        for (let i = 0; i < images.length; i++) {
          result.push(await getDescriptorsFromDB(images[i]));
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

        // console.log(finalResults);

        // let result = [];
        // for (let i = 0; i < images.length; i++) {
        //   const labels = await getDescriptorsFromDB(images[i]);
        //   labels.forEach(label => {
        //     const existingLabel = result.find(item => item._label === label._label);
        //     if (existingLabel) {
        //       existingLabel.frame.push(i + 1); // Frame number starts from 1
        //     } else {
        //       result.push({ _label: label._label, frame: [i + 1] });
        //     }
        //   });
        // }

        // Remove temp files
        // fs.unlinkSync(tempFilePath);
        files.forEach((file) => fs.unlinkSync(`./tmp/${file}`));

        res.json({ finalResults });
      },
    );
  });
});

router.post('/post-face', async (req, res) => {
  const File1 = req.files.File1.tempFilePath;
  const File2 = req.files.File2.tempFilePath;
  const File3 = req.files.File3.tempFilePath;
  const label = req.body.label;

  let result = await uploadLabeledImages([File1, File2, File3], label);
  if (result) {
    res.json({ message: 'Face data stored successfully' });
  } else {
    res.json({ message: 'Something went wrong, please try again.' });
  }
});

module.exports = router;
