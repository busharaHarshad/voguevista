const mongoose=require('mongoose')
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobileno:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_admin:{
        type:Number,
        required:true
    },
    blocked: {
         type: Boolean,
          default: false 
   },
 is_varified:{
            type:Number,
            default:0
 },
        otp: {
            type: Number,
            default: 0, 
          },
})

module.exports=mongoose.model('User',userSchema)