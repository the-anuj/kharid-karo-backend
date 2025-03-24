const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
    name:String,
    email:String,
    password:String
})

module.exports=mongoose.model('user',userSchema)