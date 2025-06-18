import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Claim message is required'],
    trim: true,
    minlength: [20, 'Message must be at least 20 characters'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
claimSchema.index({ item: 1, claimedBy: 1 }, { unique: true }); // Prevent duplicate claims
claimSchema.index({ item: 1, status: 1 });
claimSchema.index({ claimedBy: 1 });
claimSchema.index({ status: 1 });
claimSchema.index({ createdAt: -1 });

// Pre-save middleware to set resolvedAt when status changes
claimSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending') {
    this.resolvedAt = new Date();
  }
  next();
});

// Instance method to approve claim
claimSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.resolvedBy = approvedBy;
  this.resolvedAt = new Date();
  return this.save();
};

// Instance method to reject claim
claimSchema.methods.reject = function(rejectedBy, notes = '') {
  this.status = 'rejected';
  this.resolvedBy = rejectedBy;
  this.resolvedAt = new Date();
  if (notes) this.adminNotes = notes;
  return this.save();
};

// Static method to get claims for an item
claimSchema.statics.getItemClaims = function(itemId) {
  return this.find({ item: itemId })
    .populate('claimedBy', 'name email')
    .populate('resolvedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get user's claims
claimSchema.statics.getUserClaims = function(userId) {
  return this.find({ claimedBy: userId })
    .populate('item', 'title description type location date image')
    .populate('resolvedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get pending claims for items owned by user
claimSchema.statics.getPendingClaimsForUser = function(userId) {
  return this.find({ status: 'pending' })
    .populate({
      path: 'item',
      match: { createdBy: userId },
      select: 'title description type location date image'
    })
    .populate('claimedBy', 'name email')
    .sort({ createdAt: -1 });
};

export default mongoose.model('Claim', claimSchema);