const mongoose = require('mongoose');


const cartSchema = new mongoose.Schema({
    user:mongoose.Types.ObjectId,
    products:[{
        item:mongoose.Types.ObjectId,
        quantity:Number
    }]
});

module.exports = mongoose.model('Cart',cartSchema);