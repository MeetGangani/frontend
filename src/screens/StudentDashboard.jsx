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
      const response = await axios.get('/api/exams/my-results');
      setExamResults(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to fetch exam results');
    } finally {
      setLoading(false);
    }
  };

  const renderStartExam = () => (
    <div>
      <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Start New Exam
      </h2>
      <div className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-lg p-8 shadow-lg`}>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Enter Exam IPFS Hash
            </label>
            <form onSubmit={handleStartExam} className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter the IPFS hash provided by your institute"
                  value={ipfsHash}
                  onChange={(e) => setIpfsHash(e.target.value)}
                  disabled={loading}
                  required
                  className={`flex-1 px-4 py-3 rounded-lg ${
                    isDarkMode 
                      ? 'bg-[#0A0F1C] border-gray-700 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } border focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                />
                <button
                  type="submit"
                  disabled={loading || !ipfsHash.trim()}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 
                    ${loading ? 'cursor-not-allowed opacity-50' : 'hover:bg-violet-500'} 
                    bg-violet-600 text-white`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </div>
                  ) : (
                    'Start Exam'
                  )}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );

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
        setTimeLeft(response.data.timeLimit * 60);
        setAnswers({});
        navigate('/exam');
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

  const submitExam = async () => {
    if (!currentExam) return;

    try {
      setExamSubmitting(true);
      const response = await axios.post('/api/exams/submit', {
        examId: currentExam._id,
        answers
      });
      
      // First fetch fresh results to ensure we have the latest data
      await fetchResults();
      
      // Then update the UI state
      setCurrentExam(null);
      setAnswers({});
      setTimeLeft(null);
      setActiveTab('results');
      
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

  const renderAvailableExams = () => (
    <div>
      <h2 className="text-2xl font-bold mb-4">Available Exams</h2>
      {availableExams.length === 0 ? (
        <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">
          No exams available at the moment.
        </div>
      ) : (
        <div className="space-y-4">
          {availableExams.map((exam) => (
            <div key={exam._id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">{exam.examName}</h3>
              <p className="text-gray-600 mb-2">Institute: {exam.instituteName}</p>
              <p className="text-gray-600 mb-4">
                Total Questions: {exam.totalQuestions}<br />
                Time Limit: {exam.timeLimit} minutes
              </p>
              <button
                onClick={() => handleStartExam(exam.ipfsHash)}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Start Exam
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
              onClick={submitExam}
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
        <h2 className={`text-2xl font-bold mb-6 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          My Results
        </h2>
        
        {examResults.length === 0 ? (
          <div className={`p-4 rounded-lg ${
            isDarkMode 
              ? 'bg-blue-900/20 text-blue-300' 
              : 'bg-blue-50 text-blue-700'
          }`}>
            No exam results available.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className={`min-w-full divide-y ${
              isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              <thead className={isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'}>
                <tr>
                  {['Exam Name', 'Score', 'Correct Answers', 'Status', 'Submission Date'].map((header) => (
                    <th
                      key={header}
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
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
                    {/* Exam Name - Always show */}
                    <td className={`px-6 py-4 whitespace-nowrap ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {result.exam?.examName || 'Loading...'}
                    </td>

                    {/* Score */}
                    <td className={`px-6 py-4 whitespace-nowrap`}>
                      {result.exam?.resultsReleased 
                        ? <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {result.score?.toFixed(2)}%
                          </span>
                        : <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isDarkMode ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            Pending
                          </span>
                      }
                    </td>

                    {/* Correct Answers */}
                    <td className={`px-6 py-4 whitespace-nowrap`}>
                      {result.exam?.resultsReleased
                        ? <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {result.correctAnswers} / {result.totalQuestions}
                          </span>
                        : <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isDarkMode ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            Pending
                          </span>
                      }
                    </td>

                    {/* Status */}
                    <td className={`px-6 py-4 whitespace-nowrap`}>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        result.exam?.resultsReleased 
                          ? isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-100 text-green-800'
                          : isDarkMode ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.exam?.resultsReleased ? 'Released' : 'Pending'}
                      </span>
                    </td>

                    {/* Submission Date - Always show */}
                    <td className={`px-6 py-4 whitespace-nowrap`}>
                      {result.submittedAt 
                        ? <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {new Date(result.submittedAt).toLocaleString()}
                          </span>
                        : <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            isDarkMode ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            Pending
                          </span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  if (loading && !currentExam) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode ? 'bg-[#0A0F1C]' : 'bg-gray-50'
    }`}>
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
            {['start', 'results'].map((tab) => (
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
                {tab === 'start' ? 'Start Exam' : 'My Results'}
              </button>
            ))}
          </nav>
        </div>

        <div>
          {activeTab === 'start' && renderStartExam()}
          {activeTab === 'exam' && currentExam && renderExam()}
          {activeTab === 'results' && renderResultsTab()}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
