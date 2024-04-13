const mongoose = require('mongoose');
const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
    maxlength: 8, 
  },
   couponName: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100  // Assuming the discount is a percentage, so it should be between 0 and 100
  },
  minPurchase: {
    type: Number,
    default: 0  // Default to 0 if no minimum purchase required
  },
  Expiry: {
    type: Date,
    required: true,
    expires: 0,
  },
  usageLimit: {
    type: Number,
    default: null  // Set to null if there's no usage limit
  },
  active: {
    type: Boolean,
    default: true  // Coupon is active by default
  },
  createdAt: {
    type: Date,
    default: Date.now  // Default to the current date/time when the document is created
  },usedBy: 
  [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }] // Array of user IDs

});
// Create a TTL index on the Expiry field
couponSchema.index({ Expiry: 1 }, { expireAfterSeconds: 0 });

// Create a Coupon model based on the schema
module.exports = mongoose.model('Coupon', couponSchema);

