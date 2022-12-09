const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const mongoose = require('mongoose');
const Banner = require('../models/Banner');

module.exports = {
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {}
      const user = await Admin.find({ email: userData.email });

      if (user[0]) {
        bcrypt.compare(userData.password, user[0].password).then((result) => {
          if (result) {
            response.user = user;
            response.status = true;
            resolve(response)
            console.log("login success");
          } else {
            console.log("invalid credentials");
            resolve({ status: false })
          }
        })
      } else {
        console.log("no user with this email address");
        resolve({ status: false })
      }
    })
  },

  doAddProduct: (userData) => {
    return new Promise(async (resolve, reject) => {
      let obj = {};
      let status = false;
      const newProduct = new Product(
        {
          name: userData.name,
          category: userData.category,
          price: userData.price,
          description: userData.description,
          stock: userData.stock,
          discount: userData.discount,
          image: userData.image,
          proOffer: userData.proOffer
        }
      );
      newProduct.save().then((err, data) => {
        if (err) {
          obj.status = true
          resolve(obj)
        }
        obj.data = newProduct;
        resolve(obj)
      })

    })
  },

  doAddCategory: (productData, offer) => {
    let status = false;
    return new Promise(async (resolve, reject) => {
      const category = await Category.findOne({ category: productData });
      if (category) {

        resolve(status = true)
      } else {
        const newCategory = new Category(
          { category: productData, discount: offer }
        );
        newCategory.save().then(() => {
          console.log("Category added to the database");
          resolve(status)
        })
      }

    })
  },
  getTotalPrice: () => {
    return new Promise(async (resolve, reject) => {
      const totalIncome = await Order.aggregate([
        {
          $match:
          {
            $or: [
              { 'products.status': 'placed' },
              { 'products.status': 'packed' },
              { 'products.status': 'shipped' },
              { 'products.status': 'delivered' }
            ]
          }

        },
        {
          $group: {
            _id: null,
            netIncome: { $sum: '$amount' }
          },
        }
      ])

      if (totalIncome[0] === undefined) {
        resolve(0)
      } else {
        console.log(totalIncome[0].netIncome);
        resolve(totalIncome[0].netIncome)
      }

    })
  },
  getPaypalPrice: () => {
    return new Promise(async (resolve, reject) => {
      const totalPaypalIncome = await Order.aggregate([
        {
          $match: {
            "$and": [
              { paymentMethod: "PAYPAL" },
              {
                $or: [
                  { 'products.status': 'placed' },
                  { 'products.status': 'packed' },
                  { 'products.status': 'shipped' },
                  { 'products.status': 'delivered' }
                ]
              }
            ]
          }
        },
        {
          $group: {
            _id: null,
            netIncome: { $sum: '$amount' }
          },
        }

      ])

      if (totalPaypalIncome[0] === undefined) {
        resolve(0)
      } else {
        console.log(totalPaypalIncome[0].netIncome);
        resolve(totalPaypalIncome[0].netIncome)
      }

    })
  },
  getRazorpayPrice: () => {
    return new Promise(async (resolve, reject) => {
      const totalRazorPayIncome = await Order.aggregate([
        {
          $match: {
            "$and": [
              { paymentMethod: "ONLINE" },
              {
                $or: [
                  { 'products.status': 'placed' },
                  { 'products.status': 'packed' },
                  { 'products.status': 'shipped' },
                  { 'products.status': 'delivered' }
                ]
              }
            ]
          }
        },
        {
          $group: {
            _id: null,
            netIncome: { $sum: '$amount' }
          },
        }

      ])

      if (totalRazorPayIncome[0] === undefined) {
        resolve(0)
      } else {
        resolve(totalRazorPayIncome[0].netIncome)
        console.log(totalRazorPayIncome[0].netIncome);
      }

    })
  },
  getCODPrice: () => {
    return new Promise(async (resolve, reject) => {
      const totalCODIncome = await Order.aggregate([
        {
          $match: {
            "$and": [
              { paymentMethod: "COD" },
              {
                $or: [
                  { 'products.status': 'placed' },
                  { 'products.status': 'packed' },
                  { 'products.status': 'shipped' },
                  { 'products.status': 'delivered' }
                ]
              }
            ]
          }
        },
        {
          $group: {
            _id: null,
            netIncome: { $sum: '$amount' }
          },
        }

      ])

      if (totalCODIncome[0] === undefined) {
        resolve(0)
      } else {
        console.log(totalCODIncome[0].netIncome);
        resolve(totalCODIncome[0].netIncome)
      }

    })
  },
  getUsersCount: () => {
    return new Promise(async (resolve, reject) => {
      let usersCount = await User.find({}).count();
      resolve(usersCount)
    })
  },
  getDailySales: () => {
    return new Promise(async (resolve, reject) => {
      let dailySales = await Order.aggregate([
        {
          $match: {
            $or: [
              { 'products.status': 'placed' },
              { 'products.status': 'packed' },
              { 'products.status': 'shipped' },
              { 'products.status': 'delivered' }
            ]
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$Date" } },
            total: { $sum: '$amount' },
            count: { $sum: 1 }

          }
        },
        {
          $sort: { _id: 1 }
        }
      ])

      console.log("daily sales", dailySales);
      resolve(dailySales);
    })
  },
  getWeeklySales: () => {
    return new Promise(async (resolve, reject) => {
      let weeklyData = await Order.aggregate([
        {
          $match: {
            $or: [
              { 'products.status': 'placed' },
              { 'products.status': 'packed' },
              { 'products.status': 'shipped' },
              { 'products.status': 'delivered' }
            ]
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%m", date: "$Date" } },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])

      console.log("weekly sales", weeklyData);
      resolve(weeklyData);
    })
  },
  getYearlySales: () => {
    return new Promise(async (resolve, reject) => {
      let yearlySales = await Order.aggregate([
        {
          $match: {
            $or: [
              { 'products.status': 'placed' },
              { 'products.status': 'packed' },
              { 'products.status': 'shipped' },
              { 'products.status': 'delivered' }
            ]
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y", date: "$Date" } },
            total: { $sum: '$amount' },
            count: { $sum: 1 }

          }
        },
        {
          $sort: { _id: 1 }
        }
      ])

      console.log("yearly sales", yearlySales);
      resolve(yearlySales)
    })
  },
  getTotalSales: () => {
    return new Promise(async (resolve, reject) => {
      let sales = await Order.find({ status: "placed" }).count();
      resolve(sales)
    })
  },
  createCoupon: (datas) => {
    return new Promise(async (resolve, reject) => {
      let newCoupon = new Coupon({
        couponName: datas.couponname,
        discountPrice: datas.couponprice,
        couponcode: datas.couponcode,
        activationDate: datas.activation,
        expiryDate: datas.expirationdate,
        minimumOrderPrice: datas.orderprice,
      });

      newCoupon.save((err, data) => {
        if (err) {
          console.log(err)
        } else {
          resolve()
        }
      })
    })
  },

  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      let coupons = await Coupon.find({});
      resolve(coupons)
    })
  },

  getOrderedProducts: async (orderid) => {
    return new Promise(async (resolve, reject) => {
      let id = mongoose.Types.ObjectId(orderid);

      let cartItems = await Order.aggregate([
        {
          $match: { _id: id },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
            status: "$products.status",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            status: 1,
            product: { $arrayElemAt: ["$product", 0] },
          },
        },
      ]);
      console.log(cartItems);
      resolve(cartItems);
    });
  },

  packOrder: async (prodId, orderId) => {
    return new Promise(async (resolve, reject) => {
      const updateData = await Order.findOneAndUpdate({ _id: orderId, "products.item": mongoose.Types.ObjectId(prodId) },
        {
          $set: {
            "products.$.status": "packed"
          }
        })
      resolve();
    })
  },

  shipOrder: async (prodId, orderId) => {
    return new Promise(async (resolve, reject) => {
      const updateData = await Order.findOneAndUpdate({ _id: orderId, "products.item": mongoose.Types.ObjectId(prodId) },
        {
          $set: {
            "products.$.status": "shipped"
          }
        })
      resolve();
    })
  },

  deliveryOrder: async (prodId, orderId) => {
    return new Promise(async (resolve, reject) => {
      const updateData = await Order.findOneAndUpdate({ _id: orderId, "products.item": mongoose.Types.ObjectId(prodId) },
        {
          $set: {
            "products.$.status": "delivered"
          }
        })
      resolve();
    })
  },
  cancelOrder: async (prodId, orderId) => {
    return new Promise(async (resolve, reject) => {
      const updateData = await Order.findOneAndUpdate({ _id: orderId, "products.item": mongoose.Types.ObjectId(prodId) },
        {
          $set: {
            "products.$.status": "cancelled"
          }
        })
      resolve();
    })
  },

  allowReturn: async (prodId, orderId) => {
    return new Promise(async (resolve, reject) => {
      const updateData = await Order.findOneAndUpdate({ _id: orderId, "products.item": mongoose.Types.ObjectId(prodId) },
        {
          $set: {
            "products.$.status": "returned"
          }
        })

      const order = await Order.findOne({ _id: orderId });

      var data = order.products.filter(function (i) {
        if (i.item == prodId) {
          return i;
        }
      });

      const product = await Product.findOne({ _id: prodId })


      let amount = data[0].quantity * product.price;


      const updatedData = await User.updateOne({ _id: order.userId }, { $inc: { 'wallet': amount } });



      resolve();

    })
  },

  denyReturn: async (prodId, orderId) => {
    return new Promise(async (resolve, reject) => {
      const updateData = await Order.findOneAndUpdate({ _id: orderId, "products.item": mongoose.Types.ObjectId(prodId) },
        {
          $set: {
            "products.$.status": "return denied"
          }
        })
      resolve();

    })
  },

  offerPricing: (async (discount, price, id, category) => {
    return new Promise(async (resolve, reject) => {

      if (discount == 0) {
        if (category.discount != 0) {
          var doOffer = (price * category.discount) / 100;
          let discountAmount = Math.floor(price - doOffer);
          const offer = await Product.findOneAndUpdate({ _id: id }, { offerPrice: discountAmount });
        } else {
          var doOffer = (price * discount) / 100;
          let discountAmount = Math.floor(price - doOffer);
          const offer = await Product.findOneAndUpdate({ _id: id }, { offerPrice: discountAmount });
        }
      } else {
        if (category.discount != 0 && category.discount > discount) {
          var doOffer = (price * category.discount) / 100;
          let discountAmount = Math.floor(price - doOffer);
          const offer = await Product.findOneAndUpdate({ _id: id }, { offerPrice: discountAmount });
        } else {
          var doOffer = (price * discount) / 100;
          let discountAmount = Math.floor(price - doOffer);
          const offer = await Product.findOneAndUpdate({ _id: id }, { offerPrice: discountAmount });
        }
      }


      resolve();

    })
  }),

  editCategory: (async (catId, category, discount, catProducts) => {
    return new Promise(async (resolve, reject) => {
      const editCategory = await Category.findByIdAndUpdate({ _id: catId }, { category, discount });
      if (editCategory) {

        catProducts.forEach(async pds => {
          if (pds.discount < discount) {
            let id = pds._id;
            let price = pds.price
            let prod = await Product.findByIdAndUpdate({ _id: id }, { discount: discount })

            const doOffer = (price * discount) / 100;
            let discountAmount = Math.floor(price - doOffer);


            const offer = await Product.findOneAndUpdate({ _id: id }, { offerPrice: discountAmount });

          } else {
            let price = pds.price
            let id = pds._id;
            const doOffer = (price * pds.proOffer) / 100;
            let discountAmount = Math.floor(price - doOffer);
            let disc = pds.proOffer
            const offer = await Product.findOneAndUpdate({ _id: id }, { offerPrice: discountAmount, discount: disc });

          }

        });


        resolve()
      }
    })
  }),

  sortSalesReport: (async (fromDate, toDate) => {
    return new Promise(async (resolve, reject) => {
      let newFromDate = new Date(fromDate);
      let newToDate = new Date(toDate)

      if(toDate === fromDate){
        var day = 60 * 60 * 24 * 1000;
        newToDate = new Date(newFromDate.getTime() + day);
      }
      // let myOrders = await Order.find(
      //   { $and: [{ Date: { $gte: newFromDate } }, { Date: { $lt: newToDate } }] }
      // );

      let salesData = await Order.aggregate([
        {
          $match: { $and: [{ Date: { $gte: newFromDate } }, { Date: { $lt: newToDate } }] }
        },
        {
          $unwind: "$products"
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
            Date: 1,
            paymentMethod: 1,
            status: 1,
            amount: 1,
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "product"
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            Date: 1,
            paymentMethod: 1,
            status: 1,
            amount: 1,
            product: { $arrayElemAt: ["$product", 0] }
          }
        }


      ])

      console.log(salesData);
      resolve(salesData)

    })
  }),

  mainSales : async()=>{
    return new Promise(async (resolve,reject)=>{
      let myData = await Order.aggregate([
        {
          $unwind: "$products"
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
            Date: 1,
            paymentMethod: 1,
            status: 1,
            amount: 1,
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "product"
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            Date: 1,
            paymentMethod: 1,
            status: 1,
            amount: 1,
            product: { $arrayElemAt: ["$product", 0] }
          }
        }
    
      ])

      console.log(myData);
      resolve(myData)
    })
  },

  addBanner : async(bannerItems) =>{
    return new Promise((resolve,reject) =>{
      const newBanner = new Banner({
        title:bannerItems.title,
        category:bannerItems.category,
        description:bannerItems.description,
        image:bannerItems.image
      })

      newBanner.save().then(()=>{
        console.log('data is adde to the db');
        resolve();
      })

    })
  },

  deleteBanner : async(bannerId) =>{
    return new Promise(async (resolve,reject)=>{
      const data = await Banner.findByIdAndRemove({_id:bannerId});
      if(data){
        resolve(true)
      }
    })
  }






}