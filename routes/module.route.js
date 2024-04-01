/**
 * @route /api/v1/coursemodule
 */
const { Router } = require("express");

const {
    createModule,
    deleteModule,
    getAllModules,
    getModuleById,
    updateModule,
    uploadModuleVideos,
    uploadVideosToCloud,
    CalcDuration,
    calculateModuleDuration
} = require("../controller/module.controller");

const { protect, allowedRoles } = require("../services/auth.service");

const {
    createModuleValidator,
    deleteModuleValidator,
    getModuleValidator,
    updateModuleValidator
} = require("../utils/validations/module.validation");

const router = Router();

// protected
router.use(protect);



// private [Instructor,Admin]
router.use(allowedRoles("Instructor", "Admin"));

router.route("/")
    .get(getAllModules)
    .post(uploadModuleVideos, uploadVideosToCloud, createModuleValidator, createModule);

router.route("/calculate-duration/:id")
    .put(CalcDuration)

router.route("/:id")
    .get(getModuleValidator, getModuleById)
    .delete(deleteModuleValidator, deleteModule)
    .put(updateModuleValidator, updateModule);

module.exports = router;