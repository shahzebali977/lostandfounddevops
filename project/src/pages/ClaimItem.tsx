import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface Item {
  _id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  location: string;
  date: string;
  image?: string;
  createdBy: {
    name: string;
  };
}

interface ClaimForm {
  message: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const ClaimItem: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<ClaimForm>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchItemDetails = useCallback(async () => {
    try {
      if (!id) return;
      const response = await axios.get(`http://localhost:5000/api/items/${id}`);
      setItem(response.data);
    } catch (err) {
      toast.error('Failed to fetch item details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchItemDetails();
  }, [fetchItemDetails]);

  const onSubmit = async (data: ClaimForm) => {
    if (!id) return;
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to submit a claim');
        navigate('/login');
        return;
      }
      
      await axios.post(`http://localhost:5000/api/claims/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Claim submitted successfully! The owner will be notified.');
      navigate(`/item/${id}`);
    } catch (err) {
      // Type cast to avoid 'any'
      const apiError = err as ApiError;
      toast.error(apiError.response?.data?.message || 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Claim This Item</h1>
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-start space-x-4">
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                )}
                <div>
                  <h2 className="font-semibold text-lg text-gray-900">{item.title}</h2>
                  <p className="text-gray-600 text-sm">
                    {item.description?.substring(0, 100) || ''}
                    {item.description?.length > 100 ? '...' : ''}
                  </p>
                  <div className="text-sm text-gray-500 mt-2">
                    Found by: {item.createdBy?.name || 'Anonymous'}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Explain why you believe this item belongs to you. Please provide specific details that would help the finder verify your claim.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Your message to the finder
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    {...register('message', {
                      required: 'Message is required',
                      minLength: {
                        value: 20,
                        message: 'Message must be at least 20 characters'
                      },
                      maxLength: {
                        value: 1000,
                        message: 'Message cannot exceed 1000 characters'
                      }
                    })}
                    rows={6}
                    className={`pl-10 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
                      errors.message ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Describe details about the item that only the owner would know..."
                  />
                </div>
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">Important Note:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your contact information will be shared with the item finder</li>
                  <li>False claims may result in account restrictions</li>
                  <li>Be specific and honest in your description</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};