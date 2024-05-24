const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
require("dotenv").config()

const faceRouter = require('./routers/faceRouter');
const { loadModels } = require('./controllers/utils/faceUtils');
const corsMiddleware = require('./middleware/corsMiddleware');

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

app.post('/send-message', (req, res) => {
  console.log(req.body);
  const message = req.body.message;

  console.log('Received message from client:', message);

  // Відповідь на клієнта з повідомленням "Повідомлення успішно отримано на сервері"
  res.send('Повідомлення успішно отримано на сервері');
});

mongoose
  .connect(
    `mongodb+srv://vlad:pass123@cluster0.g8rarqs.mongodb.net/diplom?retryWrites=true&w=majority`,
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log('DB connected and server us running.');
  })
  .catch((err) => {
    console.log(err);
  });
