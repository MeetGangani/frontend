import { useState, useEffect } from 'react';
import { useRegisterMutation } from '../slices/usersApiSlice';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import AdminUserCreate from './AdminUserCreate';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('student');
  const [success, setSuccess] = useState('');
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminComment, setAdminComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [processingType, setProcessingType] = useState(null);

  const [register, { isLoading }] = useRegisterMutation();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch requests
      const requestsResponse = await axios.get('/api/admin/requests', {
        withCredentials: true
      });
      console.log('Fetched requests:', requestsResponse.data); // Debug log
      setRequests(Array.isArray(requestsResponse.data) ? requestsResponse.data : []);

      // Fetch stats
      const statsResponse = await axios.get('/api/admin/dashboard', {
        withCredentials: true
      });
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await register({ 
        name, 
        email, 
        password,
        userType
      }).unwrap();
      
      setSuccess(`Successfully created ${userType} account`);
      setName('');
      setEmail('');
      setPassword('');
      setUserType('student');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
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

  const handleStatusUpdate = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    const status = processingType === 'approve' ? 'approved' : 'rejected';
    setProcessingStatus('Initiating process...');

    try {
      if (processingType === 'approve') {
        setProcessingStatus('Encrypting and uploading to IPFS...');
      } else {
        setProcessingStatus('Processing rejection...');
      }
      
      const response = await axios.put(`/api/admin/requests/${selectedRequest._id}`, {
        status,
        adminComment
      });

      setProcessingStatus('Finalizing...');
      
      // Update the local state
      setRequests(requests.map(req => 
        req._id === selectedRequest._id 
          ? { ...req, status: response.data.status }
          : req
      ));

      // Refresh stats
      await fetchData();
      
      setShowModal(false);
      setSelectedRequest(null);
      setAdminComment('');
      setError(null);
      setProcessingType(null);

      toast.success(`Request ${status} successfully`);

    } catch (error) {
      console.error('Error updating status:', error);
      setError(`Failed to ${status} request: ${error.response?.data?.message || error.message}`);
    } finally {
      setActionLoading(false);
      setProcessingStatus('');
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className={`mb-4 p-4 rounded-lg ${
            isDarkMode 
              ? 'bg-red-900/20 border-red-800 text-red-300' 
              : 'bg-red-50 border-red-200 text-red-700'
          } border`}>
            {error}
          </div>
        )}
        
        <div className="mb-8">
          <nav className="flex space-x-8">
            {['dashboard', 'users'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === tab
                    ? 'border-violet-500 text-violet-500'
                    : isDarkMode 
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Total Requests', value: stats?.totalRequests || 0 },
                { title: 'Pending Requests', value: stats?.pendingRequests || 0 },
                { title: 'Approved Requests', value: stats?.approvedRequests || 0 }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${
                    isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
                  } rounded-lg shadow p-6 text-center`}
                >
                  <h3 className={`text-lg font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-900'
                  }`}>
                    {stat.title}
                  </h3>
                  <p className={`text-3xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Requests Table */}
            <div className="mt-8">
              <h2 className={`text-2xl font-bold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Exam Requests
              </h2>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 p-4">{error}</div>
              ) : requests.length === 0 ? (
                <div className="text-gray-500 p-4">No pending requests</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th>Exam Name</th>
                        <th>Institute</th>
                        <th>Status</th>
                        <th>Questions</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {requests.map((request) => (
                        <tr key={request._id}>
                          <td>{request.examName}</td>
                          <td>{request.institute?.name}</td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              request.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td>{request.totalQuestions}</td>
                          <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                          <td>
                            {request.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApprove(request._id)}
                                  className="bg-green-500 text-white px-3 py-1 rounded"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(request._id)}
                                  className="bg-red-500 text-white px-3 py-1 rounded"
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
          </div>
        )}

        {activeTab === 'users' && <AdminUserCreate />}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
                    className={`${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-300' 
                        : 'text-gray-400 hover:text-gray-500'
                    }`}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="p-6">
                {error && (
                  <div className={`mb-4 p-4 rounded-lg ${
                    isDarkMode 
                      ? 'bg-red-900/20 border-red-800 text-red-300' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  } border`}>
                    {error}
                  </div>
                )}
                
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
                    required
                    className={`w-full px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 ${
                      isDarkMode 
                        ? 'bg-[#2a2f3e] border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {actionLoading && processingStatus && (
                  <div className={`mb-4 p-4 rounded-lg flex items-center ${
                    isDarkMode 
                      ? 'bg-blue-900/20 text-blue-300' 
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    <div className={`animate-spin rounded-full h-4 w-4 border-b-2 mr-2 ${
                      isDarkMode ? 'border-blue-300' : 'border-blue-700'
                    }`}></div>
                    {processingStatus}
                  </div>
                )}
              </div>

              <div className={`px-6 py-4 flex justify-end space-x-3 rounded-b-lg ${
                isDarkMode ? 'bg-[#2a2f3e]' : 'bg-gray-50'
              }`}>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                    processingType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {actionLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    processingType === 'approve' ? 'Approve' : 'Reject'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;