import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Upload, MapPin, Calendar, Tag, FileText } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ReportForm {
  title: string;
  description: string;
  type: 'lost' | 'found';
  category: string;
  location: string;
  date: string;
  contactInfo: string;
}

export const ReportItem: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ReportForm>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categories = ['Electronics', 'Clothing', 'Accessories', 'Keys', 'Documents', 'Bags', 'Sports', 'Other'];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ReportForm) => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to report an item');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Add image if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
        console.log('Image being uploaded:', {
          name: selectedImage.name,
          type: selectedImage.type,
          size: `${(selectedImage.size / 1024).toFixed(2)} KB`
        });
      }

      console.log('Submitting report with data:', {
        title: data.title,
        type: data.type,
        category: data.category,
        hasImage: selectedImage ? 'Yes' : 'No'
      });

      // Send the request
      const response = await axios.post('http://localhost:5000/api/items', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Report submitted successfully:', response.data);
      toast.success('Item reported successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error reporting item:', error);
      
      const errorDetail = {
        message: error.response?.data?.message || 'Unknown error',
        status: error.response?.status,
        data: error.response?.data
      };
      
      console.error('Error details:', errorDetail);
      
      toast.error(errorDetail.message || 'Failed to report item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Report an Item</h1>
          <p className="mt-2 text-gray-600">
            Help reunite people with their belongings by reporting lost or found items
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Item Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What are you reporting?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`relative ${errors.type ? 'border-red-500' : ''}`}>
                  <input
                    {...register('type', { required: 'Please select a type' })}
                    type="radio"
                    value="lost"
                    className="sr-only peer"
                  />
                  <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                    <div className="text-center">
                      <div className="text-red-500 mb-2">📱</div>
                      <div className="font-medium">Lost Item</div>
                      <div className="text-sm text-gray-500">I lost something</div>
                    </div>
                  </div>
                </label>
                <label className="relative">
                  <input
                    {...register('type', { required: 'Please select a type' })}
                    type="radio"
                    value="found"
                    className="sr-only peer"
                  />
                  <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 peer-checked:border-blue-500 peer-checked:bg-blue-50">
                    <div className="text-center">
                      <div className="text-green-500 mb-2">🔍</div>
                      <div className="font-medium">Found Item</div>
                      <div className="text-sm text-gray-500">I found something</div>
                    </div>
                  </div>
                </label>
              </div>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Item Title
              </label>
              <div className="mt-1 relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('title', { 
                    required: 'Title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' },
                    maxLength: { value: 100, message: 'Title cannot exceed 100 characters' }
                  })}
                  type="text"
                  className={`pl-10 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
                    errors.title ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="e.g., Black iPhone 13, Red backpack"
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
                  errors.category ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <div className="mt-1 relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  {...register('description', { 
                    required: 'Description is required',
                    minLength: { value: 10, message: 'Description must be at least 10 characters' },
                    maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' }
                  })}
                  rows={4}
                  className={`pl-10 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
                    errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="Provide detailed description including color, brand, distinguishing features..."
                />
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <div className="mt-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('location', { 
                    required: 'Location is required',
                    minLength: { value: 3, message: 'Location must be at least 3 characters' },
                    maxLength: { value: 200, message: 'Location cannot exceed 200 characters' }
                  })}
                  type="text"
                  className={`pl-10 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
                    errors.location ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="e.g., Central Park, Main Street, University Library"
                />
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date (Lost/Found)
              </label>
              <div className="mt-1 relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('date', { required: 'Date is required' })}
                  type="date"
                  className={`pl-10 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
                    errors.date ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Contact Info */}
            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">
                Contact Information
              </label>
              <input
                {...register('contactInfo', {
                  maxLength: { value: 200, message: 'Contact info cannot exceed 200 characters' }
                })}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Phone number or additional contact info (optional)"
              />
              {errors.contactInfo && (
                <p className="mt-1 text-sm text-red-600">{errors.contactInfo.message}</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="mb-4">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="mx-auto h-32 w-32 object-cover rounded-md"
                      />
                    </div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  )}
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>{imagePreview ? 'Change image' : 'Upload a file'}</span>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageChange}
                      />
                    </label>
                    {!imagePreview && <p className="pl-1">or drag and drop</p>}
                  </div>
                  {!imagePreview && (
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Reporting...' : 'Report Item'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};