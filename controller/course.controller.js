//import ApiFeatures from '../services/api-features.service';
const asyncHandler = require("express-async-handler");
//const mongoose = require('mongoose');
const sharp = require("sharp");
const { v4: uuid } = require("uuid");
//const factory = require("../services/factory.service")
const {
  recordNotFound,
  validationError,
} = require("../utils/response/errors");
//const ApiFeatures = require('../services/api-features.service');
const { success } = require("../utils/response/response");
const Course = require('../models/Course.model');
const Category = require('../models/Category.model'); // Import your Category model
const Section = require('../models/section.model'); // Import your Category model Module
const Module = require('../models/Module.model'); // Import your Category model Module
const User = require("../models/user.model");

const {
  uploadToCloudinary,
  uploadMix,
} = require("../services/file-upload.service");


//handles uploading thumbnail and vedioTrailer
const uploadtBoth = uploadMix([{ name: 'thumbnail', maxCount: 1 }, { name: 'videoTrailer', maxCount: 1 }]);

// Import necessary modules and dependencies
const resizethumbnailImg = asyncHandler(async (req, res, next) => {
  try {
    // Generate a unique filename using UUID and current timestamp
    const filename = `user-${uuid()}-${Date.now()}.jpeg`;

    // Check if a thumbnail file is provided in the request
    if (req.files.thumbnail) {

      // Validate the mimetype of the thumbnail file
      if (!req.files.thumbnail[0].mimetype.startsWith("image") && req.files.thumbnail[0].mimetype !== 'application/octet-stream') {
        return next(validationError({ message: "Only image files are allowed" }));
      }

      // Resize and format the thumbnail image using sharp library
      const img = await sharp(req.files.thumbnail[0].buffer)
        .resize(600, 600)
        .toFormat("jpeg")
        .jpeg({ quality: 95 });

      // Upload the resized thumbnail image to Cloudinary
      const data = await uploadToCloudinary(
        await img.toBuffer(),
        filename,
        "course"
      );
      // Check if 'data' is defined before accessing 'secure_url'
      if (data && data.secure_url) {
        // Save the Cloudinary URL of the thumbnail image into the request body
        req.body.thumbnail = data.secure_url;
      } else {
        return next(validationError({ message: "Error uploading thumbnail image" }));
      }
    }


    // Check if a video trailer file is provided in the request
    if (req.files.videoTrailer) {
      // Upload the video trailer file to Cloudinary
      const data = await uploadToCloudinary(
        req.files.videoTrailer[0].buffer,
        filename,
        "course"
      );

      console.log("Uploaded video trailer data:", data);

      // Check if 'data' is defined before accessing 'secure_url'
      if (data && data.secure_url) {
        // Save the Cloudinary URL of the video trailer into the request body
        req.body.videoTrailer = data.secure_url;
      } else {
        return next(validationError({ message: "Error uploading video trailer" }));
      }
    }

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    // Pass any errors to the next middleware for error handling
    next(error);
  }
});

/**
 * @description create new course
 * @route POST /api/v1/course
 * @access private [Instructor, Admin]
 */
const createCourse = asyncHandler(async (req, res, next) => {

  try {
    // create new course with title, subTitle, category, language, level and instructor fields
    // 1- Extract required fields from the request body
    const { title, subTitle, category, language, level } = req.body;
    const { _id } = req.user;//instrucotr id
    console.log(_id)
    // 2- Create the course using the extracted fields
    const newCourse = await Course.create({
      title: title,
      subTitle,
      category,
      language,
      level,
      instructor: _id
    });

    console.log(newCourse);
    // 3- Update the category with the new course
    await Category.findByIdAndUpdate(
      category,
      { $push: { courses: newCourse._id } },
      { new: true }
    );

    // 4- get the instructor by id
    const Instructor = await User.findById(_id);
    console.log(Instructor);
    // 5- get instructor courses
    const instructorCourses = Instructor.courses;

    // 6- push the new course id into instructor courses
    instructorCourses.push(newCourse._id);

    // 7- save the instructor
    Instructor.save();

    // 8- Send success response
    const { statusCode, body } = success({ data: newCourse });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * @description get all courses with selected fields
 * @route GET /api/v1/course
 * @access private [Instructor, Admin]
 */
const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await Course.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'instructor',
        foreignField: '_id',
        as: 'instructorInfo',
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        thumbnail: 1,//{ $ifNull: ['$price.amount', 0] }
        price: { amount: { $ifNull: ['$price.amount', 0] }, currency: { $ifNull: ['$price.currency', "EGP"] } },
        ratingsAverage: { $ifNull: ['$ratingsAverage', 0] },
        instructorName: { $arrayElemAt: ['$instructorInfo.name', 0] },
      },
    },
  ]);

  const { body, statusCode } = success({
    data: { results: courses },
  });
  res.status(statusCode).json(body);
});

/**
 * @description get course by id
 * @route GET /api/v1/course/:id
 * @access private [Instructor, Admin]
 */
const getCourseById = asyncHandler(async (req, res, next) => {
  try {
    const courseId = req.params.id;

    // Find the course by ID and populate the 'modules' field with the complete module objects
    const course = await Course.findById(courseId).populate('instructor').populate({
      path: 'sections',
      populate: {
        path: 'modules',
        model: 'Module',
        select: 'name _id isFree', // Specify the fields you want to include in the populated modules
      },
    });

    if (!course) {
      return next(recordNotFound({ message: `Course with id ${req.params.id} not found` }));
    }

    // Extract the populated modules from each section and format them as desired
    const formattedModules = [];
    course.sections.forEach(section => {
      section.modules.forEach(module => {
        formattedModules.push({ name: module.name, id: module._id });
      });
    });

    // Replace the original modules array in the course object with the formatted one
    course.modules = formattedModules;

    const { body, statusCode } = success({
      data: { results: course },
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});


/**
 * @description update course by id
 * @route PUT /api/v1/course/:id
 * @access private [Instructor, Admin]
 */
const updateCourse = asyncHandler(async (req, res, next) => {
  //update course with thumbnails, trailer,courseDescription, whatWillBeTaught, targetAudience, requirements
  const courseId = req.params.id;
  console.log(req.body)
  try {

    // 1- Check if the course exists
    if (!courseId) {
      return next(
        recordNotFound({
          message: `course with id ${req.params.id} not found`,
        })
      );
    }
    //2- Construct an update object with only the allowed parameters
    const updatedCourseData = {};

    if (req.body.instructor !== courseId.instructor) {
      updatedCourseData.instructor = req.body.instructor;
      // push this course to the instructor courses
      await User.updateMany(
        { _id: req.body.instructor },
        { $push: { courses: courseId } }
      );
    }
    if (req.body.title !== courseId.title) {
      updatedCourseData.title = req.body.title;
    }
    if (req.body.subTitle !== courseId.subTitle) {
      updatedCourseData.subTitle = req.body.subTitle;
    }
    if (req.body.category !== courseId.category) {
      updatedCourseData.category = req.body.category;
      //pull this course from previous category
      // await Category.updateMany(
      //   { _id: courseId.category },
      //   { $pull: { courses: courseId } }
      //);
      // push this course to the category courses
      await Category.updateMany(
        { _id: req.body.category },
        { $push: { courses: courseId } }
      );
    }
    if (req.body.language !== courseId.language) {
      updatedCourseData.language = req.body.language;
    }
    if (req.body.level !== courseId.level) {
      updatedCourseData.level = req.body.level;
    }
    if (req.body.thumbnail !== courseId.thumbnail) {
      updatedCourseData.thumbnail = req.body.thumbnail;
    }
    if (req.body.videoTrailer !== courseId.videoTrailer) {
      updatedCourseData.videoTrailer = req.body.videoTrailer;
    }
    //won't be using it first time when creating new course
    if (req.body.sections !== courseId.sections) {
      updatedCourseData.sections = req.body.sections;
    }
    if (req.body.courseDescription !== courseId.courseDescription) {
      updatedCourseData.courseDescription = req.body.courseDescription;
    }
    if (req.body.whatWillBeTaught !== courseId.whatWillBeTaught) {
      updatedCourseData.whatWillBeTaught = req.body.whatWillBeTaught;
    }
    if (req.body.targetAudience !== courseId.targetAudience) {
      updatedCourseData.targetAudience = req.body.targetAudience;
    }
    if (req.body.requirements !== courseId.requirements) {
      updatedCourseData.requirements = req.body.requirements;
    }
    if (req.body.ratingsAverage !== courseId.ratingsAverage) {
      updatedCourseData.ratingsAverage = req.body.ratingsAverage;
    }
    if (req.body.price.amount || req.body.price.currency ) {
      // Initialize price object if it's undefined
      if (!updatedCourseData.price) {
        updatedCourseData.price = {};
      }
      // Check if amount and currency are provided
      if (req.body.price.amount) {
        updatedCourseData.price.amount = req.body.price.amount;
      }
      if (req.body.price.currency) {
        updatedCourseData.price.currency = req.body.price.currency;
      }
    }
    console.log("updatedCourseData ", updatedCourseData);
    //3- Update course by id with the constructed update object
    const updatedData = await Course.findByIdAndUpdate(courseId, updatedCourseData, { new: true });

    //4- send a response
    const { statusCode, body } = success({ data: updatedData });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * @description delete course by id
 * @route DELETE /api/v1/course/:id
 * @access private [Instructor, Admin]
 */
const deleteCourse = asyncHandler(async (req, res, next) => {
  try {
    // 1- get course id
    const courseId = req.params.id;

    // 2- Find the course by id
    const deletedCourse = await Course.findById(courseId);

    // 3- Check if course exists
    if (!deletedCourse) {
      return next(
        recordNotFound({
          message: `Course with id ${req.params.id} not found`,
        })
      );
    }

    // 4- Remove course from instructor's courses
    await User.updateMany(
      { courses: courseId },
      { $pull: { courses: courseId } }
    );

    // 5- Remove course from category's courses
    await Category.updateMany(
      { courses: courseId },
      { $pull: { courses: courseId } }
    );

    // 7- Delete sections associated with the course
    //const Sections = deletedCourse.sections;

    // 8 - iterate over all sections
    const sections = deletedCourse.sections;
    for (const sectionId of sections) {
      // 9- get section
      const sec = await Section.findById(sectionId);
      // 10- get section's modules

      if (sec) {
        console.log(sec)
        const secModules = sec.modules;
        // 11- iterate through modules and delete each
        for (const module of secModules) {
          const deletedModule = await Module.findByIdAndDelete(module);
          if (!deletedModule) {
            console.log(`Module with ID ${module} not found.`);
          }
        }
        // 12- delete section
        await Section.findByIdAndDelete(sectionId)
      }

    }

    // 13- delete course
    await Course.findByIdAndDelete(courseId);

    // 14- Send response
    const { statusCode, body } = success({
      message: "Course, associated modules, and sections deleted successfully",
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * @description Add course to wishlist
 * @route PUT /api/v1/course/wishlist
 * @access protected User
 */
const addCourseToWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { courseId } = req.body;

  // 1- get user by id
  const user = await User.findById(_id);
  // 2- check if the course is already in wishlist
  const alreadyAdded = user.wishlist.find((id) => id.toString() === courseId);

  if (alreadyAdded) {
    // remove the course from wishlist
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { $pull: { wishlist: courseId } },
      { new: true }
    );
    // get response back
    const { statusCode, body } = success({
      message: 'Course removed successfully from your wishlist.',
      data: updatedUser.wishlist,
    });
    res.status(statusCode).json(body);

  } else {
    // add course to wishlist
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { $push: { wishlist: courseId } },
      { new: true }
    );
    // get course by id
    const course = await Course.findById(courseId).populate({
      path: 'sections', select: 'name'
    });
    //
    // const 
    // get sections count
    const count = await constructor.countDocuments({ courseId: courseId });
    // get response back
    const { statusCode, body } = success({
      message: 'Course added successfully to your wishlist.',
      data: updatedUser.wishlist,
    });
    res.status(statusCode).json(body);
  }
});

/**
 * @description getuserwishlist
 * @route GET /api/v1/course/wishlist
 * @access protected User
 */
const getLoggedUserWishlist = asyncHandler(async (req, res) => {
  // 1- get user by id
  const user = await User.findById(req.user._id).populate('wishlist');

  // 2- get response back
  const { statusCode, body } = success({
    message: 'User Wishlist:',
    data: user.wishlist
  });
  res.status(statusCode).json(body);
});

/**
 * @description get all courses to specific category
 * @route GET /api/v1/course/categoriesId/:categoryId
 * @access protected User
 */
const getCoursesInCategory = asyncHandler(async (req, res, next) => {//not finished yet
  try {
    // 1- get category by id
    const categoryWithCourses = await Category.findById(req.params.categoryId);
    // 2- check if the category exists
    if (!categoryWithCourses || !categoryWithCourses.courses || categoryWithCourses.courses.length === 0) {
      return next(recordNotFound({ message: `Courses not found for this category` }));
    }
    const courses = categoryWithCourses.courses;
    const formattedCourses = [];

    for (const courseId of courses) {
      // get course by id
      const course = await Course.findById(courseId).populate('instructor', 'name'); // Populate instructor's name only

      if (course) {
        formattedCourses.push({
          _id: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          price: course.price,
          ratingsAverage: course.ratingsAverage || 0,
          instructorName: course.instructor.name, // Include instructor's name in the output
        });
      }
    }

    // 5- return response
    const { statusCode, body } = success({
      message: 'Instructor courses',
      data: { results: formattedCourses },
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error)
  }

});
/**
 * @description get courses by specific instructor with selected fields
 * @route GET /api/v1/course/getinstructorcourse
 * @access protected User
 */
const getCoursesByInstructor = asyncHandler(async (req, res, next) => {
  try {
    // get instructor id
    const { _id } = req.user;
    // 1- get instructor by id
    const instructor = await User.findById(_id);

    // 2- check if the instructor exists
    if (!instructor || !instructor.courses || instructor.courses.length === 0) {
      return next(recordNotFound({ message: `Courses not found for this instructor` }));
    }

    // 3- get the instructor courses
    const Courses = instructor.courses; // Array of courses for the instructor
    console.log(Courses)

    // 5- map through each course and get the id, title, thumbnail, price, ratingsAvaerage, and instructorName
    const formattedCourses = [];
    for (const courseId of Courses) {
      // get course by id
      const course = await Course.findById(courseId).
        populate('instructor', 'name'); // Populate instructor's name only
      //check if exists
      if (course) {
        formattedCourses.push({
          _id: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          price: course.price,
          ratingsAverage: course.ratingsAverage || 0,
          instructorName: course.instructor.name, // Include instructor's name in the output
        });
      }
    }
    // 6- return response
    const { statusCode, body } = success({
      message: 'Instructor courses',
      data: { results: formattedCourses },
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

const clearCatogrySections = asyncHandler(async (req, res, next) => {
  try {
    const catogory = await Category.findById(req.params.id);

    const courses = catogory.courses;
    console.log(courses)

    if (!courses) {
      return next(recordNotFound({ message: 'Courses not found' }))
    }

    for (const coursesId of courses) {

      await Category.updateMany(
        { courses: coursesId },
        { $pull: { courses: coursesId } }
      );

    }
    const { statusCode, body } = success({
      message: 'catogery courses pulled successfully',

    });
    res.status(statusCode).json(body);
  }
  catch (error) {
    next(error);
  }
});

/**
 * @description get search for course
 * @route get /api/v1/course/search/course
 * @access protected User
 */
const searchCourse = asyncHandler(async (req, res, next) => {
  try {

    let mongooseQuery = Course.find().populate({
      path: 'instructor',
      select: 'name -_id'
    });

    //Limit fields if specified in the request
    // const { fields } = req.query;
    // if (fields) {
    //   const selectedFields = fields.split(',').join(' ');
    //   mongooseQuery = mongooseQuery.select(selectedFields);
    // } else {
    //   mongooseQuery = mongooseQuery.select('-__v');
    // }
    // Search by keyword if provided
    const { keyword } = req.query;//keyword
    if (keyword) {
      let query = {}
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { subTitle: { $regex: keyword, $options: "i" } },
        { courseDescription: { $regex: keyword, $options: "i" } },
      ]

      console.log('Search query:', query);
      mongooseQuery = mongooseQuery.find(query);
    };

    // Execute the MongoDB query
    const courses = await mongooseQuery;

    if (courses.length === 0) {
      return next(recordNotFound({ message: "No courses found" }));
    }
    //
    const formattedCourses = [];
    for (const courseId of courses) {
      // get course by id
      const course = await Course.findById(courseId).
        populate('instructor', 'name'); // Populate instructor's name only

      if (course) {
        formattedCourses.push({
          _id: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          price: course.price,
          ratingsAverage: course.ratingsAverage || 0,
          instructorName: course.instructor.name, // Include instructor's name in the output
        });
      }
    }

    // send response back
    const { statusCode, body } = success({
      message: 'Searched courses',
      data: { results: formattedCourses }
    });
    res.status(statusCode).json(body);
  } catch (err) {
    next(err);
  }
});
/**
 * @description get search for course
 * @route get /api/v1/course/search/instructor
 * @access protected User
 */
const searchInstructor = asyncHandler(async (req, res, next) => {
  try {

    let mongooseQuery = User.find();

    // Search by keyword if provided
    const { keyword } = req.query;//keyword
    if (keyword) {
      let query = {}
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
      ]

      console.log('Search query:', query);
      mongooseQuery = mongooseQuery.find(query);
      //console.log(query);
    };

    // Execute the MongoDB query
    const instructor = await mongooseQuery;
    console.log(instructor);
    //check if the exist an instructor
    if (!instructor || instructor.length === 0) {
      return next(recordNotFound({ message: "No instructor found" }));
    }
    // extract courses 
    const Courses = instructor[0].courses;
    if (!Courses) {
      return next(recordNotFound({ message: "there is no course for this instructor" }))
    }
    // iterate over the courses
    const formattedCourses = [];
    for (const courseId of Courses) {
      // get course by id
      const course = await Course.findById(courseId).
        populate('instructor', 'name'); // Populate instructor's name only
      //check if exists
      if (course) {
        formattedCourses.push({
          _id: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          price: course.price,
          ratingsAverage: course.ratingsAverage || 0,
          instructorName: course.instructor.name, // Include instructor's name in the output
        });
      }
    }
    // send response back
    const { statusCode, body } = success({
      message: 'Instrucor courses',
      data: { results: formattedCourses }
    });
    res.status(statusCode).json(body);
  } catch (err) {
    next(err);
  }
});
/**
 * @description get search for course
 * @route get /api/v1/course/search/category
 * @access protected User
 */
const searchCatogery = asyncHandler(async (req, res, next) => {
  try {

    let mongooseQuery = Category.find();

    // Search by keyword if provided
    const { keyword } = req.query;//keyword
    console.log(keyword)
    if (keyword) {
      console.log("in")
      let query = {}
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
      ]

      console.log('Search query:', query);
      mongooseQuery = mongooseQuery.find(query);
    }

    // Execute the MongoDB query
    const category = await mongooseQuery;
    console.log(category);
    //check if the exist an instructor
    if (!category || category.length === 0) {
      return next(recordNotFound({ message: "No category found" }));
    }
    // extract courses 
    const Courses = category[0].courses;//for empty search it return 1st course
    //check if threre course exists
    if (!Courses) {
      return next(recordNotFound({ message: "there is no courses for this category" }));
    }
    // iterate over the courses
    const formattedCourses = [];
    for (const courseId of Courses) {
      // get course by id
      const course = await Course.findById(courseId).
        populate('instructor', 'name'); // Populate instructor's name only
      //check if exists
      if (course) {
        formattedCourses.push({
          _id: course._id,
          title: course.title,
          thumbnail: course.thumbnail,
          price: course.price,
          ratingsAverage: course.ratingsAverage || 0,
          instructorName: course.instructor.name, // Include instructor's name in the output
        });
      }
    }
    // send response back
    const { statusCode, body } = success({
      message: 'category courses',
      data: { results: formattedCourses }
    });
    res.status(statusCode).json(body);
  } catch (err) {
    next(err);
  }
});
/**
 * @description post search for course
 * @route PUT /api/v1/calculate-duration/:id
 * @access protected Instructor
 */
const coursDuration = asyncHandler(async (req, res, next) => {
  try {
    //get course by id
    const course = await Course.findById(req.params.id)
    console.log(course);
    //check if course exists
    if (!course) {
      return next(recordNotFound({ message: 'course not found' }));
    }
    //check if there exists sections in this course
    if (course.sections) {
      //get course sections
      const sectionsId = course.sections;
      console.log(sectionsId)
      // initiate couse duration
      let hours = 0; let minutes = 0; let seconds = 0;
      //iterate through each section
      for (const section of sectionsId) {
        // get section by id
        console.log(section);
        const sec = await Section.findById(section);
        if (sec) {
          // extract section duration
          hours += sec.sectionDuration.hours;
          minutes += sec.sectionDuration.minutes;
          seconds += sec.sectionDuration.seconds;
        }
      }
      //update course duration
      course.duration.hours = hours;
      course.duration.minutes = minutes;
      course.duration.seconds = seconds;
      // save course
      await course.save();
      //return response
      const { statusCode, body } = success({
        message: 'Course duration calculated successfully',
        data: course.duration
      });
      res.status(statusCode).json(body);
    }
  } catch (err) {
    next(err);
  }
})
module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  resizethumbnailImg,
  uploadtBoth,
  addCourseToWishlist,
  getLoggedUserWishlist,
  getCoursesInCategory,
  getCoursesByInstructor,
  searchCourse,
  searchInstructor,
  searchCatogery,
  clearCatogrySections,
  coursDuration
};
