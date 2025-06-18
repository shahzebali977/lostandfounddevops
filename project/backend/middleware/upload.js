import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

console.log('Cloudinary Configuration Check:');
console.log('- CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set ✓' : 'Missing ✗');
console.log('- API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set ✓' : 'Missing ✗');
console.log('- API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set ✓' : 'Missing ✗');

// Configure Cloudinary with explicit values from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test the Cloudinary connection
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error('⚠️ Cloudinary connection failed:', error.message);
  } else {
    console.log('✅ Cloudinary connected successfully');
  }
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lost-found',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  }
});

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Error handling middleware for multer and Cloudinary
export const handleUploadError = (error, req, res, next) => {
  console.error('Upload error occurred:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message
    });
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed'
    });
  }
  
  if (error.message && (error.message.includes('Cloudinary') || error.http_code)) {
    console.error('Cloudinary error details:', error);
    return res.status(500).json({
      success: false,
      message: 'Image upload service error. Please try again later.',
      details: error.message
    });
  }
  
  next(error);
};