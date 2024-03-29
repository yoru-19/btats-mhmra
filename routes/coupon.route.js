const { Router } = require("express");

const {
  getCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controller/coupon.controller');

const { protect, allowedRoles } = require("../services/auth.service");

const router = Router();

router.use(protect, allowedRoles('Admin', 'Instructor'));

router.route('/').get(getCoupons).post(createCoupon);
router.route('/:id').get(getCoupon).put(updateCoupon).delete(deleteCoupon);

module.exports = router;
