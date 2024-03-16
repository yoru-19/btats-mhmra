// module.model.js
// file.model.js
const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(

  {
    /*section: [
      {
        type: mongoose.Types.ObjectId,
        ref: "section",
      },],*/

    name: {
      type: String,
      unique: true, // Ensure uniqueness of the 'name' field
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
      type: Number,
      min: 0,
    },
    
  },
  {
    timestamps: true,
  }
);



const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;
