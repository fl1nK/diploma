const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const faceRouter = require('./routers/faceRouter');
const { loadModels } = require('./controllers/utils/faceUtils');
const corsMiddleware = require('./middleware/corsMiddleware');

const startWebSocketServer = require('./websocketServer');

const app = express();

app.use(
  fileUpload({
    useTempFiles: true,
  }),
);

loadModels();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'data')));

app.use(corsMiddleware);
app.use(faceRouter);

mongoose
  .connect(
    `mongodb+srv://vlad:pass123@cluster0.g8rarqs.mongodb.net/diplom?retryWrites=true&w=majority`,
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log('DB connected and server us running.');

    // Start WebSocket server
    startWebSocketServer(app);
  })
  .catch((err) => {
    console.log(err);
  });
