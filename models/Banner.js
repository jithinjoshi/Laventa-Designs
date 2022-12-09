const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    category:{
        type:Array,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:Array,
        required:true
    }
})

module.exports = new mongoose.model('Banner',bannerSchema)