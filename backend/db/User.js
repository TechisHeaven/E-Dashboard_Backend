const mongoose = require("mongoose")
const { roles } = require("../utils/constants")

const userSchema = new mongoose.Schema({
    name: String, 
    email: {
        type: String ,
        unique: true,
    }, 
    password: String, 
    role:{
        type:String,
        enum: [roles.admin, roles.client], 
        default: roles.client
    },
    myFile : String
    
})

module.exports = mongoose.model("users",userSchema)


