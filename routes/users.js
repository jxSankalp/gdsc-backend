const mongoose = require("mongoose");
const validator = require("validator");

mongoose.connect(
  "mongodb+srv://sankalpjain2006:KzauK00XPLfsaYNg@gdsc-backend.x557xam.mongodb.net/"
);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^.+@lnmiit\.ac\.in$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid institute email address!`,
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"],
  },
  typeOfUser: {
    type: String,
    enum: ["Student", "Admin"],
    required: [true, "Type of User is required"],
  },
  fullName: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  verified:{
    type: Boolean,
    default: false,
  }
  // captcha: {
  //   type: String,
  //   required: [true, "CAPTCHA is required"],
  // },
});

userSchema
  .virtual("confirmPassword")
  .get(function () {
    return this._confirmPassword;
  })
  .set(function (value) {
    this._confirmPassword = value;
  });


module.exports = mongoose.model("User", userSchema);


