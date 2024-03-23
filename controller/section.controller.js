const asyncHandler = require("express-async-handler");
const {
  //   recordNotFound,
  //   validationError,
} = require("../utils/response/errors");
const {
  success
} = require("../utils/response/response");

//import createModule from module controller
const { createModule } = require("./module.controller");
const Section = require("../models/section.model");
const Modules = require("../models/Module.model");

// const Module = require("../models/Module.model");
const { uploadMix, uploadFilesToCloudinary } = require("../services/file-upload.service")
const Course = require("../models/Course.model")
const factory = require("../services/factory.service");
const { recordNotFound } = require("../utils/response/responseStatus");

const uploadModuleVideos = uploadMix([{ name: "file" }])

const uploadVideosToCloud = asyncHandler(async (req, res, next) => {
  if (req.files.file) {
    console.log("uploadVedioTo Cloud: " + req.files.file);
    console.log("yess");
    req.body.file = [];
    const veds = req.files.file
    console.log(veds);
    const uploadPromises = veds.map((v) => {
      console.log("hello", v);
      return uploadFilesToCloudinary(v.buffer, "modules").then((result) => {
        console.log("ioioi");
        console.log(result, v);
        req.body.file.push({ path: result.secure_url, filename: result.public_id });
        console.log("donee");
      });
    });
    await Promise.all(uploadPromises);
    console.log("promises: " + uploadPromises);
  }
  next();
})


/**
 * @description create new section
 * @route POST /api/v1/section
 * @access private [Instructor, Admin]
 */
const createSection = asyncHandler(async (req, res) => {
  //create a new section with only the courseId
  // create section with no file

  // 1- get the course id
  const CourseId = req.body.courseId;

  // 2- create new section with module IDs and without files
  const newSection = await Section.create({
    courseId: req.body.courseId
  });

  // 3- get the course 
  const updatedCourse = await Course.findById(
    req.body.courseId,
  );
  console.log(updatedCourse)
  // 4- Update the corresponding course.sections[] array by pushing new section IDs
  updatedCourse.sections.push(newSection._id)

  // 5- save course changes
  updatedCourse.save();

  // 6- send response back
  const { statusCode, body } = success({
    message: "New Section created without files",
    data: newSection,
  });
  res.status(statusCode).json(body);
});

/**
* @description get all sections
* @route GET /api/v1/section
* @access private [Instructor, Admin]
*/
const getAllSections = asyncHandler(async (req, res) => {
  // 1- get all sections
  const sections = await Section.find()//populate to courses and modules

  // 3- check if exists
  if (!sections) {
    return next(recordNotFound({ message: `no section is found` }))
  };
  // 3- send response back
  const { statusCode, body } = success({
    message: "get all sections",
    data: sections,
  });
  res.status(statusCode).json(body);
});
/**
* @description get section by id
* @route GET /api/v1/section
* @access private [Instructor, Admin]
*/
const getSectionByid = factory.getOne(Section);

/**
* @description update section
* @route PUT /api/v1/section
* @access private [Instructor, Admin]
*/
const updateSection = asyncHandler(async (req, res) => {
  //upload files, and update title
  try {
    const sectionId = req.params.id;
    // Check if files are uploaded
    if (!req.files || !req.files.file || req.files.file.length === 0) {
      // Update section without files
      try {
        console.log("noooo filessss")
        // 1- update section by id
        const updatedSection = await Section.findByIdAndUpdate(
          sectionId,
          { title: req.body.title },
          { new: true }
        );

        // 2- send response back
        const { statusCode, body } = success({
          message: "Section updated successfully no files",
          data: updatedSection,
        });
        return res.status(statusCode).json(body);
      } catch (error) {
        console.error("Error updating section:", error);
        return res.status(500).json({ message: "Internal Server Error" });
      }
    }

    // Assuming the uploaded files are in req.files.file
    // 1- get the files
    const uploadedFiles = req.files.file;
    console.log(uploadedFiles);

    // 2- Get the section by id
    const sec = await Section.findById(sectionId);

    // 3- get sections modules 
    const moduleIds = sec.modules;

    // 4- Iterate through each uploaded file
    for (const file of uploadedFiles) {
      // 5- get the name of the uploaded file
      const Name = file.originalname;
      // 6- create module for each file
      const module = await createModule({ file, Name });
      console.log(module);

      // 7- push module's id into section's moduleIds[] array
      if (module) {
        moduleIds.push(module._id);
      } else {
        // Handle the case where module creation failed
        console.error(`Failed to create module for file: ${file.originalname}`);
        // Returning a more detailed error message
        return res.status(500).json({ message: `Failed to create module for file: ${file.originalname}` });
      }
    }

    // 8- Update the section with the module IDs and other details
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        title: req.body.title,
        modules: moduleIds,
      },
      { new: true }
    );

    // 9- send response back
    const { statusCode, body } = success({
      message: "Section updated with files successfully",
      data: updatedSection,
    });
    res.status(statusCode).json(body);

  } catch (error) {
    console.error("Error updating section:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
* @description delete section
* @route DELETE /api/v1/section
* @access private [Instructor, Admin]
*/
const deleteSection = asyncHandler(async (req, res, next) => {
  try {
    // 1- Get section by id
    const sectionId = req.params.id;
    const section = await Section.findById(sectionId);
    // 2- check if section exists
    if (!section) {
      console.log(section)
      return next(RecordNotFound({ message: `section with id ${sectionId} is not found` }));
    }

    // 3- Get associated module IDs
    const moduleIds = section.modules;

    // 4- Delete each module
    for (const moduleId of moduleIds) {
      const deletedModule = await Modules.findByIdAndDelete(moduleId);
      if (!deletedModule) {
        console.log(`Module with ID ${moduleId} not found.`);
      }
    }

    // 5- delete/pull this section from course
    await Course.updateMany(
      { sections: sectionId },
      { $pull: { sections: sectionId } }
    );

    // 6- Delete the section itself
    await Section.findByIdAndDelete(sectionId);

    // 7- Send response back
    const { statusCode, body } = success({
      message: 'Section and associated modules deleted successfully',
    });
    res.status(statusCode).json(body);
  } catch (error) {
    console.error('Error deleting section:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});



module.exports = {
  createSection,
  getAllSections,
  getSectionByid,
  updateSection,
  deleteSection,
  uploadModuleVideos,
  uploadVideosToCloud
}