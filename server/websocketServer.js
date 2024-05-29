const { Server } = require('ws');
const tf = require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');
const http = require('http');

const FaceModel = require('./models/Face');
const DetectedUser = require('./models/DetectedUser');

const loadModels = async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models/faceApi');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./models/faceApi');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./models/faceApi');
};

loadModels();

const startWebSocketServer = (app) => {
  const server = http.createServer(app);
  const wss = new Server({ server });

  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      try {
        const videoBuffer = Buffer.from(message);
        const videoTensor = tf.node.decodeImage(videoBuffer);

        const faces = await getAllDescriptors();

        const labeledFaceDescriptors = faces.map((face) => {
          const descriptors = face.descriptions.map(
            (desc) => new Float32Array(Object.values(desc)),
          );
          return new faceapi.LabeledFaceDescriptors(face._id.toString(), descriptors);
        });

        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

        if (videoTensor.shape.length === 3 && videoTensor.shape[2] === 3) {
          const detections = await faceapi
            .detectAllFaces(videoTensor)
            .withFaceLandmarks()
            .withFaceDescriptors();

          const results = detections.map((detection) =>
            faceMatcher.findBestMatch(detection.descriptor),
          );

          for (const result of results) {
            if (result.label !== 'unknown') {
              const face = faces.find((face) => face._id.equals(result.label));

              await setDetectedUser(result.label);
              ws.send(JSON.stringify({ user: face.lastName }));
            } else {
              ws.send(JSON.stringify({ error: 'Unknown user.' }));
            }
          }
        } else {
          ws.send(JSON.stringify({ error: 'Unexpected tensor shape.' }));
        }
      } catch (error) {
        console.error(error);
        ws.send(JSON.stringify({ error: 'Error processing video.' }));
      }
    });
  });

  const port = process.env.WS_PORT || 5001;
  server.listen(port, () => {
    console.log(`WebSocket server running at http://localhost:${port}`);
  });
};

async function getAllDescriptors() {
  try {
    let users = await FaceModel.find().populate('images').lean();

    for (const user of users) {
      user.descriptions = user.images.map((image) => image.descriptions[0]);
      user.images = '';
    }

    return users;
  } catch (error) {
    console.log(error);
  }
}

async function setDetectedUser(id) {
  try {
    // Перевірте, чи вже є помітка для цього користувача за останні 5 хвилин
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const existingDetection = await DetectedUser.findOne({
      userID: id,
      createdAt: { $gt: fiveMinutesAgo },
    });

    if (existingDetection) {
      console.log(`Already detected user ${id} within the last 5 minutes.`);
      return;
    }

    const currentDate = new Date();
    const currentTime = currentDate.getHours() * 60 + currentDate.getMinutes();

    const user = await FaceModel.findById(id);

    const entryTime = user.entryTime;
    const outTime = user.outTime;

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
    console.log(error);
  }
}

module.exports = startWebSocketServer;
