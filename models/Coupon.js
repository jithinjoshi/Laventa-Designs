const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    couponName:String,
    discountPrice:Number,
    couponcode:String,
    activationDate:Date,
    expiryDate:Date,
    minimumOrderPrice:Number,
    users:[{userid:mongoose.Types.ObjectId}],
    status:{
        type:Boolean,
        default:true
    },

});

module.exports = mongoose.model('Coupon',couponSchema);