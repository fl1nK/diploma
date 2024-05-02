const express = require('express');

const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');

const cheakFaceRouter = require('./routers/cheakFaceRouter');

const app = express();

app.use(
  fileUpload({
    useTempFiles: true,
  }),
);

app.use(cheakFaceRouter);

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
