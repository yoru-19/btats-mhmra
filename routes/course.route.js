/**
 * @route /api/v1/course
 */

const { Router } = require("express");
const {
    createCourse,
    getAllCourses,
    deleteCourse,
    updateCourse,
    getCourseById,
    resizethumbnailImg,
    uploadtBoth,
    addCourseToWishlist,
    getLoggedUserWishlist,
    getCoursesInCategory,
    getCoursesByInstructor
} = require("../controller/course.controller");

const { protect, allowedRoles } = require("../services/auth.service");

const {
    createCourseValidator,
    deleteCourseValidator,
    getCourseValidator,
    updateCourseValidator,
} = require("../utils/validations/course.validation");

const router = Router();



// protected
router.use(protect);

router.route("/categoriesId/:categoryId")
    .get(getCoursesInCategory)

// user & instructor & admin
router.route("/wishlist")
    .put(addCourseToWishlist)
    .get(getLoggedUserWishlist);

// private [Instructor]
router.use(allowedRoles("Instructor", "Admin"));

router.route("/getinstructorcourse")
    .get(getCoursesByInstructor);

router.route("/")
    .get(getAllCourses)
    .post(
        //uploadtBoth,
        //resizethumbnailImg,
        createCourseValidator,
        createCourse);

router.route("/:id")
    .get(
        getCourseValidator,
        getCourseById)
    .delete(
        deleteCourseValidator,
        deleteCourse
    )
    .put(
        uploadtBoth,
        resizethumbnailImg,
        //updateCourseValidator,//error 
        updateCourse
    );



module.exports = router;
