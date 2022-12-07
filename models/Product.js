const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name:String,
    category:Array,
    price:Number,
    discount:Number,
    stock:Number,
    description:String,
    image:Array,
    offerPrice:{
        type:Number,
        default:0
    },
    proOffer:{
        type:Number,
        default:0
    }
},
{timestamps:true}
);

module.exports = new mongoose.model('Product',productSchema)
