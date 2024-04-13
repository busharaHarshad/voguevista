const User=require('../models/userModel')
const Cart=require('../models/cartModel')
const Order=require('../models/orderModel')
const Wallet=require('../models/walletModel')
const Razorpay = require('razorpay');
const { RAZORPAY_KEY_ID , RAZORPAY_KEY_SECRET } =process.env;
var razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
//////////////////////////////////////////////////////////////////////////////////////////////////
const getWallet=async(req,res)=>{
    try{
        const userId = req.session.user_id;
        if (req.session.user_id) {
            const userData = await User.findById(req.session.user_id);

            if (!userData) {
                // Handle the case where the user with the session ID is not found
                return res.status(404).send('User not found');
            }
            const wallet = await Wallet.findOne({ userId: userId });
            if (!wallet) {
                return res.status(404).json({ error: 'Wallet not found' });
            }
                 res.render('wallet',{user:userData,wallet:wallet})
        }
    }catch(error){
        console.log(error.message)
    }
  }

// Assuming you have configured Razorpay SDK and imported it as 'razorpay'
const addwalletAmount = async (req, res) => {
    try {
        const userId=req.session.user_id
        const amount = parseFloat(req.body.amount); // Amount to add to the wallet
        const currency = 'INR'; // Currency (you can change this as needed)
        let wallet = await Wallet.findOne({ userId: userId });
        // If wallet doesn't exist, create a new one
        if (!wallet) {
            wallet = new Wallet({ userId: userId, balance: 0 });
        }
        
        // Create a wallet fund order using Razorpay SDK
        const order = await razorpay.orders.create({
            amount: amount * 100, // Convert amount to paisa
            currency,
            receipt: 'wallet_fund_' + Date.now(), // Unique receipt ID for tracking
            payment_capture: 1, // Automatically capture payment
        });
        
        // Update the wallet balance
        wallet.balance += amount;
        await wallet.save();
        // Send the order ID back to the client
        res.json({ orderId: order.id , balance: wallet.balance});
    } catch (error) {
        console.error('Error creating wallet fund order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const getWalletPay=async(req,res)=>{
try{
    const { amount} = req.body; // Get the amount and type of transaction from the request body
    const userId=req.session.user_id // Assuming you have user information stored in session
console.log(userId)
    // Find the wallet using the user ID from the session
    const wallet = await Wallet.findOne({ userId:userId });

    if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
    }

    // Create a new wallet transaction object
    wallet.transactionHistory.push({
        amount:amount,
        type: 'deposit',
        timestamp: new Date()
    });

    // Save the updated wallet
    await wallet.save();


    // Respond with success message or data if needed
    res.status(200).json({ message: 'Wallet transaction saved successfully' });

}catch(error){
    console.log(error.message)
}
}
  module.exports={
    getWallet,
    addwalletAmount,
   getWalletPay,
  }