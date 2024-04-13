const mongoose = require('mongoose');

const ProductsSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  productprice: {
    type: Number,
    required: true,
  },
  saleprice: {
    type: Number,
    required: true,
  },
   stockLeft: {
    type: Number,
    required: true,
  
  },offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
        
      }, 
      offerprice: {
        type: Number,
       
      },
  image: {
    type: Array,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Products', ProductsSchema);