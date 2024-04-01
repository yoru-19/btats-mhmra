// module.model.js
// file.model.js
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfprobePath('C:/PATH_programs/ffprobe');
// Initialize Cloudinary with your credentials
// cloudinary.config({
//   cloud_name: 'CLOUDINARY_API_NAME',
//   api_key: 'CLOUDINARY_API_KEY',
//   api_secret: 'CLOUDINARY_API_SECERT'
// });

const moduleSchema = new mongoose.Schema(

  {
    name: {
      type: String,
      //unique: true, 
    },

    isFree: {
      type: Boolean,
      default: false,
    },
    file: {
      filename: {
        type: String,
        required: true,
      },
      path: {
        type: String,
        required: true,
      },
    },

    duration: {
      hours: {
        type: Number,
        default: 0,
      },
      minutes: {
        type: Number,
        default: 0,
      },
      seconds: {
        type: Number,
        default: 0,
      }
    },

  },
  {
    timestamps: true,
  }
);

const calculateModuleDuration = (secureUrl) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(secureUrl, (err, data) => {
      if (err) {
        console.error('Error:', err);
        reject(err);
      } else {
        // Extract duration from metadata
        const duration = data.format.duration;
        console.log('Video duration:', duration);
        resolve(duration);
      }
    });
  });
};




const Module = mongoose.model('Module', moduleSchema);

module.exports = {
  calculateModuleDuration,
  Module,
};