const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const { exportUser, createUser } = require("./controller/User");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoose.set("strictQuery", false);
mongoose
  .connect(
    "mongodb+srv://vlad:pass123@cluster0.g8rarqs.mongodb.net/diplom?retryWrites=true&w=majority"
  )
  .then(() => console.log("Connected to DB"))
  .catch((error) => console.log(error));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Шлях до папки для зберігання фото
const photoDirectory = path.join(__dirname, "photos");

// Маршрут для отримання фото за посиланням
app.get("/photos/:photoName", (req, res) => {
  const photoName = req.params.photoName;
  const photoPath = path.join(photoDirectory, photoName);

  // Відправляємо фото у відповідь
  res.sendFile(photoPath);
});

app.get("/downloadExcel", exportUser);
app.get("/createUser", createUser);

app.listen(PORT, () => {
  console.log(`Server starting on port ${PORT}`);
});
