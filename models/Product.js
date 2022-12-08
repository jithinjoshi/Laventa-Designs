const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    category:{
        type:Array,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:Array,
        required:true
    },
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
