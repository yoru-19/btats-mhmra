/**
 * @route /api/v1/auth
 */
const { Router } = require("express");
const {
  register,
  login,
  refresh,
  logout,
  forgetPassword,
  confirmReset,
  resetPassword,
} = require("../controller/auth.controller");
const {
  registerValidator,
  loginValidator,
  forgetPasswordValidator,
  confirmResetValidator,
  resetPasswordValidator,
} = require("../utils/validations/auth.validation");
const {
  resizeProfileImage,
  uploadProfileImage,
} = require("../controller/user.controller");

const router = Router();

router.post(
  "/register",
  uploadProfileImage,
  resizeProfileImage,
  registerValidator,
  register
);
router.post("/login", loginValidator, login);
router.get("/refresh", refresh);
router.delete("/logout", logout);
router.post("/forget-password", forgetPasswordValidator, forgetPassword);
router.post("/confirm-reset", confirmResetValidator, confirmReset);
router.post("/reset-password", resetPasswordValidator, resetPassword);

module.exports = router;
