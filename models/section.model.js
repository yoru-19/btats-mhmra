//section.model.js
const mongoose = require('mongoose');
const Module = require('../models/Module.model');
const sectionSchema = new mongoose.Schema({

  title: {
    type: String,
    //required: true,
  },

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },

  sectionDuration: {//how to cumpute it?
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

  modules: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Module",
    },
  ],

});
// Pre-save middleware to generate a default title if not provided
sectionSchema.pre('save', async function (next) {
  if (!this.title) {
    // Find the count of existing sections for this course and use it to generate a default title
    const count = await this.constructor.countDocuments({ courseId: this.courseId });
    this.title = `Section ${count + 1}`;
  }
  next();
});

// // Pre-save middleware to calculate sectionDuration
// sectionSchema.pre('save', async function (next) {
//   try {
//     let totalDuration = 0;
//     // Iterate through each module in the section
//     for (const moduleId of this.modules) {
//       // Find the module by ID
//       const module = await Module.findById(moduleId);
//       if (module) {
//         // Add the module's duration to the total duration
//         totalDuration += module.duration || 0; // Assuming module.duration exists and is a number
//       }
//     }
//     // Set the sectionDuration to the calculated totalDuration
//     this.sectionDuration = totalDuration;
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

const Section = mongoose.model('Section', sectionSchema);

module.exports = Section;