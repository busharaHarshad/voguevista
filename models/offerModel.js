const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  offername: {
    type: String,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100 
  },
  startDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Inactive', // Default status is Inactive
   
},

});

// Middleware to check and update status before saving
OfferSchema.pre('save', function(next) {
    // Get the current date
    const currentDate = new Date();
  
    // Compare the current date with the startDate and expiryDate
    if (this.startDate && this.startDate <= currentDate && this.expiryDate && this.expiryDate > currentDate) {
      this.status = 'Active'; // Set status to Active if within the date range
    } else {
      this.status = 'Inactive'; // Set status to Inactive otherwise
    }
  
    next();
  });
module.exports = mongoose.model('Offer', OfferSchema);


