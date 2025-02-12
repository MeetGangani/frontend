import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import config from '../config/config.js';

const InstituteDashboard = () => {
  const { isDarkMode } = useTheme();
  const [file, setFile] = useState(null);
  const [examName, setExamName] = useState('');
  const [description, setDescription] = useState('');
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [examRequests, setExamRequests] = useState([]);

  useEffect(() => {
    fetchUploads();
    fetchExamRequests();
  }, []);

  const resetForm = () => {
    setFile(null);
    setExamName('');
    setDescription('');
    setError(null);
    setSuccess(null);
    // Reset the file input by clearing its value
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const fetchUploads = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/upload/my-uploads`, {
        withCredentials: true
      });
      setUploads(response.data);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    }
  };

  const fetchExamRequests = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/admin/requests`, {
        withCredentials: true
      });
      setExamRequests(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch exam requests');
      setExamRequests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size should be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const validateJsonContent = (content) => {
    if (!content.questions || !Array.isArray(content.questions)) {
      throw new Error('Invalid JSON format: missing questions array');
    }

    content.questions.forEach((q, index) => {
      if (!q.question) {
        throw new Error(`Question ${index + 1} is missing question text`);
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${index + 1} must have exactly 4 options`);
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
        throw new Error(`Question ${index + 1} has invalid correct answer index`);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First validate the JSON content
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonContent = JSON.parse(e.target.result);
          validateJsonContent(jsonContent);

          const formData = new FormData();
          formData.append('file', file);
          formData.append('examName', examName);
          formData.append('description', description);

          await axios.post(`${config.API_BASE_URL}/api/upload`, formData, {
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          setSuccess('Questions uploaded successfully!');
          fetchUploads();
          resetForm(); // Reset form after successful upload
          
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Error reading file');
        setLoading(false);
      };

      reader.readAsText(file);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload file');
      setLoading(false);
    }
  };

  const handleViewResults = async (examId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.API_BASE_URL}/api/exams/results/${examId}`, {
        withCredentials: true
      });
      setExamResults(response.data);
      setSelectedExam(uploads.find(u => u._id === examId));
      setShowResultsModal(true);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to fetch exam results');
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseResults = async (examId) => {
    try {
      setLoading(true);
      await axios.post(`${config.API_BASE_URL}/api/exams/release/${examId}`, {}, {
        withCredentials: true
      });
      setSuccess('Results released successfully');
      await fetchUploads();
      if (selectedExam?._id === examId) {
        const response = await axios.get(`${config.API_BASE_URL}/api/exams/results/${examId}`, {
          withCredentials: true
        });
        setExamResults(response.data);
      }
    } catch (error) {
      console.error('Error releasing results:', error);
      setError('Failed to release results: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/api/upload`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data) {
        toast.success('File uploaded successfully');
        setFile(null);
        // Reset file input
        e.target.reset();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
    </div>;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-8">
            {['upload', 'exams'].map((tab) => (
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

        {activeTab === 'upload' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
            } rounded-lg shadow-md p-6`}
          >
            <h2 className={`text-2xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Upload Exam Paper
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className={`w-full p-2 border rounded ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-300'
                  }`}
                  accept=".pdf,.doc,.docx"
                  disabled={uploading}
                />
              </div>
              <button
                type="submit"
                disabled={!file || uploading}
                className={`px-4 py-2 rounded font-medium ${
                  uploading || !file
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-700'
                } text-white transition-colors duration-200`}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === 'exams' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
            } rounded-lg shadow-md p-6`}
          >
            <h2 className={`text-2xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              My Uploads
            </h2>
            <div className="overflow-x-auto rounded-lg">
              <table className={`min-w-full divide-y ${
                isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
              }`}>
                <thead className={isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'}>
                  <tr>
                    {['Exam Name', 'Description', 'Status', 'Uploaded Date', 'Total Questions', 'Results', 'Actions'].map((header) => (
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
                  {uploads.map((upload) => (
                    <tr key={upload._id}>
                      <td className={`px-6 py-4 whitespace-nowrap ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {upload.examName}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {upload.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          upload.status === 'approved' 
                            ? isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-100 text-green-800'
                            : upload.status === 'rejected'
                            ? isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-100 text-red-800'
                            : isDarkMode ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {upload.status}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {upload.totalQuestions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {upload.status === 'approved' && (
                          <button
                            onClick={() => handleViewResults(upload._id)}
                            className="px-3 py-1 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                          >
                            View Results
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {upload.status === 'approved' && !upload.resultsReleased && (
                          <button
                            onClick={() => handleReleaseResults(upload._id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          >
                            Release Results
                          </button>
                        )}
                        {upload.resultsReleased && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isDarkMode 
                              ? 'bg-green-900/20 text-green-300' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            Results Released
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Results Modal */}
        {showResultsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${
                isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
              } rounded-xl shadow-lg max-w-4xl w-full`}
            >
              <div className={`p-6 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              } flex justify-between items-center`}>
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {selectedExam?.examName} - Results
                </h3>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className={`${
                    isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                {examResults.length === 0 ? (
                  <div className={`p-4 rounded-lg ${
                    isDarkMode 
                      ? 'bg-blue-900/20 text-blue-300' 
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    No results available yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${
                      isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                    }`}>
                      <thead className={isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'}>
                        <tr>
                          {['Student Name', 'Score', 'Correct Answers', 'Submission Date'].map((header) => (
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
                        {examResults.map((result) => (
                          <tr key={result._id}>
                            <td className={`px-6 py-4 whitespace-nowrap ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-900'
                            }`}>
                              {result.student?.name || 'N/A'}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-900'
                            }`}>
                              {result.score?.toFixed(2) || '0.00'}%
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-900'
                            }`}>
                              {result.correctAnswers} / {result.totalQuestions}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-900'
                            }`}>
                              {new Date(result.submittedAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstituteDashboard;
