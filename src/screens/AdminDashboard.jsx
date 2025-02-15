import { useState, useEffect } from 'react';
import { useRegisterMutation } from '../slices/usersApiSlice';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import AdminUserCreate from './AdminUserCreate';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaTrash, FaSearch, FaSync } from 'react-icons/fa';

const AdminDashboard = () => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('student');
  const [success, setSuccess] = useState('');
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminComment, setAdminComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [processingType, setProcessingType] = useState(null);
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [register, { isLoading }] = useRegisterMutation();

  // Add backend URL
  const BACKEND_URL = 'https://backdeploy-9bze.onrender.com';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, statsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/requests`, { withCredentials: true }),
        axios.get(`${BACKEND_URL}/api/admin/dashboard`, { withCredentials: true })
      ]);
      setRequests(requestsRes.data);
      setStats(statsRes.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/users/create`,
        {
          name,
          email,
          password,
          userType
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        toast.success(`Successfully created ${userType} account`);
        
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
        setUserType('student');
        
        // Refresh users list
        await fetchUsers();
        setActiveTab('users');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'Failed to create user';
      toast.error(errorMessage);
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setAdminComment('Approved by admin');
    setShowModal(true);
    setProcessingType('approve');
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setAdminComment('');
    setShowModal(true);
    setProcessingType('reject');
  };

  // Handle request status update (for exam requests)
  const handleRequestStatusUpdate = async () => {  
    if (!selectedRequest) return;

    setActionLoading(true);
    const status = processingType === 'approve' ? 'approved' : 'rejected';
    setProcessingStatus(status === 'approved' ? 'Encrypting and uploading to IPFS...' : 'Processing request...');

    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/requests/${selectedRequest._id}`,
        {
          status,
          adminComment
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (response.data) {
        setRequests(requests.map(req =>
          req._id === selectedRequest._id
            ? {
                ...req,
                status: response.data.status,
                ipfsHash: response.data.ipfsHash,
                ipfsEncryptionKey: response.data.ipfsEncryptionKey
              }
            : req
        ));

        if (status === 'approved' && response.data.ipfsHash) {
          toast.success(`Request approved and uploaded to IPFS\nHash: ${response.data.ipfsHash.slice(0, 10)}...`);
        } else {
          toast.success(`Request ${status} successfully`);
        }

        await fetchData();
        setShowModal(false);
        setSelectedRequest(null);
        setAdminComment('');
        setProcessingType(null);
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.response?.data?.message || `Failed to ${status} request`);
    } finally {
      setActionLoading(false);
      setProcessingStatus('');
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setUserLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/users`, {
        withCredentials: true
      });
      
      if (response.data) {
        setUsers(response.data);
        setFilteredUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
      setUserError('Failed to fetch users');
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (users) {
      setFilteredUsers(
        users.filter(user => 
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.userType.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [users, searchTerm]);

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(
          `${BACKEND_URL}/api/admin/users/${userId}`,
          { withCredentials: true }
        );
        fetchUsers(); // Refresh user list
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  // Add refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'pending':
        return (
          <span className={`${baseClasses} ${
            isDarkMode 
              ? 'bg-yellow-900/20 text-yellow-300' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className={`${baseClasses} ${
            isDarkMode 
              ? 'bg-green-900/20 text-green-300' 
              : 'bg-green-100 text-green-800'
          }`}>
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className={`${baseClasses} ${
            isDarkMode 
              ? 'bg-red-900/20 text-red-300' 
              : 'bg-red-100 text-red-800'
          }`}>
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  console.log('Current requests:', requests);
  console.log('Current stats:', stats);

  return (
    <div className={`min-h-screen pt-28 p-4 transition-none ${isDarkMode ? 'bg-[#0A0F1C] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Stats Cards - Adjusted z-index */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-0">
        <div className={`p-4 rounded-lg shadow-md transition-none ${
          isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
        }`}>
          <h3 className="text-lg font-semibold mb-2">Total Requests</h3>
          <p className="text-3xl font-bold">{stats?.totalRequests || 0}</p>
        </div>
        <div className={`p-4 rounded-lg shadow-md ${
          isDarkMode ? 'bg-[#1a1f2e] text-white' : 'bg-white text-gray-900'
        }`}>
          <h3 className="text-lg font-semibold mb-2">Pending Requests</h3>
          <p className="text-3xl font-bold">{stats?.pendingRequests || 0}</p>
        </div>
        <div className={`p-4 rounded-lg shadow-md ${
          isDarkMode ? 'bg-[#1a1f2e] text-white' : 'bg-white text-gray-900'
        }`}>
          <h3 className="text-lg font-semibold mb-2">Approved Requests</h3>
          <p className="text-3xl font-bold">{stats?.approvedRequests || 0}</p>
        </div>
      </div>

      {/* Tab Navigation - Adjusted z-index */}
      <div className="mb-6 relative z-0">
        <div className={`flex space-x-4 border-b transition-none ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-medium transition-none ${
              activeTab === 'dashboard'
                ? isDarkMode
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-violet-600 border-b-2 border-violet-600'
                : isDarkMode
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Exam Requests
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-none ${
              activeTab === 'users'
                ? isDarkMode
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-violet-600 border-b-2 border-violet-600'
                : isDarkMode
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Manage Users
          </button>
        </div>
      </div>

      {/* Content Area - Adjusted z-index and margin */}
      {activeTab === 'dashboard' ? (
        <div className={`rounded-lg shadow-md overflow-hidden relative z-0 mt-4 ${
          isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
        }`}>
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className={`text-2xl font-bold ${
              isDarkMode ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'
            }`}>
              Exam Requests
            </h2>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-[#2a2f3e] hover:bg-[#3a3f4e] text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh requests"
            >
              <FaSync className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                isDarkMode ? 'border-violet-400' : 'border-violet-600'
              }`}></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-6">{error}</div>
          ) : requests.length === 0 ? (
            <div className={`text-center p-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No pending requests
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'}>
                  <tr>
                    {['Exam Name', 'Institute', 'Status', 'Questions', 'Date', 'Actions'].map((header) => (
                      <th key={header} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                }`}>
                  {requests.map((request) => (
                    <tr key={request._id} className={
                      isDarkMode ? 'hover:bg-[#2a2f3e]' : 'hover:bg-gray-50'
                    }>
                      <td className="px-6 py-4 whitespace-nowrap">{request.examName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{request.institute?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{request.totalQuestions}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprove(request)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Create User Form */}
          <div className="w-full lg:w-[400px]">
            <div className={`rounded-lg shadow-md ${
              isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
            }`}>
              <div className="p-4 lg:p-6">
                <h2 className={`text-xl font-semibold mb-6 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Create New User</h2>
                <AdminUserCreate onUserCreated={fetchUsers} />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="flex-1">
            <div className={`rounded-lg shadow-md ${
              isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
            }`}>
              <div className="p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className={`text-xl font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>User List</h2>
                  <div className="relative w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search by email or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 pr-4 py-2 rounded-lg w-full sm:w-72 ${
                        isDarkMode 
                          ? 'bg-[#2a2f3e] text-white border-gray-700' 
                          : 'bg-white text-gray-900 border-gray-300'
                      } border focus:outline-none focus:ring-1 focus:ring-violet-500`}
                    />
                    <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  </div>
                </div>
                
                {userLoading ? (
                  <div className="flex justify-center items-center p-4">
                    <Loader />
                  </div>
                ) : userError ? (
                  <div className="text-red-500 p-4">{userError}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'}`}>
                            <tr>
                              {['Name', 'Email', 'Type', 'Status', 'Actions'].map((header) => (
                                <th key={header} className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${
                            isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                          }`}>
                            {filteredUsers.map((user) => (
                              <tr key={user._id} className={`${
                                isDarkMode 
                                  ? 'hover:bg-[#2a2f3e] text-gray-200' 
                                  : 'hover:bg-gray-50 text-gray-900'
                              }`}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{user.name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{user.email}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm capitalize">{user.userType}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    user.isActive
                                      ? 'bg-green-500 text-white'
                                      : 'bg-red-500 text-white'
                                  }`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <button
                                    onClick={() => handleDeleteUser(user._id)}
                                    className={`p-1.5 rounded-full ${
                                      isDarkMode 
                                        ? 'hover:bg-[#3a3f4e] text-red-400' 
                                        : 'hover:bg-gray-100 text-red-500'
                                    }`}
                                  >
                                    <FaTrash className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${
              isDarkMode 
                ? 'bg-[#1a1f2e] text-white' 
                : 'bg-white text-gray-900'
            } rounded-lg max-w-md w-full shadow-xl`}
          >
            <div className={`flex justify-between items-center p-6 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className="text-lg font-medium">
                {processingType === 'approve' ? 'Approve' : 'Reject'} Request
              </h3>
              {!actionLoading && (
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Admin Comment
                </label>
                <textarea
                  rows={3}
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  disabled={actionLoading}
                  className={`w-full px-3 py-2 rounded-lg shadow-sm ${
                    isDarkMode 
                      ? 'bg-[#2a2f3e] border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {actionLoading && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-500"></div>
                  <span>{processingStatus}</span>
                </div>
              )}
            </div>

            <div className={`px-6 py-4 flex justify-end space-x-3 ${
              isDarkMode ? 'bg-[#2a2f3e]' : 'bg-gray-50'
            }`}>
              <button
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestStatusUpdate}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-violet-600 text-white hover:bg-violet-700' 
                    : 'bg-violet-500 text-white hover:bg-violet-600'
                }`}
              >
                {processingType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;