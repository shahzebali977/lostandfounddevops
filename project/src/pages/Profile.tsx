import React, { useState, useEffect } from 'react';
import { User, ChevronDown, ChevronUp, Award, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface UserStats {
  totalReports: number;
  lostItems: number;
  foundItems: number;
  resolvedItems: number;
  successRate: number;
  claims: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

interface Claim {
  _id: string;
  item: {
    _id: string;
    title: string;
    description?: string;
    type: 'lost' | 'found';
    image?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  createdAt: string;
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Initialize empty stats
      let userStats: UserStats = {
        totalReports: 0,
        lostItems: 0,
        foundItems: 0,
        resolvedItems: 0,
        successRate: 0,
        claims: {
          pending: 0,
          approved: 0,
          rejected: 0
        }
      };

      // Get user items
      try {
        const itemsResponse = await axios.get('http://localhost:5000/api/items/user/mine', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (itemsResponse.data && Array.isArray(itemsResponse.data)) {
          const items = itemsResponse.data;
          const lostItems = items.filter(item => item.type === 'lost').length;
          const foundItems = items.filter(item => item.type === 'found').length;
          const resolvedItems = items.filter(item => item.status === 'resolved').length;
          const totalItems = items.length;
          const successRate = totalItems > 0 ? Math.round((resolvedItems / totalItems) * 100) : 0;
          
          userStats = {
            ...userStats,
            totalReports: totalItems,
            lostItems,
            foundItems,
            resolvedItems,
            successRate,
          };

          // Compute badges based on real item data
          const updatedBadges = [];
          
          if (foundItems >= 5) {
            updatedBadges.push({
              id: 'good-samaritan',
              name: 'Good Samaritan',
              description: 'Reported 5+ found items',
              icon: 'award',
              earned: true
            });
          } else {
            updatedBadges.push({
              id: 'good-samaritan',
              name: 'Good Samaritan',
              description: 'Report 5 found items',
              icon: 'award',
              earned: false
            });
          }
          
          if (resolvedItems >= 3) {
            updatedBadges.push({
              id: 'resolver',
              name: 'Problem Solver',
              description: 'Successfully resolved 3+ items',
              icon: 'check-circle',
              earned: true
            });
          } else {
            updatedBadges.push({
              id: 'resolver',
              name: 'Problem Solver',
              description: 'Successfully resolve 3 items',
              icon: 'check-circle',
              earned: false
            });
          }
          
          if (totalItems >= 10) {
            updatedBadges.push({
              id: 'active-reporter',
              name: 'Active Reporter',
              description: 'Submitted 10+ reports',
              icon: 'star',
              earned: true
            });
          } else {
            updatedBadges.push({
              id: 'active-reporter',
              name: 'Active Reporter',
              description: 'Submit 10 reports',
              icon: 'star',
              earned: false
            });
          }
          
          setBadges(updatedBadges);
        }
      } catch (itemsError) {
        console.error('Error fetching user items:', itemsError);
      }
        
      // Get user claims - use the /mine endpoint from your claims routes
      try {
        const claimsResponse = await axios.get('http://localhost:5000/api/claims/mine', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (claimsResponse.data && Array.isArray(claimsResponse.data)) {
          const userClaims = claimsResponse.data;
          setClaims(userClaims);
          
          const pendingClaims = userClaims.filter(claim => claim.status === 'pending').length;
          const approvedClaims = userClaims.filter(claim => claim.status === 'approved').length;
          const rejectedClaims = userClaims.filter(claim => claim.status === 'rejected').length;
          
          userStats = {
            ...userStats,
            claims: {
              pending: pendingClaims,
              approved: approvedClaims,
              rejected: rejectedClaims
            }
          };
        }
      } catch (claimsError) {
        console.error('Error fetching user claims:', claimsError);
      }
      
      setStats(userStats);
      
    } catch (error) {
      console.error('Error setting up profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-16 relative">
            <div className="absolute bottom-0 translate-y-1/2 left-6 flex items-end">
              <div className="bg-white rounded-full p-2 border-4 border-white shadow-lg">
                {/* Always use User icon for now since profile image upload isn't implemented */}
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-12 w-12 text-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 pt-16 pb-6">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'User'}</h1>
              <p className="text-gray-600">{user?.email || 'No email provided'}</p>

              {/* Member Since - Use the user's createdAt property if available */}
              <p className="text-sm text-gray-500">
                Member since {user?.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString() 
                  : new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Statistics Dashboard */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Activity Dashboard</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Reports Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-600">Total Reports</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalReports || 0}</p>
                </div>

                {/* Success Rate Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-600">Success Rate</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.successRate || 0}%</p>
                </div>

                {/* Resolved Items Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-600">Items Resolved</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.resolvedItems || 0}</p>
                </div>
              </div>

              {/* Expandable Statistics Sections */}
              <div className="mt-6 space-y-4">
                {/* Items Breakdown Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <button 
                    className="w-full px-4 py-3 flex justify-between items-center focus:outline-none hover:bg-gray-50"
                    onClick={() => toggleSection('items')}
                  >
                    <div className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-gray-700">Items Breakdown</span>
                    </div>
                    {activeSection === 'items' ? 
                      <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                      <ChevronDown className="h-5 w-5 text-gray-500" />}
                  </button>
                  
                  {activeSection === 'items' && (
                    <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Lost Items</span>
                          <span className="font-medium text-red-600">{stats?.lostItems || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Found Items</span>
                          <span className="font-medium text-green-600">{stats?.foundItems || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Resolved Items</span>
                          <span className="font-medium text-blue-600">{stats?.resolvedItems || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Claims Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <button 
                    className="w-full px-4 py-3 flex justify-between items-center focus:outline-none hover:bg-gray-50"
                    onClick={() => toggleSection('claims')}
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <span className="font-medium text-gray-700">Claims Status</span>
                    </div>
                    {activeSection === 'claims' ? 
                      <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                      <ChevronDown className="h-5 w-5 text-gray-500" />}
                  </button>
                  
                  {activeSection === 'claims' && (
                    <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="space-y-4">
                        {/* Claims Status Summary */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm text-gray-600">Pending</span>
                            </div>
                            <span className="font-medium text-yellow-600">{stats?.claims?.pending || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-600">Approved</span>
                            </div>
                            <span className="font-medium text-green-600">{stats?.claims?.approved || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-gray-600">Rejected</span>
                            </div>
                            <span className="font-medium text-red-600">{stats?.claims?.rejected || 0}</span>
                          </div>
                        </div>
                        
                        {/* Recent Claims List */}
                        {claims.length > 0 && (
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Claims</h4>
                            <div className="space-y-3">
                              {claims.slice(0, 3).map(claim => (
                                <div key={claim._id} className="border border-gray-200 rounded-md p-3 bg-white">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-medium">{claim.item.title}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(claim.createdAt).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                                    </span>
                                  </div>
                                  {/* Show a preview of the claim message */}
                                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                    {claim.message}
                                  </p>
                                </div>
                              ))}
                              
                              {/* Show all claims button */}
                              {claims.length > 3 && (
                                <button 
                                  className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800"
                                  onClick={() => {
                                    // You could add navigation to a full claims page here in the future
                                    toast.success('Viewing all claims will be available soon!');
                                  }}
                                >
                                  View all {claims.length} claims
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Empty state for claims */}
                        {claims.length === 0 && (
                          <div className="text-center py-4">
                            <p className="text-gray-500 text-sm">
                              You haven't made any claims yet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Badges Section */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Achievement Badges</h2>
              
              {badges.length === 0 ? (
                <p className="text-gray-500 italic">No badges yet. Stay active to earn badges!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className={`border rounded-lg p-4 flex flex-col items-center text-center ${
                        badge.earned 
                          ? 'bg-gradient-to-b from-yellow-50 to-amber-100 border-amber-200' 
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className={`${
                        badge.earned
                          ? 'bg-yellow-100 text-amber-700 border-amber-200'
                          : 'bg-gray-100 text-gray-400 border-gray-200'
                        } rounded-full p-3 mb-3 border`
                      }>
                        <Award className="h-6 w-6" />
                      </div>
                      <h3 className="font-medium text-gray-800">{badge.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                      {!badge.earned && (
                        <span className="mt-2 text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};