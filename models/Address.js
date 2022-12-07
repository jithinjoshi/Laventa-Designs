const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: mongoose.Types.ObjectId,
  fullname: String,
  address: String,
  city: String,
  state:String,
  pin: Number,
  tel:Number,
});

module.exports = new mongoose.model("Address", addressSchema);
