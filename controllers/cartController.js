const User=require('../models/userModel')
const bcrypt=require('bcrypt')
const session = require('express-session');
const Products = require('../models/adminModel');
const Category = require('../models/categoryModel');
const Address=require('../models/addressModel');
const Cart=require('../models/cartModel')
const Order=require('../models/orderModel')
const Wallet=require('../models/walletModel')
const Coupon=require('../models/couponModel')
const Razorpay = require('razorpay');
const { productdetailLoad } = require('./userController');
const { RAZORPAY_KEY_ID , RAZORPAY_KEY_SECRET } =process.env;
var instance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })

//cart0000000000000000000000000000000000000000000000000000000000000000000000000000
const getCart=async(req,res)=>{
    try{
        const categories = await Category.find({status: 'false',isDeleted: false});
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                // Handle the case where the user with the session ID is not found
                return res.status(404).send('User not found');
            }
            // Save the cart item to the database
            const userId = req.session.user_id;
            const cartt = await Cart.findOne({ userId: userId }).populate('product.productId');
           
            if (!cartt) {
                // If the user's cart is empty, render an empty cart view
                return res.render('cart',{user:userData,category:categories,cart:cartt});
            }
            // Calculate the threshold date for products older than one minute
           
       res.render('cart',{user:userData,category:categories,cart:cartt})
    }else{
        res.render('login')
    }
 }catch(error){
        console.log(error.message)
    }
}


const addTocart=async(req,res)=>{
    try{
        const categories = await Category.find({status: 'false',isDeleted: false});

        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                // Handle the case where the user with the session ID is not found
                return res.status(404).send('User not found');
            }
            // Save the cart item to the database
    
res.render('cart',{user:userData,category:categories})
   } 
   else{
    res.render('login')
}

}catch(error){
        console.log(error.message)
    }
}
const Listcart = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.body.productId; // Assuming you're getting the productId from the request body
        const categories = await Category.find({ status: 'false', isDeleted: false });

        if (!userId) {
            // Handle the case where the user is not logged in
            return res.render('login');
        }

        const userData = await User.findById(userId);
        if (!userData) {
            // Handle the case where the user with the session ID is not found
            return res.status(404).send('User not found');
        }
        
        // Find the user's cart (if it exists) or create a new one if not
        let cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            cart = new Cart({
                userId: userId,
                product: [{ productId: productId }]
            });
        } else {
            // Check if the product is already in the cart
            const productIndex = cart.product.findIndex(p => p.productId.toString() === productId.toString());
            if (productIndex >= 0) {
                // Increment the quantity if the product is already in the cart
                cart.product[productIndex].quantity++;
            } else {
                // Add the product to the cart if it's not already there
                cart.product.push({ productId: productId });
            }
        }

        // Save the updated cart
        await cart.save();

        // Update stock left in product
        const product = await Products.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.stockLeft < 1) {
            return res.status(400).json({ error: 'Not enough stock left for product' });
        }

        product.stockLeft--;

        await product.save();

        // Respond with the cart details
        const cartt = await Cart.findOne({ userId: userId }).populate('product.productId');
        if (!cartt) {
            // If the user's cart is empty, render an empty cart view
            return res.render('empty-cart');
        }

        res.render('cart', { user: userData, category: categories, cart: cartt });

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};
const checkAndRemoveExpiredProducts = async () => {
    try {
        const currentTime = new Date();
        const expirationTimeThreshold = new Date(currentTime.getTime() - (1 * 60000)); // 1 minute ago

        // Find carts with expired products
        const carts = await Cart.find({
            'product.createdAt': { $lte: expirationTimeThreshold }
        });
        
        for (const cart of carts) {
            for (const product of cart.product) {
                // Find the product in the Products schema
                const productInfo = await Products.findById(product.productId);

                if (productInfo) {

                    // Increase the stock left in Products schema by the product quantity
                    productInfo.stockLeft += product.quantity;

                    // Save the updated product info
                    await productInfo.save();
                }
            }

            // Remove expired products from the cart
            cart.product = cart.product.filter(product => product.createdAt > expirationTimeThreshold);

            // Save the updated cart
            await cart.save();
        }
    } catch (error) {
        console.error('Error checking and removing expired products:', error.message);
    }
};
const days = 10;
const millisecondsInDay = 24 * 60 * 60 * 1000; // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
const intervalTime = days * millisecondsInDay; // Interval time for 10 days in milliseconds

// Schedule the background task to run every minute
setInterval(checkAndRemoveExpiredProducts, intervalTime);
/*const updatequantity=async(req,res)=>{
try{
    const { newQuantity } = req.body;
    const productId = req.params.productId;
        // Find the cart and update the quantity for the specified product
        const cart = await Cart.findOneAndUpdate(
            { userId: req.session.user_id, 'product.productId': productId },
            { $set: { 'product.$.quantity': newQuantity } },
            { new: true }
        );
        
        res.redirect('/cart');
}catch(error){
    console.log(error.message)
}
}*/
const updateProductStock = async (cart) => {
    for (const cartProduct of cart.product) {
        const product = await Products.findById(cartProduct.productId);

        if (!product) {
            throw new Error(`Product not found with id: ${cartProduct.productId}`);
        }

        if (product.stockLeft < 1) {
            throw new Error(`Not enough stock left for product: ${product.productName}`);
        }

        // Decrease the stock by 1 for each product added to the cart
        product.stockLeft--;

        await product.save();
    }
}

const updateProductStockdec = async (cart) => {
    for (const cartProduct of cart.product) {
        const product = await Products.findById(cartProduct.productId);

        if (!product) {
            throw new Error(`Product not found with id: ${cartProduct.productId}`);
        }

        if (product.stockLeft < 1) {
            throw new Error(`Not enough stock left for product: ${product.productName}`);
         
        }

        // Decrease the stock by 1 for each product added to the cart
        product.stockLeft++;

        await product.save();
    }
}

const updateincrementquantity=async(req,res)=>{
    try {
        const { newQuantity } = req.body;
        const productId = req.params.productId;
        const userId = req.session.user_id;
         // Check if stock is available
         const product = await Products.findOne({ _id: productId });
         if (!product) {
             return res.status(404).json({ success: false, message: 'Product not found' });
         }
 
         if (product.stockLeft < newQuantity) {
             return res.status(400).json({ success: false, message: 'Not enough stock available' });
         }
 
        // Update quantity in cart
        const cart = await Cart.findOneAndUpdate(
            { userId: req.session.user_id, 'product.productId': productId },
            { $set: { 'product.$.quantity': newQuantity } },
            { new: true }
        );
       

        // Update stock left in product
        await updateProductStock(cart);

        // Send the updated cart back to the client
        res.json({ success: true, cart });
    } catch (error) {
        console.log(error.message);
    }
}
const updatedecrementquantity=async(req,res)=>{
    try {
        const { newQuantity } = req.body;
        const productId = req.params.productId;

        // Update quantity in cart
        const cart = await Cart.findOneAndUpdate(
            { userId: req.session.user_id, 'product.productId': productId },
            { $set: { 'product.$.quantity': newQuantity } },
            { new: true }
        );
        await updateProductStockdec(cart);
       
        res.json({ success: true, cart });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
const deleteCart = async (req, res) => {
    try {
        const productId = req.query.id;
        const userId = req.session.user_id;

        // Find the cart by user ID
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Find the product in the cart
        const productInCart = cart.product.find(item => item.productId.toString() === productId);

        if (!productInCart) {
            return res.status(404).json({ error: 'Product not found in the cart' });
        }

        // Remove the product from the cart
        cart.product = cart.product.filter(item => item.productId.toString() !== productId);

        // Save the updated cart
        await cart.save();

        // Find the corresponding product in the database
        const product = await Products.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Add the quantity from the cart back to the stockLeft of the product
        product.stockLeft += productInCart.quantity;

        // Save the updated product
        await product.save();

        res.redirect('/cart');

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getCheckout=async(req,res)=>{
    try{

        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                // Handle the case where the user with the session ID is not found
                return res.status(404).send('User not found');
            }
            // Save the cart item to the database
            const userId = req.session.user_id;
            const cartt = await Cart.findOne({ userId: userId }).populate('product.productId');
           const totalItem=req.query.totalItem;
           const overallTotal=req.query.overallTotal;
           req.session.totalItem=totalItem;
           req.session.overallTotal=overallTotal;
            if (!cartt) {
                // If the user's cart is empty, render an empty cart view
                return res.render('cart',{user:userData,cart:cartt});
            }  
            const userAddresses = await Address.find({ userId:userData._id}); // or retrieve it from wherever it's stored


          res.render('checkout',{user:userData,cart:cartt,address:userAddresses,totalItem:totalItem,overallTotal:overallTotal})
   }
 }catch(error){
        console.log(error.message)
    }
}

const getComplete=async(req,res)=>{
    try{
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                // Handle the case where the user with the session ID is not found
                return res.status(404).send('User not found');
            }
           
res.render('complete',{user:userData})
        }
    }catch(error){
        console.log(error.message)
    }
}
/*const postOrder=async(req,res)=>{
    try{
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                // Handle the case where the user with the session ID is not found
                return res.status(404).send('User not found');
            }
           
            const cart = await Cart.findOne({ userId: req.session.user_id });
            let product=[]
           for(let item of cart.product){
            product.push({
                productId:item.productId,
                quantity:item.quantity
            })
           }
           
            const order= new Order({
                userId: req.session.user_id,
                product:product,
                addressId: req.body.selectedAddress,
                paymentMethod: req.body.paymentMethod,
                totalAmount:req.session.overallTotal,
                totalItem:req.session.totalItem,
                // Add any other relevant fields to the orderData object
            });
            // Save the orderData object to your order database using your Order model
            await order.save()

            await Cart.deleteMany({ userId: req.session.user_id });
        res.redirect('complete')
        }
    }catch(error){
        console.log(error.message)
    }
}*/

/*const postOrder = async (req, res) => {
    try {
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                return res.status(404).send('User not found');
            }

            const cart = await Cart.findOne({ userId: req.session.user_id }).populate('product.productId');
           
            for (const cartItem of cart.product) {
                productPrice = cartItem.productId.productprice;
            }
            const selectedAddress = await Address.findById(req.body.selectedAddress);
            console.log(req.body.selectedAddress)

            if (!selectedAddress) {
                return res.status(404).send('Address not found');
            }
            console.log(selectedAddress)
            const order = new Order({
                userId: req.session.user_id,
                product: cart.product,
                productPrice:productPrice,
                address:selectedAddress,
                paymentMethod: req.body.paymentMethod,
                totalAmount: req.session.overallTotal,
                totalItem: req.session.totalItem,
            });
1
            await order.save();

            await Cart.deleteMany({ userId: req.session.user_id });

            res.redirect('complete');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Internal server error');
    }
};*/
const postOrder = async (req, res) => {
    try {
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                return res.status(404).send('User not found');
            }

            const cart = await Cart.findOne({ userId: req.session.user_id }).populate('product.productId');
           
            let productPrice = 0;
            let offeramount = 0; // Initialize discount amount
            const orderProducts = [];
            for (const cartItem of cart.product) {
                //const productPrice = cartItem.productId.productprice;
                const productId = cartItem.productId;
                const quantity = cartItem.quantity;
               // const productAmount = productPrice * quantity;
               let pricePerProduct = productId.offerprice || productId.productprice; // Use offer price if available, otherwise regular price
               const productAmount = pricePerProduct * quantity;

                orderProducts.push({
                    productId: cartItem.productId._id,
                    quantity: quantity,
                    productAmount: productAmount,
                    orderStatus: 'Processing', // Assuming default status is 'Processing'
                    returnReason: '' // Assuming there's no return reason initially
                });
            }
            console.log(orderProducts)

            for (const cartItem of cart.product) {
                productPrice += cartItem.productId.productprice;
               // Check if the product has an offer price
               if (cartItem.productId.offerprice && cartItem.productId.offerprice > 0) {
                offeramount += cartItem.productId.offerprice * cartItem.quantity;
                console.log("if",offeramount)
            } else {
                offeramount += cartItem.productId.productprice * cartItem.quantity;
                console.log("else",offeramount)
        
            }
            }
            
console.log(offeramount)
            const selectedAddress = await Address.findById(req.body.selectedAddress);

            if (!selectedAddress) {
                return res.status(404).send('Address not found');
            }


           

            // Determine the payment method
            const paymentMethod = req.body.paymentMethod;
            const  TotalAmount=req.body.overallTotal
            const discountAmount=req.session.overallTotal-req.body.overallTotal
            console.log("discount amount",discountAmount)
            // Handle cash on delivery payment
            if (paymentMethod === 'cashOnDelivery') {
                // Create the order
                const order = new Order({
                    userId: req.session.user_id,
                    product: orderProducts,
                    productPrice: productPrice,
                    address: selectedAddress,
                    paymentMethod: paymentMethod,
                    totalAmount: TotalAmount,
                    totalItem: req.session.totalItem,
                    Offeramount:offeramount,     
                    discount:discountAmount,
                });

                // Save the order to the database
                await order.save();

                // Clear the user's cart
                await Cart.deleteMany({ userId: req.session.user_id });

                // Save the user ID to the coupon schema
                if (req.body.couponName) {
                    const coupon = await Coupon.findOne({ couponName: req.body.couponName });
                    console.log(coupon)
                    if (coupon) {
                        coupon.usedBy = req.session.user_id;
                        coupon.usageLimit -= 1;
                        await coupon.save();
                    }
                }
                // Redirect to completion page
              res.redirect('/complete');
              
            } else if (paymentMethod === 'onlinePayment') {
                // Integrate with online payment gateway
                // Implement payment logic here (e.g., redirecting to a payment page)
                // After successful payment, create the order and proceed as above
                const razorpayOptions = {
                    amount: req.body.overallTotal* 100, // Amount in paise
                    currency: 'INR',
                    receipt: 'order_rcptid_' + Date.now() ,// You can generate a unique receipt ID
                    payment_capture: 1, // Auto-capture payment

                };
               
                /* const order = new Order({
                    userId: req.session.user_id,
                    product: cart.product,
                    productPrice: productPrice,
                    address: selectedAddress,
                    paymentMethod: paymentMethod,
                    totalAmount: TotalAmount,
                    totalItem: req.session.totalItem,
                    discount:discountAmount,
                });

                // Save the order to the database
                await order.save();

                // Clear the user's cart
                await Cart.deleteMany({ userId: req.session.user_id });*/

                const payment = await instance.orders.create(razorpayOptions);

                // Redirect user to Razorpay payment page
                res.status(200).json({ orderId: payment.id, amount: payment.amount });

            } else if (paymentMethod === 'wallet') {
                // Integrate with wallet service or API
                // Deduct the amount from the user's wallet balance
                 // Deduct the amount from the user's wallet balance
                 const wallet = await Wallet.findOne({ userId: req.session.user_id });

                 if (!wallet) {
                     return res.status(404).send('Wallet not found');
                 }
 
                 const amountToDeduct = TotalAmount;
                 if (wallet.balance < amountToDeduct) {
                     return res.status(400).send('Not enough balance in the wallet');
                 }
 
                 wallet.balance -= amountToDeduct;
                 await wallet.save();

                 wallet.transactionHistory.push({
                    amount: amountToDeduct,
                    type: 'purchase', // Assuming this is a purchase transaction
                    timestamp: new Date()
                });
                await wallet.save(); // Save the updated wallet with transaction history
        
                 // Create the order
                 const order = new Order({
                     userId: req.session.user_id,
                     product:orderProducts,
                     productPrice: productPrice,
                     address: selectedAddress,
                     paymentMethod: paymentMethod,
                     totalAmount:amountToDeduct,
                     totalItem: req.session.totalItem,
                     Offeramount:offeramount,  
                     discount:discountAmount,
                     paymentStatus: 'completed',
                 });
 
                 // Save the order to the database
                 await order.save();
 
                 // Clear the user's cart
                 await Cart.deleteMany({ userId: req.session.user_id });
                 if (req.body.couponName) {
                    const coupon = await Coupon.findOne({ couponName: req.body.couponName });
                    console.log(coupon)
                    if (coupon) {
                        coupon.usedBy = req.session.user_id;
                        coupon.usageLimit -= 1;
                        await coupon.save();
                    }
                }
                 // Redirect to completion page
                 res.redirect('/complete');
                // Create the order and proceed as above
            } else {
                // Handle unsupported payment method
                return res.status(400).send('Unsupported payment method');
            }
        }
    } catch (error) {
        console.error('Error placing order:', error);
        return res.status(500).send('Internal server error');
    }
};
/*const saveonlineorder=async(req,res)=>{
    try{
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                return res.status(404).send('User not found');
            }

            const cart = await Cart.findOne({ userId: req.session.user_id }).populate('product.productId');
           
            let productPrice = 0;
            let offeramount = 0; // Initialize discount amount

            for (const cartItem of cart.product) {
                productPrice += cartItem.productId.productprice;
                offeramount += (cartItem.productId.productprice -cartItem.productId. offerprice) * cartItem.quantity; // Calculate discount for each product
          
            }
console.log(offeramount)
            const selectedAddress = await Address.findById(req.body.selectedAddress);

            if (!selectedAddress) {
                return res.status(404).send('Address not found');
            }

            // Determine the payment method
            const paymentMethod = req.body.paymentMethod;
            const  TotalAmount=req.body.overallTotal
            const discountAmount=req.session.overallTotal-req.body.overallTotal
            console.log("discount amount",discountAmount)
            const order = new Order({
                userId: req.session.user_id,
                product: cart.product,
                productPrice: productPrice,
                address: selectedAddress,
                paymentMethod: paymentMethod,
                totalAmount: TotalAmount,
                totalItem: req.session.totalItem,
                Offeramount:offeramount,  
                discount:discountAmount,
            });

            // Save the order to the database
            await order.save();
            console.log("new order:",order)
            // Clear the user's cart
            await Cart.deleteMany({ userId: req.session.user_id });
            return res.status(200).send('Order saved successfully and cart cleared.');

            
        }
    }catch(error){
        console.log(error.message)
    }
}*/
const saveonlineorder = async (req, res) => {
    try {
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                return res.status(404).send('User not found');
            }

            const cart = await Cart.findOne({ userId: req.session.user_id }).populate('product.productId');

            let productPrice = 0;
            let offeramount = 0; // Initialize discount amount
            const orderProducts = [];
            for (const cartItem of cart.product) {
                //const productPrice = cartItem.productId.productprice;
                //const quantity = cartItem.quantity;
                //const productAmount = productPrice * quantity;
                const productId = cartItem.productId;
                const quantity = cartItem.quantity;
               let pricePerProduct = productId.offerprice || productId.productprice; // Use offer price if available, otherwise regular price
               const productAmount = pricePerProduct * quantity;

                orderProducts.push({
                    productId: cartItem.productId._id,
                    quantity: quantity,
                    productAmount: productAmount,
                    orderStatus: 'Processing', // Assuming default status is 'Processing'
                    returnReason: '' // Assuming there's no return reason initially
                });
            }
            for (const cartItem of cart.product) {
                productPrice += cartItem.productId.productprice;
               // Check if the product has an offer price
               if (cartItem.productId.offerprice && cartItem.productId.offerprice > 0) {
                offeramount += cartItem.productId.offerprice * cartItem.quantity;
                console.log("if",offeramount)
            } else {
                offeramount += cartItem.productId.productprice * cartItem.quantity;
                console.log("else",offeramount)
        
            }
            }
            console.log(offeramount);

            const selectedAddress = await Address.findById(req.body.selectedAddress);

            if (!selectedAddress) {
                return res.status(404).send('Address not found');
            }

            // Determine the payment method
            const paymentMethod = req.body.paymentMethod;
            const TotalAmount = req.body.overallTotal;
            const discountAmount = req.session.overallTotal - req.body.overallTotal;
            console.log("discount amount", discountAmount);

            const order = new Order({
                userId: req.session.user_id,
                product: orderProducts,
                productPrice: productPrice,
                address: selectedAddress,
                paymentMethod: paymentMethod,
                totalAmount: TotalAmount,
                totalItem: req.session.totalItem,
                Offeramount: offeramount,
                discount: discountAmount,
                paymentStatus: 'completed', // Set payment status to 'success'
           
            });

            // Save the order to the database
            await order.save();
            console.log("new order:", order);

            // Clear the user's cart
            await Cart.deleteMany({ userId: req.session.user_id });
            if (req.body.couponName) {
                const coupon = await Coupon.findOne({ couponName: req.body.couponName });
                console.log(coupon)
                if (coupon) {
                    coupon.usedBy = req.session.user_id;
                    coupon.usageLimit -= 1;
                    await coupon.save();
                }
            }
            return res.status(200).send('Order saved successfully and cart cleared.');
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal server error');
    }
};
const savependingOrder = async (req, res) => {
    try {
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                return res.status(404).send('User not found');
            }

            const cart = await Cart.findOne({ userId: req.session.user_id }).populate('product.productId');

            let productPrice = 0;
            let offeramount = 0; // Initialize discount amount
            const orderProducts = [];
            for (const cartItem of cart.product) {
              //  const productPrice = cartItem.productId.productprice;
             //   const quantity = cartItem.quantity;
               // const productAmount = productPrice * quantity;
               const productId = cartItem.productId;
               const quantity = cartItem.quantity;
              let pricePerProduct = productId.offerprice || productId.productprice; // Use offer price if available, otherwise regular price
              const productAmount = pricePerProduct * quantity;

                orderProducts.push({
                    productId: cartItem.productId._id,
                    quantity: quantity,
                    productAmount: productAmount,
                    orderStatus: 'Processing', // Assuming default status is 'Processing'
                    returnReason: '' // Assuming there's no return reason initially
                });
            }
            for (const cartItem of cart.product) {
                productPrice += cartItem.productId.productprice;
               // Check if the product has an offer price
               if (cartItem.productId.offerprice && cartItem.productId.offerprice > 0) {
                offeramount += cartItem.productId.offerprice * cartItem.quantity;
                console.log("if",offeramount)
            } else {
                offeramount += cartItem.productId.productprice * cartItem.quantity;
                console.log("else",offeramount)
        
            }
            }

            console.log(offeramount);

            const selectedAddress = await Address.findById(req.body.selectedAddress);

            if (!selectedAddress) {
                return res.status(404).send('Address not found');
            }

            // Determine the payment method
            const paymentMethod = req.body.paymentMethod;
            const TotalAmount = req.body.overallTotal;
            const discountAmount = req.session.overallTotal - req.body.overallTotal;
            console.log("discount amount", discountAmount);

            const order = new Order({
                userId: req.session.user_id,
                product: orderProducts,
                productPrice: productPrice,
                address: selectedAddress,
                paymentMethod: paymentMethod,
                totalAmount: TotalAmount,
                totalItem: req.session.totalItem,
                Offeramount: offeramount,
                discount: discountAmount,
                paymentStatus: 'pending',
            });

            // Save the order to the database
            await order.save();
            console.log("new order:", order);

            // Clear the user's cart
            await Cart.deleteMany({ userId: req.session.user_id });
            if (req.body.couponName) {
                const coupon = await Coupon.findOne({ couponName: req.body.couponName });
                console.log(coupon)
                if (coupon) {
                    coupon.usedBy = req.session.user_id;
                    coupon.usageLimit -= 1;
                    await coupon.save();
                }
            }
            // Send a response indicating that the order is saved with payment pending status
            return res.status(200).send({ message: 'Order saved successfully with payment pending status.' });
        }
    } catch (error) {
        console.log(error.message);
        // Handle the error and send an appropriate response
        return res.status(500).send({ error: 'Failed to save order with payment pending status.', errorMessage: error.message });
    }
}

/*const discount= async (req, res) => {
    try {
      const { couponName, orderTotal } = req.body; // Get the coupon code and order total from the request body
  console.log(couponName)
  console.log(orderTotal)
  const userId = req.session.user_id;
  console.log(userId)
      // Find the coupon in the database based on the coupon code
      const coupon = await Coupon.findOne({ couponName });
  console.log(coupon)
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }
  
      // Assuming the coupon has a discountPercentage field representing the discount percentage
      const discountPercentage = coupon.discount;
  
      // Calculate the discount amount based on the discount percentage and overall total
      const discountAmount = (discountPercentage / 100) * orderTotal;
      console.log("delete",discountAmount)
      // You can perform further validation or processing here if needed
      coupon.usageLimit -= 1;

      coupon.usedBy.push(userId);
        // Save the updated coupon in the database
        await coupon.save();
  let overallTotal=orderTotal-discountAmount
      // Return the discount amount in the response
      overallTotal = parseInt(overallTotal);

      console.log( overallTotal)
      req.session.overallTotalDis=discountAmount
      res.status(200).json({ discount: discountAmount,overallTotal: overallTotal });
    } catch (error) {
      console.error('Error applying coupon:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }*/
  const discount = async (req, res) => {
    try {
        const { couponName, orderTotal } = req.body; // Get the coupon code and order total from the request body
        const userId = req.session.user_id;

        // Find the coupon in the database based on the coupon code
        const coupon = await Coupon.findOne({ couponName });

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        // Assuming the coupon has a discountPercentage field representing the discount percentage
        const discountPercentage = coupon.discount;

        // Calculate the discount amount based on the discount percentage and overall total
        const discountAmount = (discountPercentage / 100) * orderTotal;

        // Store the discount amount in the session
        req.session.discountAmount = discountAmount;

        // Calculate the overall total after applying the discount
        const overallTotal = orderTotal - discountAmount;

        res.status(200).json({ discount: discountAmount, overallTotal });
    } catch (error) {
        console.error('Error applying discount:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

 const couponManagement=async (req, res) => {
    const { orderTotal } = req.query;
   

    try {
         const userId=req.session.user_id
        // Fetch coupons from the database based on the price range
        //const coupons = await Coupon.find({active: true, minPurchase: { $lte: orderTotal } }); // Adjust query as per your schema
        const coupons = await Coupon.find({
            active: true,
            minPurchase: { $lte: orderTotal },
            usedBy: { $ne: userId } // Exclude coupons where the userId is present in the usedBy array
        });
        
        res.json({ coupons });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
 const removediscount=async(req,res)=>{
    try{
        const { orderTotal,couponName } = req.body; // Get the original total amount from the request body
console.log(orderTotal)
const userId = req.session.user_id;
const coupon = await Coupon.findOne({ couponName });
        // Calculate the updated overallTotal (e.g., by removing the discount)
        const discountAmount = req.session.overallTotalDis  // Get the discount amount from session or default to 0
        let updatedOverallTotal = orderTotal + discountAmount;
        console.log(updatedOverallTotal)
       // coupon.usageLimit += 1;
        //await Coupon.updateOne({ couponName }, { $pull: { usedBy: userId } });

        // Save the updated coupon in the database
        //await coupon.save();
        // Update the overallTotal in session or wherever it's stored
        req.session.overallTotal = updatedOverallTotal; // Assuming overallTotal is stored in session
        updatedOverallTotal = parseInt(updatedOverallTotal);
        // Send the updated overallTotal back to the frontend
        res.status(200).json({ overallTotal: updatedOverallTotal });
    
    }catch(error){
        console.log(error.message)
    }
 }

 const orderpayment = async (req, res) => {
    try {
        const { orderId, productId } = req.body; // Get orderId and productId from the request body

        // Retrieve the order from your database using the orderId
        const order = await Order.findById(orderId).populate('product.productId');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Find the product within the order's products array based on the productId
        const product = order.product.find(item => item.productId._id.toString() === productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found in the order' });
        }

        let amount;

        if (product.productId.offerprice && product.productId.offerprice > 0) {
            // Use offer price * quantity if available
            amount = product.productId.offerprice * product.quantity;
        } else {
            // Default to product price * quantity if no offer price or offer price is zero
            amount = product.productId.productprice * product.quantity;
        }

        // Create a new Razorpay order
        const razorpayOptions = {
            amount: amount * 100, // Amount in paise (Razorpay expects amount in smallest currency unit)
            currency: 'INR',
            receipt: 'order_rcptid_' + Date.now(), // Unique receipt ID for each order
        };

        // Create a new Razorpay order
        const payment = await instance.orders.create(razorpayOptions);
         // Update paymentStatus to "complete" in the order model
         order.paymentStatus = 'completed';
         await order.save();

        // Redirect user to Razorpay payment page or send payment details back to the frontend
        res.status(200).json({ orderId: payment.id, amount: payment.amount });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports={
getCart,
addTocart,
Listcart,
//updatequantity,
updateincrementquantity,
updatedecrementquantity,
deleteCart,
getCheckout,
getComplete,
postOrder,
discount,
couponManagement,
removediscount,
saveonlineorder,
savependingOrder,
orderpayment,
}