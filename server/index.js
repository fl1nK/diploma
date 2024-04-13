const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const { exportUser, createUser } = require("./controller/User");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoose.set("strictQuery", false);
mongoose
  .connect(
    "mongodb+srv://vlad:pass123@cluster0.g8rarqs.mongodb.net/diplom?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connected to DB"))
  .catch((error) => console.log(error));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/downloadExcel", exportUser);
app.get("/createUser", createUser);

app.listen(PORT, () => {
  console.log(`Server starting on port ${PORT}`);
});
