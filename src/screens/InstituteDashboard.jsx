import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import axiosInstance from "../utils/axiosConfig";
import { FaSync, FaDownload, FaPlus, FaEdit, FaTrash, FaChartBar, FaList, FaGraduationCap, FaChalkboardTeacher } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const InstituteDashboard = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("instituteDashboardTab") || "exams";
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/upload/my-uploads");
      if (response.data) {
        setUploads(response.data);
      }
    } catch (error) {
      console.error("Error fetching uploads:", error);
      toast.error(error.response?.data?.message || "Failed to fetch uploads");
      setError(error.response?.data?.message || "Failed to fetch uploads");
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = async (examId) => {
    try {
      setIsRefreshing(true);
      const response = await axiosInstance.get(`/api/exams/results/${examId}`);
      setExamResults(response.data);

      // Find the exam details to display in the modal
      const exam = uploads.find((upload) => upload._id === examId);
      setSelectedExam(exam);
      setShowResultsModal(true);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to fetch results');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResultsRefresh = async () => {
    if (!selectedExam) return;

    try {
      setIsRefreshing(true);
      const response = await axiosInstance.get(`/api/exams/results/${selectedExam._id}`);
      setExamResults(response.data);
      toast.success('Results refreshed');
    } catch (error) {
      console.error('Error refreshing results:', error);
      toast.error('Failed to refresh results');
    } finally {
      setIsRefreshing(false);
    }
  };

  const downloadResultsAsCSV = () => {
    if (!examResults.length) {
      toast.error('No results to download');
      return;
    }

    // Create CSV headers
    const headers = ['Student Name', 'Score (%)', 'Correct Answers', 'Total Questions', 'Submission Date'];
    
    // Convert results to CSV format with properly formatted date
    const csvData = examResults.map(result => {
      // Format the date properly
      const submissionDate = result.submittedAt 
        ? new Date(result.submittedAt).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : 'N/A';

      return [
        result.student?.name || 'Deleted User',
        result.score?.toFixed(2) || '0.00',
        result.correctAnswers || '0',
        result.totalQuestions || '0',
        submissionDate
      ];
    });

    // Add headers to the beginning
    csvData.unshift(headers);

    // Convert to CSV string with proper escaping for commas and quotes
    const csvString = csvData.map(row => 
      row.map(cell => {
        if (cell && cell.toString().includes(',') || cell.toString().includes('"') || cell.toString().includes('\n')) {
          return `"${cell.toString().replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');

    // Create blob and download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Create filename with current date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedExam.examName}_results_${currentDate}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReleaseResults = async (examId) => {
    try {
      const response = await axiosInstance.post(`/api/exams/release/${examId}`);

      // Update the uploads state to reflect the results release
      setUploads((prevUploads) =>
        prevUploads.map((upload) =>
          upload._id === examId ? { ...upload, resultsReleased: true } : upload
        )
      );

      toast.success(response.data.message);
      
      // If the modal is open and showing this exam's results, refresh them
      if (selectedExam?._id === examId) {
        const resultsResponse = await axiosInstance.get(`/api/exams/results/${examId}`);
        setExamResults(resultsResponse.data);
      }
    } catch (error) {
      console.error('Error releasing results:', error);
      toast.error('Failed to release results');
    }
  };

  const handleToggleExamMode = async (examId) => {
    const currentExam = uploads.find((upload) => upload._id === examId);

    // Check if the exam is approved
    if (!currentExam || currentExam.status !== "approved") {
      toast.error("Exam mode can only be toggled for approved exams.");
      return;
    }

    try {
      const newExamMode = !currentExam.examMode; // Toggle the current state

      const response = await axiosInstance.put(
        `/api/exams/${examId}/exam-mode`,
        {
          examMode: newExamMode, // Send the new state to the server
        }
      );

      // Update the uploads state to reflect the new exam mode
      setUploads((prevUploads) =>
        prevUploads.map((upload) =>
          upload._id === examId ? { ...upload, examMode: newExamMode } : upload
        )
      );

      toast.success(response.data.message);
    } catch (error) {
      console.error("Error toggling exam mode:", error);
      toast.error("Failed to toggle exam mode");
    }
  };

  const renderExamsTab = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Dashboard Header */}
      <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gradient-to-r from-violet-900/40 to-purple-900/40' : 'bg-gradient-to-r from-violet-50 to-purple-50'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Institute Dashboard
            </h1>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Welcome back! Manage your exams and view student performance
            </p>
          </div>
          <button
            onClick={() => navigate('/institute/exam/create')}
            className={`px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transform transition-all duration-200 hover:scale-105 ${
              isDarkMode
                ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20'
            }`}
          >
            <FaPlus className="w-4 h-4" />
            Create New Exam
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          variants={cardVariants}
          className={`p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Exams</p>
              <h3 className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {uploads.length}
              </h3>
            </div>
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-violet-900/20 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
              <FaChartBar className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          className={`p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Exams</p>
              <h3 className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {uploads.filter(exam => exam.examMode).length}
              </h3>
            </div>
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
              <FaGraduationCap className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          className={`p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending Approval</p>
              <h3 className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {uploads.filter(exam => exam.status === 'pending').length}
              </h3>
            </div>
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
              <FaChalkboardTeacher className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          className={`p-6 rounded-xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Questions</p>
              <h3 className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {uploads.reduce((acc, exam) => acc + exam.totalQuestions, 0)}
              </h3>
            </div>
            <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <FaList className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Exams Section */}
      <div className={`rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`px-6 py-5 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Exam Name
                </th>
                <th className={`px-6 py-5 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Description
                </th>
                <th className={`px-6 py-5 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Status
                </th>
                <th className={`px-6 py-5 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Created
                </th>
                <th className={`px-6 py-5 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Questions
                </th>
                <th className={`px-6 py-5 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Results
                </th>
                <th className={`px-6 py-5 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Actions
                </th>
                <th className={`px-6 py-5 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Mode
                </th>
                <th className={`px-6 py-5 text-left text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Toggle
                </th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((upload, index) => (
                <tr 
                  key={upload._id} 
                  className={`${
                    isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                  } ${
                    index !== uploads.length - 1 ? `border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}` : ''
                  }`}
                >
                  <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {upload.examName}
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {upload.description}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      upload.status === 'approved'
                        ? isDarkMode 
                          ? 'bg-green-400/10 text-green-400' 
                          : 'bg-green-100 text-green-700'
                        : isDarkMode 
                          ? 'bg-yellow-400/10 text-yellow-400'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {upload.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {new Date(upload.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {upload.totalQuestions}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewResults(upload._id)}
                      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        isDarkMode
                          ? 'text-violet-400 hover:bg-violet-400/10'
                          : 'text-violet-600 hover:bg-violet-50'
                      }`}
                    >
                      View Results
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {!upload.resultsReleased ? (
                      <button
                        onClick={() => handleReleaseResults(upload._id)}
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          isDarkMode
                            ? 'text-green-400 hover:bg-green-400/10'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        Release Results
                      </button>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-green-400/10 text-green-400' : 'bg-green-100 text-green-700'
                      }`}>
                        Results Released
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      upload.examMode
                        ? isDarkMode 
                          ? 'bg-green-400/10 text-green-400' 
                          : 'bg-green-100 text-green-700'
                        : isDarkMode 
                          ? 'bg-red-400/10 text-red-400'
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {upload.examMode ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleExamMode(upload._id)}
                      disabled={upload.status !== "approved"}
                      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        upload.examMode
                          ? isDarkMode
                            ? 'text-red-400 hover:bg-red-400/10'
                            : 'text-red-600 hover:bg-red-50'
                          : isDarkMode
                            ? 'text-green-400 hover:bg-green-400/10'
                            : 'text-green-600 hover:bg-green-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {upload.examMode ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  const renderResultsModal = () => {
    if (!showResultsModal || !selectedExam) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-500'} opacity-75`}></div>
          </div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className={`text-lg leading-6 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedExam.examName} - Results
                      </h3>
                      <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Exam Results Overview
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleResultsRefresh}
                        className={`p-2 rounded-lg ${
                          isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <FaSync className={isRefreshing ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={downloadResultsAsCSV}
                        className={`p-2 rounded-lg ${
                          isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <FaDownload />
                      </button>
                    </div>
                  </div>

                  <div className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {examResults.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Score
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Correct/Total
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Time Taken
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Submitted At
                              </th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {examResults.map((result) => (
                              <tr key={result._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                    {result.student?.name || 'Anonymous'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {result.student?.email || 'N/A'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    result.score >= 70
                                      ? 'bg-green-100 text-green-800'
                                      : result.score >= 50
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}>
                                    {result.score?.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {result.correctAnswers}/{result.totalQuestions}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {new Date(result.submittedAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        No results available for this exam yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <button
                type="button"
                onClick={() => setShowResultsModal(false)}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium sm:ml-3 sm:w-auto sm:text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Close
              </button>
              {!selectedExam.resultsReleased && (
                <button
                  type="button"
                  onClick={() => handleReleaseResults(selectedExam._id)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-violet-600 text-base font-medium text-white hover:bg-violet-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Release Results
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen pt-24 pb-12 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 md:px-6">
        {renderExamsTab()}
        {renderResultsModal()}
      </div>
    </div>
  );
};

export default InstituteDashboard;