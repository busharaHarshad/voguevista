const User=require('../models/userModel')
const bcrypt=require('bcrypt')
const nodemailer=require('nodemailer')
const session = require('express-session');
const Products = require('../models/adminModel');
const Category = require('../models/categoryModel');
const Address=require('../models/addressModel');
const Cart=require('../models/cartModel')
const securePassword=async(password)=>{
    try{
       const passwordHash=await bcrypt.hash(password,10)
       return passwordHash
    }
    catch(error)
    {
console.log(error.message)
    }
}
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendVerifyMail=async ( name ,email,otp,req)=>{
    try{
       
         const transporter=nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth: {
              user: process.env.EMAIL_USER, // Your Gmail email address
              pass: process.env.EMAIL_PASSWORD // Your Gmail password or an app-specific password
            }
          });

          const mailOptions = {
            from: process.envEMAIL_USER, // Sender's email address
            to: email, // Recipient's email address
            subject: 'Your One-Time Password (OTP)',
            text: `Hello ${name},\nYour OTP for email verification is: ${otp}`
          };
          const info=await transporter.sendMail(mailOptions)
                console.log("email hasbeen send",info.response)
            
            
    }catch(error){
console.log(error.message)
    }
}
//.....................profile..................................
const profileLoad=async(req,res)=>{
    try{
      
       if (req.session.user_id) {
           const userData = await User.findById(req.session.user_id);
   
           if (!userData) {
               // Handle the case where the user with the session ID is not found
               return res.status(404).send('User not found');
           }
           const passwordChanged = req.query.password_changed === 'true';
   
           res.render('profile', { user: userData,passwordChanged:passwordChanged });
       }
    }catch(error){
       console.log(error.message)
    }
   }
   
   const editProfile=async(req,res)=>{
       try{
           const id=req.query.id
               const userData = await User.findById({_id:id});
       
               if (userData) {
                   res.render('profile-edit',{user:userData})
          
               }else{
                   res.redirect('/profile')
               }
   }catch(error){
   
       }
   }
   
   const updateProfile=async(req,res)=>{
       try{
          
           const user = await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name,mobileno:req.body.mobileno,email: req.body.email}});
           req.session.data=user
           const otp = generateOTP();
           console.log(otp)
           req.session.user_id = user._id;
                   req.session.otp = otp;
           
                   
                   sendVerifyMail(req.body.name, req.body.email, otp, req);
               
                  
           res.redirect('/otp-pass')
       }catch(error){
           console.log(error.message)
       }
   }
   const changePassword=async(req,res)=>{
       try{
           const id=req.query.id
           console.log
           const userData = await User.findById({_id:id});
   
           if (userData) {
               res.render('changepassword',{user:userData})
      
           }else{
               res.redirect('/profile')
           }
       }catch(error){
           console.log(error.message)
       }
   }
   const updatePassword = async (req, res) => {
       try {
           const { currentPassword, newPassword, confirmPassword } = req.body;
           const userId=req.body.user_id
           const user = await User.findById(userId);
           
           if (!user) {
               return res.status(404).send('User not found');
           }
       
           // Compare the current password with the hashed password in the database
           const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
       
           if (!isCurrentPasswordValid) {
               return res.render('changepassword',{message:"Current password is incorrect", user: user });
           }
        // Check if the new password is the same as the current password
        if (currentPassword === newPassword) {
            return res.render('changepassword', { message: "New password must be different from the current password", user: user });
        }
           // Compare the new password and confirm password
           if (newPassword !== confirmPassword) {
               return res.render('changepassword',{message:'New password and confirm password do not match',user: user });
           }
       
           // Hash the new password before updating it in the database
           const hashedPassword = await bcrypt.hash(newPassword, 10);
           
           // Update user's password
           user.password = hashedPassword;
           await user.save();
       
            res.redirect('/profile?password_changed=true')
           
       } catch (error) {
           console.error(error.message);
           return res.status(500).send('Internal Server Error');
       }
   };

   module.exports={
    profileLoad,
    changePassword,
    editProfile,
    updateProfile,
    updatePassword,
}