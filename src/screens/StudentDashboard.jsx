import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import config from '../config/config.js';
import { useNavigate } from 'react-router-dom';

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
      <div className="space-y-6">
        <h2 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Start Exam
        </h2>

        {/* Available Exams Section */}
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Available Exams
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  } uppercase tracking-wider`}>
                    Exam Name
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  } uppercase tracking-wider`}>
                    Institute
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  } uppercase tracking-wider`}>
                    Total Questions
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  } uppercase tracking-wider`}>
                    Time Limit
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  } uppercase tracking-wider`}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {availableExams.map((exam) => (
                  <tr key={exam._id}>
                    <td className={`px-6 py-4 whitespace-nowrap ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {exam.examName}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {exam.instituteName}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {exam.totalQuestions}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {exam.timeLimit} minutes
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap`}>
                      <button
                        onClick={() => handleStartExam(exam.ipfsHash)}
                        disabled={loading}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        Start Exam
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* IPFS Hash Input Section */}
        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Enter Exam Hash
          </h3>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={ipfsHash}
              onChange={(e) => setIpfsHash(e.target.value)}
              placeholder="Enter IPFS hash provided by your institute"
              className={`flex-1 p-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            />
            <button
              onClick={handleStartExam}
              disabled={loading || !ipfsHash}
              className={`px-6 py-2 rounded-lg ${
                loading || !ipfsHash
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-700'
              } text-white transition-colors`}
            >
              {loading ? 'Starting...' : 'Start Exam'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
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

  const handleSubmitExam = async () => {
    try {
      setExamSubmitting(true);
      setError(null);

      const response = await axios.post(
        `${config.API_BASE_URL}/api/exams/submit`, // Make sure this matches your backend route
        {
          examId: currentExam._id,
          answers: answers
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setActiveTab('results');
        await fetchResults(); // Refresh results after submission
      }
    } catch (error) {
      console.error('Submit exam error:', error);
      setError(error.response?.data?.message || 'Failed to submit exam');
    } finally {
      setExamSubmitting(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const renderExam = () => {
    if (!currentExam || !currentExam.questions) return null;

    const currentQuestion = currentExam.questions[currentQuestionIndex];
    const totalQuestions = currentExam.questions.length;
    const answeredQuestions = Object.keys(answers).length;

    return (
      <div>
        <h2 className={`text-2xl font-bold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {currentExam.examName}
        </h2>
        
        {/* Timer */}
        <div className={`p-4 rounded-lg mb-4 ${
          timeLeft < 300 ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
        }`}>
          Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              {answeredQuestions} of {totalQuestions} answered
            </span>
          </div>
          <div className={`w-full rounded-full h-2.5 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className="bg-violet-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className={`rounded-lg shadow-lg mb-6 p-6 ${
          isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
        }`}>
          <h3 className={`font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {currentQuestion.text}
          </h3>
          <div className="space-y-3">
            {Array.isArray(currentQuestion.options) && currentQuestion.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestionIndex}`}
                  onChange={() => handleAnswerSelect(currentQuestionIndex, optionIndex + 1)}
                  checked={answers[currentQuestionIndex] === optionIndex + 1}
                  disabled={examSubmitting}
                  className={`h-4 w-4 text-violet-600 focus:ring-violet-500 ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-700' 
                      : 'border-gray-300 bg-white'
                  }`}
                />
                <span>
                  {String.fromCharCode(65 + optionIndex)}. {option}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mb-6">
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0 || examSubmitting}
            className={`px-4 py-2 rounded-lg disabled:opacity-50 ${
              isDarkMode 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmitExam}
              disabled={examSubmitting || answeredQuestions !== totalQuestions}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center"
            >
              {examSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Exam'
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              disabled={examSubmitting}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>

        {/* Question Navigation Pills */}
        <div className="flex flex-wrap gap-2">
          {currentExam.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              disabled={examSubmitting}
              className={`w-8 h-8 rounded-full font-medium ${
                answers[index]
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : index === currentQuestionIndex
                  ? 'bg-violet-600 text-white hover:bg-violet-700'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:opacity-50`}
            >
              {index + 1}
            </button>
          ))}
        </div>
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    } uppercase tracking-wider`}>
                      Exam Name
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    } uppercase tracking-wider`}>
                      Score
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    } uppercase tracking-wider`}>
                      Status
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    } uppercase tracking-wider`}>
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {Array.isArray(examResults) && examResults.map((result) => (
                    <tr key={result._id}>
                      <td className={`px-6 py-4 whitespace-nowrap ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {result.exam?.examName || 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {result.exam?.resultsReleased ? (
                          <>
                            {result.score ? `${result.score.toFixed(2)}%` : 'N/A'}
                            <br />
                            <span className="text-sm text-gray-500">
                              ({result.correctAnswers}/{result.totalQuestions} correct)
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Results pending
                          </span>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap`}>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          result.exam?.resultsReleased
                            ? isDarkMode 
                              ? 'bg-green-900/20 text-green-300' 
                              : 'bg-green-100 text-green-800'
                            : isDarkMode
                              ? 'bg-yellow-900/20 text-yellow-300'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {result.exam?.resultsReleased ? 'Released' : 'Pending'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {result.submittedAt 
                          ? new Date(result.submittedAt).toLocaleString()
                          : 'N/A'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`p-6 text-center ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No exam results found
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-100'} min-h-screen p-4 md:p-8`}>
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

      {/* Exit Exam Warning Modal */}
      {isExamMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-4 text-center">
          Warning: Leaving this page will submit your exam automatically
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;