const mongoose = require('mongoose');

let cartDataSchema = new mongoose.Schema({
    id:{ type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    cart:[
        {
            productId:String,
            quantity:Number
        },
    ]
})

module.exports=mongoose.model('Cart',cartDataSchema)