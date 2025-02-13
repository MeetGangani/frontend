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

  const [register, { isLoading }] = useRegisterMutation();

  useEffect(() => {
    Promise.all([fetchRequests(), fetchStats()])
      .finally(() => setLoading(false));
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/admin/requests');
      setRequests(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch requests');
      setRequests([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard');
      setStats(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to fetch statistics');
      setStats(null);
    }
  };

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
      await fetchStats();
      
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
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500'
    };
    return (
      <span className={`${variants[status]} text-white text-xs font-medium px-2.5 py-0.5 rounded-full`}>
        {status}
      </span>
    );
  };

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
            <h2 className={`text-2xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              File Requests
            </h2>
            
            {requests.length === 0 ? (
              <div className={`p-4 rounded-lg ${
                isDarkMode 
                  ? 'bg-blue-900/20 text-blue-300' 
                  : 'bg-blue-50 text-blue-700'
              }`}>
                No requests found.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className={`min-w-full divide-y ${
                  isDarkMode 
                    ? 'divide-gray-700' 
                    : 'divide-gray-200'
                }`}>
                  <thead className={isDarkMode ? 'bg-[#1a1f2e]' : 'bg-gray-50'}>
                    <tr>
                      {['Exam Name', 'Institute', 'Status', 'Date', 'Actions'].map((header) => (
                        <th key={header} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isDarkMode 
                      ? 'divide-gray-700 bg-[#1a1f2e]' 
                      : 'divide-gray-200 bg-white'
                  }`}>
                    {requests.map((request) => (
                      <tr key={request._id}>
                        <td className={`px-6 py-4 whitespace-nowrap ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-900'
                        }`}>
                          {request.fileName}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-900'
                        }`}>
                          {request.institute?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-900'
                        }`}>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {request.status === 'pending' && (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleApprove(request)}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(request)}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
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