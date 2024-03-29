/**
 * @ignore things i might need latter 
 */
/* exports.applyCoupon = asyncHandler(async (req, res, next) => {
//   // 1) Get coupon based on coupon name
//   const coupon = await Coupon.findOne({
//     name: req.body.coupon,
//     expire: { $gt: Date.now() },
//   });

//   if (!coupon) {
//     return next(new recordNotFound(`Coupon is invalid or expired`));
//   }

//   // 2) Get logged user cart to get total cart price
//   const cart = await Cart.findOne({ user: req.user._id });

//   const totalPrice = cart.totalCartPrice;

//   // 3) Calculate price after priceAfterDiscount
//   const totalPriceAfterDiscount = (
//     totalPrice -
//     (totalPrice * coupon.discount) / 100
//   ).toFixed(2); // 99.23

//   cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
//   await cart.save();

//   res.status(200).json({
//     status: 'success',
//     numOfCartItems: cart.cartItems.length,
//     data: cart,
//   });
// });*/

// the below code fragment can be found in: get looged user cart before modification
// const getLoggedUserCart = asyncHandler(async (req, res) => {
//     // 1. Find the cart for the logged-in user
//     const cart = await Cart.findOne({ user: req.user._id });
  
//     // 2. Check if cart exists
//     if (!cart) {
//       // If cart does not exist, return a 404 error using recordNotFound
//       return recordNotFound({
//         message: `There is no cart for this user id: ${req.user._id}`,
//       });
//     }
  
//     // 3. Check if cartItems array is empty
//     if (cart.cartItems.length === 0) {
//       // If cart exists but cartItems is empty, return a success response indicating an empty cart
//       const { body, statusCode } = success({
//         message: "Cart is empty",
//         data: {
//           numOfCartItems: cart.cartItems.length,
//           data: cart,
//         },
//       });
//       return res.status(statusCode).json(body);
//     }
  
//     // 4. If cart and cartItems exist, create a success response body
//     const { body, statusCode } = success({
//       data: {
//         numOfCartItems: cart.cartItems.length,
//         data: cart,
//       },
//     });
  
//     // 5. Send the success response
//     res.status(statusCode).json(body);
//   });

/*const calcTotalCartPrice = (cart) => {
  let totalPrice = 0;

  cart.cartItems.forEach((item) => {
    // Check if item.price is a valid number
    if (typeof item.price === "number" && !isNaN(item.price)) {
      totalPrice += item.price;
    } else {
      console.error("Invalid price for cart item:", item);
    }
  });
  cart.totalCartPrice = totalPrice;
  cart.totalPriceAfterDiscount = undefined;
  return totalPrice;
}; */

/* // 1- Find the category by ID and populate the 'courses' field to get course details
// const categoryWithCourses = await Category.findById(req.params.categoryId).populate('courses');

// // 2- check if categoryWithCourses exists
// if (!categoryWithCourses) {
//   return next(recordNotFound({ message: `Catogory not found` }))
// }

/// 3- Extract courses from the populated field
// const coursesInCategory = categoryWithCourses.courses;

// // 4- get response back
// const { statusCode, body } = success({
//   message: 'categoryCourses:',
//   data: coursesInCategory
// });
// res.status(statusCode).json(body);*/