import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import config from '../config/config.js';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';
import { FaExpand, FaCompress } from 'react-icons/fa';

const StudentDashboard = () => {
  const { isDarkMode } = useTheme();
  const [isExamMode, setIsExamMode] = useState(false);
  const [examResults, setExamResults] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [ipfsHash, setIpfsHash] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [examDuration, setExamDuration] = useState(60); // Default to 60 minutes

  // Initialize activeTab after isExamMode is declared
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('studentDashboardTab');
    return isExamMode ? 'exam' : (savedTab || 'start');
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    let timer;
    if (currentExam && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleSubmitExam('time_expired');
            localStorage.removeItem('examState');
            return 0;
          }
          // Save state every 30 seconds
          if (prevTime % 30 === 0) {
            saveExamState();
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentExam, timeLeft]);

  useEffect(() => {
    if (currentExam) {
      setIsExamMode(true);
      setTimeLeft(currentExam.timeLimit * 60); // Set time left based on duration in seconds
    } else {
      setIsExamMode(false);
    }
  }, [currentExam]);

  useEffect(() => {
    if (isExamMode && currentExam) {
      let isSubmitting = false;

      const handleVisibilityChange = () => {
        if (document.hidden && !isSubmitting && !examSubmitting) {
          isSubmitting = true;
          handleSubmitExam('tab_switch');
        }
      };

      const handleWindowBlur = () => {
        if (!isSubmitting && !examSubmitting) {
          isSubmitting = true;
          handleSubmitExam('window_switch');
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
        isSubmitting = false;
      };
    }
  }, [isExamMode, currentExam, answers, examSubmitting]);

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
    if (isExamMode) {
      return; // Don't allow tab switching during exam
    }
    setActiveTab(tab);
    localStorage.setItem('studentDashboardTab', tab);
  };

  useEffect(() => {
    if (isExamMode) {
      setActiveTab('exam');
      localStorage.removeItem('studentDashboardTab');
    }
  }, [isExamMode]);

  const renderStartExam = () => {
    return (
      <div className="mt-8">
        <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Start Exam
        </h2>
        
        <div className="max-w-md mx-auto space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-100 border border-red-400 text-red-700">
              <p>{error}</p>
            </div>
          )}

          <div>
            <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Enter the exam code provided by your institute to begin
            </p>

            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="examCode" 
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Exam Code
                </label>
                <input
                  type="text"
                  id="examCode"
                  value={ipfsHash}
                  onChange={(e) => {
                    setIpfsHash(e.target.value);
                    setError(null); // Clear error when input changes
                  }}
                  placeholder="Enter your exam code"
                  className={`w-full px-4 py-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-800 text-white border-gray-700 focus:border-violet-500' 
                      : 'bg-white text-gray-900 border-gray-300 focus:border-violet-500'
                  } border focus:ring-2 focus:ring-violet-200 transition-colors`}
                />
              </div>

              <button
                onClick={handleStartExam}
                disabled={!ipfsHash.trim() || loading}
                className={`w-full py-3 px-4 rounded-lg transition-colors ${
                  !ipfsHash.trim() || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-700'
                } text-white font-medium`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  'Start Exam'
                )}
              </button>
            </div>
          </div>

          {/* Important Instructions */}
          <div className={`mt-8 p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <h3 className={`text-lg font-medium mb-3 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Important Instructions
            </h3>
            <ul className={`space-y-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Make sure you have a stable internet connection
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Do not leave or refresh the page during the exam
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Switching tabs or windows will auto-submit your exam
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Keep track of the time limit once you start
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      showToast.error('Failed to enter fullscreen mode');
      console.error('Fullscreen error:', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Exit fullscreen error:', error);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Only force fullscreen and auto-submit if it's not a manual submission
      if (!document.fullscreenElement && isExamMode && !examSubmitting) {
        showToast.error('Fullscreen mode is required during the exam');
        enterFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isExamMode, enterFullscreen, examSubmitting]);

  const notifyExamStateChange = (isExamActive) => {
    // Create a custom event with detail
    const event = new CustomEvent('customExamState', {
      detail: {
        type: 'examState',
        isActive: isExamActive
      }
    });
    window.dispatchEvent(event);
  };

  const handleStartExam = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/exams/start`, {
        ipfsHash: ipfsHash.trim(),
        duration: examDuration // Pass duration to the backend
      });

      if (response.data) {
        setCurrentExam(response.data);
        setTimeLeft(response.data.timeLimit * 60); // Set time left based on duration in seconds
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      showToast.error('Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  const handleExamCompletion = async () => {
    await exitFullscreen();
    setCurrentExam(null);
    setIsExamMode(false);
    setAnswers({});
    setTimeLeft(null);
    setActiveTab('results');
    localStorage.removeItem('examState');
    localStorage.removeItem('pendingSubmission');
    fetchResults();
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    try {
      const updatedAnswers = {
        ...answers,
        [questionIndex]: answerIndex
      };
      setAnswers(updatedAnswers);
      saveExamState(updatedAnswers);
    } catch (error) {
      console.error('Error saving answer:', error);
      showToast.error('Failed to save answer');
    }
  };

  const handleSubmitExam = async (submitType = 'manual') => {
    if (examSubmitting) return;
    
    try {
      setExamSubmitting(true);
      
      const attemptedAnswers = Object.keys(answers).reduce((acc, key) => {
        if (answers[key] !== null && answers[key] !== undefined) {
          acc[key] = Number(answers[key]);
        }
        return acc;
      }, {});

      const submissionData = {
        examId: currentExam._id,
        answers: attemptedAnswers,
        isAutoSubmit: submitType !== 'manual',
        totalQuestions: currentExam.questions.length,
        attemptedCount: Object.keys(attemptedAnswers).length,
        timeRemaining: timeLeft
      };

      // Add offline handling
      if (!navigator.onLine) {
        // Store submission in localStorage for later
        localStorage.setItem('pendingSubmission', JSON.stringify({
          submissionData,
          timestamp: new Date().toISOString()
        }));
        
        showToast.warning('You are offline. Your exam will be submitted when you reconnect.');
        
        // Don't clear exam state yet
        setExamSubmitting(false);
        return;
      }

      const response = await axios.post(
        `${config.API_BASE_URL}/api/exams/submit`,
        submissionData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          },
          // Add timeout to prevent infinite loading
          timeout: 10000
        }
      );

      if (response.data) {
        localStorage.removeItem('examState');
        localStorage.removeItem('pendingSubmission');
        
        switch (submitType) {
          case 'tab_switch':
            showToast.error(`Tab switched! Exam auto-submitted with ${Object.keys(attemptedAnswers).length} attempted questions`);
            break;
          case 'window_switch':
            showToast.error(`Window switched! Exam auto-submitted with ${Object.keys(attemptedAnswers).length} attempted questions`);
            break;
          case 'time_expired':
            showToast.warning(`Time's up! Exam submitted with ${Object.keys(attemptedAnswers).length} attempted questions`);
            break;
          default:
            showToast.success('Exam submitted successfully!');
        }
        
        notifyExamStateChange(false);
        setIsExamMode(false);
        setCurrentExam(null);
        setTimeLeft(null);
        setActiveTab('results');
        
        await handleExamCompletion();
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      
      // Store submission data if network error
      if (error.message.includes('Network Error') || !navigator.onLine) {
        localStorage.setItem('pendingSubmission', JSON.stringify({
          submissionData,
          timestamp: new Date().toISOString()
        }));
        showToast.warning('Network error. Your exam will be submitted when you reconnect.');
      } else {
        showToast.error(
          error.response?.data?.message || 
          'Failed to submit exam. Please try again or contact support.'
        );
      }
    } finally {
      setExamSubmitting(false);
    }
  };

  // Add online/offline status handling
  useEffect(() => {
    const handleOnline = async () => {
      const pendingSubmission = localStorage.getItem('pendingSubmission');
      if (pendingSubmission) {
        try {
          const { submissionData } = JSON.parse(pendingSubmission);
          
          const response = await axios.post(
            `${config.API_BASE_URL}/api/exams/submit`,
            submissionData,
            {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.data) {
            localStorage.removeItem('examState');
            localStorage.removeItem('pendingSubmission');
            showToast.success('Pending exam submitted successfully!');
            await handleExamCompletion();
          }
        } catch (error) {
          console.error('Error submitting pending exam:', error);
          showToast.error('Failed to submit pending exam. Please try again or contact support.');
        }
      }
    };

    const handleOffline = () => {
      showToast.warning('You are offline. Don\'t worry, your exam progress is saved.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending submission on component mount
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
        <div className="space-y-4 md:space-y-6 pb-16">
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
            <h3 className={`text-lg md:text-xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Question {currentQuestionIndex + 1} of {currentExam.questions.length}
            </h3>
            <p className={`text-base md:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className={`w-full sm:w-auto px-4 py-2 rounded ${
                currentQuestionIndex === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-700 text-white'
              }`}
            >
              Previous
            </button>

            {currentQuestionIndex === currentExam.questions.length - 1 ? (
              <div className="w-full sm:w-auto flex flex-col items-center sm:items-end">
                <button
                  onClick={handleSubmitExam}
                  disabled={examSubmitting || !allAnswered}
                  className={`w-full sm:w-auto px-6 py-2 rounded transition-all ${
                    examSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : allAnswered
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Submit Exam
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      {activeTab === 'start' && renderStartExam()}
      {activeTab === 'exam' && renderExam()}
      {activeTab === 'results' && (
        <div className="text-center p-4">
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
            Exam results will be displayed here.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;