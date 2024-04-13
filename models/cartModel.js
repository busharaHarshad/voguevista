const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
    product:[
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required:true
      }, 
  quantity: {
    type: Number,
    required: true,
    default: 1 ,
  },
  createdAt: {
    type: Date,
    default: Date.now
},
}
    ]
},
);

module.exports = mongoose.model('Cart', CartSchema);