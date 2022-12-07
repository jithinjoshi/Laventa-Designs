var userHelper = require("../helpers/userHelpers");
const Cart = require("../models/Cart");
const Category = require("../models/Category");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { Convert } = require("easy-currencies");
const paypal = require("paypal-rest-sdk");

const { default: mongoose } = require("mongoose");
const Address = require("../models/Address");
const client = require("twilio")(process.env.ACCOUNTSID, process.env.AUTHTOKEN);

//GET METHODS

//home
const getHome = async function (req, res, next) {
  const categories = await Category.find({});
  const products = await Product.find({});
  const user = req.session.user;
  let cartCount = null;
  let wishlistCount = null;
  let wishlistData;


  if (user) {
    cartCount = await userHelper.getCartProductCount(user._id);
    wishlistCount = await userHelper.getWishlistProductCount(user._id);
    wishlistData = await userHelper.getWishlistProducts(user._id);

  }
  res.render("index", { categories, products, user, cartCount, wishlistCount, wishlistData  });
};

//signup
const getSignUp = (req, res) => {
  res.render("signup", { message: req.flash("message") });
};

//signin
const getSignIn = function (req, res) {
  res.render("signin", { message: req.flash("message") });
};

//signout
const getSignOut = (req, res) => {
  req.session.userlogin = false;
  req.session.user = null;
  res.redirect("/");
};

//productDetails
const productDetails = async (req, res) => {
  const id = req.params.id;
  const product = await Product.findOne({ _id: id });

  const products = await Product.find({});
  const user = req.session.user;
  let cartCount = null;
  let wishlistCount = null;
  if (user) {
    cartCount = await userHelper.getCartProductCount(user._id);
    wishlistCount = await userHelper.getWishlistProductCount(user._id);
  }

  res.render("single", { product, products, user, cartCount, wishlistCount });
};

//otp
const getOtp = (req, res) => {
  res.render("otp", { message: req.flash("message") });
};

//verify
const getVerify = async (req, res) => {
  const mobile = req.session.phone;
  res.render("otp-varification", { message: req.flash("message"), mobile });
};

//cart
const getCart = async (req, res) => {
  const user = req.session.user;
  const userId = req.session.user._id;
  const discount = req.session.discount;
  let cartCount = null;
  cartCount = await userHelper.getCartProductCount(userId);
  let data = await userHelper.getCartProducts(userId);
  let total = await userHelper.getTotalAmount(userId, discount);
  wishlistCount = await userHelper.getWishlistProductCount(userId);

  res.render("shoping-cart", { user, items: data, cartCount, total, wishlistCount });
};

//cart products
const cartProducts = async (req, res) => {
  const productId = req.params.id;
  const userId = req.session.user._id;

  userHelper.doCart(productId, userId).then((status) => {
    if (status.status) {
      res.json({ status: true });
    } else {
      res.json({ status: false });
    }

  });

  const stockCount = await userHelper.viewStock(productId, userId);
};

//wishlist
const getWishlist = async (req, res) => {
  const user = req.session.user;
  const userId = req.session.user._id;
  let cartCount = null;
  cartCount = await userHelper.getCartProductCount(userId);
  let wishlistCount = null;
  wishlistCount = await userHelper.getWishlistProductCount(userId);
  let datas = await userHelper.getWishlistProducts(userId);

  res.render("wishlist", { user, datas, cartCount, wishlistCount })
}

//wishlist products
const wishlistProducts = (req, res) => {
  const productId = req.params.id;
  const userId = req.session.user._id;

  userHelper.doWishlist(productId, userId).then((data) => {
    if(data.status){
      res.json(data);
    }else{
      res.json({status:false})
    }
    
  });
};

//checkout
const getCheckout = async (req, res) => {
  let user = req.session.user;
  let discount = req.session.discount;
  let cartCount = null;
  let wishlistCount = null;
  cartCount = await userHelper.getCartProductCount(user._id);
  let cartTotal = await userHelper.getTotalAmount(user._id, discount);
  let address = await userHelper.getDefaultAddress(user._id);

  wishlistCount = await userHelper.getWishlistProductCount(user._id);

  let wallet = await userHelper.getWalletAmount(user._id)


  res.render("checkout", { user, cartCount, cartTotal, address, wishlistCount, wallet });
};

//orderlist
const orderlist = async (req, res) => {
  const user = req.session.user;
  const userId = req.session.user._id;
  let cartCount = null;
  let wishlistCount = null;
  cartCount = await userHelper.getCartProductCount(userId);
  const orders = await Order.find({});
  wishlistCount = await userHelper.getWishlistProductCount(userId);

  var orderDates;

  orders.forEach(order => {
    orderDates = order.Date.toISOString().slice(0, 10);
  });

  res.render("viewOrders", { user, cartCount, orders, wishlistCount, orderDates });
};

// const viewOrders = async (req,res)=>{
//   const user = req.session.user;
//   const userId = req.session.user._id;
//   let cartCount = null;
//   cartCount = await userHelper.getCartProductCount(userId);
//   const orders = await Order.find({});

//   res.render("myOrders",{user,cartCount,orders})

// }

//ordered products
const viewOrders = async (req, res) => {
  let orderId = req.params.id;
  const user = req.session.user;
  const userId = req.session.user._id;
  let cartCount = null;
  let wishlistCount = null;
  cartCount = await userHelper.getCartProductCount(userId);
  const orders = await Order.find({});
  let products = await userHelper.getOrderedProducts(orderId);
  wishlistCount = await userHelper.getWishlistProductCount(userId);
  res.render("ordered-products", { user, cartCount, orders, products, wishlistCount });
};

//success message
const success = async (req, res) => {
  let id = req.params.id;
  userHelper.changePaymentStatus(id);
  res.render("success");
};

//cancel
const cancel = (req, res) => {
  res.render("failure");
};

//profile
const profile = async (req, res) => {
  const user = req.session.user;
  const userId = req.session.user._id;
  let cartCount = null;
  cartCount = await userHelper.getCartProductCount(userId);
  const [year, day, month] = user.createdAt.toString().split("T")[0].split("-");
  let date = `${day}-${month}-${year}`;

  let myOrders = await Order.find({});
  let currentUser = await User.findOne({ _id: userId });

  let wishlistCount = null;
  wishlistCount = await userHelper.getWishlistProductCount(userId);

  let addresses = await Address.find({});

  res.render("userProfile", { user, cartCount, date, myOrders, currentUser, wishlistCount, addresses });
};

//POST METHODS

const postSignup = function (req, res) {
  const userData = req.body;
  userHelper.doSignup(userData).then((response) => {
    if (response.isUser) {
      req.session.userlogin = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      req.flash(
        "message",
        "user already exist with this email address or mobile number"
      );
      res.redirect("/signup");
    }
  });
};

const postSignIn = function (req, res) {
  const userData = req.body;
  console.log(userData);

  userHelper.doSignin(userData).then((result) => {
    if (result.status) {
      req.session.userlogin = true;
      req.session.user = result.user;
      res.redirect("/");
    } else if (result.access === false) {
      req.flash("message", "You are blocked");
      res.redirect("/signin");
    } else {
      req.flash("message", "invalid credentials");
      res.redirect("/signin");
    }
  });
};

const postOtp = async (req, res) => {
  let phone = req.body.mobile;

  const checkphone = await User.findOne({ mobile: phone });

  if (checkphone === null) {
    req.flash("message", "Enter a valid Mobile Number");
    res.redirect("/otp");
  } else if (checkphone.status === false) {
    req.flash("message", "You are blocked");
    res.redirect("/otp");
  } else {
    console.log(phone);
    client.verify.services(process.env.SERVICE_ID).verifications.create({
      to: `+91${phone}`,
      channel: "sms",
    });

    req.session.phone = checkphone.mobile;
    res.redirect("/verify");
  }
};

const postVerify = (req, res) => {
  const otp = req.body.otp;
  const mobile = req.session.phone;
  client.verify
    .services(process.env.SERVICE_ID)
    .verificationChecks.create({
      to: `+91${mobile}`,
      code: otp,
    })
    .then(async (resp) => {
      console.log(resp);
      console.log(resp.valid);
      if (resp.valid) {
        const user = await User.findOne({ mobile });
        req.session.user = user;
        res.redirect("/");
      } else {
        req.flash("message", "Invalid OTP");
        res.redirect("/verify");
      }
    });
};

const postChangeProductQuantity = (req, res) => {
  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.getTotalAmount(req.body.user);
    res.json(response);
  });
};

const postCheckout = async (req, res) => {
  let discount = req.session.discount;

  let products = await userHelper.getCartProductList(req.body.userid);
  let totalPrice = await userHelper.getTotalAmount(req.body.userid, discount);
  req.session.discount = null;
  userHelper.placeOrder(req.body, products, totalPrice).then(async (orderId) => {
    if (req.body.payment === "COD") {
      res.json({ isCODPayment: true });
    } else if (req.body.payment === "ONLINE") {
      userHelper.razorpayPayment(totalPrice, orderId).then((response) => {
        console.log(response);
        res.json(response);
      });
    }else if(req.body.payment === "WALLET"){
      
      let wallet = await userHelper.reduceWalletAmount(req.body.userid,totalPrice);
      res.json({ isWalletPayment: true });

    } else {
      userHelper.generatePaypal(orderId, totalPrice).then((response) => {
        res.json(response);
        req.session.orderid = orderId;
      });
    }
  }).catch((stock) => {
    console.log(stock);
    if (stock.stock === null) {
      res.json({ stock: false })
    }

  })
};

const postVerifyPayment = (req, res) => {
  userHelper
    .verifyPayment(req.body)
    .then(() => {
      userHelper.changePaymentStatus(req.body["order[receipt]"]).then(() => {
        res.json({ status: true });
      });
    })
    .catch((err) => {
      console.log(err);
      res.json({ status: false });
    });
};

const postOrder = async (req, res) => {
  let id = req.params.id;
  let cancelOrder = await Order.findByIdAndUpdate(id, { status: "cancelled" });
  res.redirect("/orderlist");
};

const postProfile = async (req, res) => {
  const userId = req.session.user._id;
  let { name, email, phone } = req.body;

  console.log(userId);
  console.log(name);

  let update = await User.findOneAndUpdate(
    { _id: userId },
    { $set: { username: name, email, mobile: phone } }
  );

  let newPassword = req.body.password;
  console.log(newPassword);
  if (newPassword != "") {
    userHelper.hashPassword(newPassword).then((data) => {
      let { compare } = req.body;
      userHelper.comparePassword(compare, data).then(async (result) => {
        if (result) {
          let updatePassword = await User.findByIdAndUpdate(
            { _id: userId },
            { password: data }
          );
          let user = await User.findOne({ _id: userId });
          req.session.user = user;
          res.json({ url: "/" });
        } else {
          let user = await User.findOne({ _id: userId });
          req.session.user = user;
          res.json({ url: "/" });
        }
      });
    });
  } else {
    let user = await User.findOne({ _id: userId });
    req.session.user = user;
    res.json({ url: "/" });
  }

  async function updatedUser() { }
};

const checkPassword = async (req, res) => {
  let userId = req.session.user._id;
  let user = await User.find({ _id: userId });

  let password = req.body.password;
  userHelper.comparePassword(password, user[0].password).then((data) => {
    console.log(data, user[0].password);
    if (data) {
      console.log("success");
      res.json({ login: true });
    } else {
      res.json({ login: false });
      console.log("failed");
    }
  });
};

const cancelProductOrder = async (req, res) => {
  let id = req.params.id;
  let orderId = req.params.order_id;
  let uId = req.session.user._id

  let paymentMethod = await userHelper.getOrder(orderId, id, uId);

  userHelper.updateStatus(id, orderId).then(() => {
    res.redirect("/orderlist")
  })
}

const deleteWishlistProduct = (req, res) => {
  let productId = req.params.id;
  let wishlistId = req.params.wishlistId;

  console.log(productId, wishlistId);

  userHelper.deletewishlist(productId, wishlistId).then(() => {
    res.redirect("/wishlist")
  })
}

// const orderAddresses = (req,res)=>{
//   let userId = req.session.user._id;
//   console.log(userId);
//   userHelper.userAddresses(userId)
// }

const checkCoupon = async (req, res) => {
  let coupon = req.body.couponCode;
  let user = req.session.user;
  let discount = req.session.discount;



  let totalPrice = await userHelper.getTotalAmount(user._id);


  userHelper.checkCouponCode(coupon, totalPrice, user._id).then((data) => {
    let total = data.total;

    data.total = totalPrice - total

    // data.total = discountPrice;
    console.log(data);
    if (data) {
      req.session.discount = total;
      res.json(data);
    } else {
      res.json(data)
    }
  })
}

const editAddress = async (req, res) => {
  let user = req.session.user;
  let cartCount = null;
  let wishlistCount = null;
  cartCount = await userHelper.getCartProductCount(user._id);
  wishlistCount = await userHelper.getWishlistProductCount(user._id);

  let addressId = req.params.id;
  console.log(addressId);

  const address = await Address.findById({ _id: addressId });

  console.log(address);
  res.render("edit-address", { user, cartCount, wishlistCount, address });
}

const deleteProduct = async (req, res) => {
  let addressid = req.params.id;

  const deleteUser = await Address.findByIdAndDelete({ _id: addressid });
  if (deleteUser) {
    res.json(true)
  }
  res.redirect("/profile")

}

const postEditAddress = async (req, res) => {
  let id = req.params.id;

  let { fullname, address, city, state, zip, tel, discounts } = req.body;

  const updateData = await Address.findOneAndUpdate({ _id: id }, { "$set": { "fullname": fullname, "address": address, "city": city, "state": state, "pin": zip, "tel": tel, "discounts": discounts } });
  res.redirect("/profile")
}

const deleteCartProduct = async (req, res) => {
  console.log("//////////////////////////////////////////////////////////////////////");
  let productId = req.body.proId;
  let isDeleteCartItem = userHelper.deleteCartItem(productId).then((condition) => {
    res.json(condition)
  })
}

const retrunProduct = async (req, res) => {
  let id = req.body.item;
  let orderId = req.body.prodId;

  let updateData = await userHelper.returnStatus(id, orderId);
  if (updateData.status === true) {
    res.json(updateData.status)
  }
}

const viewProduct = async (req, res) => {
  const categories = await Category.find({});
  const products = await Product.find({});
  const user = req.session.user;
  let cartCount = null;
  let wishlistCount = null;
  var wishlistData = null;

  let category = req.params.category;
  console.log(category);

  let categoryProducts = await Product.find({category:category});
  



  if (user) {
    cartCount = await userHelper.getCartProductCount(user._id);
    wishlistCount = await userHelper.getWishlistProductCount(user._id);
    wishlistData = await userHelper.getWishlistProducts(user._id);
  }



  res.render("product",{ categories, products, user, cartCount, wishlistCount,categoryProducts,category}) 
}

const searchProduct = async(req,res)=>{
  let searchValue = req.body.data;
  
  userHelper.searchProducts(searchValue).then((data)=>{
  
    if(data){
      res.json({status:true})
    }else{
      res.json({status:false})
    }

  
  })
}

const search = async (req,res) =>{
  let data = req.params.data;

  const user = req.session.user;
  let cartCount = null;
  let wishlistCount = null;
  var wishlistData = null;


  if (user) {
    cartCount = await userHelper.getCartProductCount(user._id);
    wishlistCount = await userHelper.getWishlistProductCount(user._id);
    wishlistData = await userHelper.getWishlistProducts(user._id);
  }

  let searchResult = await userHelper.searchProducts(data);
  res.render("search",{searchResult, user, cartCount, wishlistCount})
}

module.exports = {
  getHome,
  getSignUp,
  getSignIn,
  getSignOut,
  productDetails,
  getOtp,
  getVerify,
  getCart,
  cartProducts,
  getCheckout,
  orderlist,
  //orderedProducts,
  success,
  cancel,
  profile,
  postSignup,
  postSignIn,
  postOtp,
  postVerify,
  postChangeProductQuantity,
  postCheckout,
  postVerifyPayment,
  postOrder,
  postProfile,
  checkPassword,
  viewOrders,
  cancelProductOrder,
  //orderAddresses
  getWishlist,
  wishlistProducts,
  deleteWishlistProduct,
  checkCoupon,
  editAddress,
  postEditAddress,
  deleteProduct,
  deleteCartProduct,
  retrunProduct,
  viewProduct,
  searchProduct,
  search
};
