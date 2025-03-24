const mongoose = require('mongoose')

let productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category:String,
    quantity:Number,
    description: String,
    image: String,
  });

module.exports = mongoose.model('Product', productSchema)