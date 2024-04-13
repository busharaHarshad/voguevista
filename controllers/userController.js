const User=require('../models/userModel')
const bcrypt=require('bcrypt')
const nodemailer=require('nodemailer')
const session = require('express-session');
const Products = require('../models/adminModel');
const Category = require('../models/categoryModel');
const Address=require('../models/addressModel');
const Cart=require('../models/cartModel')
const Order=require('../models/orderModel')
const Wishlist=require('../models/wishlistModel')
const Wallet=require('../models/walletModel')
const fs = require('fs');
const PDFDocument = require('pdfkit');

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
// Function to generate a random OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
//for mail sending...
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

const loadRegister=async(req,res)=>{
    try{
        
        res.render('registration')
    }catch(error){
        console.log(error.message)
    }
}


const insertUser=async(req,res)=>{
    try{
       
          const spassword=await securePassword(req.body.password)
        
          const userPassword = req.body.password.trim();
          const confirmPassword = req.body.confirmPassword.trim();
  
          // Check if password and confirm password match
          if (userPassword !== confirmPassword) {
              return res.render('registration', { message: 'Password and Confirm Password do not match.' });
          }
        
          const user=new User({
        name:req.body.name,
        email:req.body.email,
        mobileno:req.body.mobileno,
        password:spassword,
        is_admin:0,
      
        }) 
        const username=req.body.name.trim()
        if (username === '') {
          return res.render('registration',{message:'Username cannot be empty or contain only spaces.'});
        }

        const email=req.body.email
        const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.render('registration',{message:'Email already exists. Please choose a different one.'});
  }
  const usermobileno=req.body.mobileno.trim()

  const numericRegex = /^\d+$/;
  if (!numericRegex.test(usermobileno)) {
    return res.render('registration', { message: 'Mobile number must contain only numeric digits.' });
}

  if (usermobileno === '') {
    return res.render('registration',{message:'mobile number cannot be empty or contain only spaces.'});
  }
  if (usermobileno.length > 10) {
    return res.render('registration', { message: 'mobile number  must have at least 10 numbers.' });
}
  const userpassword=req.body.password.trim()

  if (userpassword === '') {
    return res.render('registration',{message:'Password cannot be empty or contain only spaces.'});
  }
  if (userpassword.length <= 8) {
    return res.render('registration', { message: 'Password must have at least 8 characters.' });
}


req.session.data=user
const otp = generateOTP();
console.log(otp)
req.session.user_id = user._id;
        req.session.otp = otp;

        
        sendVerifyMail(req.body.name, req.body.email, otp, req);
    
       
        res.redirect('/otp-pass'); 

        
    }catch(error){
        console.log("error ocuured")
    }
}
const getOTP=async(req,res)=>{
    try{
       
res.render('otp-pass')
    }catch(error){
        console.log(error.message)
    }
}
const resendOTP=async(req,res)=>{
    try {
        const userData = req.session.data;

        if (!userData) {
            return res.status(400).send('User data not found in the session');
        }
        const otp = generateOTP();
        console.log(otp);
        await sendVerifyMail(userData.name, userData.email, otp, req);
        req.session.otp = otp;
        res.status(200).send('New OTP sent successfully');
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}

const verifyOTP = async (req, res) => {
    try {
        // Retrieve user ID and OTP from the session
        const userId = req.session.user_id;
        console.log(userId)
        const storedOTP = req.session.otp; 
        console.log(storedOTP)
        // Get entered OTP from the request body
        const enteredOTP = req.body.otp.trim();
        console.log(enteredOTP)
        // Check if the entered OTP matches the stored OTP
        const userData = req.session.data;

        // Check if the user data exists in the session
        if (!userData) {
            return res.render('otp-pass', { message: 'User data not found in the session' });
        }


        if (enteredOTP == storedOTP) {
            const user = new User({
                name: userData.name,
                email: userData.email,
                mobileno: userData.mobileno,
                password: userData.password,  
                 is_admin: 0,
        
            });
            
                     await user.save();
                     const newWallet = new Wallet({ userId });
                     await newWallet.save();
         
                      delete req.session.otp;

                res.render('login');
            
        } else {
            console.log('Invalid OTP');
            return res.render('otp-pass', { message: 'Invalid OTP' });
        }
       
    } catch (error) {

        console.log(error.message);
        return res.render('otp-pass', { message: 'Error during OTP verification' });
    }
};

///login user methods

const loginLoad=async(req,res)=>{
    try{
        
        res.render('login')
    }catch(error){
        console.log(error.message)
    }
}
 const verifyLogin=async(req,res)=>{
        try{
      
            const { email, password } = req.body;
        const userData=await User.findOne({email:email})
        if(userData){
            if (userData.blocked) {
                return res.render('login', { message: 'Your account is blocked. Please contact support.' });
              }

              
           const passwordMatch =await bcrypt.compare(password,userData.password) 
            if(passwordMatch){

                    req.session.user_id=userData._id
                    res.redirect('/home')
                }else{
                res.render('login',{message:"Email and password is incorrect...."})
            }
    
        }else{
    
            res.render('login',{message:"Email and password is incorrect,,,,"})
        }
    
    
      }catch(error){
        console.log(error.message);
    }
}
const loadHome = async (req, res) => {
    try {
        const id = req.query.id;
        let productData = [];
        const categories = await Category.find({ status: 'false', isDeleted: false });
        const productDetail = await Products.findById(id);
          
        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        const limit = 3;
        var sort = '';
        if (req.query.sort) {
            sort = req.query.sort;
        }
        
        const sortOptions = {};
       
        switch (sort) {
            case 'productprice_asc':
                sortOptions.productprice = 1;
                break;
            case 'productprice_desc':
                sortOptions.productprice = -1;
                break;
            case 'createdAt_desc':
                    sortOptions.createdAt = -1;
                    break;
            default:
                // Default sorting if no valid sort parameter is provided
                sortOptions.productprice = 1;
                break;
        }
        const filterOptions = {}; // Initialize filter options

        // Filter by category
       // if (req.query.category) {
         //   filterOptions.category = { $regex: new RegExp(req.query.category, 'i') };
        //}
        // Filter by category if categories are selected
if (req.query.categories) {
    console.log(req.query.categories)
    filterOptions.category = { $in: req.query.categories };
} else if (req.query.categories && typeof req.query.categories === 'string') {
    filterOptions.category = req.query.categories;
}

         // Filter by product name
         if (req.query.products) {
            filterOptions.productName = { $in: req.query.products };
        } else if (req.query.products && typeof req.query.products === 'string') {
            filterOptions.productName = req.query.products;
        }
        
        var search = '';
        if (req.query.search) {
            search = req.query.search;
            productData = await Products.find({
                ...filterOptions,
                productName: { $regex: new RegExp(search, 'i') },
                category: { $regex: new RegExp(search, 'i') },
                stockLeft:{$gt:0},
               
            }).sort(sortOptions)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();
           
            const count = await Products.countDocuments({
                ...filterOptions,
                productName: { $regex: new RegExp(search, 'i') },
                category: { $regex: new RegExp(search, 'i') },
                stockLeft:{$gt:0},
            });

            const totalPages = Math.ceil(count / limit);
            const prevPage = page > 1 ? page - 1 : null;
            const nextPage = page < totalPages ? page + 1 : null;

            if (req.session.user_id) {
                const userData = await User.findById(req.session.user_id);
                res.render('home', {
                    user: userData,
                    products: productData,
                    category: categories,
                    product: productDetail,
                    search: search,
                    totalPages: totalPages,
                    currentPage: page,
                    prevPage: prevPage,
                    sort: sort,
                    nextPage: nextPage,
                    //selectedCategories: req.query.category || [], // Pass selected categories to frontend
                    //selectedProducts: req.query.products || [], // Pass selected products to frontend
                    filterOptions: filterOptions, // Pass filter options to frontend
              
                });
            } else {
                res.render('home', {
                    products: productData,
                    category: categories,
                    product: productDetail,
                    search: search,
                    totalPages: totalPages,
                    currentPage: page,
                    sort: sort,
                    prevPage: prevPage,
                    nextPage: nextPage,
                    //selectedCategories: req.query.category|| [], // Pass selected categories to frontend
                    //selectedProducts: req.query.products || [], // Pass selected products to frontend
                    filterOptions: filterOptions, // Pass filter options to frontend
              
                });
            }
        } else {
            productData = await Products.find(filterOptions)
                .sort(sortOptions)
                .limit(limit)
                .skip((page - 1) * limit)
                .exec();
              
            const count = await Products.countDocuments( filterOptions);

            const totalPages = Math.ceil(count / limit);
            const prevPage = page > 1 ? page - 1 : null;
            const nextPage = page < totalPages ? page + 1 : null;

            if (req.session.user_id) {
                const userData = await User.findById(req.session.user_id);
                res.render('home', {
                    user: userData,
                    products: productData,
                    category: categories,
                    product: productDetail,
                    search: search,
                    totalPages: totalPages,
                    currentPage: page,
                    sort: sort,
                    prevPage: prevPage,
                    nextPage: nextPage,
                    //selectedCategories: req.query.category || [], // Pass selected categories to frontend
                    //selectedProducts: req.query.products || [], // Pass selected products to frontend
                    filterOptions: filterOptions, // Pass filter options to frontend
              
                    
                });
            } else {
                res.render('home', {
                    products: productData,
                    category: categories,
                    product: productDetail,
                    search: search,
                    totalPages: totalPages,
                    currentPage: page,
                    sort: sort,
                    prevPage: prevPage,
                    nextPage: nextPage,
                    //selectedCategories: req.query.category || [], // Pass selected categories to frontend
                    //selectedProducts: req.query.products || [], // Pass selected products to frontend
                    filterOptions: filterOptions, // Pass filter options to frontend
              
                });
            }
        }
    } catch (error) {

        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

    const userLogout=async(req,res)=>{
        try{
            req.session.user_id = null;
            res.redirect('/')
    
        }catch(error){
            console.log(error.message)
        }
    }


    const forgetLoad=async(req,res)=>{
        try{
            res.render('forget')
        }catch(error){
            console.log(error.message)
        }
    }
    //forgot mail.................................
    const sendOTPMail=async (email,otp,req)=>{
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
            text: `Hello Your OTP for email verification is: ${otp}`
          };
          const info=await transporter.sendMail(mailOptions)
                console.log("email hasbeen send",info.response)
            
            
    }catch(error){
console.log(error.message)
    }
}
    
const forgetVerify = async (req, res) => {
    try {
        const { password, confirmpassword, email } = req.body;
        
        // Check if password and confirm password match
        if (password !== confirmpassword) {
            return res.render('forget', { message: 'Password and Confirm Password do not match.' });
        }
        
        // Check if a user exists with the provided email
        const existingUser = await User.findOne({ email });
        
        if (!existingUser) {
            return res.render('forget', { message: 'No user found with this email.' });
        }
        
        // Generate the OTP
        const otp = generateOTP();
        console.log(otp)
        
        // Store the OTP in the session
        req.session.otp = otp;
        
        // Send the OTP to the user via email
        sendOTPMail(email, otp, req);
        
        // Redirect the user to the OTP verification page
        res.redirect('otpforget');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const getOTPforget = async (req, res) => {
    try {
        res.render('otpforget');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const otpForget = async (req, res) => {
    try {
        const { email, password, otp } = req.body;

        // Retrieve the OTP from the session
        const sessionOTP = req.session.otp;

        // Compare the OTP from the session with the OTP provided by the user
        if (sessionOTP !== otp) {
            return res.render('otpforget', { message: 'Invalid OTP. Please try again.' });
        }

        // Delete the OTP from the session
        delete req.session.otp;

        // Check if a user exists with the provided email
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.render('otpforget', { message: 'No user found with this email.' });
        }

        // Update the user's password
        existingUser.password = await securePassword(password);
        await existingUser.save();

        // Redirect the user to the login page after successful password update
        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};
const resendOTPforget = async (req, res) => {
  try {
    const email = req.body.email;
    console.log(email)
 // Check if the email exists in the database
 const userData = await User.findOne({ email });
  
 if (!userData) {
   // If the email doesn't exist, send an error message
   return res.status(400).send('Email not found.');
 }

 // Generate a new OTP
 const otp = generateOTP();
 console.log(otp);

 // Send the new OTP to the user via email
 await sendOTPMail(userData.email, otp, req);

 // Update the user's OTP in the database
 req.session.otp = otp;


 // Send a success message
 return res.status(200).send('New OTP sent successfully');

   
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
}
//......................................product.......................
const productdetailLoad = async (req, res) => {
    try {
        const categories = await Category.find({status: 'false',isDeleted: false});
        const id = req.query.id;

        if (!id) {
            // Handle the case where the id is undefined or not provided
            return res.status(400).send('Product ID is missing');
        }

        const productData = await Products.findById(id);

        if (!productData) {
            // Handle the case where the product with the given ID is not found
            return res.status(404).send('Product not found');
        }

        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                // Handle the case where the user with the session ID is not found
                return res.status(404).send('User not found');
            }
           
            res.render('productdetail', { user: userData, product: productData,category: categories});
        } else{  // Handle the case where req.session.user_id is not available
         res.render('productdetail', {   product: productData ,category: categories});
        }
    } catch (error) {
        console.log(error.message);
        // Handle other errors as needed
        res.status(500).send('Internal Server Error');
    }
}




//order.......................................................................
const getOrder=async(req,res)=>{
    try{
        if (!req.session.user_id) {
            // Handle the case where the user is not logged in
            return res.status(401).send('Unauthorized');
          }
          const userData = await User.findById(req.session.user_id);
         
          if (!userData) {
            // Handle the case where the user with the session ID is not found
            return res.status(404).send('User not found');
          }
          var page=1;
        if(req.query.page){
            page=req.query.page;

        }
        const limit=2;
          const orders = await Order.find({ userId:req.session.user_id}).populate('product.productId').sort({ createdAt: -1 }).limit(limit * 1).skip((page-1) * limit).exec();
          const count = await Order.find( { userId:req.session.user_id}).populate('product.productId').populate('userId').countDocuments()
          const totalPages = Math.ceil(count / limit);
         const prevPage = page > 1 ? page - 1 : null;
         const nextPage = page < totalPages ? page + 1 : null;
     ;
          console.log(orders)
          res.render('order',{
            user:userData,
            order:orders,
            totalPages:totalPages,
            currentPage:page,
            prevPage: prevPage,
            nextPage: nextPage})
    }catch(error){
        console.log(error.message)
    }
}
/*const deleteOrder = async (req, res) => {
    try {
      const { productId, orderId } = req.body;
  console.log(productId)
  console.log(orderId)
      // Update the status of the product to 'cancelled' within the order
      const updatedOrder = await Order.findByIdAndUpdate(orderId, {
        $set: { 'product.$[element].orderStatus': 'cancelled' }
      }, {
        arrayFilters:[{ 'element.productId': productId }],
        new: true
      });
  
      if (!updatedOrder) {
        // If the order is not found, return a 404 Not Found response
        return res.status(404).send('Order not found');
      }
  
      // Redirect back to the order page
      res.redirect('/order');
    } catch (error) {
      // Handle any errors
      console.error('Error cancelling product:', error);
      res.status(500).send('Internal server error');
    }
  };*/
  const deleteOrder = async (req, res) => {
    try {
        const { productId, orderId } = req.body;
        
        // Find the order and the product in the order
        const order = await Order.findOne({ _id: orderId });
        const product = order.product.find((p) => p.productId.toString() === productId);

        if (!product) {
            // If the product is not found in the order, return a 404 Not Found response
            return res.status(404).send('Product not found in order');
        }
        const productInDB = await Products.findById(productId);
        
        if (!productInDB) {
            // If the product is not found in the database, return a 404 Not Found response
            return res.status(404).send('Product not found in database');
        }
        
        // Increase the stockLeft of the product by the quantity of the product in the order
        productInDB.stockLeft += product.quantity;
        
        // Set the orderStatus of the product to 'cancelled'
        product.orderStatus = 'cancelled';


      // Check if the payment method is 'onlinePayment' or 'wallet'
      if (order.paymentMethod === 'onlinePayment' || order.paymentMethod === 'wallet') {
        // Refund the amount to the wallet balance
        const userWallet = await Wallet.findOne({ userId: order.userId });
        if (!userWallet) {
            // Create a new wallet if the user doesn't have one
            const newWallet = new Wallet({ userId: order.userId, balance: 0 });
            await newWallet.save();
            userWallet = newWallet;
        }

        // Calculate the refunded amount based on the product price and quantity
        const refundedAmount = product.productAmount * product.quantity;

        // Update the wallet balance by adding the refunded amount
        userWallet.balance += refundedAmount;
        await userWallet.save();

        userWallet.transactionHistory.push({
            amount: refundedAmount,
            type: 'refund',
            timestamp: new Date()
        });
        await userWallet.save(); // Save the updated wallet with transaction history
    
    
    }        
    // Update wallet transaction history for the refund
   


        // Update the order with the modified product
        await order.save();
        await productInDB.save();
        // Return the updated order status as part of the response
        res.status(200).json({ orderStatus: 'cancelled' });
    } catch (error) {
        // Handle any errors
        console.error('Error cancelling order:', error);
        res.status(500).send('Internal server error');
    }
};

const getorderDetail=async(req,res)=>{
    try{
        if (!req.session.user_id) {
            // Handle the case where the user is not logged in
            return res.status(401).send('Unauthorized');
          }
          const userData = await User.findById(req.session.user_id);
         
          if (!userData) {
            // Handle the case where the user with the session ID is not found
            return res.status(404).send('User not found');
          }
          const orderId = req.query.id; // Extracting orderId from query parameter
        const productId = req.query.productId; // Extracting productId from query parameter
        const order = await Order.findById(orderId)
        .populate({
            path: 'product.productId',  // Populate the productId field of the product array
            model: 'Products',  // Make sure this matches your Products model name
        })
        

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Find the product within the order that matches the provided productId
        const product = order.product.find(product => product.productId._id.equals(productId));
        if (!product) {
            return res.status(404).send('Product not found in order');
        }


        // Now you have the specific product
        console.log(product);


        // Here, order will contain only the product matching the given productId
      

        // Fetch order and product details based on the IDs
        // Then render the order details page with the fetched data
        res.render('orderdetail', { user:userData,order:order,product:product});
   
        }catch(error){
        console.log(error.message)
    }
}

  const returnOrder=async(req,res)=>{
    try{
        const { productId, orderId ,returnReason} = req.body;
        console.log(returnReason)
        // Find the order and the product in the order
        const order = await Order.findOne({ _id: orderId });
        const product = order.product.find((p) => p.productId.toString() === productId);

        if (!product) {
            // If the product is not found in the order, return a 404 Not Found response
            return res.status(404).send('Product not found in order');
        }
        const productInDB = await Products.findById(productId);
        
        if (!productInDB) {
            // If the product is not found in the database, return a 404 Not Found response
            return res.status(404).send('Product not found in database');
        }
        
        // Increase the stockLeft of the product by the quantity of the product in the order
        productInDB.stockLeft += product.quantity;
        // Set the orderStatus of the product to 'cancelled'
        product.orderStatus = 'returned';
 // Save the return reason
 product.returnReason = returnReason;

        // Update the order with the modified product
        await order.save();
        await productInDB.save();
        console.log("productprice",order.productPrice)
        // Return the updated order status as part of the response
        const userWallet = await Wallet.findOne({ userId: req.session.user_id });
        if (!userWallet) {
            return res.status(404).send('User wallet not found');
        }

        // Add the returned amount to the wallet balance
      //  const returnedAmount = order.productPrice * product.quantity;// Implement this function based on your business logic
        // Calculate the amount to be returned based on the product price and quantity
        let returnedAmount = product.productAmount  * product.quantity;


        userWallet.balance += returnedAmount;
        await userWallet.save();
        userWallet.transactionHistory.push({
            amount: returnedAmount,
            type: 'refund',
            timestamp: new Date()
        });
        await userWallet.save();

        res.status(200).json({ orderStatus: 'returned' });
    }catch(error){
        console.log(error.message)
    }
  }
  const getWishlist=async(req,res)=>{
    try{
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                // Handle the case where the user with the session ID is not found
                return res.status(404).send('User not found');
            }
            const wishlist = await Wishlist.find({ userId: req.session.user_id }).sort({ createdAt: -1 }).populate('productId');
            console.log(wishlist)
       res.render('wishlist',{user:userData,wishlist:wishlist})
        }else{
            res.render('login')
        }
    }catch(error){
        console.log(error.message)
    }
  }
  const addWishlist=async(req,res)=>{
    try{ 
        
        const userId = req.session.user_id;
        const productId = req.body.productId;
console.log(userId)
console.log(productId)
        // Create a new wishlist item
        const wishlist = new Wishlist({
            userId: userId,
            productId: productId
        });

        // Save the new wishlist item to the database
        await wishlist.save();

        res.redirect('/wishlist')
    }catch(error){
        console.log(error.message)
    }
  }
  const deleteWishlist=async(req,res)=>{
    try{
        const itemId = req.query.itemId; // Assuming the query parameter is named 'itemId'
       
        // Use the Wishlist model to delete the wishlist item by its ID
        await Wishlist.findByIdAndDelete(itemId);

        res.redirect('/wishlist')
    }catch(error){
        console,log(error.message)
    }
  }
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const productoffer=async (req, res) => {
    try {
        const productId = req.params.productId;
        // Fetch the product details from the database based on productId
        console.log(productId)
        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const response = {
            _id: product._id,
            productName: product.productName,
            // Include offerprice, productprice, and productname in the response if available
            offerprice: product.offerprice || 0, // Default to 0 if offerprice is not available
            productprice: product.productprice,
             // Include other relevant product details as needed
        };
        console.log(response)
        res.status(200).json({ product: response });
   
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
const invoiceprint=async  (req, res) => {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId).populate('userId').populate('product.productId');

    if (!order) {
        return res.status(404).send('Order not found');
    }
    // Create a new PDF document
    const doc = new PDFDocument();

    // Set response headers for PDF download
    res.setHeader('Content-Disposition', `attachment; filename="invoice_${orderId}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');

    // Pipe the PDF document to the response stream
    doc.pipe(res);

    // Example content for the PDF
    doc.fontSize(16).text(`Order ID: ${orderId}`, { align: 'center' });

    doc.moveDown(2); 
    doc.fontSize(12).text(`Customer Name: ${order.userId.name}`);
    doc.fontSize(12).text(`Mobile: ${order.userId.mobileno}`);
    doc.fontSize(12).text(`Email: ${order.userId.email}`);
   

    doc.fontSize(12).text(`Order Date: ${order.createdAt.toDateString()}`);


    doc.moveDown(); // Move cursor down for spacing

    // Loop through each product in the order and add product details to the PDF
    order.product.forEach((item, index) => {
        doc.fontSize(12).text(`Product ${index + 1}: ${item.productId.productName}`);
        doc.fontSize(12).text(`Quantity: ${item.quantity}`);
        doc.fontSize(12).text(`Product Price: Rs${item.productId.productprice}`);
        doc.fontSize(12).text(`Product Price: Rs${item.productAmount}`);
         doc.fontSize(12).text(`Order Status: ${item.orderStatus}`);
        doc.moveDown(); // Move cursor down for spacing
    });

    // Add total amount, payment method, and address details to the PDF
    doc.fontSize(12).text(`Total Amount: Rs${order.totalAmount}`);
    doc.fontSize(12).text(`Payment Method: ${order.paymentMethod}`);
    doc.fontSize(12).text(`Discount Price: Rs${order.discount}`);
       

    
    // Address details
    doc.moveDown(); // Move cursor down for spacing
    doc.fontSize(14).text('Delivery Address:');
    doc.fontSize(12).text(`Name: ${order.address.name}`);
    doc.fontSize(12).text(`Mobile: ${order.address.mobile}`);
    doc.fontSize(12).text(`Address:  ${order.address.address.replace(/\s+/g, ',')}`);
    doc.fontSize(12).text(`District: ${order.address.district}`);
    doc.fontSize(12).text(`State: ${order.address.state}`);
    doc.fontSize(12).text(`Pincode: ${order.address.pincode}`);

    // End the PDF document

    // Thank you message and Vogue Vista contact details
    doc.moveDown(2); // Move cursor down for spacing
    doc.fontSize(10).text('Thank you for shopping with us!', { align: 'right' });
    doc.fontSize(10).text('Vogue Vista:', { align: 'right' });
    doc.fontSize(10).text('Voguevista@gmail.com', { align: 'right' });
    doc.fontSize(10).text('Phone: +1122778800', { align: 'right' });

    doc.end();
}
module.exports={
    loadRegister,
    insertUser,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    forgetLoad,
    forgetVerify, 
    verifyOTP,
    getOTP,
    productdetailLoad,
    resendOTP,
    otpForget,
    getOTPforget,
    resendOTPforget,
    getWishlist,
    addWishlist,
    deleteWishlist,
    //order............
    getOrder,
    deleteOrder,
    getorderDetail,
    returnOrder,
    productoffer,
    invoiceprint,
   
}