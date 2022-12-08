const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    couponName:{
        type:String,
        required:true
    },
    discountPrice:{
        type:Number,
        required:true
    },
    couponcode:{
        type:String,
        required:true
    },
    activationDate:{
        type:Date,
        required:true
    },
    expiryDate:{
        type:Date,
        required:true
    },
    minimumOrderPrice:{
        type:Number,
        required:true
    },
    users:[{userid:mongoose.Types.ObjectId}],
    status:{
        type:Boolean,
        default:true
    },

});

module.exports = mongoose.model('Coupon',couponSchema);