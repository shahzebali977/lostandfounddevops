# Lost and Found Web Application

A full-stack MERN application for reporting and finding lost items in your community.

## Features

### User Features
- **User Authentication**: Secure registration and login with JWT tokens
- **Report Items**: Report lost or found items with detailed descriptions and images
- **Browse & Search**: Advanced filtering by type, category, location, and date
- **Claims System**: Submit claims for found items with verification process
- **Personal Dashboard**: Manage your own reports and track claims
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Technical Features
- **Modern UI**: Beautiful, production-ready interface with Tailwind CSS
- **Image Upload**: Cloudinary integration for secure image storage
- **Real-time Updates**: Toast notifications for user feedback
- **Form Validation**: Comprehensive client and server-side validation
- **Security**: JWT authentication, rate limiting, and input sanitization
- **Database**: MongoDB with Mongoose ODM and optimized queries
- **API Documentation**: RESTful API with comprehensive error handling

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Date-fns** for date formatting

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Multer** + **Cloudinary** for image uploads
- **Express Validator** for input validation
- **Helmet** for security headers
- **Morgan** for logging
- **Rate Limiting** for API protection

## Database Schema

### Collections

#### Users
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, validated),
  password: String (required, hashed, min 6 chars),
  role: String (enum: ['user', 'admin'], default: 'user'),
  isActive: Boolean (default: true),
  lastLogin: Date,
  profilePicture: String (URL),
  phone: String,
  timestamps: true
}
```

#### Items
```javascript
{
  title: String (required, 3-100 chars),
  description: String (required, 10-1000 chars),
  type: String (enum: ['lost', 'found'], required),
  category: String (enum: categories, required),
  location: String (required, 3-200 chars),
  date: Date (required, not future),
  image: String (Cloudinary URL),
  contactInfo: String (optional, max 200 chars),
  createdBy: ObjectId (ref: User, required),
  status: String (enum: ['active', 'resolved', 'archived'], default: 'active'),
  isActive: Boolean (default: true),
  views: Number (default: 0),
  tags: [String],
  timestamps: true
}
```

#### Claims
```javascript
{
  item: ObjectId (ref: Item, required),
  claimedBy: ObjectId (ref: User, required),
  message: String (required, 20-1000 chars),
  status: String (enum: ['pending', 'approved', 'rejected'], default: 'pending'),
  adminNotes: String (optional, max 500 chars),
  resolvedAt: Date,
  resolvedBy: ObjectId (ref: User),
  timestamps: true
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Items
- `GET /api/items` - Get all items with filters
- `GET /api/items/:id` - Get single item
- `GET /api/items/user/mine` - Get user's items
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item (soft delete)
- `PATCH /api/items/:id/resolve` - Mark item as resolved

### Claims
- `POST /api/claims/:itemId` - Submit claim
- `GET /api/claims/item/:itemId` - Get claims for item (owner only)
- `GET /api/claims/mine` - Get user's claims
- `GET /api/claims/pending` - Get pending claims for user's items
- `PUT /api/claims/:claimId` - Update claim status
- `DELETE /api/claims/:claimId` - Delete claim

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables:
   ```env
   MONGODB_URI=mongodb://localhost:27017/lostfound
   JWT_SECRET=your-super-secret-jwt-key
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Testing Strategy

The application is designed to support comprehensive testing with the following test cases:

### Authentication Tests (10+ cases)
1. **Register user successfully** - Valid user data
2. **Reject duplicate email registration** - Email already exists
3. **Login with correct credentials** - Valid email/password
4. **Login failure on wrong password** - Invalid password
5. **Login failure on non-existent user** - Email not found
6. **Token verification success** - Valid JWT token
7. **Token verification failure** - Invalid/expired token
8. **Profile update success** - Valid profile data
9. **Profile update validation** - Invalid data
10. **Password validation** - Minimum length requirements

### Items Tests (15+ cases)
1. **Add new lost item** - Valid item data
2. **Add new found item** - Valid item data
3. **Prevent report without auth** - No JWT token
4. **Get all items successfully** - Public endpoint
5. **Get items with filters** - Type, category, location filters
6. **Get single item by ID** - Valid item ID
7. **Get user's own items** - Authenticated user
8. **Update item successfully** - Item owner
9. **Prevent update by non-owner** - Different user
10. **Delete item successfully** - Item owner (soft delete)
11. **Prevent delete by non-owner** - Different user
12. **Mark item as resolved** - Item owner
13. **Image upload validation** - File type/size limits
14. **Search functionality** - Text search
15. **Pagination testing** - Large datasets

### Claims Tests (12+ cases)
1. **Submit claim to existing item** - Valid claim data
2. **Prevent claim on own item** - Item owner restriction
3. **Prevent duplicate claims** - Same user, same item
4. **Get claims for item** - Item owner only
5. **Approve claim successfully** - Item owner
6. **Reject claim successfully** - Item owner
7. **Get user's own claims** - Authenticated user
8. **Get pending claims** - Item owner
9. **Prevent claim status update by non-owner** - Different user
10. **Delete pending claim** - Claim owner
11. **Prevent delete of processed claim** - Status validation
12. **Claim message validation** - Length requirements

### Integration Tests
- **End-to-end user flow** - Register → Report → Claim → Resolve
- **Database operations** - CRUD operations with proper relationships
- **File upload flow** - Image upload and storage
- **Authentication flow** - Login → Protected routes → Logout

## Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcryptjs with salt rounds
- **Input Validation** on both client and server
- **Rate Limiting** to prevent API abuse
- **CORS Configuration** for cross-origin requests
- **Helmet.js** for security headers
- **File Upload Security** with type and size validation
- **SQL Injection Prevention** through Mongoose ODM
- **XSS Protection** through input sanitization

## Performance Optimizations

- **Database Indexing** for frequently queried fields
- **Image Optimization** through Cloudinary transformations
- **Pagination** for large datasets
- **Lazy Loading** for images
- **Caching** strategies for static content
- **Compression** for API responses
- **Connection Pooling** for database connections

## Deployment Considerations

### Environment Variables
- Separate configurations for development, staging, and production
- Secure storage of sensitive credentials
- Environment-specific database connections

### Database
- MongoDB Atlas for production
- Proper backup and recovery strategies
- Database monitoring and alerting

### File Storage
- Cloudinary for image hosting and optimization
- CDN integration for faster delivery
- Automatic image transformations

### Security
- HTTPS enforcement
- Environment variable security
- Regular security audits
- Dependency vulnerability scanning

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.