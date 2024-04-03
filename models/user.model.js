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
      enum: ["Instructor", "User", "Admin"],
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

    profileImage: {
      type: String,
      default: 'https://res.cloudinary.com/dcjrolufm/image/upload/v1711983058/defaults/rrn916ctapttfi2tsrtj.png' // Default link
    },
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
