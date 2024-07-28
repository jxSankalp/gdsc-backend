const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: true,
    expires: new Date(Date.now() + 3600), // 1 hr
  },
});

module.exports = mongoose.model("token", tokenSchema);
