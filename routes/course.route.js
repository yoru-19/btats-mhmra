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
    getCoursesByInstructor,
    clearCatogrySections
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

router.route("/clearCategCourses/:id")
    .get(clearCatogrySections)

router.route("/categoriesId/:categoryId")
    .get(getCoursesInCategory)

// user & instructor & admin
router.route("/wishlist")
    .put(addCourseToWishlist)
    .get(getLoggedUserWishlist);

router.route("/")
    .get(getAllCourses)


// private [Instructor]
router.use(allowedRoles("Instructor", "Admin"));

router.route("/getInstructorCourse")
    .get(getCoursesByInstructor);

router.route("/")
    .post(
        //uploadtBoth,
        //resizethumbnailImg,
        createCourseValidator,
        createCourse);

router.route("/:id")
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

router.use(allowedRoles("Instructor", "Admin", "User"));

router.route("/:id")
    .get(
        getCourseValidator,
        getCourseById)


module.exports = router;
