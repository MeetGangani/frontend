import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import config from '../config/config.js';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const StudentDashboard = () => {
  const { isDarkMode } = useTheme();
  const [availableExams, setAvailableExams] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('start');
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [ipfsHash, setIpfsHash] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isExamMode, setIsExamMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
    fetchResults();
  }, []);

  useEffect(() => {
    let timer;
    if (currentExam && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            submitExam(); // Auto-submit when time runs out
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentExam, timeLeft]); // Dependencies for the timer effect

  useEffect(() => {
    if (currentExam) {
      setIsExamMode(true);
    } else {
      setIsExamMode(false);
    }
  }, [currentExam]);

  const fetchExams = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/api/exams/available`, {
        withCredentials: true
      });
      setAvailableExams(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Failed to fetch available exams');
    }
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${config.API_BASE_URL}/api/exams/my-results`,
        { withCredentials: true }
      );
      
      // Ensure we have an array, even if empty
      setExamResults(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching results:', error);
      setExamResults([]);
      setError('Failed to fetch exam results');
    } finally {
      setLoading(false);
    }
  };

  const handleTabSwitch = (tab) => {
    if (isExamMode && tab !== 'exam') {
      // Prevent switching tabs during exam
      return;
    }
    setActiveTab(tab);
  };

  const renderStartExam = () => {
    return (
      <div className="max-w-lg mx-auto p-4 md:p-6">
        <div className="text-center mb-8">
          <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Start Exam
          </h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Enter the exam code provided by your institute to begin
          </p>
        </div>

        <div className="space-y-6">
          {/* IPFS Hash Input */}
          <div className="space-y-4">
            <label 
              htmlFor="ipfsHash"
              className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Exam Code
            </label>
            <input
              id="ipfsHash"
              type="text"
              value={ipfsHash}
              onChange={(e) => setIpfsHash(e.target.value)}
              placeholder="Enter your exam code"
              className={`w-full p-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-300 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-violet-500`}
            />
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartExam}
            disabled={loading || !ipfsHash.trim()}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all
              ${loading || !ipfsHash.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting Exam...
              </span>
            ) : (
              'Start Exam'
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
              <p className="font-medium">Unable to start exam</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className={`mt-8 p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-medium mb-3 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Important Instructions
            </h3>
            <ul className={`list-disc list-inside space-y-2 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <li>Make sure you have a stable internet connection</li>
              <li>Do not leave or refresh the page during the exam</li>
              <li>Switching tabs or windows will auto-submit your exam</li>
              <li>Keep track of the time limit once you start</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const handleStartExam = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!ipfsHash) {
        setError('Please enter the IPFS hash provided by your institute');
        return;
      }

      const response = await axios.post(
        `${config.API_BASE_URL}/api/exams/start`,
        { ipfsHash: ipfsHash.trim() },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (response.data) {
        setCurrentExam(response.data);
        setTimeLeft(response.data.timeLimit * 60); // Convert minutes to seconds
        setAnswers({});
        setCurrentQuestionIndex(0);
        setActiveTab('exam');
        
        // Store exam state in localStorage in case of page refresh
        localStorage.setItem('currentExam', JSON.stringify({
          ...response.data,
          startTime: new Date().toISOString(),
          timeLeft: response.data.timeLimit * 60
        }));
      }
    } catch (error) {
      console.error('Start exam error:', error);
      setError(
        error.response?.data?.message || 
        'Failed to start exam. Please verify your IPFS hash with your institute.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExamCompletion = () => {
    setCurrentExam(null);
    setIsExamMode(false);
    setAnswers({});
    setTimeLeft(null);
    setActiveTab('results'); // Automatically switch to results tab
    fetchResults(); // Refresh results
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionIndex]: optionIndex // Store the actual option index
      };
      
      // Log the answer selection for debugging
      console.log('Answer selected:', {
        questionIndex,
        selectedOption: optionIndex,
        allAnswers: newAnswers
      });
      
      return newAnswers;
    });
  };

  const handleSubmitExam = async () => {
    try {
      setExamSubmitting(true);
      
      // Log the answers being submitted
      console.log('Submitting answers:', answers);
      
      const response = await axios.post(
        `${config.API_BASE_URL}/api/exams/submit`,
        {
          examId: currentExam._id,
          answers: answers
        },
        {
          withCredentials: true
        }
      );

      if (response.data) {
        console.log('Submission response:', response.data);
        
        toast.success(`Exam submitted successfully! Score: ${response.data.score}%`);
        
        // Update the results immediately with the correct score
        const newResult = {
          _id: Date.now(),
          exam: {
            examName: currentExam.examName,
            resultsReleased: true
          },
          score: Number(response.data.score),
          correctAnswers: response.data.correctAnswers,
          totalQuestions: response.data.totalQuestions,
          submittedAt: new Date(),
          resultsAvailable: true
        };

        setExamResults(prev => [newResult, ...prev]);
        handleExamCompletion();
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error(error.response?.data?.message || 'Failed to submit exam');
    } finally {
      setExamSubmitting(false);
      setCurrentExam(null);
      setAnswers({});
      setTimeLeft(null);
    }
  };

  // Add this function to check if all questions are answered
  const areAllQuestionsAnswered = () => {
    if (!currentExam) return false;
    
    const totalQuestions = currentExam.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    
    return answeredQuestions === totalQuestions;
  };

  // Add this function to get the number of remaining questions
  const getRemainingQuestions = () => {
    if (!currentExam) return 0;
    
    const totalQuestions = currentExam.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    
    return totalQuestions - answeredQuestions;
  };

  // Update the exam rendering with submit button validation
  const renderExam = () => {
    if (!currentExam) {
      return (
        <div className="text-center p-4">
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
            No active exam. Please start an exam first.
          </p>
        </div>
      );
    }

    const remainingQuestions = getRemainingQuestions();
    const allAnswered = areAllQuestionsAnswered();

    return (
      <div className="relative">
        {/* Exam Content */}
        <div className="space-y-6 pb-16">
          {/* Timer and Progress */}
          <div className="sticky top-0 z-10 bg-inherit py-2 space-y-2">
            <div className={`text-lg font-semibold ${
              timeLeft <= 300 ? 'text-red-500' : isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              Time Remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {remainingQuestions > 0 
                ? `${remainingQuestions} question${remainingQuestions > 1 ? 's' : ''} remaining`
                : 'All questions answered!'
              }
            </div>
          </div>

          {/* Question */}
          <div className="space-y-4">
            <h3 className={`text-xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Question {currentQuestionIndex + 1} of {currentExam.questions.length}
            </h3>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentExam.questions[currentQuestionIndex].text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentExam.questions[currentQuestionIndex].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                className={`w-full p-4 text-left rounded-lg transition-colors ${
                  answers[currentQuestionIndex] === index
                    ? isDarkMode
                      ? 'bg-violet-600 text-white'
                      : 'bg-violet-100 text-violet-900'
                    : isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Navigation and Submit Buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded ${
                currentQuestionIndex === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}
            >
              Previous
            </button>

            {currentQuestionIndex === currentExam.questions.length - 1 ? (
              <div className="flex flex-col items-end">
                <button
                  onClick={handleSubmitExam}
                  disabled={examSubmitting || !allAnswered}
                  className={`px-6 py-2 rounded transition-all ${
                    examSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : allAnswered
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {examSubmitting 
                    ? 'Submitting...' 
                    : allAnswered
                      ? 'Submit Exam'
                      : `Answer All Questions (${remainingQuestions} left)`
                  }
                </button>
                {!allAnswered && (
                  <span className="text-xs text-red-500 mt-1">
                    Please answer all questions before submitting
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(prev => 
                  Math.min(currentExam.questions.length - 1, prev + 1)
                )}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded"
              >
                Next
              </button>
            )}
          </div>

          {/* Question Navigation with Answer Status */}
          <div className="mt-8">
            <h4 className={`text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Question Navigation
            </h4>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {currentExam.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`p-2 text-sm rounded relative ${
                    currentQuestionIndex === index
                      ? 'bg-violet-600 text-white'
                      : answers[index] !== undefined
                        ? isDarkMode
                          ? 'bg-violet-900/50 text-violet-100'
                          : 'bg-violet-100 text-violet-900'
                        : isDarkMode
                          ? 'bg-gray-800 text-gray-300'
                          : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {index + 1}
                  {answers[index] !== undefined && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Summary */}
          <div className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Answered: {Object.keys(answers).length} / {currentExam.questions.length}
          </div>
        </div>

        {/* Warning Banner */}
        {isExamMode && (
          <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-4 text-center z-50">
            Warning: Leaving this page will submit your exam automatically
          </div>
        )}
      </div>
    );
  };

  const renderResultsTab = () => {
    return (
      <div>
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          My Results
        </h2>
        
        <div className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-lg shadow-lg`}>
          {examResults && examResults.length > 0 ? (
            <div className="space-y-4">
              {examResults.map((result) => (
                <div
                  key={result._id}
                  className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  } shadow`}
                >
                  <h3 className="font-semibold text-lg mb-2">
                    {result.exam.examName}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Score</p>
                      <p className="font-medium">
                        {result.score !== null && result.score !== undefined
                          ? `${Number(result.score).toFixed(2)}%`
                          : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Correct Answers</p>
                      <p className="font-medium">
                        {result.correctAnswers !== null && result.correctAnswers !== undefined
                          ? `${result.correctAnswers}/${result.totalQuestions}`
                          : 'Pending'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Submitted: {new Date(result.submittedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-6 text-center ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {loading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                </div>
              ) : (
                'No exam results found'
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-100'} min-h-screen pt-50 p-4 md:p-8`}>
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          {/* Navigation Sidebar - Hidden during exam mode on mobile */}
          <div className={`w-full md:w-1/4 ${isExamMode ? 'hidden md:block' : ''}`}>
            <div className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-lg p-4 md:p-6 shadow-lg`}>
              <h2 className={`text-xl md:text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Navigation
              </h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleTabSwitch('start')}
                    disabled={isExamMode}
                    className={`block w-full text-left px-4 py-2 rounded-lg transition-colors
                      ${activeTab === 'start'
                        ? 'bg-violet-600 text-white'
                        : isDarkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-200'
                      }
                      ${isExamMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    Start Exam
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleTabSwitch('exam')}
                    className={`block w-full text-left px-4 py-2 rounded-lg transition-colors
                      ${activeTab === 'exam'
                        ? 'bg-violet-600 text-white'
                        : isDarkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    Exam
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleTabSwitch('results')}
                    disabled={isExamMode}
                    className={`block w-full text-left px-4 py-2 rounded-lg transition-colors
                      ${activeTab === 'results'
                        ? 'bg-violet-600 text-white'
                        : isDarkMode
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-200'
                      }
                      ${isExamMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    Results
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="w-full md:w-3/4">
            <div className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-lg p-4 md:p-6 shadow-lg`}>
              {/* Warning Banner for Exam Mode */}
              {isExamMode && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
                  <p className="font-bold">Exam in Progress</p>
                  <p>Please do not leave this page or switch tabs until you complete the exam.</p>
                </div>
              )}

              {/* Content Sections */}
              {activeTab === 'start' && !isExamMode && renderStartExam()}
              {activeTab === 'exam' && renderExam()}
              {activeTab === 'results' && !isExamMode && renderResultsTab()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;