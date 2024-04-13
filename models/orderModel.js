const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
           
        },
        quantity: {
            type: Number,
            default: 1
        },
        orderStatus: {
            type: String,
            enum: ['Processing', 'Shipped', 'Delivered','cancelled','returned','placed'],
            default: 'Processing'
        },
        returnReason: {
            type: String // New field to store return reason
        },
        productAmount: {
            type: Number,
            required: true
        }
        
    }],
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
  },
   productPrice:{
    type:Number,
    required:true,
    immutable: false
   },
   Offeramount:{
    type:Number,
    default:0,
   },
    paymentMethod: {
        type: String,
        enum: ['cashOnDelivery', 'wallet', 'onlinePayment'],
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    discount: {
      type: Number,
      default: 0 // Default value can be adjusted as needed
  },
   /* addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        immutable: true
    },*/ address: {
        name: {
            type: String,
            required: true
          },
          mobile: {
            type: Number, // Change to Number type
            required: true
          },
          address: {
            type: String,
            required: true
          },
          pincode: {
            type: Number, // Change to Number type
            required: true
          },
          state: {
            type: String,
            required: true
          },
          district: {
            type: String,
            required: true
          },
          city: {
            type: String,
            required: true
          }
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model('Order', orderSchema);
