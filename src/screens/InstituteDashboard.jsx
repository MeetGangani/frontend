import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import axiosInstance from "../utils/axiosConfig";
import { FaSync, FaDownload, FaPlus, FaEdit, FaTrash, FaUpload, FaChartBar, FaList, FaFileExcel, FaFileCode } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const InstituteDashboard = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [examName, setExamName] = useState("");
  const [description, setDescription] = useState("");
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("instituteDashboardTab") || "upload";
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [examDuration, setExamDuration] = useState(60); // Default to 60 minutes
  const [fileType, setFileType] = useState("json"); // Add this state for toggling between JSON and Excel

  // Animation variants for Framer Motion
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

  const resetForm = () => {
    setFile(null);
    setExamName("");
    setDescription("");
    setError(null);
    setSuccess(null);
    // Reset the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = "";
    }
  };

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (fileType === "json" && selectedFile.type === "application/json") {
        setFile(selectedFile);
        setError(null);
      } else if (
        fileType === "excel" && 
        (selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
         selectedFile.type === "application/vnd.ms-excel")
      ) {
        setFile(selectedFile);
        setError(null);
      } else {
        setFile(null);
        setError(`Please select a valid ${fileType.toUpperCase()} file`);
        toast.error(`Please select a valid ${fileType.toUpperCase()} file`);
        e.target.value = ""; // Reset file input
      }
    }
  };

  const handleExcelSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!file || !examName || !description) {
      setError("Please fill in all required fields");
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      // First, send the Excel file to the Excel processor service
      const formData = new FormData();
      formData.append("file", file);

      // Use axios instead of fetch for better error handling
      const processorResponse = await axiosInstance.post(
        "/api/proxy/excel",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          }
        }
      );

      // Get the processed questions
      const processedData = processorResponse.data;
      
      if (!processedData.questions || !Array.isArray(processedData.questions)) {
        throw new Error("Invalid response from Excel processor");
      }

      // Now send the processed questions to your backend
      const uploadData = new FormData();
      
      // Create a JSON file from the processed questions
      const questionsBlob = new Blob([JSON.stringify(processedData)], {
        type: "application/json",
      });
      
      uploadData.append("file", questionsBlob, "processed_excel.json");
      uploadData.append("examName", examName);
      uploadData.append("description", description);
      uploadData.append("duration", examDuration.toString());

      // Send to your backend
      const response = await axiosInstance.post("/api/upload", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(response.data.message || "Excel file processed and uploaded successfully");
      toast.success("Excel file processed and uploaded successfully");
      resetForm();
      fetchUploads();
    } catch (error) {
      console.error("Excel upload error:", error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Excel processor error: ${error.response.data.error || error.response.statusText}`);
        toast.error(`Excel processor error: ${error.response.data.error || error.response.statusText}`);
      } else if (error.request) {
        // The request was made but no response was received
        setError("No response from Excel processor. It might be down or CORS issues.");
        toast.error("No response from Excel processor. It might be down or CORS issues.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(error.message);
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (fileType === "excel") {
      return handleExcelSubmit(e);
    }
    
    // Existing JSON upload logic remains...
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!file || !examName || !description) {
      setError("Please fill in all required fields");
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      // First, validate the JSON content
      const reader = new FileReader();

      const fileContent = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });

      const jsonContent = JSON.parse(fileContent);
      validateJsonContent(jsonContent);

      // If validation passes, proceed with upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("examName", examName);
      formData.append("description", description);
      formData.append("duration", examDuration.toString());

      const response = await axiosInstance.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(response.data.message);
      toast.success(response.data.message);
      resetForm();
      fetchUploads();
    } catch (error) {
      console.error("Upload error:", error);

      if (error instanceof SyntaxError) {
        setError("Invalid JSON format. Please check your file.");
        toast.error("Invalid JSON format. Please check your file.");
      } else if (error instanceof Error) {
        setError(error.message);
        toast.error(error.message);
      } else {
        setError(error.response?.data?.message || "Failed to upload file");
        toast.error(error.response?.data?.message || "Failed to upload file");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = async (examId) => {
    try {
      setIsRefreshing(true);
      const response = await axiosInstance.get(`/api/results/${examId}`);
      setExamResults(response.data);

      // Find the exam details to display in the modal
      const exam = uploads.find((upload) => upload._id === examId);
      setSelectedExam(exam);

      setShowResultsModal(true);
    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("Failed to fetch results");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResultsRefresh = async () => {
    if (!selectedExam) return;

    try {
      setIsRefreshing(true);
      const response = await axiosInstance.get(
        `/api/results/${selectedExam._id}`
      );
      setExamResults(response.data);
      toast.success("Results refreshed");
    } catch (error) {
      console.error("Error refreshing results:", error);
      toast.error("Failed to refresh results");
    } finally {
      setIsRefreshing(false);
    }
  };

  const downloadResultsAsCSV = () => {
    if (!examResults.length) {
      toast.error("No results to download");
      return;
    }

    // Create CSV content
    const headers = [
      "Student Name",
      "Score (%)",
      "Correct Answers",
      "Total Questions",
      "Submission Date",
    ];
    const rows = examResults.map((result) => [
      result.student?.name || "Deleted User",
      result.score?.toFixed(2) || "0.00",
      result.correctAnswers,
      result.totalQuestions,
      new Date(result.submittedAt).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedExam.examName}_results.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReleaseResults = async (examId) => {
    try {
      const response = await axiosInstance.post(
        `/api/results/release/${examId}`
      );

      // Update the uploads state to reflect the results release
      setUploads((prevUploads) =>
        prevUploads.map((upload) =>
          upload._id === examId ? { ...upload, resultsReleased: true } : upload
        )
      );

      toast.success(response.data.message);
    } catch (error) {
      console.error("Error releasing results:", error);
      toast.error("Failed to release results");
    }
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("instituteDashboardTab", tab);
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

  // Add validation for exam duration
  const handleExamDurationChange = (e) => {
    const value = parseInt(e.target.value);
    // Ensure value is not negative and is a valid number
    if (value < 0 || isNaN(value)) {
      setExamDuration(0);
    } else {
      setExamDuration(value);
    }
  };

  // Navigate to exam creation screen
  const navigateToExamCreation = () => {
    navigate('/institute/exam/create');
  };

  // Add this debugging function
  const debugExams = async () => {
    try {
      const response = await axiosInstance.get("/api/upload/my-uploads");
      console.log("API Response:", response);
      console.log("Exams data:", response.data);
      
      if (response.data && response.data.length > 0) {
        toast.success(`Found ${response.data.length} exams`);
      } else {
        toast.error("No exams found in the response");
      }
    } catch (error) {
      console.error("Debug error:", error);
      toast.error(`Debug error: ${error.message}`);
    }
  };

  const validateJsonContent = (content) => {
    if (!content.questions || !Array.isArray(content.questions)) {
      throw new Error("Invalid JSON format: missing questions array");
    }

    content.questions.forEach((q, index) => {
      if (!q.question) {
        throw new Error(`Question ${index + 1} is missing question text`);
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${index + 1} must have exactly 4 options`);
      }
      if (
        typeof q.correctAnswer !== "number" ||
        q.correctAnswer < 0 ||
        q.correctAnswer > 3
      ) {
        throw new Error(
          `Question ${index + 1} has invalid correct answer index`
        );
      }
    });
  };

  const renderUploadTab = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Upload New Exam
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Type Selection */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setFileType("json")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                fileType === "json"
                  ? 'bg-violet-600 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaFileCode /> JSON
            </button>
            <button
              type="button"
              onClick={() => setFileType("excel")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                fileType === "excel"
                  ? 'bg-violet-600 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaFileExcel /> Excel
            </button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Upload {fileType.toUpperCase()} File
            </label>
            <div className={`relative border-2 border-dashed rounded-lg p-6 text-center ${
              isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
            } transition-colors`}>
              <input
                type="file"
                onChange={handleFileChange}
                accept={fileType === "json" ? ".json" : ".xlsx,.xls"}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2">
                <FaUpload className={`mx-auto h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Drag and drop your {fileType.toUpperCase()} file here, or click to browse
                </p>
                {file && (
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Exam Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Exam Name
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-violet-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-violet-500'
                } focus:ring-2 focus:ring-violet-200 transition-colors`}
                placeholder="Enter exam name"
              />
            </div>

            <div className="space-y-2">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Duration (minutes)
              </label>
              <input
                type="number"
                value={examDuration}
                onChange={handleExamDurationChange}
                min="1"
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-violet-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-violet-500'
                } focus:ring-2 focus:ring-violet-200 transition-colors`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-violet-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-violet-500'
              } focus:ring-2 focus:ring-violet-200 transition-colors`}
              placeholder="Enter exam description"
            />
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-100 border border-red-400 text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-100 border border-green-400 text-green-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            } font-medium flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FaUpload />
                <span>Upload Exam</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Create New Exam Button */}
      <motion.button
        variants={cardVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={navigateToExamCreation}
        className={`w-full py-4 px-6 rounded-xl ${
          isDarkMode
            ? 'bg-violet-600 hover:bg-violet-700'
            : 'bg-violet-600 hover:bg-violet-700'
        } text-white font-medium flex items-center justify-center gap-2 shadow-lg`}
      >
        <FaPlus />
        <span>Create New Exam</span>
      </motion.button>
    </motion.div>
  );

  const renderExamsTab = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          My Exams
        </h2>
        <button
          onClick={fetchUploads}
          disabled={loading}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isDarkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Refresh exams"
        >
          <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
        </div>
      ) : uploads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uploads.map((upload) => (
            <motion.div
              key={upload._id}
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-xl ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg space-y-4`}
            >
              <div className="flex justify-between items-start">
                <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {upload.examName}
                </h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  upload.examMode
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {upload.examMode ? 'Active' : 'Inactive'}
                </div>
              </div>

              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {upload.description}
              </p>

              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Created: {new Date(upload.createdAt).toLocaleDateString()}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleToggleExamMode(upload._id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    upload.examMode
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {upload.examMode ? 'Stop Exam' : 'Start Exam'}
                </button>
                <button
                  onClick={() => handleViewResults(upload._id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  View Results
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          No exams found. Upload your first exam to get started.
        </div>
      )}
    </motion.div>
  );

  return (
    <div className={`min-h-screen pt-16 pb-12 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 md:px-6">
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => handleTabSwitch("upload")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              activeTab === "upload"
                ? 'bg-violet-600 text-white'
                : isDarkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
            } font-medium shadow-sm`}
          >
            <FaUpload />
            <span>Upload</span>
          </button>
          <button
            onClick={() => handleTabSwitch("exams")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              activeTab === "exams"
                ? 'bg-violet-600 text-white'
                : isDarkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
            } font-medium shadow-sm`}
          >
            <FaList />
            <span>My Exams</span>
          </button>
        </div>

        {/* Main Content */}
        {activeTab === "upload" ? renderUploadTab() : renderExamsTab()}

        {/* Results Modal */}
        {showResultsModal && selectedExam && (
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
                        <h3 className={`text-lg leading-6 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Exam Results: {selectedExam.examName}
                        </h3>
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
                                    Correct Answers
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
                                      <div className="text-sm font-medium">
                                        {result.student.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {result.student.email}
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
                                        {result.score}%
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {result.correctAnswers}/{result.totalQuestions}
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
        )}
      </div>
    </div>
  );
};

export default InstituteDashboard;