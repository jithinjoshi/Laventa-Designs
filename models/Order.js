const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    Date : Date,
    deliveryDetails : {
        fullname:String,
        country:String,
        address:String,
        city:String,
        state:String,
        pin:Number,
        tel:Number,
    },
    userId:mongoose.Types.ObjectId,
    paymentMethod:String,
    products:Array,
    amount:Number,
    status:String
})

module.exports = mongoose.model('Order',orderSchema);