import express from 'express';
import { body, validationResult } from 'express-validator';
import Claim from '../models/Claim.js';
import Item from '../models/Item.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Submit a claim for an item
router.post('/:itemId', auth, [
  body('message')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Message must be between 20 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { itemId } = req.params;
    const { message } = req.body;

    // Check if item exists and is active
    const item = await Item.findById(itemId);
    if (!item || !item.isActive || item.status !== 'active') {
      return res.status(404).json({
        message: 'Item not found or no longer available'
      });
    }

    // Check if user is trying to claim their own item
    if (item.createdBy.toString() === req.user.userId) {
      return res.status(400).json({
        message: 'You cannot claim your own item'
      });
    }

    // Check if user has already claimed this item
    const existingClaim = await Claim.findOne({
      item: itemId,
      claimedBy: req.user.userId
    });

    if (existingClaim) {
      return res.status(400).json({
        message: 'You have already submitted a claim for this item'
      });
    }

    // Create new claim
    const claim = new Claim({
      item: itemId,
      claimedBy: req.user.userId,
      message
    });

    await claim.save();
    await claim.populate('claimedBy', 'name email');
    await claim.populate('item', 'title description type');

    res.status(201).json({
      message: 'Claim submitted successfully',
      claim
    });

  } catch (error) {
    console.error('Submit claim error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid item ID'
      });
    }
    res.status(500).json({
      message: 'Server error submitting claim'
    });
  }
});

// Get claims for a specific item (only for item owner)
router.get('/item/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Check if item exists and user owns it
    const item = await Item.findById(itemId);
    if (!item || !item.isActive) {
      return res.status(404).json({
        message: 'Item not found'
      });
    }

    if (item.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        message: 'Not authorized to view claims for this item'
      });
    }

    const claims = await Claim.getItemClaims(itemId);

    res.json(claims);

  } catch (error) {
    console.error('Get item claims error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid item ID'
      });
    }
    res.status(500).json({
      message: 'Server error fetching claims'
    });
  }
});

// Get user's own claims
router.get('/mine', auth, async (req, res) => {
  try {
    const claims = await Claim.getUserClaims(req.user.userId);
    res.json(claims);
  } catch (error) {
    console.error('Get user claims error:', error);
    res.status(500).json({
      message: 'Server error fetching your claims'
    });
  }
});

// Get pending claims for user's items
router.get('/pending', auth, async (req, res) => {
  try {
    const claims = await Claim.getPendingClaimsForUser(req.user.userId);
    // Filter out claims where item is null (item doesn't belong to user)
    const validClaims = claims.filter(claim => claim.item);
    res.json(validClaims);
  } catch (error) {
    console.error('Get pending claims error:', error);
    res.status(500).json({
      message: 'Server error fetching pending claims'
    });
  }
});

// Update claim status (approve/reject)
router.put('/:claimId', auth, [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either "approved" or "rejected"'),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Admin notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { claimId } = req.params;
    const { status, adminNotes } = req.body;

    const claim = await Claim.findById(claimId).populate('item');

    if (!claim) {
      return res.status(404).json({
        message: 'Claim not found'
      });
    }

    // Check if user owns the item
    if (claim.item.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        message: 'Not authorized to update this claim'
      });
    }

    // Check if claim is still pending
    if (claim.status !== 'pending') {
      return res.status(400).json({
        message: 'Claim has already been processed'
      });
    }

    // Update claim
    if (status === 'approved') {
      await claim.approve(req.user.userId);
      // Optionally mark item as resolved when claim is approved
      claim.item.status = 'resolved';
      await claim.item.save();
    } else {
      await claim.reject(req.user.userId, adminNotes);
    }

    await claim.populate('claimedBy', 'name email');
    await claim.populate('resolvedBy', 'name email');

    res.json({
      message: `Claim ${status} successfully`,
      claim
    });

  } catch (error) {
    console.error('Update claim error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid claim ID'
      });
    }
    res.status(500).json({
      message: 'Server error updating claim'
    });
  }
});

// Delete claim (only by claim owner)
router.delete('/:claimId', auth, async (req, res) => {
  try {
    const { claimId } = req.params;

    const claim = await Claim.findById(claimId);

    if (!claim) {
      return res.status(404).json({
        message: 'Claim not found'
      });
    }

    // Check if user owns the claim
    if (claim.claimedBy.toString() !== req.user.userId) {
      return res.status(403).json({
        message: 'Not authorized to delete this claim'
      });
    }

    // Only allow deletion of pending claims
    if (claim.status !== 'pending') {
      return res.status(400).json({
        message: 'Cannot delete processed claims'
      });
    }

    await Claim.findByIdAndDelete(claimId);

    res.json({
      message: 'Claim deleted successfully'
    });

  } catch (error) {
    console.error('Delete claim error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid claim ID'
      });
    }
    res.status(500).json({
      message: 'Server error deleting claim'
    });
  }
});

export default router;