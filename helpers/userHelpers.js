const bcrypt = require("bcrypt");
const User = require("../models/User");
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Razorpay = require("razorpay");
const paypal = require("paypal-rest-sdk");


const { Convert } = require("easy-currencies");
const Address = require("../models/Address");
const Wishlist = require("../models/Wishlist");

var instance = new Razorpay({
  key_id: process.env.RAZO_KEYID,
  key_secret: process.env.RAZO_SECRET,
});

//paypal
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_SECRET,
});

let updateStock = async (id) => {
  let stockUpdate = await Product.updateOne(id, { stock: { $inc: -1 } });
  console.log(stockUpdate);
}

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};

      //hash password
      const password = await bcrypt.hash(userData.password, 10);

      //add user in to database
      const newUser = new User({
        username: userData.username,
        email: userData.email,
        mobile: userData.mobile,
        password: password,
      });
      newUser.save((err, user) => {
        if (err) {
          console.log("unable to login");
          resolve({ isUser: false });
        } else {
          response.user = user;
          response.isUser = true;
          resolve(response);
        }
      });
    });
  },

  doSignin: (userData) => {
    return new Promise(async (resolve, reject) => {
      // const user = await User.find({$or:[
      //     {
      //         email:userData.email
      //     },
      //     {
      //         phone:userData.phone
      //     }
      // ]});
      // console.log(user);
      //const data = bcrypt.compare(userData.password,)

      let response = {};

      const user = await User.find({ email: userData.email });
      console.log(user);

      if (user[0]) {
        bcrypt.compare(userData.password, user[0].password).then((result) => {
          if (result === true && user[0].status === true) {
            response.user = user[0];
            response.status = true;
            resolve(response);
          } else if (result === true && user[0].status === false) {
            resolve({ access: false });
          } else {
            resolve({ status: false });
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },

  doCart: (prodId, userId, total) => {
    let userid = userId;
    let proObj = {
      item: prodId,
      quantity: 1,
      total: total
    };

    return new Promise(async (resolve, reject) => {
      let products = await Product.findOne({ _id: prodId });

      let cartItems = await Cart.findOne({ user: userId });

      if(cartItems != null){
        var pds = cartItems.products;
      }
    
      





      const user = await Cart.findOne({ user: userId });

      if (user) {
        let proExist = user.products.findIndex(
          (product) => product.item == prodId
        );
        console.log(proExist);
        if (proExist != -1 && cartItems != null) {
          var data = pds.filter(function (i) {
            if (i.item == prodId) {
              return i;
            }
          });
          if (products.stock > data[0].quantity) {
            Cart.updateOne(
              { user: userid, "products.item": prodId },
              { $inc: { "products.$.quantity": 1 } }
            ).then(() => {
              resolve({ status: true });
            });
          } else {
            resolve({ status: false })
          }
        } else {
          Cart.updateOne(
            { user: userId },
            { $push: { products: [proObj] } }
          ).then(() => {
            resolve({ status: true });
          });
        }
      } else {
        const newCart = new Cart({
          user: userId,
          products: [proObj],
        });

        newCart.save().then((data) => {
          resolve({ status: true });
        });
      }




    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let userid = mongoose.Types.ObjectId(userId);
      let cartItems = await Cart.aggregate([
        {
          $match: { user: userid },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
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
            product: { $arrayElemAt: ["$product", 0] },
          },
        },
      ]);

      console.log(cartItems);
      resolve(cartItems);
    });
  },
  getCartProductCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      const data = await Cart.find({ user: userId });

      let count = 0;

      if (data.length > 0) {
        count = data[0].products.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity: (data) => {
    data.count = parseInt(data.count);
    data.quantity = parseInt(data.quantity);

    return new Promise(async (resolve, reject) => {
      if (data.count == -1 && data.quantity == 1) {
        Cart.updateOne(
          { _id: data.cart },
          { $pull: { products: { item: data.product } } }
        ).then((response) => {
          resolve({ removeProduct: true });
        });
      } else {
        Cart.updateOne(
          { _id: data.cart, "products.item": data.product },
          { $inc: { "products.$.quantity": data.count } }
        ).then((response) => {
          resolve({ status: true });
        });
      }
    });
  },
  getTotalAmount: (userId, discount) => {
    return new Promise(async (resolve, reject) => {
      let userid = mongoose.Types.ObjectId(userId);

      let cartItems = await Cart.aggregate([
        {
          $match: { user: userid },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
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
            product: { $arrayElemAt: ["$product", 0] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum:{$cond:{"if":{$gt:["product.discount",0]},then:{ $multiply: ["$quantity", "$product.offerPrice"] },else:{ $multiply: ["$quantity", "$product.price"] }}}},
          },
        },
      ]);

      if (cartItems[0] === undefined) {
        resolve(0);
      } else {

        if (discount) {
          cartItems[0].total = cartItems[0].total - discount;
          resolve(cartItems[0].total)
        } else {
          resolve(cartItems[0].total);
        }

      }
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await Cart.findOne({ user: userId });
      resolve(cart.products);
    });
  },
  placeOrder: (order, products, total) => {
    return new Promise(async (resolve, reject) => {

      let status = order.payment === "COD" ||  order.payment === "WALLET" ? "placed" : "pending";

      if (status != 'pending') {
        products.forEach(async product => {
          let productItem = product.item;
          let quantity = product.quantity;

          let item = await Product.find({ _id: productItem });
          let stock = item[0].stock;


          if (stock === 0 && stock < quantity) {
            console.log("product can't reduce");
            reject({ stock: null });
          } else {
            const updateStock = await Product.updateOne({ _id: productItem }, { $inc: { stock: -quantity } });
            console.log(updateStock);
          }

        });
      }

      var currentdate = new Date();
      var datetime =
        currentdate.getDate() +
        "/" +
        (currentdate.getMonth() + 1) +
        "/" +
        currentdate.getFullYear() +
        " @ " +
        currentdate.getHours() +
        ":" +
        currentdate.getMinutes() +
        ":" +
        currentdate.getSeconds();

      const existingAddress = await Address.find({ $and: [{ fullname: order.fullname }, { address: order.address }, { pin: order.zip }] });

      if (existingAddress.length === 0) {
        const myNewAddress = new Address({
          userId: order.userid,
          fullname: order.fullname,
          address: order.address,
          state: order.state,
          city: order.city,
          pin: order.zip,
          tel: order.tel,
        });

        myNewAddress.save();

      }


      const orderObj = new Order({
        Date: new Date().toISOString(),
        deliveryDetails: {
          fullname: order.fullname,
          country: order.country,
          address: order.address,
          city: order.city,
          pin: order.zip,
          tel: order.tel,
        },
        userId: order.userid,
        paymentMethod: order.payment,
        products: products,
        amount: total,
        status: status,
      });

      orderObj.save().then(async (data) => {
        if (data) {
          resolve(data._id);

          const deleteCart = await Cart.deleteOne({ user: order.userid });
        }

        let myData = await Order.updateOne(
          { _id: data._id },
          {
            $set: {
              "products.$[].status": "placed",
            },
          }
        );
      });
    });
  },
  razorpayPayment: (total, orderId) => {
    let obj = {};
    return new Promise((resolve, reject) => {
      let status = true;
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          obj.status = true;
          obj.order = order;
          resolve(obj);
        }
      });
    });
  },
  verifyPayment: (data) => {
    return new Promise((resolve, reject) => {
      let crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", process.env.RAZO_SECRET);

      hmac.update(
        data["payment[razorpay_order_id]"] +
        "|" +
        data["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");

      if (hmac === data["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changePaymentStatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let updatedData = await Order.findByIdAndUpdate(
        { _id: orderId },
        { status: "placed" }
      );

      if (updatedData) {
        resolve();
      }
    });
  },

  //paypal
  generatePaypal: async (orderId, total) => {
    const value = await Convert(total).from("INR").to("USD");
    return new Promise((resolve, reject) => {
      var create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: (process.env.RETURN_URL || "http://localhost:3000/success/") + orderId,
          cancel_url: process.env.CANCEL_URL || "http://localhost:3000/cancel",
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: "Laventa Designs",
                  sku: "001",
                  price: Math.round(value),
                  currency: "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: "USD",
              total: Math.round(value),
            },
            description: "safest method",
          },
        ],
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          resolve(payment);
        }
      });
    });
  },

  //hash new password
  hashPassword: (password) => {
    return new Promise(async (resolve, reject) => {
      let hash = await bcrypt.hash(password, 10);
      resolve(hash);
    });
  },

  comparePassword: (text, hash) => {
    return new Promise(async (resolve, reject) => {
      let result = await bcrypt.compare(text, hash);
      resolve(result);
    });
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
      resolve(cartItems);
    });
  },

  updateStatus: (productId, orderId) => {
    return new Promise(async (resolve, reject) => {
      const updatedData = await Order.findOneAndUpdate(
        { _id: orderId, "products.item": mongoose.Types.ObjectId(productId) },
        {
          $set: {
            "products.$.status": "cancelled",
          },
        }
      );

 
      var quantity = updatedData.products.filter(function (i) {
        if (i.item == productId) {
          return i.quantity;
        }
      });
      let product_quantity = quantity[0].quantity;

      let restoreStock = await Product.updateOne({ _id: productId }, { $inc: { stock: product_quantity } });



      // Order.updateOne({_id:orderId,"products.item":productId},
      //     {$set:{"products.$[element].status":"cancelled"}},
      //     {
      //         arrayFilters:[{"el.item":productId}],

      //     }

      //     )

      // products.forEach(async product => {
      //   let productItem = product.item;
      //   let quantity = product.quantity;

      //   console.log(productItem,quantity);
      //   console.log("<<<<<<<<<>>>>>>>>>>>>>>>");

      //   const updateStock = await Product.updateOne({_id:productItem},{$inc:{stock:-quantity}});
      //   console.log(updateStock);

      // });


      // let restoreStock = await Product.updateOne({_id:productId},{$inc:{stock:quantity}});
      // console.log(restoreStock);
      // console.log(">>>>>>>>>>>><<<<<<<<<<");

      let user = await Order.find({ _id: orderId, "products.item": productId });
      resolve();
    });
  },

  getDefaultAddress: (userid) => {
    return new Promise(async (resolve, reject) => {
      const myAddress = await Address.findOne({ userId: userid });
      if (myAddress === null) {
        resolve();
      } else {
        resolve(myAddress);
      }
    });
  },

  doWishlist: (prodId, userId) => {
    let userid = userId;
    let proObj = {
      item: prodId,
      quantity: 1,
    };

    return new Promise(async (resolve, reject) => {
      const user = await Wishlist.findOne({ user: userId });

      if (user) {
        let proExist = user.products.findIndex(
          (product) => product.item == prodId
        );
        console.log(proExist);
        if (proExist === -1) {
          Wishlist.updateOne(
            { user: userId },
            { $push: { products: [proObj] } }
          ).then(() => {
            resolve({status:true});
          });
        }
      } else {
        const newWishlist = new Wishlist({
          user: userId,
          products: [proObj],
        });

        newWishlist.save().then((data) => {
          resolve({status:true});
        });
      }
    });
  },

  getWishlistProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let userid = mongoose.Types.ObjectId(userId);
      let wishlistItems = await Wishlist.aggregate([
        {
          $match: { user: userid },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: "$products.item",
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
            product: { $arrayElemAt: ["$product", 0] },
          },
        },
      ]);

      resolve(wishlistItems);
    });
  },

  getWishlistProductCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      const data = await Wishlist.find({ user: userId });

      let count = 0;

      if (data.length > 0) {
        count = data[0].products.length;
      }
      resolve(count);
    });
  },

  deletewishlist: (productId, wishlistId) => {
    let Id = mongoose.Types.ObjectId(productId);
    return new Promise(async (resolve, reject) => {
      const data = await Wishlist.updateOne(
        { _id: wishlistId },
        {
          $pull: {
            products: { item: Id },
          },
        }
      );

      if (data) {
        resolve();
      }
    });
  },

  checkCouponCode: (couponData, totalPrice, userId) => {
    return new Promise(async (resolve, reject) => {
      let coupon = await Coupon.find({ couponcode: couponData });
      console.log(coupon);
      let today = new Date();

      console.log(today);

      let checkUser = await Coupon.findOne({ couponcode: couponData }, { users: { $elemMatch: { userid: userId } } });



      let obj = {}

      if (coupon.length > 0) {
        if (totalPrice > coupon[0].minimumOrderPrice) {
          if (today >= coupon[0].activationDate) {
            if (today < coupon[0].expiryDate) {
              if (checkUser.users.length === 0) {
                let total = coupon[0].discountPrice;
                obj.status = true;
                obj.total = total;
                const updateId = await Coupon.updateOne(
                  { couponcode: couponData },
                  { $addToSet: { users: { userid: userId } } }
                );
                resolve(obj);
              } else {
                obj.message = "Sorry, You alreadly redeemed this coupon";
                obj.status = false;
                resolve(obj);
              }
            } else {
              obj.message = "Sorry, The coupon is not valid anymore";
              obj.status = false;
              resolve(obj);
            }
          } else {
            obj.message = "Sorry, No coupon found with the given code";
            obj.status = false;
            resolve(obj);
          }
        } else {
          obj.message =
            "Sorry, The order total should be a minimum of" +
            coupon.minimumOrderPrice;
          obj.status = false;
          resolve(obj);
        }
      } else {
        obj.status = false;
        obj.message = "No Coupon with this couponcode";
        resolve(obj);
      }
    });
  },

  deleteCartItem: (proId) => {
    return new Promise(async (resolve, reject) => {
      // let productId = mongoose.Types.ObjectId(proId)
      console.log(proId);
      let deleteData = await Cart.updateOne({ 'products.item': proId }, { "$pull": { "products": { "item": proId } } })
      resolve({ status: true })
    })
  },

  viewStock: (productId, userId) => {
    return new Promise(async (resolve, reject) => {
      // let userid = mongoose.Types.ObjectId(userId);
      // let productid = mongoose.Types.ObjectId(productId);


      const viewQuantity = await Cart.find({ $and: [{ 'products.item': productId }, { user: userId }] });
    })
  },

  getOrder: (orderId, productId, userId) => {
    return new Promise(async (resolve, reject) => {
      const order = await Order.findOne({ _id: orderId });
      // console.log(order.products,":::::::::");
      var orderProduct = order.products.filter(function (i) {
        if (i.item == productId) {
          return i;
        }
      });

      let price = await Product.findOne({ _id: productId })

      if (order.paymentMethod != 'COD') {
        let amount = price.price * orderProduct[0].quantity;

        let wallet = await User.updateOne({ _id: userId }, { $inc: { wallet: amount } });

        console.log(wallet);
        resolve(wallet);
      } else {
        resolve(0);

      }

    })
  },
  returnStatus: (id, orderId) => {
    return new Promise(async (resolve, reject) => {
      const updatedData = await Order.findOneAndUpdate(
        { _id: orderId, "products.item": mongoose.Types.ObjectId(id) },
        {
          $set: {
            "products.$.status": "return pending",
          },
        }
      );
      if (updatedData != null) {
        resolve({ status: true })
      }

    })
  },

  getWalletAmount: (userId) =>{
    return new Promise(async(resolve,reject)=>{
      let user = await User.findOne({_id:userId});
      let myWallet = user.wallet;
      resolve(myWallet)
    })
  },

  reduceWalletAmount : (userId,totalPrice)=>{
    return new Promise(async(resolve,reject)=>{
      let wallet = await User.updateOne({_id:userId},{$inc:{'wallet':-totalPrice}});
      console.log(wallet);
      resolve(wallet);
    })
  },

  searchProducts : (search)=>{
    return new Promise(async (resolve,reject)=>{
      let data = await Product.find({});
      if(data){
        let pdt = data.filter((i)=>{
          if(i.name.includes(search)){
            return i;

          }
        })
        resolve(pdt)

      }
      
    })
  }

};


