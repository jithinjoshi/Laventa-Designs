var adminHelper = require("../helpers/adminHelpers");

const Product = require("../models/Product");
const Category = require("../models/Category");
const User = require("../models/User");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const Banner = require("../models/Banner");

// GET METHODS

//admin -login
const loginAdmin = function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect("/admin/home");
  } else {
    res.render("admin/login", { message: req.flash("message") });
  }
};

//logout
const logoutAdmin = (req, res) => {
  req.session.loggedIn = false;
  req.session.admin = null;
  res.redirect("/admin");
};

//home
const homeAdmin = async (req, res) => {
  let dailyReport = await adminHelper.getDailySales();
  let monthlyReport = await adminHelper.getWeeklySales();
  let yearlyReport = await adminHelper.getYearlySales();

  let totalIncome = await adminHelper.getTotalPrice();
  let paypalIncome = await adminHelper.getPaypalPrice();
  let codIncome = await adminHelper.getCODPrice();
  let razorpayIncome = await adminHelper.getRazorpayPrice();
  let userCount = await adminHelper.getUsersCount();
  let sales = await adminHelper.getTotalSales();

  res.render("admin/main", {
    paypalIncome,
    codIncome,
    razorpayIncome,
    dailyReport,
    yearlyReport,
    monthlyReport,
    userCount,
    totalIncome,
    sales,
  });
};

//products
const productsAdmin = async (req, res) => {
  let Products = await Product.find({});
  res.render("admin/products", { items: Products });
};

//addProduct
const addProductsAdmin = async (req, res) => {
  const categories = await Category.find({});
  res.render("admin/add-product", {
    categories: categories,
    message: req.flash("message"),
  });
};

//editProducts
const editProducts = async (req, res) => {
  const userid = req.params.id;
  let product = await Product.findOne({ _id: userid });
  let categories = await Category.find({});
  res.render("admin/edit", { item: product, categories: categories });
};

//categories
const categoryAdmin = async (req, res) => {
  let category = await Category.find({});
  console.log(category);
  res.render("admin/category", { categories: category });
};

//addCategory
const addCategoryAdmin = (req, res) => {
  res.render("admin/add-category",{message: req.flash("message")});
};

//customers
const customersAdmin = async (req, res) => {
  const users = await User.find({});
  console.log(users);
  res.render("admin/customers", { users: users });
};

//orders
const ordersAdmin = async (req, res) => {
  const orders = await Order.find({});
  console.log(orders);
  res.render("admin/orders", { orders });
};

// POST METHODS

//login
const postLogin = (req, res) => {
  let adminData = {
    email: req.body.email,
    password: req.body.password,
  };

  adminHelper.doLogin(adminData).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.admin = response.user;
      res.redirect("/admin/home");
    } else {
      req.flash("message", "invalid username or password");
      res.redirect("/admin");
    }
  });
};

//addProducts
const postAddProducts = (req, res) => {
  const productData = {
    name: req.body.name,
    category: req.body.category,
    price: req.body.price,
    discount: req.body.discounts,
    description: req.body.description,
    stock:req.body.stock,
    image: req.files,
    proOffer:req.body.discounts
  };

  console.log(req.files);
  adminHelper.doAddProduct(productData).then(async (data) => {
    if (data.status) {

      let productData = data.data;

      //categories
      let cat = productData.category;
      const category = await Category.findOne({category:cat})


     
      //offer pricing
      adminHelper.offerPricing(productData.discount,productData.price,productData._id,category).then(()=>{
        console.log("data updated");
      })

      res.redirect("/admin/products");
    } else {
      req.flash("message", "All items are not added properly");
      res.redirect("/admin/addProduct");
    }
  });
};

//edit Products
const editProdcuts = async (req, res) => {
  const userid = req.params.id;
  const singlepdt = await Product.findOne({ _id: userid });

  let product = await Product.findByIdAndUpdate(userid, {
    name: req.body.name,
    category: req.body.category,
    price: req.body.price,
    discount:req.body.discounts,
    stock:req.body.stock,
    description: req.body.description,
    image: req.files.length != 0 ? req.files : req.files.file,
    proOffer:req.body.discounts
  });
  let cat = req.body.category.trim();
  const category = await Category.findOne({category:cat})
  adminHelper.offerPricing(req.body.discounts,req.body.price,userid,category).then(()=>{
    console.log("data updated");
  })
 
  res.redirect("/admin/products");
};

//delete Products
const deleteProducts = (req, res) => {
  Product.deleteOne({ _id: req.body.delete }, (err) => {
    if (!err) {
      res.redirect("/admin/products");
    } else {
      console.log(err);
    }
  });
};

//add category
const addCategory = (req, res) => {
  const category = req.body.category;
  const unique = category.toLowerCase();
  const offer = req.body.discount


  adminHelper.doAddCategory(unique,offer).then((status) => {
    if (status) {
      req.flash("message", "Category is already in the list");
      res.redirect("/admin/addcategory");
    } else {
      res.redirect("/admin/category");
    }
  });
};

//delete category
const categoryDelete = (req, res) => {
  const id = req.body.delete;
  console.log(id);
  Category.deleteOne({ _id: id }, (err) => {
    if (!err) {
      res.redirect("/admin/category");
    }
  });
};

//block user
const blockUser = async (req, res) => {
  id = req.params.id;
  const user = await User.findByIdAndUpdate(id, { status: false });
  req.session.userlogin = false;
  req.session.user = null;

  res.redirect("/admin/customers");
};

//unblock user
const unblockUser = async (req, res) => {
  id = req.params.id;
  const user = await User.findByIdAndUpdate(id, { status: true });

  res.redirect("/admin/customers");
};

//pack orders
const packOrders = async (req, res) => {
  let prodId = req.params.prodId;
  let orderId = req.params.orderId
 
  adminHelper.packOrder(prodId,orderId).then(()=>{
    res.redirect("/admin/orders");
  })
  
};

//ship orders
const shipOrders = async (req, res) => {
  let prodId = req.params.prodId;
  let orderId = req.params.orderId
 
  adminHelper.shipOrder(prodId,orderId).then(()=>{
    res.redirect("/admin/orders");
  })
  
}

//delivery orders
const deliveryOrders = async (req, res) => {
  let prodId = req.params.prodId;
  let orderId = req.params.orderId
 
  adminHelper.deliveryOrder(prodId,orderId).then(()=>{
    res.redirect("/admin/orders");
  })
  
}


//cancel orders
const cancelOrders = async (req, res) => {
  let prodId = req.params.prodId;
  let orderId = req.params.orderId
 
  adminHelper.cancelOrder(prodId,orderId).then(()=>{
    res.redirect("/admin/orders");
  })
  
}

const allowReturn = async(req,res) =>{
  let prodId = req.params.prodId;
  let orderId = req.params.orderId;

  adminHelper.allowReturn(prodId,orderId).then(()=>{
    res.redirect("/admin/orders")
  })

}

const denyReturn =  async(req,res) =>{
  let prodId = req.params.prodId;
  let orderId = req.params.orderId;

  adminHelper.denyReturn(prodId,orderId).then(()=>{
    res.redirect("/admin/orders")
  })

}



//coupons

const coupons = async(req,res) =>{
  let couponList = await adminHelper.getAllCoupons()
 
  console.log(couponList);
  var couponActivationDate;
  var couponExpiryDate;
  couponList.forEach(coupon => {
    couponActivationDate = coupon.activationDate.toISOString().slice(0, 10);
    couponExpiryDate = coupon.expiryDate.toISOString().slice(0, 10);
  });
  res.render("admin/coupons",{couponList,couponActivationDate,couponExpiryDate});
};

const createCoupon = async(req,res) =>{
  res.render("admin/createCoupon",);
};

const postCreateCoupon = async(req,res)=>{
  let datas = req.body;
  adminHelper.createCoupon(datas).then(()=>{
    res.redirect("/admin/coupons")
  })

}

const getViewProducts = async (req,res)=>{
  let id = req.params.id;
  let products = await adminHelper.getOrderedProducts(id);
  res.render('admin/viewOrderedProducts',{items:products})
}

const salesReport = async (req,res) =>{
  let dailyReport = await adminHelper.getDailySales();
  let monthlyReport = await adminHelper.getWeeklySales();
  let yearlyReport = await adminHelper.getYearlySales();

  let salesReport = await adminHelper.mainSales();

  let orderDates = []
  

  var data = req.session.salesValue;
  console.log(data);
  if(data === undefined){
    salesReport.forEach(sales => {
      orderDates.push(sales.Date.toISOString().slice(0,10))
    });


    res.render('admin/salesReport',{salesReport,orderDates})
  }else{
    salesReport.forEach(sales => {
      orderDates.push(sales.Date.toISOString().slice(0,10))
    });
    res.render('admin/salesReport',{salesReport:data,orderDates})
  }

 


}

const getAddPdt = async(req,res)=>{
  const categories = await Category.find({});
  res.render("admin/addProduct", {
    categories: categories,
    message: req.flash("message"),
  });
}

const getEditPdt = async (req,res) =>{
  const userid = req.params.id;
  let product = await Product.findOne({ _id: userid });
  let categories = await Category.find({});

  res.render("admin/editProduct", { item: product, categories: categories });
}

const editCategory = async (req,res) =>{
  const categoryId = req.params.id;
  let categories = await Category.find({_id:categoryId});
  res.render("admin/editCategory",{categories});
}

const postEditCategory = async(req,res) =>{
  const categoryId = req.params.id;
  let categories = req.body.category;
  let discount = req.body.discount;
  let category = categories.trim() 
  let categoryProducts = await Product.find({category:category});
  
  const editCategory = await adminHelper.editCategory(categoryId,category,discount,categoryProducts).then(()=>{
    res.redirect("/admin/category")
  })
}

const banners = async (req,res) =>{
  const banners = await Banner.find({});
  console.log(banners);
  console.log("...............................");
  res.render("admin/banners",{banners});
}

const createbanner = async (req,res) =>{
  const categories = await Category.find({})
  res.render('admin/createBanner',{categories})
}

const sortReport = async (req,res) =>{

  let toDate = req.body.toDate
  let fromDate = req.body.fromDate;
  


  let type = req.body.data;
  console.log(type);

  if(type === 'all'){
    let sortData = await adminHelper.mainSales()
    if(sortData){
      req.session.salesValue = undefined;
      res.json(true);
    }else{
      res.json(false);
    }

  }else{
    let sortData = await adminHelper.sortSalesReport(fromDate,toDate);
    if(sortData){
      req.session.salesValue = sortData;
      res.json(true)
    }
  }
}

const postBanner = async (req,res) =>{
  const bannerItems = {
    title:req.body.title,
    category:req.body.category,
    description:req.body.description,
    image:req.file
  }
 adminHelper.addBanner(bannerItems).then(()=>{
    res.redirect("/admin/banner");
 })
  
  
}

const deleteBanner = async (req,res) =>{
  let id = req.body.delete;
  let deleteBanner = adminHelper.deleteBanner(id);
  if(deleteBanner){
    res.redirect("/admin/banner")
  }


  
  
}


module.exports = {
  loginAdmin,
  logoutAdmin,
  homeAdmin,
  productsAdmin,
  addProductsAdmin,
  editProducts,
  categoryAdmin,
  addCategoryAdmin,
  customersAdmin,
  ordersAdmin,
  postLogin,
  postAddProducts,
  editProdcuts,
  deleteProducts,
  addCategory,
  categoryDelete,
  blockUser,
  unblockUser,
  cancelOrders,
  coupons,
  createCoupon,
  postCreateCoupon,
  getViewProducts,
  packOrders,
  shipOrders,
  deliveryOrders,
  allowReturn,
  denyReturn,
  salesReport,
  getAddPdt,
  getEditPdt,
  editCategory,
  postEditCategory,
  banners,
  createbanner,
  sortReport,
  postBanner,
  deleteBanner
};
