const mongoose = require("mongoose");
const User = require("./users");

const postSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: [true, "Project Name is required"],
    },
    githubLink: {
      type: String,
      required: [true, "GitHub Repository Link is required"],
    },
    thumbnail: {
      type: String,
      required: [true, "Thumbnail is required"],
    },
    liveLink: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
);

module.exports = mongoose.model("Post", postSchema);
