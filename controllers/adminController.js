const User=require('../models/userModel')
const bcrypt=require('bcrypt')
const Products = require('../models/adminModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');
const Coupon=require('../models/couponModel')
const Offer=require('../models/offerModel')
const loadLogin=async(req,res)=>{
    try{
        res.render('login')
    }catch(error){
        console.log(error.message)
    }
}

const verifyLogin=async(req,res)=>{
    try{
      
        const email=req.body.email;
    const password=req.body.password;

    const userData=await User.findOne({email:email})
    
    if(userData){

       const passwordMatch =await bcrypt.compare(password,userData.password) 
       console.log(passwordMatch)
        if(passwordMatch){
            if(userData.is_admin==1){
                req.session.adminId =userData._id
                res.redirect('/admin/home')
               
                
            }else{
                res.render('login',{message:"you are not admin"})
            }

        }else{
            res.render('login',{message:"Email and password is incorrect"})
        }

    }else{

        res.render('login',{message:"Email and password is incorrect"})
    }


    } catch(error){
      console.log(error.message)
    } 
  }

  /*const loadDashboard=async(req,res)=>{
    try{     
         // Find all orders (or apply filters as needed)
            const userData = await User.findById({ _id: req.session.adminId });
             
       // res.render('home', { user: userData});
         
         // Aggregate pipeline to count product sales and get top-selling products
         const topSellingProducts = await Order.aggregate([
            { $unwind: '$product' }, // Unwind the product array
            { $group: { _id: '$product.productId', totalSales: { $sum: '$product.quantity' } } }, // Group by productId and sum quantities
            { $sort: { totalSales: -1 } }, // Sort by totalSales descending order
            { $limit: 5 } // Limit the result to 5 documents (top 5 selling products)
        ]);
        console.log(topSellingProducts)
        // Populate product details using productId
        const populatedProducts = await Promise.all(topSellingProducts.map(async (product) => {
            const { _id, totalSales ,productName} = product;
            const productDetails = await Products.findById(_id); // Assuming Products is your product model
            console.log(productDetails)
            return {
                productId: _id,
               // productname: productDetails.productname,
               //productName: productDetails.productName,
                totalSales: totalSales
            };
        }));
console.log(populatedProducts)
        // Render the home view with user data and top-selling products
        res.render('home', { user: userData, topSellingProducts: populatedProducts });
 
    }catch(error){
        console.log(error.message)
    }
  }*/
  const loadDashboard = async (req, res) => {
    try {
        // Find the logged-in user data
        const userData = await User.findById(req.session.adminId);

        // Aggregate pipeline to count product sales and get top-selling products
        const topSellingProducts = await Order.aggregate([
            { $unwind: '$product' }, // Unwind the product array
            //{ $match: { orderStatus: 'Delivered' } }, // Match only orders with status "delivered"
            { $match: { 'product.orderStatus': 'Delivered' } }, // Match only orders with status "Delivered"
            { $group: { _id: '$product.productId', totalSales: { $sum: '$product.quantity' } } }, // Group by productId and sum quantities
            { $sort: { totalSales: -1 } }, // Sort by totalSales descending order
            { $limit: 5 }, // Limit the result to 5 documents (top 5 selling products)
            {
                $lookup: { // Lookup to get product details
                    from: 'products', // Assuming the name of the products collection is 'products'
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' }, // Unwind the productDetails array
            {
                $project: {
                    _id: 1,
                    totalSales: 1,
                    productName: '$productDetails.productName',
                    productDescription: '$productDetails.description'
                }
            }
        ]);
        console.log(topSellingProducts)
//brand area....................................

// Aggregate pipeline to count product sales and get top-selling brands
const topSellingBrands =await Order.aggregate([
    { $unwind: '$product' }, // Unwind the product array
    { $match: { 'product.orderStatus': 'Delivered' } }, // Match only orders with status "Delivered"
     {
        $lookup: { // Lookup to get product details
            from: 'products', // Assuming the name of the products collection is 'products'
            localField: 'product.productId',
            foreignField: '_id',
            as: 'productDetails'
        }
    },
    { $unwind: '$productDetails' }, // Unwind the productDetails array
    { 
        $group: { 
            _id: '$productDetails.productName', // Group by productName from productDetails
            totalSales: { $sum: '$product.quantity' } // Sum up the quantities
        }
    } ,
    { $sort: { totalSales: -1 } }, // Sort by totalSales descending order
    { $limit: 5 }, // Limit the result to 5 documents (top 5 selling products)
   // Group by productName and sum quantities
]);


console.log(topSellingBrands);
// Aggregate pipeline to count product sales and get top-selling categories
const topSellingCategories = await Order.aggregate([
    { $unwind: '$product' }, // Unwind the product array
    { $match: { 'product.orderStatus': 'Delivered' } }, // Match only orders with status "Delivered"
    {
        $lookup: { // Lookup to get product details
            from: 'products', // Assuming the name of the products collection is 'products'
            localField: 'product.productId',
            foreignField: '_id',
            as: 'productDetails'
        }
    },
    { $unwind: '$productDetails' }, // Unwind the productDetails array
    {
        $group: { // Group by category and sum quantities
            _id: '$productDetails.category',
            totalSales: { $sum: '$product.quantity' }
        }
    },
    { $sort: { totalSales: -1 } }, // Sort by totalSales descending order
    { $limit: 5 } // Limit the result to 5 documents (top 5 selling categories)
]);

const totalDeliveredOrders = await Order.aggregate([
    { $match: { 'product.orderStatus': 'Delivered' } }, // Match only orders with status "Delivered"
    { $count: 'totalDeliveredOrders' } // Count the number of documents
]);

// Extract the total number of delivered orders (if any)
const deliveredOrdersCount = totalDeliveredOrders.length > 0 ? totalDeliveredOrders[0].totalDeliveredOrders : 0;
const totalProducts = await Products.countDocuments();



        // Render the home view with user data and top-selling products
        res.render('home', { 
            user: userData,
             topSellingProducts: topSellingProducts,
            topSellingBrands:topSellingBrands,
            topSellingCategories:topSellingCategories,
            deliveredOrdersCount:deliveredOrdersCount, 
            totalProducts :totalProducts 
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

const getYearlyChartData = async (req, res) => {
    try {
        const startYear = 2020;
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: currentYear - startYear + 1 }, (_, index) => startYear + index);

        const yearlyData = await Order.aggregate([
            { $match: { 'product.orderStatus': 'Delivered' } },
            {
                $group: {
                    _id: { $year: '$createdAt' },
                    ordersCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const result = years.map(year => {
            const data = yearlyData.find(item => item._id === year);
            return {
                _id: year,
                ordersCount: data ? data.ordersCount : 0
            };
        });

        console.log(result);
        res.json(result);
    } catch (error) {
        console.log(error.message);
    }
};

const getMonthlyChartData = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        const monthlyData = await Order.aggregate([
            {
                $match: {
                    'product.orderStatus': 'Delivered',
                    createdAt: {
                        $gte: new Date(currentYear, 0, 1), // January 1st of the current year
                        $lt: new Date(currentYear + 1, 0, 1) // January 1st of the next year
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    ordersCount: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Generate labels for each month
        // Generate labels for each month
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Fill in order counts for each month
        const result = monthNames.map((month, index) => {
            const monthData = monthlyData.find(data => data._id === index + 1);
            return {
                _id: `${month}`,
                ordersCount: monthData ? monthData.ordersCount : 0
            };
        });
        console.log(result);
        res.json(result);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};


const logout=async(req,res)=>{
    try{
        
        req.session.adminId = null;
        res.redirect('/admin')
    }catch(error){
        console.log(error.message)
    }
}
const adminDashboard=async(req,res)=>{
    
    try{
        var search='';
        if(req.query.search){
            search=req.query.search;

        }
        
        var page=1;
        if(req.query.page){
            page=req.query.page;

        }
        const limit=2;
        const usersData=await User.find({
            is_admin:0,
           
                name:{$regex: new RegExp(search, 'i') }
        })
        .limit(limit*1)
        .skip((page-1)*limit)
        .exec()


        const count=await User.find({
            is_admin:0,
           
                name:{$regex: new RegExp(search, 'i') }
        }).countDocuments();
        const totalPages = Math.ceil(count / limit);
        const prevPage = page > 1 ? page - 1 : null;
        const nextPage = page < totalPages ? page + 1 : null;
    
        res.render('customer',{
            user:usersData,
            totalPages:totalPages,
            currentPage:page,
            prevPage: prevPage,
            nextPage: nextPage,
            search: search
        })

    }catch(error){
        console.log(error.message)
    }
}

const  blockUSer=async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }
      user.blocked = !user.blocked;
      await user.save();
      if (req.session.user_id=== userId) {
        req.session.user_id=null
    }
      res.redirect('/admin/customer');
    } catch (error) {

        
      console.error(error.message);
      res.status(500).send('Server Error');
    }
}
//product side.............................................................   
const adminProduct = async (req, res) => {
    try {
        var search = '';
        if (req.query.search) {
            search = req.query.search;
        }
        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        const limit = 2;
        var sort = '';
        if (req.query.sort) {
            sort = req.query.sort;
        }
        const sortOptions = {};
        const filterOptions = {};
        if (req.query.category) {
            filterOptions.category = { $regex: new RegExp(req.query.category, 'i') };
        }

        // Check the sort parameter and set the sorting options accordingly
        switch (sort) {
            case 'productprice_asc':
                sortOptions.productprice = 1;
                break;
            case 'productprice_desc':
                sortOptions.productprice = -1;
                break;
            case 'saleprice_asc':
                sortOptions.saleprice = 1;
                break;
            case 'saleprice_desc':
                sortOptions.saleprice = -1;
                break;
            case 'quantity_asc':
                sortOptions.stockLeft = 1;
                break;
            case 'quantity_desc':
                sortOptions.stockLeft = -1;
                break;
            // Add more cases for other fields as needed
            default:
                // Default sorting if no valid sort parameter is provided
                sortOptions.productprice = 1;
                break;
        }

        // Fetch categories that are not deleted and are listed
        const categories = await Category.find({ isDeleted: false, status: false });

        // Extract category names from the fetched categories
        const categoryNames = categories.map(category => category.categoryname);

        // Fetch products associated with categories that are not deleted and are listed
        const products = await Products.find({
            productName: { $regex: new RegExp(search, 'i') },
            category: { $in: categoryNames }, // Filter products by category names
            ...filterOptions,
        })
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
           
        const count = await Products.find({
            productName: { $regex: new RegExp(search, 'i') },
            category: { $in: categoryNames }, // Filter products by category names
            ...filterOptions,
        }).countDocuments();
        const totalPages = Math.ceil(count / limit);
        const prevPage = page > 1 ? page - 1 : null;
        const nextPage = page < totalPages ? page + 1 : null;
        const activeOffers = await Offer.find({ status: 'Active' });
        console.log(activeOffers)
        res.render('product', {
            products: products,
            totalPages: totalPages,
            currentPage: page,
            prevPage: prevPage,
            nextPage: nextPage,
            search: search,
            sort: sort,
            category: req.query.category,
            categories: categories,
            activeOffers: activeOffers,
            req: req,

        });
    } catch (error) {
        console.log(error.message);
    }
};

        
const addProduct=async(req,res)=>{
    try{ 
        const categories = await Category.find({status: 'false',isDeleted:'false'});
res.render('addproduct',{category: categories})
    }catch(error){
        console.log(error.message)
    }
}


const addnewProduct=async(req,res)=>{
    try{
        const productPrice = req.body.productprice; // Convert to float
        const salePrice = req.body.saleprice; // Convert to float
        const categories = await Category.find({status: 'false',isDeleted:'false'});
       
        if (productPrice <= 0 && salePrice <= 0) {
         return res.render('addproduct',{message:"productprice and sale price couldnot have  value  or 0",category:categories})
        }
       
       
        const product=new Products({
            productName:req.body.productName,
            category:req.body.category,
            description : req.body.description,
            productprice:req.body.productprice,
            saleprice:req.body.saleprice,
            stockLeft:req.body.stockLeft,
            image:req.files 

  
        })

          const products=await product.save();
 if(products){    
    res.redirect('/admin/product');
    }else{
        res.render('addproduct')
    }
  
        } catch (error) {
          console.error(error);
          res.status(500).send('Internal Server Error');
        }
    }

  const editProduct=async(req,res)=>{
    try{
        const id=req.query.id
        const categories = await Category.find({status: 'false',isDeleted:'false'});
        const product=await Products.findById({_id:id})
        
        if(product){
            res.render('editproduct',{products:product,category: categories ,image: product.image})
        }else{
            res.redirect('/admin/product')
        }
       
    }catch(error){
        console.log(error.message)
    }
  } 

  const updateProduct = async (req, res) => {
    try {
        const productId = req.body.id;
        const updatedFields = {
            productName: req.body.productName,
            category: req.body.category,
            description: req.body.description,
            productprice: req.body.productprice,
            saleprice: req.body.saleprice,
            stockLeft:req.body.stockLeft
        };

        // Check if new images are provided in the request
        if (req.files && req.files.length > 0) {
            updatedFields.image = req.files; // If yes, update the images
        }

        // Find the product by ID and update it with the new fields
        const updatedProduct = await Products.findByIdAndUpdate(productId, { $set: updatedFields });
 // Check if the updated product has an offer applied
 if (updatedProduct.offer && updatedProduct.offerprice) {
   console.log("offer present")
   const offer = await Offer.findById(updatedProduct.offer);
           
   if (offer) {
    // Calculate the new offer price based on the updated product price and offer percentage
    const newOfferPrice = updatedFields.productprice - (updatedFields.productprice * (offer.percentage / 100));
    console.log('New offer price:', newOfferPrice);

    // Update the product's offer price with the new calculated offer price
    updatedProduct.offerprice = newOfferPrice;
    await updatedProduct.save(); // Save the product with updated offer price
}
}
        res.redirect('/admin/product');
    } catch (error) {
        console.log(error.message);
    }

}
const updateProductImage = async (req, res) => {
    try {
        const productId = req.body.productId;
        const index = req.body.index;
        const file = req.file; // Assuming you're using multer middleware to handle file upload

        if (!productId || !index || !file) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Find the product by its ID
        const product = await Products.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update the image at the specified index
        product.image[index] = {
            filename: file.filename,
            // You may want to store additional information such as file path, mimetype, etc.
        };

        // Save the updated product to the database
        await product.save();

        res.status(200).json({ message: 'Image updated successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

 
  const deleteProduct=async(req,res)=>{
    try{
        const id=req.query.id;
        await Products.deleteOne({_id:id})
        res.redirect('/admin/product')
    }catch(error){
        console.log(error.message)
    }
  }
  const deleteImage = async (req, res) => {
    try {
        const { productId, imageIndex } = req.body;
        console.log(productId)
        const product = await Products.findById({_id:productId});
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // Remove the image at the specified index
        product.image.splice(imageIndex, 1);
        
        await product.save();
        res.status(200).json({success:true})
    } catch (error) {
        console.error('Error deleting image:', error);

        res.status(500).json({ error: 'Internal Server Error' });
    }
}

  //category ...........................................
  const adminCategory=async(req,res)=>{
    try{
        const category = await Category.find({ isDeleted: false });
        const activeOffers = await Offer.find({ status: 'Active' });
       
    res.render('category',{ category: category ,activeOffers:activeOffers})
    }catch(error){
        console.log(error.message)
    }
  }

   const addcategory=async(req,res)=>{
    try{
       
        const category=new Category({
            categoryname:req.body.categoryname,
  
        })

        const catename=req.body.categoryname.trim()
        if (catename === '') {
            const allCategories = await Category.find();
          return res.render('category',{message:'Categoryname cannot be empty or contain only spaces.',category: allCategories});
        }


        const categoryname=req.body.categoryname
        const existingCategory = await Category.findOne({categoryname});

        if (existingCategory) { 
            const allCategories = await Category.find();

          return res.render('category',{message:'Already existing category',category:allCategories});
        }
        if (categoryname.length < 3 || categoryname.length > 50) {
            const allCategories = await Category.find();
            return res.render('category', { message: 'Category name length should be between 3 to 50 characters', category: allCategories });
        }

        const onlyAlphabetsRegex = /^[a-zA-Z]+$/;
        const containsOnlyAlphabets = onlyAlphabetsRegex.test(category.name);
    
        if (!containsOnlyAlphabets) {
            const allCategories = await Category.find();
          res.render('category', { message: 'Category name must contain only alphabetical characters.',category: allCategories });
          return;
        }


        const savedCategory = await category.save();
        console.log(savedCategory)

        if(savedCategory){    
            res.redirect('/admin/category');
            }else{
                const allCategories = await Category.find();
                res.render('category',{message:"error in category adding",category: allCategories})
            }
    
        
    }catch(error){
        console.log(error.message)
    }
  }



  const editcategoryLoad=async(req,res)=>{
    try{
      const id=req.query.id;
      const categoryData=await Category.findById({_id:id}) 
      if(categoryData){ 
    res.render('editcategory',{category:categoryData})
      }else{
        res.redirect('/admin/category')
      }
    }catch(error){
        console.log(error.message)
    }
  }

  const updateCategory=async(req,res)=>{
    try{
       const catdata=await Category.findByIdAndUpdate({_id:req.body.id},{$set:{categoryname:req.body.categoryname}})
    res.redirect('/admin/category')
    }catch(error){
        console.log(error.message)
    }
}


const softdeletecategory=async(req,res)=>{
    try{
      const id=req.query.id
      await  Category.findByIdAndUpdate(id, { isDeleted: true })
        res.redirect('/admin/category')
    }catch(error){
        console.log(error.message)
    }
}

const  listUnlistCategory=async (req, res) => {
    try {
      const categoryId = req.params.id;
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).send('category not found');
      }
      category.status = !category.status;
      await category.save();
      res.redirect('/admin/category');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
}
//order.......................................................
const getOrder=async(req,res)=>{
    try{
         var page=1;
        if(req.query.page){
            page=req.query.page;

        }
        const limit=3;
        const orders = await Order.find( ).populate('product.productId').populate('userId') .sort({ createdAt: -1 }).limit(limit * 1).skip((page-1) * limit).exec();
       console.log(orders)
       const count = await Order.find( ).populate('product.productId').populate('userId').countDocuments()
        const totalPages = Math.ceil(count / limit);
       const prevPage = page > 1 ? page - 1 : null;
       const nextPage = page < totalPages ? page + 1 : null;
   ;
      
          res.render('order' ,{
            order:orders,
            totalPages:totalPages,
            currentPage:page,
            prevPage: prevPage,
            nextPage: nextPage
        })
    }catch(error){
        console.log(error.message)
    }
  }

  const updateOrderStatus = async (req, res) => {
    try {
      const { orderId, productId, newStatus } = req.body;
  console.log(orderId)
  console.log(productId)
  console.log(newStatus)
      // Fetch the order by orderId
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
      }
  
      // Find the product with the matching productId
      const product = order.product.find(p => String(p.productId) === productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found in order.' });
      }
      // If the new status is 'cancelled' and the current status is not 'cancelled'
    if (newStatus === 'cancelled' && product.orderStatus !== 'cancelled') {
        // Increase the stockLeft by the quantity of the product
        const updatedProduct = await Products.findByIdAndUpdate(productId, {
          $inc: { stockLeft: product.quantity }
        }, { new: true });
  
        if (!updatedProduct) {
          return res.status(500).json({ message: 'Failed to update product stock.' });
        }
      }
      // Update the orderStatus of the product
      product.orderStatus = newStatus;
  
      // Save the updated order
      await order.save();
      res.status(200).json({ orderStatus: newStatus });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };
  
  const getorderdetail = async (req, res) => {
    try {
        const orderId = req.query.id; // Extracting orderId from query parameter
        const productId = req.query.productId; // Extracting productId from query parameter
        console.log(productId)
        console.log(orderId)
        const order = await Order.findById(orderId)
        .populate({
            path: 'product.productId',  // Populate the productId field of the product array
            model: 'Products',  // Make sure this matches your Products model name
        })
        
        console.log(order)
        if (!order) {
            return res.status(404).send('Order not found');
        }
        const product = order.product.find(product => product.productId._id.equals(productId));
        if (!product) {
            return res.status(404).send('Product not found in order');
        }


        // Now you have the specific product
        console.log(product);
        const productPrice=order.productPrice
        res.render('orderdetailadmin', {order:order,product:product});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const getCoupon=async(req,res)=>{
    try{
        
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.render('coupon',{coupons:coupons})
    }catch(error){
        console.log(error.message)
    }
}
const addCoupon=async(req,res)=>{
    try{
       
      res.render('couponadd')
    }catch(error){
        console.log(error.message)
    }
}


////////////////////////////////////////////////
const generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};
const postCoupon=async(req,res)=>{
    try{
        const couponCode = generateRandomString(8);
console.log(couponCode)
  // Validate coupon name length (8 characters)
        if (req.body.couponName.length !== 8) {
           
            return res.render('couponadd',{message:'Coupon name must be 8 characters long.'});
       
        }
        const couponName = req.body.couponName.trim(); // Remove leading and trailing spaces
        if (couponName === '') {
            return res.render('couponadd', { message: 'Coupon name cannot be empty or contain only spaces.' });
        }

        // Check if the coupon name is unique
        const existingCoupon = await Coupon.findOne({ couponName: req.body.couponName });
        if (existingCoupon) {
            return res.render('couponadd',{message:'Coupon name must be unique.'});
       
        }
 // Validate discount value is within the range of 1 to 80
 const discount = parseInt(req.body.discount);
 if (discount <= 1 || discount >= 80) {
     return res.render('couponadd', { message: 'Discount must be within range  of 1 and 80.' });
 }

  // Validate minimum purchase value is greater than 0
  const minPurchase = parseInt(req.body.minPurchase);
  if (minPurchase <= 0) {
      return res.render('couponadd', { message: 'Minimum purchase must be greater than 0.' });
  }
   // Validate expiry date is greater than today's date
   const expiryDate = new Date(req.body.expiry);
   const today = new Date();
   if (expiryDate <= today) {
       return res.render('couponadd', { message: 'Expiry date must be greater than today\'s date.' });
   }

        const coupon = new Coupon({
            couponCode: couponCode,
            couponName:req.body.couponName,
            discount: req.body.discount,
            minPurchase: req.body.minPurchase,
            Expiry: req.body.expiry,
            usageLimit: req.body.usageLimit,
            active: req.body.active === 'on', // Check if the checkbox is checked
        });


          const coupons=await coupon.save();
 if(coupons){    
    res.redirect('/admin/coupon');
    }else{
        res.render('couponadd')
    }
    }catch(error){
        console.log(error.message)
    }
}
const listUnlistCoupon=async(req,res)=>{
    try {
        const { couponId } = req.params; // Use req.params to get the couponId from the URL
      
        // Find the coupon by ID
        const coupon = await Coupon.findById(couponId);
       
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        // Toggle the active status of the coupon
        coupon.active = !coupon.active;
        await coupon.save();

        res.redirect('/admin/coupon');
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const editcouponLoad=async(req,res)=>{
    try{
        const id=req.query.id;
        const coupon=await Coupon.findById({_id:id}) 
        if(coupon){ 
      res.render('editcoupon',{coupon:coupon})
        }else{
          res.redirect('/admin/coupon')
        }
      }catch(error){
          console.log(error.message)
      }
}

const updatecoupon = async (req, res) => {
    try {
        const { id, couponCode, discount, minPurchase, Expiry, usageLimit } = req.body;
        // Check if the id is valid
        if (!id) {
            return res.status(400).json({ message: 'Invalid coupon ID' });
        }

        const updatedFields = {
            couponCode,
            discount,
            minPurchase,
            Expiry,
            usageLimit,
        };

        // Use findByIdAndUpdate to update the coupon by its ID
        const updatedCoupon = await Coupon.findByIdAndUpdate(id, { $set: updatedFields }, { new: true });

        if (!updatedCoupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.redirect('/admin/coupon');
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};
const deletecoupon=async(req,res)=>{
    try{
        const id=req.query.id
        await Coupon.deleteOne({_id:id})
           res.redirect('/admin/coupon')
      }catch(error){
          console.log(error.message)
      }
}
const orderdetailLoad=async(req,res)=>{
    try{
        const orderId = req.query.id;
        const productId = req.query.productId;

       console.log(orderId)
       console.log(productId)
       const order = await Order.findById(orderId)
       .populate({
           path: 'product.productId',  // Populate the productId field of the product array
           model: 'Products',  // Make sure this matches your Products model name
       })
       
       console.log(order)
       if (!order) {
           return res.status(404).send('Order not found');
       }
       const product = order.product.find(product => product.productId._id.equals(productId));
       if (!product) {
           return res.status(404).send('Product not found in order');
       }
       console.log("products founded is............",product)
        res.render('report',{orders:order,product:product})
    }catch(error){
        console.log(error.message)
    }
}
const saleReport=async(req,res)=>{
    try{     
         // Find all orders (or apply filters as needed)
         const orders = await Order.find({ 'product.orderStatus': 'Delivered' }).populate('product.productId');
         console.log(orders)
        res.render('salereport', { orders: orders});
         
    }catch(error){
        console.log(error.message)
    }
  }
const filterReport=async(req,res)=>{
    try {
        let filterType = req.query.filter;
        let startDate, endDate;
        console.log(filterType)
        // Calculate start and end dates based on the selected filter
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            console.log("hi date")
            endDate = new Date(req.query.endDate);
        }
        else if (filterType === 'day') {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0); // Start of the day
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999); // End of the day
        } else if (filterType === 'week') {
            // Calculate start and end dates for the past week
            // Adjust the logic as per your requirements
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7); // 7 days ago
            startDate.setHours(0, 0, 0, 0); // Start of the day
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999); // End of the day
        } else if (filterType === 'month') {
            // Calculate start and end dates for the past month
            // Adjust the logic as per your requirements
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1); // 1 month ago
            startDate.setHours(0, 0, 0, 0); // Start of the day
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999); // End of the day
        }else if (filterType === 'year') {
            // Calculate start and end dates for the past year
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1); // 1 year ago
            startDate.setHours(0, 0, 0, 0); // Start of the day
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999); // End of the day
        }

        // Fetch sales data based on the selected time frame
       let ordersQuery = Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Populate the 'product' field to include product details
        ordersQuery.populate('product.productId');

        const orders = await ordersQuery.exec();
        console.log(orders);

console.log(orders)
        res.status(200).json({ order:orders });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
   }

   const getOfferLoad=async(req,res)=>{
    try{
        const offer=await Offer.find()
       
res.render('offer',{offer:offer})
    }catch(error){
        console.log(error.message)
    }
   }

   const addOffer=async(req,res)=>{
    try{
res.render('addoffer')
    }catch(error){
        console.log(error.message)
    }
   }

   const postOffer=async(req,res)=>{
    try{
        const startDate= req.body.startDate
        const expiryDate= req.body.expiryDate
       
        if (expiryDate <= startDate) {
            return res.render('addoffer', { message: "Expiry date must be greater than start date" });
        }

        const offername = req.body.offername.trim(); // Remove leading and trailing spaces
        if (offername === '') {
            return res.render('addoffer', { message: 'offer name cannot be empty or contain only spaces.' });
        }

        // Check if the coupon name is unique
        const existingoffer = await Offer.findOne({ offername: req.body.offername });
        if (existingoffer) {
            return res.render('addoffer',{message:'offer name must be unique.'});
       
        }
        const offer = new Offer({
            offername: req.body.offername,
            percentage: req.body.percentage,
            startDate: req.body.startDate,
            expiryDate: req.body.expiryDate,
           
        });


          const offers=await offer.save();
 if(offers){    
    res.redirect('/admin/offer');
    }else{
        res.render('addoffer')
    }
res.render('addoffer')
    }catch(error){
        console.log(error.message)
    }
   }


   const editOffer=async(req,res)=>{
    try{
        const id=req.query.id;
        const offer=await Offer.findById({_id:id}) 
        if(offer){ 
            res.render('editoffer',{offer:offer})
        }else{
          res.redirect('/admin/coupon')
        }

    }catch(error){
        console.log(error.message)
    }
   }
   const updateOffer = async (req, res) => {
    try {
        
        // Extract updated offer details from request body
        const { id,offername, percentage, startDate, expiryDate } = req.body;
        if (!id) {
            return res.status(400).json({ message: 'Invalid offer ID' });
        }
        // Find the offer by ID and update its details

        const updatedFields = {
            offername,
            percentage,
            startDate,
            expiryDate
        };
        const updatedOffer = await Offer.findByIdAndUpdate(id, { $set: updatedFields }, { new: true });

        // Check if the offer was updated successfully
        if (!updatedOffer) {
            return res.status(404).json({ error: 'Offer not found' });
        }
        // Send the updated offer as a response
        res.redirect('/admin/offer')
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
 const applyOffer=async(req,res)=>{
    try {
        const { percentage,productId,offerId } = req.body;
console.log(percentage,productId,offerId)
        // Fetch the product from the database
        //const product = await Products.findById(productId);

        // Apply the offer to the product
        // For example, update the sale price based on the percentage
        //product.offerprice -= (product.productprice * (percentage / 100));

        // Save the updated product
        //await product.save();

       // res.json({ success: true, message: 'Offer applied successfully', product });
       const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const productPrice = product.productprice; // Assuming productprice is the field in your product schema
        let offerPrice = productPrice - (productPrice * percentage / 100);
        offerPrice=parseInt(offerPrice)
        // Update the product document with the offer ID and offer price
        product.offer = offerId;
        product.offerprice = offerPrice;
        await product.save();

        res.status(200).json({ success: true, message: 'Offer applied successfully', offerPrice });
  
    } catch (error) {
        console.error('Error applying offer:', error);
        res.status(500).json({ success: false, message: 'Error applying offer' });
    }
 }

  const removeOffer=async(req,res)=>{
    try{
        const { productId} = req.body;
        const product = await Products.findById(productId);

    // Check if the product exists
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
   // Find the index of the offer to remove
  // Use $unset operator to remove offer and offerprice fields
  await Products.updateOne({ _id: productId }, {
    $unset: {
        offer: '',
        offerprice: ''
    }
});


   // Send a success response
   res.status(200).json({ message: 'Offer removed successfully' });
   
 } catch (error) {
        console.log(error.message)
    }
  }
  const applyOfferCategory=async(req,res)=>{
    try{

        const {offerId } = req.body;
        const { categoryId } = req.params;
    const category = await Category.findById(categoryId);

    if (!category) {
        return res.status(404).json({ error: 'Category not found' });
    }
    const offer = await Offer.findById(offerId);
    if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
    }

    // Update the category's offerId field with the new offer ID
    category.offerId = offerId;
    category.offerPercentage = offer.percentage;
console.log(  category.offerPercentage)
    // Save the updated category
    const updatedCategory = await category.save();
    
     const categoryname=category.categoryname
     console.log(categoryname)
     const products = await Products.find({ category: categoryname });
console.log("the products are",products)
 // Calculate offer price for each product using a loop
 for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const offerPrice = product.productprice - (product.productprice * (category.offerPercentage  / 100));

    // Check if the new offer price is lower than the current offer price of the product
              //  product.offer = offerId; // Assuming offerId is the ID of the new offer
                //product.offerprice = offerPrice;
                //await product.save(); // Save each product with updated offer details
            
                 // Check if the product already has an offer and an offer price
            if (product.offer && product.offerprice) {
                // Compare new offer price with existing offer price
                if (offerPrice < product.offerprice) {
                    // Update product's offer and offer price
                    product.offer = offerId; // Assuming offerId is the ID of the new offer
                    product.offerprice = offerPrice;
                    await product.save(); // Save the product with updated offer details
                }
            } else {
                // If no existing offer or offer price, set them for the product
                product.offer = offerId; // Assuming offerId is the ID of the new offer
                product.offerprice = offerPrice;
                await product.save(); // Save the product with offer details
            }
}

     res.status(200).json({ message: 'Offer applied successfully' });
} catch (error) {
    console.error('Error applying offer:', error);
    res.status(500).json({ error: 'Internal server error' });
}
  }

  const removeOfferCategory=async(req,res)=>{
  try{
 
    const { categoryId } = req.params;
const category = await Category.findById(categoryId);

if (!category) {
    return res.status(404).json({ error: 'Category not found' });
}

// Update the category's offerId field with the new offer ID
category.offerId = null;
        category.offerPercentage = 0;

        // Save the updated category
        const updatedCategory = await category.save();

        // Find products in the category and remove offer details from each product
        const categoryname=category.categoryname
        console.log(categoryname)
         await Products.updateMany({ category: categoryname }, {
            $unset: {
                offer: '',
                offerprice: ''
            }
        });

       
res.status(200).json({ message: 'Offer removed successfully' });
} catch (error) {
console.error('Error applying offer:', error);
res.status(500).json({ error: 'Internal server error' });
}
  }
module.exports={
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    adminDashboard,
    blockUSer,
    adminProduct,
    addProduct,
    addnewProduct,
    editProduct,
    updateProduct,
    deleteProduct,
    adminCategory,
    addcategory,
    editcategoryLoad,
    updateCategory,
    softdeletecategory,
    listUnlistCategory,
    deleteImage,
    updateProductImage,
    getOrder,
    updateOrderStatus,
    getorderdetail,
    getCoupon,
    addCoupon,
    postCoupon,
    listUnlistCoupon,
    editcouponLoad,
    updatecoupon,
    deletecoupon,
    orderdetailLoad,
    saleReport,
    filterReport,
    getOfferLoad,
    addOffer,
    postOffer,
    editOffer,
    updateOffer,
    applyOffer,
    removeOffer,
    applyOfferCategory,
    removeOfferCategory,
    getYearlyChartData,
    getMonthlyChartData,
}