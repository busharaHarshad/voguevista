const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    categoryname: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: [3, 'Category name must be at least 3 characters long'],
        maxlength: [50, 'Category name cannot exceed 50 characters'],
   
    },
    status: {
        type: Boolean,
          default: false ,
    },
    isDeleted: {
        type: Boolean,
        default: false,
      },
      offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer' // Assuming 'Offer' is the model name for your offer schema
    },
    offerPercentage: {
        type: Number,
        default: 0 // default value if no offer percentage is set
    },
  
});

module.exports = mongoose.model('Category', CategorySchema);