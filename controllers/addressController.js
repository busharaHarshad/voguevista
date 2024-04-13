const User=require('../models/userModel')
const bcrypt=require('bcrypt')
const session = require('express-session');
const Address=require('../models/addressModel');
const Cart=require('../models/cartModel')
//address management ........................................
const loadAddress = async (req, res) => {
    try {
      if (!req.session.user_id) {
        // Handle the case where the user is not logged in
        return res.status(401).send('Unauthorized');
      }
  
      const userData = await User.findById(req.session.user_id);
     
      if (!userData) {
        // Handle the case where the user with the session ID is not found
        return res.status(404).send('User not found');
      } 
  
      // Render the EJS template and pass the addresses to it
      const userAddresses = await Address.find({ userId:userData._id});

      res.render('address', { user: userData, userAddresses :userAddresses});
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  };
  
const loadnewAddress=async(req,res)=>{
    try{
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);
            const userId = req.session.user_id;
            if (!userData) {
                // Handle the case where the user with the session ID is not found
                return res.status(404).send('User not found');
            }  
            const defaultAddress = await Address.findOne({ userId, isDefault: true });

      res.render('new-address',{user:userData,defaultAddress:defaultAddress})
   } }catch(error){
        console.log(error.message)
    }
}
const AddnewAddress=async(req,res)=>{
    try{
        const { name, mobile, address, pincode, state, district, city } = req.body;
        const userId=req.session.user_id // Accessing userId from the session
        const addresses = await Address.find({ userId });

        let isDefault = false; // Default is false
        if (addresses.length === 0) {
          // If the user has no addresses, set the new address as default
          isDefault = true;
        }else {
            // Find the existing default address and update it to false
            const defaultAddress = addresses.find(addr => addr.isDefault === true);
            if (defaultAddress) {
                defaultAddress.isDefault = false;
                await defaultAddress.save();
            }
        }
    // Create a new Address instance
    const newAddress = new Address({
     userId,
      name,
      mobile,
      address,
      pincode,
      state,
      district,
      city,
      isDefault
    });

    const savedAddress = await newAddress.save();
    
  res.redirect('/address')
     }catch(error){
        console.log(error.message)
    }
}
const loadeditAddress=async(req,res)=>{
    try{
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);
            
            if (!userData) {
                // Handle the case where the user with the session ID is not found
                return res.status(404).send('User not found');
            }  
            const addressId = req.query.id;

        // You can then use the addressId to find the specific address data
        const addressData = await Address.findById(addressId);

        res.render('edit-address',{user:userData, address: addressData})
   }
 }catch(error){
        console.log(error.message)
    }
}
const  updateeditAddress=async(req,res)=>{
    try{
        const address = await Address.findByIdAndUpdate({_id:req.body.address_id},{$set:{
            name:req.body.name,
            mobile:req.body.mobile,
            address:req.body.address,
            pincode:req.body.pincode,
            state:req.body.state,
            district:req.body.district,
            city:req.body.city
    }});
        res.redirect('/address')
    
    }catch(error){
       console.log(error.message)
    }
}
const deleteAddress=async (req,res)=>{
try{
const id=req.query.id;
await Address.deleteOne({_id:id})
res.redirect('/address')
}catch(error){
    console.log(error.message)
}
}
 const defaultAddress = async (req, res) => {
    try {
        const addressId = req.query.id;
        const userId = req.session.user_id; // Assuming you have a user ID in session

        // Update the default status of the selected address
        await Address.updateMany({ userId }, { $set: { isDefault: false } }); // Set all addresses as not default
        await Address.findByIdAndUpdate(addressId, { isDefault: true }); // Set the selected address as default

        res.redirect('/address'); // Redirect back to the address management page
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
module.exports={
    loadAddress,
    loadnewAddress,
    AddnewAddress,
    loadeditAddress,
    updateeditAddress,
    deleteAddress,
    defaultAddress,
}