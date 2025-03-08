import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import axiosInstance from "../utils/axiosConfig";
import { FaSync, FaDownload, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
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

  return (
    <div
      className={`min-h-screen pt-20 ${
        isDarkMode ? "bg-[#0A0F1C]" : "bg-gray-50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-8">
            {["upload", "exams", "create"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabSwitch(tab)}
                className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === tab
                    ? "border-violet-500 text-violet-500"
                    : isDarkMode
                    ? "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "upload" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              isDarkMode ? "bg-[#1a1f2e]" : "bg-white"
            } rounded-lg shadow-md p-6`}
          >
            <h2
              className={`text-2xl font-bold mb-6 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Upload Exam Questions
            </h2>
            
            {/* Add file type toggle */}
            <div className="mb-6">
              <div className={`inline-flex rounded-md shadow-sm ${isDarkMode ? "bg-[#0A0F1C]" : "bg-gray-100"}`} role="group">
                <button
                  type="button"
                  onClick={() => setFileType("json")}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                    fileType === "json"
                      ? isDarkMode
                        ? "bg-violet-700 text-white"
                        : "bg-violet-600 text-white"
                      : isDarkMode
                      ? "bg-[#0A0F1C] text-gray-300 hover:bg-[#2a2f3e]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => setFileType("excel")}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                    fileType === "excel"
                      ? isDarkMode
                        ? "bg-violet-700 text-white"
                        : "bg-violet-600 text-white"
                      : isDarkMode
                      ? "bg-[#0A0F1C] text-gray-300 hover:bg-[#2a2f3e]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Excel
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Exam Name
                </label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="Enter exam name"
                  required
                  className={`w-full px-4 py-3 rounded-lg ${
                    isDarkMode
                      ? "bg-[#0A0F1C] border-gray-700 text-white placeholder-gray-500"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                  } border focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter exam description"
                  required
                  rows="3"
                  className={`w-full px-4 py-3 rounded-lg ${
                    isDarkMode
                      ? "bg-[#0A0F1C] border-gray-700 text-white placeholder-gray-500"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                  } border focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Exam Duration (minutes)
                </label>
                <input
                  type="number"
                  value={examDuration}
                  onChange={handleExamDurationChange}
                  min="0"
                  className={`w-full px-4 py-3 rounded-lg ${
                    isDarkMode
                      ? "bg-[#0A0F1C] border-gray-700 text-white placeholder-gray-500"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                  } border focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Upload {fileType === "json" ? "JSON" : "Excel"} File
                </label>
                <div
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg ${
                    isDarkMode
                      ? "border-gray-700 bg-[#0A0F1C]"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <div className="space-y-1 text-center">
                    <svg
                      className={`mx-auto h-12 w-12 ${
                        isDarkMode ? "text-gray-400" : "text-gray-400"
                      }`}
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-center">
                      <label
                        htmlFor="file-upload"
                        className={`relative cursor-pointer rounded-md font-medium ${
                          isDarkMode ? "text-violet-400" : "text-violet-600"
                        } hover:text-violet-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-violet-500`}
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept={fileType === "json" ? ".json" : ".xlsx,.xls"}
                        />
                      </label>
                      <p
                        className={`pl-1 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        or drag and drop
                      </p>
                    </div>
                    <p
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {fileType === "json" ? "JSON file only" : "Excel files (.xlsx, .xls)"}
                    </p>
                    {file && (
                      <p
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-green-400" : "text-green-600"
                        }`}
                      >
                        {file.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode
                      ? "bg-red-900/20 text-red-300"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode
                      ? "bg-green-900/20 text-green-300"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {success}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    isDarkMode
                      ? "bg-violet-700 hover:bg-violet-600 text-white"
                      : "bg-violet-600 hover:bg-violet-700 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? "Uploading..." : "Upload Exam"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === "exams" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">My Exams</h2>
              <button
                onClick={navigateToExamCreation}
                className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                  isDarkMode
                    ? 'bg-violet-700 hover:bg-violet-600 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
              >
                <FaPlus className="mr-2" />
                Create New Exam
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 shadow-md rounded-lg overflow-hidden">
                <thead className={isDarkMode ? "bg-[#0A0F1C]" : "bg-gray-50"}>
                  <tr>
                    {[
                      "Exam Name",
                      "Description",
                      "Status",
                      "Uploaded Date",
                      "Total Questions",
                      "Results",
                      "Actions",
                      "Exam Mode",
                      "Toggle Exam Mode",
                    ].map((header) => (
                      <th
                        key={header}
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDarkMode
                      ? "divide-gray-700 bg-[#1a1f2e]"
                      : "divide-gray-200 bg-white"
                  }`}
                >
                  {uploads.map((upload) => (
                    <tr key={upload._id}>
                      <td
                        className={`px-6 py-4 whitespace-nowrap ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        {upload.examName}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        {upload.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            upload.status === "approved"
                              ? isDarkMode
                                ? "bg-green-900/20 text-green-300"
                                : "bg-green-100 text-green-800"
                              : upload.status === "rejected"
                              ? isDarkMode
                                ? "bg-red-900/20 text-red-300"
                                : "bg-red-100 text-red-800"
                              : isDarkMode
                              ? "bg-yellow-900/20 text-yellow-300"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {upload.status}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap ${
                          isDarkMode ? "text-gray-300" : "text-gray-900"
                        }`}
                      >
                        {upload.totalQuestions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {upload.status === "approved" && (
                          <button
                            onClick={() => handleViewResults(upload._id)}
                            className="px-3 py-1 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                          >
                            View Results
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {upload.status === "approved" &&
                          !upload.resultsReleased && (
                            <button
                              onClick={() => handleReleaseResults(upload._id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                              Release Results
                            </button>
                          )}
                        {upload.resultsReleased && (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              isDarkMode
                                ? "bg-green-900/20 text-green-300"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            Results Released
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            upload.examMode
                              ? isDarkMode
                                ? "bg-green-900/20 text-green-300"
                                : "bg-green-100 text-green-800"
                              : isDarkMode
                              ? "bg-red-900/20 text-red-300"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {upload.examMode ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleExamMode(upload._id)}
                          disabled={upload.status !== "approved"}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            upload.status === "approved"
                              ? upload.examMode
                                ? isDarkMode
                                  ? "bg-red-900/20 text-red-300 hover:bg-red-900/30"
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                                : isDarkMode
                                ? "bg-green-900/20 text-green-300 hover:bg-green-900/30"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                              : isDarkMode
                              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {upload.examMode ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "create" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div
              className={`w-full max-w-4xl ${
                isDarkMode ? "bg-[#1a1f2e]" : "bg-white"
              } rounded-lg shadow-md p-6`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Create New Exam
                </h2>
              </div>

              <div className="text-center py-8">
                <p
                  className={`mb-6 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Create a new exam with our interactive exam builder. Add
                  questions, options, and images directly on the platform.
                </p>
                <button
                  onClick={navigateToExamCreation}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    isDarkMode
                      ? "bg-violet-700 hover:bg-violet-600 text-white"
                      : "bg-violet-600 hover:bg-violet-700 text-white"
                  } transition-all duration-200 transform hover:scale-105`}
                >
                  <FaPlus className="inline mr-2" />
                  Start Creating Exam
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Modal */}
        {showResultsModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col ${
                isDarkMode ? "bg-[#1a1f2e]" : "bg-white"
              }`}
            >
              <div
                className={`px-6 py-4 flex justify-between items-center border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {selectedExam?.examName} - Results
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResultsRefresh}
                      disabled={isRefreshing}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isDarkMode
                          ? "bg-[#2a2f3e] hover:bg-[#3a3f4e] text-gray-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                      } ${isRefreshing ? "opacity-50 cursor-not-allowed" : ""}`}
                      title="Refresh results"
                    >
                      <FaSync className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      onClick={downloadResultsAsCSV}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isDarkMode
                          ? "bg-[#2a2f3e] hover:bg-[#3a3f4e] text-gray-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                      }`}
                      title="Download results as CSV"
                    >
                      <FaDownload className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className={`${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-500"}`}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Rest of the modal content */}
            </motion.div>
          </div>
        )}

        {/* Debug button */}
        <button
          onClick={debugExams}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Debug Exams
        </button>
      </div>
    </div>
  );
};

export default InstituteDashboard;