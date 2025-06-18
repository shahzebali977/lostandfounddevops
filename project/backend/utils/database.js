import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Database aggregation queries for analytics
export const getItemStats = async () => {
  try {
    const stats = await mongoose.model('Item').aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          lostItems: {
            $sum: { $cond: [{ $eq: ['$type', 'lost'] }, 1, 0] }
          },
          foundItems: {
            $sum: { $cond: [{ $eq: ['$type', 'found'] }, 1, 0] }
          },
          resolvedItems: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      }
    ]);

    return stats[0] || {
      totalItems: 0,
      lostItems: 0,
      foundItems: 0,
      resolvedItems: 0
    };
  } catch (error) {
    console.error('Error getting item stats:', error);
    throw error;
  }
};

export const getItemsByLocation = async () => {
  try {
    const locationStats = await mongoose.model('Item').aggregate([
      {
        $match: { isActive: true, status: 'active' }
      },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
          lostCount: {
            $sum: { $cond: [{ $eq: ['$type', 'lost'] }, 1, 0] }
          },
          foundCount: {
            $sum: { $cond: [{ $eq: ['$type', 'found'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return locationStats;
  } catch (error) {
    console.error('Error getting location stats:', error);
    throw error;
  }
};

export const getItemsByCategory = async () => {
  try {
    const categoryStats = await mongoose.model('Item').aggregate([
      {
        $match: { isActive: true, status: 'active' }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          lostCount: {
            $sum: { $cond: [{ $eq: ['$type', 'lost'] }, 1, 0] }
          },
          foundCount: {
            $sum: { $cond: [{ $eq: ['$type', 'found'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return categoryStats;
  } catch (error) {
    console.error('Error getting category stats:', error);
    throw error;
  }
};

export const getRecentActivity = async (limit = 10) => {
  try {
    const recentItems = await mongoose.model('Item').find({
      isActive: true
    })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('title type location createdAt createdBy');

    return recentItems;
  } catch (error) {
    console.error('Error getting recent activity:', error);
    throw error;
  }
};