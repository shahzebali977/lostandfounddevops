import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import Item from '../models/Item.js';

const router = express.Router();

// Get all items with filters
router.get('/', [
  query('type').optional().isIn(['lost', 'found', 'all']),
  query('category').optional().isIn(['Electronics', 'Clothing', 'Accessories', 'Keys', 'Documents', 'Bags', 'Sports', 'Other', 'all']),
  query('location').optional().isString().trim(),
  query('search').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const {
      type = 'all',
      category = 'all',
      location,
      search,
      page = 1,
      limit = 20,
      dateFrom,
      dateTo
    } = req.query;

    const filters = {
      type: type !== 'all' ? type : undefined,
      category: category !== 'all' ? category : undefined,
      location,
      search,
      dateFrom,
      dateTo
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const items = await Item.getFilteredItems(filters)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Item.countDocuments({
      isActive: true,
      status: 'active',
      ...(filters.type && { type: filters.type }),
      ...(filters.category && { category: filters.category }),
      ...(filters.location && { location: { $regex: filters.location, $options: 'i' } }),
      ...(filters.search && { $text: { $search: filters.search } }),
      ...(filters.dateFrom || filters.dateTo) && {
        date: {
          ...(filters.dateFrom && { $gte: new Date(filters.dateFrom) }),
          ...(filters.dateTo && { $lte: new Date(filters.dateTo) })
        }
      }
    });

    res.json({
      items,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      message: 'Server error fetching items'
    });
  }
});

// Get user's own items
router.get('/user/mine', auth, async (req, res) => {
  try {
    const items = await Item.getUserItems(req.user.userId);
    res.json(items);
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({
      message: 'Server error fetching your items'
    });
  }
});

// Get single item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('claimsCount');

    if (!item || !item.isActive) {
      return res.status(404).json({
        message: 'Item not found'
      });
    }

    // Increment view count
    await item.incrementViews();

    res.json(item);
  } catch (error) {
    console.error('Get item error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid item ID'
      });
    }
    res.status(500).json({
      message: 'Server error fetching item'
    });
  }
});

// Create new item with image upload
router.post('/', auth, upload.single('image'), [
  body('title').notEmpty().trim().isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description').notEmpty().trim().isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('type').isIn(['lost', 'found'])
    .withMessage('Type must be either "lost" or "found"'),
  body('category').isIn(['Electronics', 'Clothing', 'Accessories', 'Keys', 'Documents', 'Bags', 'Sports', 'Other'])
    .withMessage('Invalid category'),
  body('location').notEmpty().trim()
    .withMessage('Location is required'),
  body('date').isDate()
    .withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false, 
        errors: errors.array()
      });
    }

    const { title, description, type, category, location, date, contactInfo } = req.body;
    
    console.log('Creating item with data:', {
      title,
      type,
      category,
      hasImage: req.file ? 'Yes' : 'No'
    });
    
    if (req.file) {
      console.log('Image uploaded to Cloudinary:', req.file);
    }

    // Create the item object
    const itemData = {
      title,
      description,
      type,
      category,
      location,
      date,
      contactInfo,
      createdBy: req.user.userId,
      status: 'active'
    };

    // Add image URL if uploaded
    if (req.file) {
      // For Cloudinary, the path or secure_url contains the URL
      itemData.image = req.file.path || req.file.secure_url;
      console.log('Saving image URL:', itemData.image);
    }

    // Create and save the new item
    const newItem = new Item(itemData);
    await newItem.save();

    return res.status(201).json({
      success: true,
      item: newItem
    });
  } catch (error) {
    console.error('Error creating item:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating item',
      error: error.message
    });
  }
});

// Update item
router.put('/:id', auth, upload.single('image'), [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .optional()
    .isIn(['Electronics', 'Clothing', 'Accessories', 'Keys', 'Documents', 'Bags', 'Sports', 'Other'])
    .withMessage('Invalid category'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Location must be between 3 and 200 characters'),
  body('contactInfo')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Contact info cannot exceed 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const item = await Item.findById(req.params.id);

    if (!item || !item.isActive) {
      return res.status(404).json({
        message: 'Item not found'
      });
    }

    // Check if user owns the item
    if (item.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        message: 'Not authorized to update this item'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'category', 'location', 'contactInfo'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    // Update image if uploaded
    if (req.file) {
      item.image = req.file.path;
    }

    await item.save();
    await item.populate('createdBy', 'name email');

    res.json({
      message: 'Item updated successfully',
      item
    });

  } catch (error) {
    console.error('Update item error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid item ID'
      });
    }
    res.status(500).json({
      message: 'Server error updating item'
    });
  }
});

// Delete item (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item || !item.isActive) {
      return res.status(404).json({
        message: 'Item not found'
      });
    }

    // Check if user owns the item
    if (item.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        message: 'Not authorized to delete this item'
      });
    }

    // Soft delete
    item.isActive = false;
    await item.save();

    res.json({
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Delete item error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid item ID'
      });
    }
    res.status(500).json({
      message: 'Server error deleting item'
    });
  }
});

// Mark item as resolved
router.patch('/:id/resolve', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item || !item.isActive) {
      return res.status(404).json({
        message: 'Item not found'
      });
    }

    // Check if user owns the item
    if (item.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        message: 'Not authorized to resolve this item'
      });
    }

    item.status = 'resolved';
    await item.save();

    res.json({
      message: 'Item marked as resolved',
      item
    });

  } catch (error) {
    console.error('Resolve item error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid item ID'
      });
    }
    res.status(500).json({
      message: 'Server error resolving item'
    });
  }
});

export default router;