const { Schema, model } = require("mongoose");

const User = new Schema({
  first_name: { type: String, default: "" },
  last_name: { type: String, default: "" },
});

module.exports = model("User", User);
