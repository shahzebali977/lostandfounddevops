import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, MapPin, Calendar, User, MessageSquare, 
  Share2, Mail, AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Item {
  _id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  category: string;
  location: string;
  date: string;
  image?: string;
  contactInfo?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export const ItemDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/items/${id}`);
        setItem(response.data);
      } catch (error) {
        console.error('Error fetching item details:', error);
        toast.error('Failed to load item details');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchItem();
  }, [id, navigate]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h1>
            <p className="text-gray-600 mb-6">
              The item you're looking for doesn't exist or has been removed.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if current user is the item owner
  const isOwner = user && user.userId === item.createdBy._id;
  
  // Check if the item is a "found" item that can be claimed
  const canBeClaimed = item.type === 'found' && !isOwner;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg overflow-hidden">
          {/* Item image */}
          {item.image && (
            <div className="h-64 sm:h-80 w-full">
              <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Item details */}
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                item.type === 'lost' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {item.type === 'lost' ? 'LOST' : 'FOUND'}
              </span>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-1">Category: {item.category}</div>
              <p className="text-gray-600">{item.description}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                <span>Location: {item.location}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                <span>Date: {format(new Date(item.date), 'MMMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                <span>Posted by: {item.createdBy.name}</span>
              </div>
            </div>
            
            {/* Contact Information */}
            {item.contactInfo && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Contact Information:</h3>
                <p className="text-blue-800 text-sm">{item.contactInfo}</p>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {/* Share button - visible to everyone */}
              <button
                onClick={handleShare}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
              
              {/* Contact button - visible to everyone */}
              <a
                href={`mailto:${item.createdBy.email}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact
              </a>

              {/* Claim button - only visible if item is FOUND and viewer is NOT the owner */}
              {canBeClaimed && (
                <Link
                  to={`/claim/${item._id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Claim This Item
                </Link>
              )}
              
              {/* Owner-specific actions */}
              {isOwner && (
                <>
                  {/* Add owner-specific buttons here like edit/delete */}
                  <button
                    onClick={() => navigate(`/item/${item._id}/edit`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    Edit Item
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};