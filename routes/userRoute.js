const express=require('express')
const user_route=express()
const session=require('express-session')
const nocache=require('nocache')
const config=require('../config/dbConnect')
user_route.use(nocache())

user_route.use(session({secret:config.sessionSecret}));
const auth=require('../middleware/auth')

user_route.set('view engine','ejs')
user_route.set('views','./views/users')
user_route.use(express.json())
user_route.use(express.urlencoded({extended:true}))
user_route.use(express.static('public'))
const userController=require("../controllers/userController")
const addressController=require("../controllers/addressController")
const profileController=require("../controllers/profileController")
const cartController=require("../controllers/cartController")
const walletController=require("../controllers/walletController")
user_route.get('/otp',(req,res)=>{
    res.render('otp-pass')
})


user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);
user_route.get('/',userController.loadHome);
user_route.get('/otp-pass',userController.getOTP)
user_route.post('/otp-pass',userController.verifyOTP)
user_route.get('/login',auth.isLogout,userController.loginLoad);
user_route.post('/login',userController.verifyLogin);
user_route.post('/resend-otp',userController.resendOTP)
user_route.get('/home',auth.isLogin,userController.loadHome);
user_route.get('/logout',auth.isLogin,userController.userLogout)
user_route.get('/forget',auth.isLogout,userController.forgetLoad)
user_route.post('/forget',userController.forgetVerify)
user_route.get('/otpforget',userController.getOTPforget)
user_route.post('/otpforget',userController.otpForget)
user_route.post('/resendotp',userController.resendOTPforget)
//product......................
user_route.get('/productdetail',userController.productdetailLoad)

//profile info------------------------------------------------------------------

user_route.get('/profile',auth.isLogin,profileController.profileLoad)
user_route.get('/profile-edit',profileController.editProfile)
user_route.post('/profile-edit',profileController.updateProfile)
user_route.get('/changepassword',profileController.changePassword)
user_route.post('/changepassword',profileController.updatePassword)
user_route.get('/wishlist',userController.getWishlist)
user_route.post('/wishlist',userController.addWishlist)
user_route.get('/wishlist-delete',userController.deleteWishlist)
//address management .................................................................
user_route.get('/address',addressController.loadAddress)
user_route.get('/new-address',addressController.loadnewAddress)
user_route.post('/new-address',addressController.AddnewAddress)
user_route.get('/edit-address',addressController.loadeditAddress)
user_route.post('/edit-address',addressController.updateeditAddress)
user_route.get('/delete-address',addressController.deleteAddress)

//order**************************************************************************************
user_route.get('/order',userController.getOrder)
user_route.get('/orderdetail',userController.getorderDetail)
//cart++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
user_route.get('/cart',cartController.getCart)
user_route.get('/add-cart',cartController.addTocart)
user_route.post('/add-cart',auth.isLogin,cartController.Listcart)
user_route.post('/increment-quantity/:productId',cartController.updateincrementquantity)
user_route.post('/decrement-quantity/:productId',cartController.updatedecrementquantity)
user_route.get('/delete-cart',cartController.deleteCart)
user_route.get('/checkout',auth.isLogin,cartController.getCheckout)
user_route.post('/checkout',auth.isLogin,cartController.postOrder)
user_route.get('/complete',auth.isLogin,cartController.getComplete)
user_route.post('/cancel-order', userController.deleteOrder) 
user_route.post('/return-order',userController.returnOrder)
user_route.post('/save-order',cartController.saveonlineorder)
user_route.post('/save-pending-order',cartController.savependingOrder)
user_route.get('/get-product-details/:productId', userController.productoffer);
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
user_route.get('/wallet',walletController.getWallet)
user_route.post('/create-wallet',walletController.addwalletAmount)
user_route.post('/failed-payments',cartController.orderpayment)
// Route to fetch available coupons based on the price range
user_route.get('/coupons',cartController.couponManagement)
// Define route for applying coupons
user_route.post('/apply-coupon',cartController.discount)
user_route.post('/remove-coupon',cartController.removediscount)
user_route.post('/save-wallet-transaction',walletController.getWalletPay)
// Assume you have a route like this in your server code
user_route.get('/change-default-address',addressController.defaultAddress)
//1111111111111111111111111111111111111111111111111111111111111111111111
// Define a route to handle PDF generation and download
user_route.get('/download-invoice/:orderId', userController.invoiceprint)

module.exports=user_route

