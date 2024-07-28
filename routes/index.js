var express = require("express");
var router = express.Router();
var bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("./users");
const postModel = require("./post");
const upload = require("../public/javascripts/multer");
const sendEmail = require("../public/javascripts/mailer");
const Token = require("../public/javascripts/token");
const crypto = require("crypto");

/* GET home page. */

router.get("/", function (req, res, next) {
  res.render("login", { error: req.flash("error") });
});

router.post("/", async function (req, res, next) {
  let user = await userModel.findOne({ email: req.body.email });

  if (!user) {
    req.flash("error", "Email or Password is incorrect!");
    return res.redirect("/");
  }

  bcrypt.compare(req.body.password, user.password, function (err, result) {
    if (!result) {
      req.flash("error", "Email or Password is incorrect!");
      return res.redirect("/");
    }
    let token = jwt.sign({ email: user.email }, "lnmsecretkey");
    res.cookie("token", token);
    if (user.typeOfUser === "Admin") {
      res.redirect("/admin/users");
    } else {
      res.redirect("/profile");
    }
  });
});

router.get("/signup", function (req, res, next) {
  res.render("index", { error: req.flash("error") });
});

router.post("/signup", async function (req, res, next) {
  const allowedAdminEmails = [
    "23ucs696@lnmiit.ac.in",
    "22ucs216@lnmiit.ac.in",
    "22ucs067@lnmiit.ac.in",
    "22ucs110@lnmiit.ac.in",
    "22ucs236@lnmiit.ac.in",
    "22ucs212@lnmiit.ac.in",
  ];

  const { fullName, email, password, confirmPassword, typeOfUser } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  // Validate password format
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    req.flash(
      "error",
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    );
    return res.redirect("/signup");
  }

  if (typeOfUser === "Admin" && !allowedAdminEmails.includes(email)) {
    req.flash("error", "You are not authorized to register as an admin");
    return res.redirect("/signup");
  }

  try {
    // Check if the email already exists
    let existingUser = await userModel.findOne({ email: email });
    if (existingUser) {
      req.flash("error", "Email is already in use");
      return res.redirect("/signup");
    }

    bcrypt.genSalt(10, (err, salt) => {
      if (err) throw err;
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) throw err;
        const user = await userModel.create({
          fullName,
          email,
          password: hash,
          typeOfUser,
        });

        const verToken = await new Token({
          user: user._id,
          token: crypto.randomBytes(16).toString("hex"),
        }).save();

        // Send verification email
        sendEmail(
          user.email,
          "Verify your email",
          `Please click on the following link to verify your email: https://gdsc-backend-gpgt.onrender.com/verify/${verToken.token}`
        );

        req.flash(
          "success",
          "Account created successfully. Please verify your email."
        );
        return res.redirect("/signup");
      });
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "An error occurred. Please try again.");
    return res.redirect("/signup");
  }
});

router.get("/verify/:token", async function (req, res) {
  try {
    const vertoken = await Token.findOne({ token: req.params.token });
    if (!vertoken) return res.status(400).send({ message: "Invalid link" });

    const user = await userModel.findById(vertoken.user);
    if (!user) return res.status(400).send({ message: "Invalid link" });

    user.verified = true;
    await user.save();
    await Token.deleteOne({ token: req.params.token });

    let token = jwt.sign({ email: user.email }, "lnmsecretkey");
    res.cookie("token", token);
    if (user.typeOfUser === "Admin") {
      res.redirect("/admin/users");
    } else {
      res.redirect("/profile");
    }
  } catch (error) {
    res.status(500).send({ message: "An error occurred" });
  }
});

router.get("/logout", function (req, res) {
  res.clearCookie("token").redirect("/");
});

const auth = async function (req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/");
  }

  try {
    const decoded = jwt.verify(token, "lnmsecretkey");
    const user = await userModel.findOne({ email: decoded.email });
    if (!user) {
      return res.redirect("/");
    }
    req.user = user;
    req.isAdmin =
      user.email === "23ucs696@lnmiit.ac.in" ||
      user.email === "22ucs216@lnmiit.ac.in" ||
      user.email === "22ucs067@lnmiit.ac.in" ||
      user.email === "22ucs110@lnmiit.ac.in" ||
      user.email === "22ucs236@lnmiit.ac.in" ||
      user.email === "22ucs212@lnmiit.ac.in";
    next();
  } catch (err) {
    console.error(err);
    return res.redirect("/");
  }
};

router.get("/profile", auth, async function (req, res, next) {
  try {
    const user = await userModel
      .findOne({ email: req.user.email })
      .populate("posts");
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.render("profile", { user });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/upload",
  auth,
  upload.single("file"),
  async function (req, res, next) {
    if (!req.file) {
      return res.status(400).send("No files are uploaded.");
    }

    const user = req.user;

    const postdata = await postModel.create({
      thumbnail: req.file.filename,
      projectName: req.body.projectName,
      liveLink: req.body.liveLink,
      githubLink: req.body.githubLink,
      user: user._id,
    });

    user.posts.push(postdata._id);
    await user.save();
    res.redirect("/profile");
  }
);

router.post("/delete/:postId", auth, async function (req, res, next) {
  try {
    const postId = req.params.postId;
    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).send("Post not found");
    }

    if (
      post.user.toString() !== req.user._id.toString() &&
      req.user.typeOfUser !== "Admin"
    ) {
      return res.status(403).send("Unauthorized");
    }

    const projectName = post.projectName;
    const postUser = await userModel.findById(post.user);

    if (req.user.typeOfUser === "Admin" && postUser) {
      setImmediate(async () => {
        const subject = "Your project has been deleted by an admin";
        const text = `Dear ${postUser.fullName},\n\nYour project "${projectName}" has been deleted by an admin.\n\nBest regards,\nYour Team`;

        try {
          await sendEmail(postUser.email, subject, text);
        } catch (emailErr) {
          console.error("Failed to send email:", emailErr);
        }
      });
    }

    await postModel.findByIdAndDelete(postId);
    await userModel.findByIdAndUpdate(post.user, {
      $pull: { posts: postId },
    });

    if (req.user.typeOfUser === "Admin") {
      res.redirect("/admin/users");
    } else {
      res.redirect("/profile");
    }
  } catch (err) {
    next(err);
  }
});

router.get("/editPost/:id", auth, async function (req, res, next) {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) {
      return res.status(404).send("Post not found");
    }
    res.render("edit", { post });
  } catch (err) {
    next(err);
  }
});

router.post("/editPost/:id", auth, async function (req, res, next) {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) {
      return res.status(404).send("Post not found");
    }

    if (
      post.user.toString() !== req.user._id.toString() &&
      req.user.typeOfUser !== "Admin"
    ) {
      return res.status(403).send("Unauthorized");
    }

    const originalProjectName = post.projectName;

    post.projectName = req.body.projectName || post.projectName;
    post.githubLink = req.body.githubLink || post.githubLink;
    post.liveLink = req.body.liveLink || post.liveLink;

    await post.save();

    if (req.user.typeOfUser === "Admin") {
      const user = await userModel.findById(post.user);
      if (!user) {
        return res.status(404).send("User not found");
      }

      setImmediate(async () => {
        const subject = "Your project has been updated by an admin";
        const text = `Dear ${user.fullName},\n\nYour project "${originalProjectName}" has been updated by an admin. Here are the new details:\n\n
          Project Name: ${post.projectName}\n
          GitHub Link: ${post.githubLink}\n
          Live Link: ${post.liveLink}\n\n
          Best regards,\nYour Team`;

        try {
          await sendEmail(user.email, subject, text);
        } catch (emailErr) {
          console.error("Failed to send email:", emailErr);
        }
      });

      res.redirect("/admin/users");
    } else {
      res.redirect("/profile");
    }
  } catch (err) {
    next(err);
  }
});

router.get("/admin/users", auth, async function (req, res, next) {
  if (!req.isAdmin) return res.status(403).send("Access denied");

  try {
    const users = await userModel.find().populate("posts");
    res.render("adminUsers", { users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
