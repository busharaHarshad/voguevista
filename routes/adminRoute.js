const express=require('express')
const admin_route=express()
const bodyParser=require('body-parser')
admin_route.use(express.json())
admin_route.use(bodyParser.urlencoded({extended:true}))
const auth=require('../middleware/adminAuth')
admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')
const multer=require('multer')
admin_route.use(express.static('public'))
const storage=multer.diskStorage({
    destination:'./public/img',
    filename:function(req,file,cb){
        const name=Date.now()+'-'+file.originalname
        cb(null,name)
    }
})
const upload=multer({storage:storage})
const adminController=require('../controllers/adminController')
//admin loging.........................
admin_route.get('/',auth.isLogout,adminController.loadLogin)
admin_route.post('/',auth.isLogout,adminController.verifyLogin)
//admin dashboard..............................
admin_route.get('/home',auth.isLogin,adminController.loadDashboard)
admin_route.get('/logout',auth.isLogin,adminController.logout)
admin_route.get('/customer',auth.isLogin,adminController.adminDashboard)
// Route for fetching yearly chart data
admin_route.get('/getYearlyChartData', adminController.getYearlyChartData);
// Route for fetching monthly chart data
admin_route.get('/getMonthlyChartData', adminController.getMonthlyChartData);

//admin blocking....................................
admin_route.post('/block/:id',adminController.blockUSer)
//admin product.............................................
admin_route.get('/product',auth.isLogin,adminController.adminProduct)
admin_route.get('/addproduct',auth.isLogin,adminController.addProduct)
admin_route.post('/addproduct',auth.isLogin,upload.array('image',4),adminController.addnewProduct)
admin_route.get('/editproduct',auth.isLogin,adminController.editProduct)
admin_route.post('/editproduct',auth.isLogin,upload.array('image',4),adminController.updateProduct)
admin_route.get('/deleteproduct',auth.isLogin,adminController.deleteProduct)
admin_route.post('/delete-image',adminController.deleteImage) 
admin_route.post('/updateProductImage', upload.single('image'),adminController.updateProductImage)

//admin Category.........................................................
admin_route.get('/category',auth.isLogin,adminController.adminCategory)
admin_route.post('/category',auth.isLogin,adminController.addcategory)
admin_route.get('/editcategory',auth.isLogin,adminController.editcategoryLoad)
admin_route.post('/editcategory',auth.isLogin,adminController.updateCategory)
admin_route.get('/softdeletecategory',auth.isLogin,adminController.softdeletecategory)
admin_route.post('/category/:id/list',adminController.listUnlistCategory)
admin_route.post('/apply-offerCategory/:categoryId',adminController.applyOfferCategory)
admin_route.post('/remove-offerCategory/:categoryId',adminController.removeOfferCategory)
//order.....................................................................
admin_route.get('/order',auth.isLogin,adminController.getOrder)
admin_route.post('/updateOrderStatus', auth.isLogin,adminController.updateOrderStatus);
admin_route.get('/orderdetailadmin', auth.isLogin,adminController.getorderdetail)



//coupon................................................................................
admin_route.get('/coupon',adminController.getCoupon)
admin_route.get('/couponadd',auth.isLogin,adminController.addCoupon)
admin_route.post('/add',auth.isLogin,adminController.postCoupon)
admin_route.post('/coupon/:couponId/toggle',adminController.listUnlistCoupon)
admin_route.get('/editcoupon',auth.isLogin,adminController.editcouponLoad)
admin_route.post('/editcoupon',auth.isLogin,adminController.updatecoupon)
admin_route.get('/deletecoupon',auth.isLogin,adminController.deletecoupon)


//sales Report.......................................................................................
admin_route.get('/salereport',adminController.saleReport)
admin_route.get('/sales-report',adminController.filterReport)
admin_route.get('/report',adminController.orderdetailLoad)



//offer......................................................................................................
admin_route.get('/offer',adminController.getOfferLoad)
admin_route.get('/addoffer',adminController.addOffer)
admin_route.post('/offeradd',adminController.postOffer)
admin_route.get('/editoffer',adminController.editOffer)
admin_route.post('/editoffer',adminController.updateOffer)
admin_route.post('/applyOffer', adminController.applyOffer);
admin_route.post('/removeOffer', adminController.removeOffer);

//dashboard................................................................................................................


admin_route.get('*',function(req,res){
    res.redirect('/admin')
})
module.exports=admin_route;
