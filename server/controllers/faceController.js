const fs = require('fs');

const faceapi = require('@vladmandic/face-api/dist/face-api.node-gpu.js');
const tf = require('@tensorflow/tfjs-node-gpu');

const { Canvas, Image, createCanvas, loadImage } = require('canvas');
faceapi.env.monkeyPatch({ Canvas, Image });
const canvas = require('canvas');

const { exec } = require('child_process');

const {
  uploadLabeledImages,
  getDetectedFaceForVideo,
  getDetectedFaceForImage,
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

module.exports = {
  handlerCheckFaceImage,
  handlerCheckFaceVideo,
  handlerCreateFaceUser,
};
