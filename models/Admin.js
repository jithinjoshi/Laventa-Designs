const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    email:String,
    password:String
});

module.exports = new mongoose.model('Admin',adminSchema);