const asyncHandler = require("express-async-handler");
const ffmpeg = require('fluent-ffmpeg');
const Module = require('../models/Module.model');
const Section = require('../models/section.model');

const { uploadMix, uploadFilesToCloudinary } = require("../services/file-upload.service")
const factory = require("../services/factory.service");

const {
  recordNotFound,
} = require("../utils/response/errors");
const { success } = require("../utils/response/response");


const uploadModuleVideos = uploadMix([{ name: "file" }])

const uploadVideosToCloud = asyncHandler(async (req, res, next) => {
  if (req.files.file) {
    console.log("yess");
    req.body.file = [];
    const veds = req.files.file
    console.log(veds);

    const uploadPromises = veds.map((v) => {
      console.log("hello", v);
      return uploadFilesToCloudinary(v.buffer, "modules").then((result) => {
        console.log("ioioi");
        console.log(result, v);
        //set the path to secure_url and filename to public_id from result
        req.body.file.push({ path: result.secure_url, filename: result.public_id });
        console.log("donee");
      });
    });
    await Promise.all(uploadPromises);

  }
  next();
})


/**
 * @description create coursesmodules
 * @route POST /api/v1/coursemodule
 * @access private [Instructor, Admin]
 */
const createModule = async ({file,Name}) => {
  try {
    // 1- upload the vedio to cloudnary
    const result = await uploadFilesToCloudinary(file.buffer, "modules");
    console.log("RESULTTTTTT: ", result);

    // 2- check if exists
    if (result && result.public_id && result.secure_url) {

      //continue later
      // Get the video duration using fluent-ffmpeg
      //const Duration = await getVideoDuration(result.secure_url);
      //console.log("duration in the create")
      //  console.log(Duration)

      // 3- Create the module in the database
      const newModule = await Module.create({
        name: Name,
        file: {
          filename: result.public_id,
          path: result.secure_url,
        },
        //duration: Duration
      });

      return newModule;
    } else {
      // Handle the case where the upload to Cloudinary did not succeed
      console.error("Failed to upload file to Cloudinary");
      return null;
    }
  } catch (error) {
    console.error("Error creating module:", error);
    return null;
  }

};


/**
 * @description get all coursesmodules
 * @route GET /api/v1/coursemodule
 * @access private [Instructor, Admin]
 */
const getAllModules = factory.getAll(Module);


/**
 * @description get module by id
 * @route GET /api/v1/coursemodule/:id
 * @access private [Instructor, Admin]
 */
const getModuleById = factory.getOne(Module);

/**
 * @description update module by id
 * @route PUT /api/v1/coursemodule/:id
 * @access private [Instructor, Admin]
 */
// factory.updateOne(Module);
const updateModule = asyncHandler(async (req, res, next) => {
  const moduleId = req.params.id;
  const updatedModuleData = req.body;
  console.log(moduleId, updatedModuleData);
  try {
    // Update the module
    const updatedModule = await Module.findByIdAndUpdate(moduleId, updatedModuleData, { new: true });

    // Check if the module exists
    if (!updatedModule) {
      return next(recordNotFound({ message: `module with id ${req.params.id} not found` }))
    }
    const { statusCode, body } = success({ data: updatedModule })
    res.status(statusCode).json(body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * @description delete module by id
 * @route DELETE /api/v1/coursemodule/:id
 * @access private [Instructor, Admin]
 */
const deleteModule = asyncHandler(async (req, res, next) => {
  try {

    const moduleId = req.params.id;
    // 1- get module by id
    const module = await Module.findById(moduleId);
    // 2- check if module exists
    if (!module) {
      return next(recordNotFound({ message: `Module with id ${moduleId} not found` }))
    }

    // 3- Remove module from section's array
    await Section.updateMany(
      { modules: moduleId },
      { $pull: { modules: moduleId } }
    );

    // 4- delete module
    await Module.findByIdAndDelete(moduleId);
    const { statusCode, body } = success({ message: `Module delted successfully` });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

// Function to get video duration using fluent-ffmpeg
const getVideoDuration = (videoUrl) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoUrl, (err, metadata) => {
      console.log("yes we in")
      if (err) {
        reject(err);
        console.log(err)
      } else {
        const duration = metadata.format.duration || 0;
        console.log("duration")
        console.log(duration)
        resolve(duration);
      }
    });
  });
};

module.exports = {
  createModule,
  getAllModules,
  getModuleById,
  updateModule,
  deleteModule,
  uploadModuleVideos,
  uploadVideosToCloud,
  getVideoDuration
};
