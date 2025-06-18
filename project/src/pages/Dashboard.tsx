import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, MapPin, Calendar, Eye, Plus } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Item {
  _id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  category: string;
  location: string;
  date: string;
  image?: string;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export const Dashboard: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'browse' | 'myItems'>('browse');

  const categories = ['Electronics', 'Clothing', 'Accessories', 'Keys', 'Documents', 'Bags', 'Sports', 'Other'];

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchItems();
    } else {
      fetchMyItems();
    }
  }, [activeTab]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      // Fix API endpoint - add /api prefix
      const response = await axios.get('http://localhost:5000/api/items');
      // Handle pagination response structure
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyItems = async () => {
    try {
      setLoading(true);
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view your items');
        setActiveTab('browse');
        return;
      }
      
      // Get the user's profile first to have their name available
      const userResponse = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const user = userResponse.data.user;
      
      // Now fetch the user's items
      const itemsResponse = await axios.get('http://localhost:5000/api/items/user/mine', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Add the user's info to each item if createdBy is missing
      const itemsWithUser = (itemsResponse.data || []).map(item => {
        if (!item.createdBy || !item.createdBy.name) {
          return {
            ...item,
            createdBy: {
              name: user.name,
              email: user.email,
              _id: user._id
            }
          };
        }
        return item;
      });
      
      setItems(itemsWithUser);
    } catch (error) {
      console.error('Error fetching your items:', error);
      toast.error('Failed to fetch your items');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Lost & Found Items</h1>
            <Link
              to="/report"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Report Item
            </Link>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex border-b">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'browse' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('browse')}
            >
              Browse All Items
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'myItems' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('myItems')}
            >
              My Reports
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'all' | 'lost' | 'found')}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="lost">Lost Items</option>
                <option value="found">Found Items</option>
              </select>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <div className="text-sm text-gray-600 flex items-center">
                <Filter className="h-4 w-4 mr-1" />
                {filteredItems.length} items found
              </div>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item._id} className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.type === 'lost' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item.type.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {item.location}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {format(new Date(item.date), 'MMM dd, yyyy')}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    By {item.createdBy?.name || 'Anonymous'}
                  </span>
                  <Link
                    to={`/item/${item._id}`}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">
              {activeTab === 'browse' ? 'Try adjusting your search filters.' : 'You haven\'t reported any items yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};