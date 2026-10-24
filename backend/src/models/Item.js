import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: [true, 'Item type (lost or found) is required']
  },
  category: {
    type: String,
    enum: ['bag', 'phone', 'bottle', 'umbrella', 'laptop', 'book', 'other'],
    required: [true, 'Category is required']
  },
  color: {
    type: String,
    enum: ['black', 'white', 'grey', 'red', 'blue', 'green', 'yellow', 'brown', 'other'],
    required: [true, 'Color is required']
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  imageUrl: {
    type: String,
    required: [true, 'Image is required']
  },
  contact: {
    type: String,
    required: [true, 'Contact information is required'],
    trim: true
  },
  currentLocation: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'returned'],
    default: 'active'
  }
}, {
  timestamps: true
});

export const Item = mongoose.model('Item', itemSchema);
