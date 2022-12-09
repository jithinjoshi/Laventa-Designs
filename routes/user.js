var express = require("express");
var router = express.Router();
var userController = require("../controllers/userControllers");

const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.session.url = req.url
    console.log("-----------------------------------------------------");
    console.log(req.url);
    res.redirect("/signin");
  }
};

/* GET home page. */
router.get("/", userController.getHome);

router.get("/signup", userController.getSignUp);
router.post("/signup", userController.postSignup);

router.get("/signin", userController.getSignIn);
router.post("/signin", userController.postSignIn);

router.get("/signout", userController.getSignOut);

router.get("/productdetails/:id", userController.productDetails);

router.get("/otp", userController.getOtp);
router.post("/otp", userController.postOtp);

router.get("/verify", userController.getVerify);
router.post("/verify", userController.postVerify);

//cart

router.get("/cart", verifyLogin, userController.getCart);

router.get("/cart/:id", verifyLogin, userController.cartProducts);

router.get("/wishlist", verifyLogin,userController.getWishlist);

router.get("/wishlist/:id",verifyLogin, userController.wishlistProducts)

router.post(
  "/change-product-quantity",
  verifyLogin,
  userController.postChangeProductQuantity
);

router.get("/checkout", verifyLogin, userController.getCheckout);
router.post("/checkout", userController.postCheckout);

router.post("/verify-payment", userController.postVerifyPayment);

router.get("/orderlist", verifyLogin, userController.orderlist);
router.post("/orderlist/:id", userController.postOrder);

router.get(
  "/ordered-products/:id",
  verifyLogin,
  userController.viewOrders
);

router.get("/success/:id", userController.success);

router.get("/cancel", userController.cancel);

router.get("/profile", verifyLogin, userController.profile);
router.post("/profile", userController.postProfile);

router.get("/edit-address/:id",verifyLogin,userController.editAddress);
router.post("/edit-address/:id",verifyLogin,userController.postEditAddress)

router.post("/delete-address/:id",userController.deleteProduct)

router.post("/check-password", userController.checkPassword);

router.post('/cancel-product-order/:id/:order_id',userController.cancelProductOrder);

router.post('/delete-wishlist/:id/:wishlistId',userController.deleteWishlistProduct);

router.post('/check-coupon',userController.checkCoupon);

// router.get('/category-products',userController.categoryProducts)

router.post('/delete-cart-item',userController.deleteCartProduct);

router.post('/return',userController.retrunProduct);

router.get("/products/:category",userController.viewProduct);

router.post("/search",userController.searchProduct)

router.get('/search/:data',userController.search);




module.exports = router;
