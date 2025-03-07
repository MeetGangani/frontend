import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaPlus, FaTrash, FaImage, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { showToast } from '../utils/toast';
import config from '../config/config';

const InstituteExamCreationScreen = () => {
  const { isDarkMode } = useTheme();
  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1); // 1: Metadata, 2: Questions
  
  // Exam metadata
  const [examMetadata, setExamMetadata] = useState({
    examName: '',
    subject: '',
    description: '',
    timeLimit: 60, // in minutes
    passingPercentage: 60,
    instructions: ''
  });
  
  // Questions state
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionImage: null,
    questionImagePreview: null,
    options: [
      { text: '', image: null, imagePreview: null },
      { text: '', image: null, imagePreview: null },
      { text: '', image: null, imagePreview: null },
      { text: '', image: null, imagePreview: null }
    ],
    correctOption: 0
  });
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Refs for file inputs
  const questionImageRef = useRef(null);
  const optionImageRefs = useRef([]);
  
  // Handle metadata input changes
  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setExamMetadata({
      ...examMetadata,
      [name]: name === 'timeLimit' || name === 'passingPercentage' 
        ? parseInt(value) || 0 
        : value
    });
  };
  
  // Validate metadata before proceeding to questions
  const validateMetadata = () => {
    if (!examMetadata.examName.trim()) {
      showToast.error('Exam name is required');
      return false;
    }
    if (!examMetadata.subject.trim()) {
      showToast.error('Subject is required');
      return false;
    }
    if (examMetadata.timeLimit < 5) {
      showToast.error('Time limit must be at least 5 minutes');
      return false;
    }
    if (examMetadata.passingPercentage < 1 || examMetadata.passingPercentage > 100) {
      showToast.error('Passing percentage must be between 1 and 100');
      return false;
    }
    return true;
  };
  
  // Proceed to questions step
  const proceedToQuestions = () => {
    if (validateMetadata()) {
      setCurrentStep(2);
    }
  };
  
  // Handle question text change
  const handleQuestionTextChange = (e) => {
    setCurrentQuestion({
      ...currentQuestion,
      questionText: e.target.value
    });
  };
  
  // Handle option text change
  const handleOptionTextChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      text: value
    };
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions
    });
  };
  
  // Handle correct option selection
  const handleCorrectOptionChange = (index) => {
    setCurrentQuestion({
      ...currentQuestion,
      correctOption: index
    });
  };
  
  // Handle question image upload
  const handleQuestionImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showToast.error('Image size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setCurrentQuestion({
        ...currentQuestion,
        questionImage: file,
        questionImagePreview: reader.result
      });
    };
    reader.readAsDataURL(file);
  };
  
  // Remove question image
  const removeQuestionImage = () => {
    setCurrentQuestion({
      ...currentQuestion,
      questionImage: null,
      questionImagePreview: null
    });
    if (questionImageRef.current) {
      questionImageRef.current.value = '';
    }
  };
  
  // Handle option image upload
  const handleOptionImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showToast.error('Image size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedOptions = [...currentQuestion.options];
      updatedOptions[index] = {
        ...updatedOptions[index],
        image: file,
        imagePreview: reader.result
      };
      
      setCurrentQuestion({
        ...currentQuestion,
        options: updatedOptions
      });
    };
    reader.readAsDataURL(file);
  };
  
  // Remove option image
  const removeOptionImage = (index) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      image: null,
      imagePreview: null
    };
    
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions
    });
    
    if (optionImageRefs.current[index]) {
      optionImageRefs.current[index].value = '';
    }
  };
  
  // Validate current question
  const validateQuestion = () => {
    if (!currentQuestion.questionText.trim() && !currentQuestion.questionImage) {
      showToast.error('Question text or image is required');
      return false;
    }
    
    for (let i = 0; i < currentQuestion.options.length; i++) {
      const option = currentQuestion.options[i];
      if (!option.text.trim() && !option.image) {
        showToast.error(`Option ${i + 1} text or image is required`);
        return false;
      }
    }
    
    return true;
  };
  
  // Add current question to questions list
  const addQuestion = async () => {
    if (validateQuestion()) {
      setIsUploading(true);
      
      try {
        // In a real implementation, you would upload images to your server here
        // For now, we'll just simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Format the question for adding to the list
        const formattedQuestion = {
          questionText: currentQuestion.questionText,
          questionImage: currentQuestion.questionImagePreview,
          options: currentQuestion.options.map((option, idx) => ({
            text: option.text,
            image: option.imagePreview,
            isCorrect: idx === currentQuestion.correctOption
          })),
          correctOption: currentQuestion.correctOption
        };
        
        // Add to questions list
        setQuestions([...questions, formattedQuestion]);
        
        // Reset current question form
        setCurrentQuestion({
          questionText: '',
          questionImage: null,
          questionImagePreview: null,
          options: [
            { text: '', image: null, imagePreview: null },
            { text: '', image: null, imagePreview: null },
            { text: '', image: null, imagePreview: null },
            { text: '', image: null, imagePreview: null }
          ],
          correctOption: 0
        });
        
        // Reset file inputs
        if (questionImageRef.current) {
          questionImageRef.current.value = '';
        }
        
        optionImageRefs.current.forEach(ref => {
          if (ref) {
            ref.value = '';
          }
        });
        
        showToast.success('Question added successfully');
      } catch (error) {
        console.error('Error adding question:', error);
        showToast.error('Failed to add question. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  // Edit a question
  const editQuestion = (index) => {
    const questionToEdit = questions[index];
    
    setCurrentQuestion({
      questionText: questionToEdit.questionText || '',
      questionImage: null,
      questionImagePreview: questionToEdit.questionImage || null,
      options: questionToEdit.options.map(option => ({
        text: option.text || '',
        image: null,
        imagePreview: option.image || null
      })),
      correctOption: questionToEdit.correctOption
    });
    
    // Remove the question from the list
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
    
    // Scroll to the question form
    window.scrollTo({
      top: document.querySelector('.add-question-form').offsetTop - 100,
      behavior: 'smooth'
    });
  };
  
  // Delete a question
  const deleteQuestion = (index) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(index, 1);
      setQuestions(updatedQuestions);
      showToast.success('Question deleted');
    }
  };
  
  // Upload images to server and get URLs
  const uploadImages = async () => {
    setIsUploading(true);
    const formData = new FormData();
    
    // Process questions and collect all images
    const processedQuestions = [...questions];
    let imageCount = 0;
    
    for (let i = 0; i < processedQuestions.length; i++) {
      const question = processedQuestions[i];
      
      // Add question image if exists
      if (question.questionImage) {
        formData.append(`images`, question.questionImage);
        question.questionImageIndex = imageCount++;
      }
      
      // Add option images if they exist
      for (let j = 0; j < question.options.length; j++) {
        if (question.options[j].image) {
          formData.append(`images`, question.options[j].image);
          question.options[j].imageIndex = imageCount++;
        }
      }
    }
    
    try {
      // Only upload if there are images
      let imageUrls = [];
      if (imageCount > 0) {
        const response = await axios.post(
          `${config.API_BASE_URL}/api/exams/upload-images`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            withCredentials: true
          }
        );
        
        imageUrls = response.data.imageUrls;
      }
      
      // Replace image files with URLs
      for (let i = 0; i < processedQuestions.length; i++) {
        const question = processedQuestions[i];
        
        // Replace question image with URL
        if (question.questionImageIndex !== undefined) {
          question.questionImage = imageUrls[question.questionImageIndex];
          delete question.questionImageIndex;
          delete question.questionImagePreview;
        } else {
          question.questionImage = null;
        }
        
        // Replace option images with URLs
        for (let j = 0; j < question.options.length; j++) {
          if (question.options[j].imageIndex !== undefined) {
            question.options[j].image = imageUrls[question.options[j].imageIndex];
            delete question.options[j].imageIndex;
            delete question.options[j].imagePreview;
          } else {
            question.options[j].image = null;
          }
        }
      }
      
      return processedQuestions;
    } catch (error) {
      console.error('Error uploading images:', error);
      showToast.error('Failed to upload images. Please try again.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Submit the exam
  const submitExam = async () => {
    if (questions.length === 0) {
      showToast.error('Please add at least one question');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format the exam data
      const examData = {
        ...examMetadata,
        questions: questions.map(q => ({
          questionText: q.questionText,
          questionImage: q.questionImage,
          options: q.options,
          correctOption: q.correctOption
        })),
        totalQuestions: questions.length
      };
      
      // Submit to API
      const response = await axios.post(
        `${config.API_BASE_URL}/api/exams/create`,
        examData,
        { withCredentials: true }
      );
      
      showToast.success('Exam created successfully');
      navigate('/institute/exams');
    } catch (error) {
      console.error('Error creating exam:', error);
      showToast.error(error.response?.data?.message || 'Failed to create exam');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Go back to metadata step
  const goBackToMetadata = () => {
    setCurrentStep(1);
  };
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0A0F1C] text-white' : 'bg-gray-50 text-gray-900'} pt-20 pb-12`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Create New Exam</h1>
          <button
            onClick={() => navigate('/institute/dashboard')}
            className={`flex items-center px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </button>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= 1 
                  ? 'bg-violet-600 text-white' 
                  : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`mx-4 text-sm font-medium ${
                currentStep >= 1 
                  ? isDarkMode ? 'text-white' : 'text-gray-900' 
                  : isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Exam Details
              </div>
            </div>
            
            <div className={`w-16 h-1 ${
              currentStep >= 2 
                ? 'bg-violet-600' 
                : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`} />
            
            <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= 2 
                  ? 'bg-violet-600 text-white' 
                  : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <div className={`mx-4 text-sm font-medium ${
                currentStep >= 2 
                  ? isDarkMode ? 'text-white' : 'text-gray-900' 
                  : isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Questions
              </div>
            </div>
          </div>
        </div>
        
        {/* Step 1: Exam Metadata */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-xl shadow-lg p-6`}
          >
            <h2 className="text-2xl font-bold mb-6">Exam Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exam Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Exam Name*
                </label>
                <input
                  type="text"
                  name="examName"
                  value={examMetadata.examName}
                  onChange={handleMetadataChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                  placeholder="Enter exam name"
                  required
                />
              </div>
              
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject*
                </label>
                <input
                  type="text"
                  name="subject"
                  value={examMetadata.subject}
                  onChange={handleMetadataChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                  placeholder="Enter subject"
                  required
                />
              </div>
              
              {/* Time Limit */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Time Limit (minutes)*
                </label>
                <input
                  type="number"
                  name="timeLimit"
                  value={examMetadata.timeLimit}
                  onChange={handleMetadataChange}
                  min="5"
                  max="180"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                  required
                />
              </div>
              
              {/* Passing Percentage */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Passing Percentage*
                </label>
                <input
                  type="number"
                  name="passingPercentage"
                  value={examMetadata.passingPercentage}
                  onChange={handleMetadataChange}
                  min="1"
                  max="100"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                  required
                />
              </div>
            </div>
            
            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={examMetadata.description}
                onChange={handleMetadataChange}
                rows="3"
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                placeholder="Enter exam description"
              />
            </div>
            
            {/* Instructions */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Instructions
              </label>
              <textarea
                name="instructions"
                value={examMetadata.instructions}
                onChange={handleMetadataChange}
                rows="4"
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                placeholder="Enter instructions for students"
              />
            </div>
            
            {/* Next Button */}
            <div className="mt-8 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={proceedToQuestions}
                className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                Next: Add Questions
              </motion.button>
            </div>
          </motion.div>
        )}
        
        {/* Step 2: Questions */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Questions List */}
            {questions.length > 0 && (
              <div className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
                <h2 className="text-2xl font-bold mb-6">
                  Questions ({questions.length})
                </h2>
                
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg ${
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                      } flex justify-between items-start`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-bold mr-2">Q{index + 1}:</span>
                          <div>
                            {question.questionText && (
                              <p>{question.questionText}</p>
                            )}
                            {question.questionImagePreview && (
                              <div className="mt-2">
                                <img 
                                  src={question.questionImagePreview} 
                                  alt="Question" 
                                  className="h-20 object-contain rounded-md"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {question.options.map((option, optIndex) => (
                            <div 
                              key={optIndex}
                              className={`p-2 rounded ${
                                question.correctOption === optIndex
                                  ? isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                                  : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                              }`}
                            >
                              <div className="flex items-center">
                                <span className={`mr-2 ${
                                  question.correctOption === optIndex
                                    ? 'text-green-500'
                                    : ''
                                }`}>
                                  {String.fromCharCode(65 + optIndex)}:
                                </span>
                                <div>
                                  {option.text && (
                                    <span>{option.text}</span>
                                  )}
                                  {option.imagePreview && (
                                    <div className="mt-1">
                                      <img 
                                        src={option.imagePreview} 
                                        alt={`Option ${String.fromCharCode(65 + optIndex)}`} 
                                        className="h-12 object-contain rounded-md"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => editQuestion(index)}
                          className={`p-2 rounded-lg ${
                            isDarkMode 
                              ? 'bg-blue-900/50 hover:bg-blue-800 text-blue-300' 
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                          }`}
                          title="Edit question"
                        >
                          <FaPlus className="rotate-45" />
                        </button>
                        <button
                          onClick={() => deleteQuestion(index)}
                          className={`p-2 rounded-lg ${
                            isDarkMode 
                              ? 'bg-red-900/50 hover:bg-red-800 text-red-300' 
                              : 'bg-red-100 hover:bg-red-200 text-red-700'
                          }`}
                          title="Delete question"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add New Question Form */}
            <div className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <h2 className="text-2xl font-bold mb-6">
                {questions.length > 0 ? 'Add Another Question' : 'Add Your First Question'}
              </h2>
              
              {/* Question Text and Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Question Text or Image*
                </label>
                <textarea
                  value={currentQuestion.questionText}
                  onChange={handleQuestionTextChange}
                  rows="3"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-violet-500 focus:border-transparent mb-2`}
                  placeholder="Enter question text"
                />
                
                <div className="flex items-center mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQuestionImageUpload}
                    ref={questionImageRef}
                    className="hidden"
                    id="question-image-upload"
                  />
                  <label
                    htmlFor="question-image-upload"
                    className={`flex items-center px-4 py-2 rounded-lg cursor-pointer ${
                      isDarkMode 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <FaImage className="mr-2" />
                    {currentQuestion.questionImage ? 'Change Image' : 'Add Image'}
                  </label>
                  
                  {currentQuestion.questionImagePreview && (
                    <div className="ml-4 flex items-center">
                      <img 
                        src={currentQuestion.questionImagePreview} 
                        alt="Question Preview" 
                        className="h-16 object-contain rounded-md"
                      />
                      <button
                        type="button"
                        onClick={removeQuestionImage}
                        className={`ml-2 p-1 rounded-full ${
                          isDarkMode 
                            ? 'bg-red-900/50 hover:bg-red-800 text-red-300' 
                            : 'bg-red-100 hover:bg-red-200 text-red-700'
                        }`}
                        title="Remove image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-4">
                  Options*
                </label>
                
                <div className="space-y-4">
                  {currentQuestion.options.map((option, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg ${
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">
                            Option {String.fromCharCode(65 + index)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCorrectOptionChange(index)}
                            className={`ml-2 p-1 rounded-full ${
                              currentQuestion.correctOption === index
                                ? isDarkMode 
                                  ? 'bg-green-900 text-green-300' 
                                  : 'bg-green-500 text-white'
                               
                                : isDarkMode 
                                  ? 'bg-gray-700 text-gray-400' 
                                  : 'bg-gray-200 text-gray-500'
                            }`}
                            title={currentQuestion.correctOption === index ? "Correct answer" : "Mark as correct"}
                          >
                            <FaCheck className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionTextChange(index, e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-violet-500 focus:border-transparent mb-2`}
                        placeholder={`Enter option ${String.fromCharCode(65 + index)} text`}
                      />
                      
                      <div className="flex items-center mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleOptionImageUpload(e, index)}
                          ref={(el) => optionImageRefs.current[index] = el}
                          className="hidden"
                          id={`option-image-upload-${index}`}
                        />
                        <label
                          htmlFor={`option-image-upload-${index}`}
                          className={`flex items-center px-3 py-1 rounded-lg cursor-pointer ${
                            isDarkMode 
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          } text-sm`}
                        >
                          <FaImage className="mr-1" />
                          {option.image ? 'Change Image' : 'Add Image'}
                        </label>
                        
                        {option.imagePreview && (
                          <div className="ml-4 flex items-center">
                            <img 
                              src={option.imagePreview} 
                              alt={`Option ${String.fromCharCode(65 + index)} Preview`} 
                              className="h-12 object-contain rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeOptionImage(index)}
                              className={`ml-2 p-1 rounded-full ${
                                isDarkMode 
                                  ? 'bg-red-900/50 hover:bg-red-800 text-red-300' 
                                  : 'bg-red-100 hover:bg-red-200 text-red-700'
                              }`}
                              title="Remove image"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Add Question Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={isUploading}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    isDarkMode 
                      ? 'bg-violet-700 hover:bg-violet-600 text-white' 
                      : 'bg-violet-600 hover:bg-violet-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Add Question
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Submit Exam Button */}
            {questions.length > 0 && (
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={submitExam}
                  disabled={isSubmitting || questions.length === 0}
                  className={`px-8 py-3 rounded-lg font-medium ${
                    isDarkMode 
                      ? 'bg-green-700 hover:bg-green-600 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Exam'
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InstituteExamCreationScreen;
