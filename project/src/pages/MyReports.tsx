import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Edit, Trash2, Eye, Calendar, MapPin, MessageSquare } from 'lucide-react';
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
  createdAt: string;
  claimsCount?: number;
}

export const MyReports: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyItems();
  }, []);

  const fetchMyItems = async () => {
    try {
      const response = await axios.get('/items/mine');
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to fetch your reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await axios.delete(`/items/${itemId}`);
      setItems(items.filter(item => item._id !== itemId));
      toast.success('Report deleted successfully');
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
          <p className="mt-2 text-gray-600">
            Manage your lost and found item reports
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
            <p className="text-gray-600 mb-4">You haven't reported any items yet.</p>
            <Link
              to="/report"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Report Your First Item
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <div key={item._id} className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.type === 'lost' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.type.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4">{item.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {item.location}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(item.date), 'MMM dd, yyyy')}
                        </div>
                        {item.claimsCount && item.claimsCount > 0 && (
                          <div className="flex items-center text-blue-600">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {item.claimsCount} claim{item.claimsCount > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-24 h-24 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Reported on {format(new Date(item.createdAt), 'MMM dd, yyyy')}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/item/${item._id}`}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      <button
                        onClick={() => {/* TODO: Implement edit functionality */}}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};