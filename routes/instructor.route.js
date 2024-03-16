/**
 * @route /api/v1/instructor
 */
const { Router } = require("express");

const {
    becomeInstracotr,
    getInstructor,
    getAllInstructors,
    updateInstructor,
    deleteInstructor
} = require('../controller/instructor.controller');

const {
    becomeInstracotrValidator,
    getInstractorValidator,
    updateInstracotrVAlidator,
    deleteInstracotrVAlidator
} = require('../utils/validations/instructor.validation');


const { protect, allowedRoles } = require("../services/auth.service");

const router = Router();

// protected
router.use(protect);

// user public
router.route("/becomeInstructor").
    post(
        becomeInstracotrValidator,
        becomeInstracotr
    );

// private [admin,instructor]
router
    .route('/getAllInstructors')
    .get(
        allowedRoles('Admin', 'Instructor'),
        getAllInstructors
    );
router
    .route('/getInstructor/:id')
    .get(
        allowedRoles('Admin', 'Instructor'),
        getInstractorValidator,
        getInstructor
    );

router
    .route('/updateInstructor/:id').
    put(
        allowedRoles('Admin', 'Instructor'),
        updateInstracotrVAlidator,
        updateInstructor
    );
router
    .route('/deleteInstructor/:id').delete(
        allowedRoles('Admin', 'Instructor'),
        deleteInstracotrVAlidator,
        deleteInstructor
    );
module.exports = router;
