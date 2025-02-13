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

  // Add backend URL
  const BACKEND_URL = 'https://backdeploy-9bze.onrender.com';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Update API endpoints to include BACKEND_URL
      const requestsResponse = await axios.get(`${BACKEND_URL}/api/admin/requests`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('Raw response:', requestsResponse); // Debug log
      console.log('Fetched requests:', requestsResponse.data);
      setRequests(Array.isArray(requestsResponse.data) ? requestsResponse.data : []);

      // Fetch stats with updated URL
      const statsResponse = await axios.get(`${BACKEND_URL}/api/admin/dashboard`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('Stats response:', statsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to fetch data');
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

  const handleApprove = async (requestId) => {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/requests/${requestId}`,
        {
          status: 'approved'
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
        toast.success('Request approved successfully');
        fetchData(); // Refresh the data
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/requests/${requestId}`,
        {
          status: 'rejected'
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
        toast.success('Request rejected successfully');
        fetchData(); // Refresh the data
      }
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
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
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-[#0A0F1C] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-lg shadow-md ${
          isDarkMode ? 'bg-[#1a1f2e] text-white' : 'bg-white text-gray-900'
        }`}>
          <h3 className="text-lg font-semibold mb-2">Total Requests</h3>
          <p className="text-3xl font-bold">{stats?.totalRequests || 0}</p>
        </div>
        <div className={`p-6 rounded-lg shadow-md ${
          isDarkMode ? 'bg-[#1a1f2e] text-white' : 'bg-white text-gray-900'
        }`}>
          <h3 className="text-lg font-semibold mb-2">Pending Requests</h3>
          <p className="text-3xl font-bold">{stats?.pendingRequests || 0}</p>
        </div>
        <div className={`p-6 rounded-lg shadow-md ${
          isDarkMode ? 'bg-[#1a1f2e] text-white' : 'bg-white text-gray-900'
        }`}>
          <h3 className="text-lg font-semibold mb-2">Approved Requests</h3>
          <p className="text-3xl font-bold">{stats?.approvedRequests || 0}</p>
        </div>
      </div>

      {/* Requests Table */}
      <div className={`rounded-lg shadow-md overflow-hidden ${
        isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
      }`}>
        <h2 className={`text-2xl font-bold p-6 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          Exam Requests
        </h2>
        
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
                            onClick={() => handleApprove(request._id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request._id)}
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
    </div>
  );
};

export default AdminDashboard;