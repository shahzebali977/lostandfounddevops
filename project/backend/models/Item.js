import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['lost', 'found'],
    lowercase: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Electronics', 'Clothing', 'Accessories', 'Keys', 'Documents', 'Bags', 'Sports', 'Other']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date when item was lost/found is required'],
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Date cannot be in the future'
    }
  },
  image: {
    type: String,
    trim: true
  },
  contactInfo: {
    type: String,
    trim: true,
    maxlength: [200, 'Contact info cannot exceed 200 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
itemSchema.index({ type: 1, status: 1, isActive: 1 });
itemSchema.index({ location: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ createdBy: 1 });
itemSchema.index({ createdAt: -1 });
itemSchema.index({ date: -1 });

// Text index for search functionality
itemSchema.index({
  title: 'text',
  description: 'text',
  location: 'text',
  tags: 'text'
});

// Virtual for claims count
itemSchema.virtual('claimsCount', {
  ref: 'Claim',
  localField: '_id',
  foreignField: 'item',
  count: true
});

// Ensure virtual fields are serialized
itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

// Instance method to increment views
itemSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to get items with filters
itemSchema.statics.getFilteredItems = function(filters = {}) {
  const query = { isActive: true, status: 'active' };
  
  if (filters.type && filters.type !== 'all') {
    query.type = filters.type;
  }
  
  if (filters.category && filters.category !== 'all') {
    query.category = filters.category;
  }
  
  if (filters.location) {
    query.location = { $regex: filters.location, $options: 'i' };
  }
  
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  if (filters.dateFrom || filters.dateTo) {
    query.date = {};
    if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
  }
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .populate('claimsCount')
    .sort({ createdAt: -1 });
};

// Static method to get user's items
itemSchema.statics.getUserItems = function(userId) {
  return this.find({ createdBy: userId, isActive: true })
    .populate('claimsCount')
    .sort({ createdAt: -1 });
};

export default mongoose.model('Item', itemSchema);