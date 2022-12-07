var express = require("express");
var router = express.Router();

const multer = require("multer");
const path = require("path");

const adminController = require("../controllers/adminContollers");

//verifyAdminLogin
const verifyAdminLogin = (req, res, next) => {
  if (!req.session.loggedIn) {
    res.redirect("/admin");
  } else {
    next();
  }
};

const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb, err) => {
    if (err) {
      console.log(err);
    }
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
}).array("file", 4);

/* Admin Login. */
router.get("/", adminController.loginAdmin);

// Admin authentication
router.post("/login", adminController.postLogin);

router.get("/logout", adminController.logoutAdmin);

router.get("/home", verifyAdminLogin, adminController.homeAdmin);

router.get("/products", verifyAdminLogin, adminController.productsAdmin);

router.get("/addProduct", verifyAdminLogin, adminController.addProductsAdmin);

router.post(
  "/addProduct",
  verifyAdminLogin,
  upload,
  adminController.postAddProducts
);

router.get("/edit/:id", verifyAdminLogin, adminController.editProducts);

router.post(
  "/edit/:id",
  verifyAdminLogin,
  upload,
  adminController.editProdcuts
);

router.post("/delete", adminController.deleteProducts);

router.get("/addcategory", verifyAdminLogin, adminController.addCategoryAdmin);

router.post("/addcategory", adminController.addCategory);

router.get("/category", verifyAdminLogin, adminController.categoryAdmin);

router.post("/categoryDelete", adminController.categoryDelete);

router.get("/customers", verifyAdminLogin, adminController.customersAdmin);

router.post("/customers/block/:id", adminController.blockUser);

router.post("/customers/unblock/:id", adminController.unblockUser);

router.get("/orders", verifyAdminLogin, adminController.ordersAdmin);

router.post("/pack/:prodId/:orderId", adminController.packOrders);

router.post("/ship/:prodId/:orderId", adminController.shipOrders);

router.post("/deliver/:prodId/:orderId", adminController.deliveryOrders);

router.post("/cancel/:prodId/:orderId", adminController.cancelOrders);

router.post("/return/allow/:prodId/:orderId", adminController.allowReturn)

router.post("/return/deny/:prodId/:orderId", adminController.denyReturn)

router.get("/coupons", adminController.coupons)

router.get("/createCoupon",verifyAdminLogin,adminController.createCoupon);

router.post("/createCoupon", adminController.postCreateCoupon);

router.get("/view-products/:id",verifyAdminLogin,adminController.getViewProducts);

router.get("/sales-report",verifyAdminLogin,adminController.salesReport);

router.get("/addPdt",verifyAdminLogin,adminController.getAddPdt);

router.get("/editPdt/:id",verifyAdminLogin,adminController.getEditPdt);
router.get("/editCategory/:id",verifyAdminLogin,adminController.editCategory);
router.post("/editCategory/:id",adminController.postEditCategory)

module.exports = router;
