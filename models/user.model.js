const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minLength: 3,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    bio: String,
    phone: String,
    profileImage: String,
    jobTitle: String,
    jobDescription: String,
    facebookUrl: String,
    linkedinUrl: String,
    instagramUrl: String,
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },
    roles: {
      type: String,
      enum: ["Instructor", "User","Admin"],
      default: "User",
    },
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId
      , ref: "Course"
    }],
    // Add a reference to the Course model
    courses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    }],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
