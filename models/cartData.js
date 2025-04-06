const mongoose = require('mongoose');

let cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      quantity: {
        type: Number,
        default: 1
      },
})

let userCartSchema = new mongoose.Schema({
    userId:{ type: mongoose.Schema.Types.ObjectId,required:true },
    cart:[cartItemSchema],
    totalQuantity:Number,
    totalPrice:Number
})

module.exports=mongoose.model('Cart',userCartSchema)