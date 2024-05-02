const fs = require('fs');
const { exec } = require('child_process');
const faceapi = require('@vladmandic/face-api');
const { Canvas, Image, createCanvas, loadImage } = require('canvas');
faceapi.env.monkeyPatch({ Canvas, Image });

async function LoadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');
}
LoadModels();

const videoPath = 'labels/video.mp4';

exec(`ffmpeg -i ${videoPath} -vf fps=1 output/frame%d.jpg`, async (error, stdout, stderr) => {
  if (error) {
    console.error('Error extracting frames:', error);
    return;
  }

  const frameFiles = fs.readdirSync('output').filter(file => file.endsWith('.jpg'));
  for (const frameFile of frameFiles) {
    const img = await loadImage(`output/${frameFile}`);
    // const canvas = createCanvas(img.width, img.height);
    // const ctx = canvas.getContext('2d');
    // ctx.drawImage(img, 0, 0);

    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
    console.log(`Detected ${detections.length} faces in ${frameFile}:`);
    detections.forEach((detection, index) => {
      console.log(`Face ${index + 1}:`);
    //   console.log('Position:', detection.detection.box);
    //   console.log('Landmarks:', detection.landmarks);
    });
  }
});
