const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    category: String,
    discount:{
        type:Number,
        default:0
    }
}, { timestamps: true });

module.exports = new mongoose.model('Category', categorySchema);