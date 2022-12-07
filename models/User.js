const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        requied:true,
        maxLength:16,
        trim:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    mobile:{
        type:Number,
        required:true,
        unique:true,
        min:10
    },
    password:{
        type:String,
        min:6
    },
    status:{
        type:Boolean,
        default:true
    },
    wallet:{
        type:Number,
        default:0
    } 
},{timestamps:true})

module.exports = new mongoose.model('User',userSchema);