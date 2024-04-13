const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    transactionHistory: [{
        amount: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ['deposit', 'purchase','refund'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports= mongoose.model('Wallet', walletSchema);


