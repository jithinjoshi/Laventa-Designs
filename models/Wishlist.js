const mongoose = require('mongoose');


const wishlistSchema = new mongoose.Schema({
    user:mongoose.Types.ObjectId,
    products:[{
        item:mongoose.Types.ObjectId,
        quantity:Number
    }]
});

module.exports = mongoose.model('Wishlist',wishlistSchema);