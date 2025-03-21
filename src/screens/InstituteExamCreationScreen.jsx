import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { showToast } from '../utils/toast';
import { FaPlus, FaEdit, FaTrash, FaImage, FaFileExcel, FaUpload, FaArrowLeft, FaArrowRight, FaCheck, FaExclamationTriangle, FaTimes, FaBars, FaDownload } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import config from '../config/config';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axiosInstance from '../utils/axiosConfig';
import * as XLSX from 'xlsx';

const InstituteExamCreationScreen = () => { 
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1); // 1: Metadata, 2: Questions
  const [submitting, setSubmitting] = useState(false);

  // Exam metadata
  const [examMetadata, setExamMetadata] = useState({
    examName: '',
    subject: '',
    description: '',
    timeLimit: 60, // in minutes
    passingPercentage: 60,
    numberOfQuestions: 5 // Default to 5 questions
  });
  
  // Questions state
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionImage: null,
    questionImagePreview: null,
    questionType: 'single', // 'single' or 'multiple'
    options: [
      { text: '', image: null, imagePreview: null },
      { text: '', image: null, imagePreview: null },
      { text: '', image: null, imagePreview: null },
      { text: '', image: null, imagePreview: null }
    ],
    correctOption: 0, // For single choice questions
    correctOptions: [] // For multiple choice questions
  });
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  // Add state to track which option is currently being uploaded
  const [currentUploadingOptionIndex, setCurrentUploadingOptionIndex] = useState(null);
  // Add specific state for question image upload
  const [isUploadingQuestionImage, setIsUploadingQuestionImage] = useState(false);
  
  // Refs for file inputs
  const questionImageRef = useRef(null);
  const optionImageRefs = useRef([]);
  
  // Add a state to track if we're editing a question
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  
  // Add a state to track how many questions have been added
  const [questionsRemaining, setQuestionsRemaining] = useState(5);
  
  // Add new state for Excel upload
  const [excelFile, setExcelFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // Add new state for modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Handle metadata input changes
  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    
    // For number inputs, convert to number
    if (name === 'timeLimit' || name === 'passingPercentage' || name === 'numberOfQuestions') {
      const numValue = parseInt(value, 10) || 0;
      
      setExamMetadata({
        ...examMetadata,
        [name]: numValue
      });
      
      // Update questionsRemaining when numberOfQuestions changes
      if (name === 'numberOfQuestions') {
        const remaining = Math.max(0, numValue - questions.length);
        setQuestionsRemaining(remaining);
      }
    } else {
      setExamMetadata({
        ...examMetadata,
        [name]: value
      });
    }
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
      // Calculate remaining questions based on the current questions array and metadata
      const remaining = Math.max(0, examMetadata.numberOfQuestions - questions.length);
      setQuestionsRemaining(remaining);
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
  
  // Handle question type change
  const handleQuestionTypeChange = (type) => {
    setCurrentQuestion({
      ...currentQuestion,
      questionType: type,
      // Reset correct answers when changing question type
      correctOption: type === 'single' ? 0 : -1,
      correctOptions: type === 'multiple' ? [] : []
    });
  };
  
  // Handle correct option change
  const handleCorrectOptionChange = (index) => {
    if (currentQuestion.questionType === 'single') {
      // For single choice, just set the correctOption
      setCurrentQuestion({
        ...currentQuestion,
        correctOption: index
      });
    } else {
      // For multiple choice, toggle the option in the correctOptions array
      const updatedCorrectOptions = [...currentQuestion.correctOptions];
      
      if (updatedCorrectOptions.includes(index)) {
        // Remove if already selected
        const optionIndex = updatedCorrectOptions.indexOf(index);
        updatedCorrectOptions.splice(optionIndex, 1);
      } else {
        // Add if not selected
        updatedCorrectOptions.push(index);
      }
      
      setCurrentQuestion({
        ...currentQuestion,
        correctOptions: updatedCorrectOptions
      });
    }
  };
  
  // Handle question image upload
  const handleQuestionImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showToast.error('Image size should be less than 5MB');
      return;
    }
    
    try {
      setIsUploadingQuestionImage(true);
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Create form data
      const formData = new FormData();
      formData.append('images', file);
      
      // Upload to server
      const response = await axiosInstance.post(
        `/api/exams/upload-images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
          withCredentials: true,
          timeout: 30000 // 30 seconds timeout
        }
      );
      
      if (!response.data || !response.data.imageUrls || !response.data.imageUrls[0]) {
        throw new Error('Invalid response from server');
      }

      // Update the question with the image URL
      setCurrentQuestion({
        ...currentQuestion,
        questionImage: response.data.imageUrls[0],
        questionImagePreview: previewUrl
      });
      
      showToast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Clean up preview URL
      if (currentQuestion.questionImagePreview) {
        URL.revokeObjectURL(currentQuestion.questionImagePreview);
      }
      
      // Show appropriate error message
      let errorMessage = 'Failed to upload image';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Please try again.';
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showToast.error(errorMessage);
    } finally {
      setIsUploadingQuestionImage(false);
      // Reset file input
      if (questionImageRef.current) {
        questionImageRef.current.value = '';
      }
    }
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
  const handleOptionImageUpload = async (e, optionIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showToast.error('Image size should be less than 5MB');
      return;
    }
    
    try {
      setIsUploading(true);
      setCurrentUploadingOptionIndex(optionIndex);
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Create form data
      const formData = new FormData();
      formData.append('images', file);
      
      // Upload to server
      const response = await axiosInstance.post(
        `/api/exams/upload-images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
          withCredentials: true,
          timeout: 30000 // 30 seconds timeout
        }
      );
      
      if (!response.data || !response.data.imageUrls || !response.data.imageUrls[0]) {
        throw new Error('Invalid response from server');
      }

      // Update the option with the image URL
      const updatedOptions = [...currentQuestion.options];
      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        image: response.data.imageUrls[0],
        imagePreview: previewUrl
      };
      
      setCurrentQuestion({
        ...currentQuestion,
        options: updatedOptions
      });
      
      showToast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Clean up preview URL
      const currentPreview = currentQuestion.options[optionIndex]?.imagePreview;
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
      
      // Show appropriate error message
      let errorMessage = 'Failed to upload image';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Please try again.';
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      showToast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setCurrentUploadingOptionIndex(null);
      // Reset file input
      if (optionImageRefs.current[optionIndex]) {
        optionImageRefs.current[optionIndex].value = '';
      }
    }
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
    if (!currentQuestion.questionText.trim() && !currentQuestion.questionImagePreview) {
      showToast.error('Question text or image is required');
      return false;
    }
    
    let hasEmptyOption = false;
    currentQuestion.options.forEach(option => {
      if (!option.text.trim() && !option.imagePreview) {
        hasEmptyOption = true;
      }
    });
    
    if (hasEmptyOption) {
      showToast.error('All options must have text or an image');
      return false;
    }
    
    // Check if at least one correct option is selected
    if (currentQuestion.questionType === 'single' && currentQuestion.correctOption === -1) {
      showToast.error('Please select a correct answer');
      return false;
    }
    
    if (currentQuestion.questionType === 'multiple' && currentQuestion.correctOptions.length === 0) {
      showToast.error('Please select at least one correct answer');
      return false;
    }
    
    return true;
  };
  
  // Modify the editQuestion function
  const editQuestion = (index) => {
    const questionToEdit = questions[index];
    
    setCurrentQuestion({
      questionText: questionToEdit.questionText || '',
      questionImage: null,
      questionImagePreview: questionToEdit.questionImage || null,
      questionType: questionToEdit.questionType || 'single',
      options: questionToEdit.options.map(option => ({
        text: option.text || '',
        image: null,
        imagePreview: option.image || null
      })),
      correctOption: questionToEdit.correctOption || 0,
      correctOptions: questionToEdit.correctOptions || []
    });
    
    setEditingQuestionIndex(index);
    setIsEditModalOpen(true); // Open the modal
  };
  
  // Add closeEditModal function
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    cancelEdit();
  };
  
  // Modify the addQuestion function
  const addQuestion = async () => {
    // Check if we're at the limit and not editing
    if (questions.length >= examMetadata.numberOfQuestions && editingQuestionIndex === null) {
      showToast.error(`You can only add ${examMetadata.numberOfQuestions} questions`);
      return;
    }
    
    // Validate question
    if (!currentQuestion.questionText.trim() && !currentQuestion.questionImagePreview) {
      showToast.error('Question text or image is required');
      return;
    }
    
    let hasEmptyOption = false;
    currentQuestion.options.forEach(option => {
      if (!option.text.trim() && !option.imagePreview) {
        hasEmptyOption = true;
      }
    });
    
    if (hasEmptyOption) {
      showToast.error('All options must have text or an image');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Process images if needed
      const processedQuestion = {...currentQuestion};
      
      // Upload question image if it exists and is a File object
      if (processedQuestion.questionImage && processedQuestion.questionImage instanceof File) {
        const questionImageUrl = await uploadImage(processedQuestion.questionImage);
        processedQuestion.questionImage = questionImageUrl;
      }
      
      // Upload option images if they exist and are File objects
      for (let i = 0; i < processedQuestion.options.length; i++) {
        if (processedQuestion.options[i].image && processedQuestion.options[i].image instanceof File) {
          const optionImageUrl = await uploadImage(processedQuestion.options[i].image);
          processedQuestion.options[i].image = optionImageUrl;
        }
      }
      
      // Update questions array
      if (editingQuestionIndex !== null) {
        // We're editing an existing question
        const updatedQuestions = [...questions];
        updatedQuestions[editingQuestionIndex] = processedQuestion;
        setQuestions(updatedQuestions);
        setEditingQuestionIndex(null);
        setIsEditModalOpen(false); // Close the modal
        showToast.success('Question updated successfully');
      } else {
        // We're adding a new question
        setQuestions([...questions, processedQuestion]);
        showToast.success('Question added successfully');
      }
      
      // Reset current question
      setCurrentQuestion({
        questionText: '',
        questionImage: null,
        questionImagePreview: null,
        questionType: 'single',
        options: [
          { text: '', image: null, imagePreview: null },
          { text: '', image: null, imagePreview: null },
          { text: '', image: null, imagePreview: null },
          { text: '', image: null, imagePreview: null }
        ],
        correctOption: 0,
        correctOptions: []
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
      
      // After successfully adding/updating a question, check if we've reached the limit
      if (editingQuestionIndex === null) {
        const newQuestionsCount = questions.length + 1;
        if (newQuestionsCount >= examMetadata.numberOfQuestions) {
          setQuestionsRemaining(0);
        } else {
          setQuestionsRemaining(examMetadata.numberOfQuestions - newQuestionsCount);
        }
      }
    } catch (error) {
      console.error('Error processing question:', error);
      showToast.error('Failed to process question images');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Delete a question
  const deleteQuestion = (index) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(index, 1);
      setQuestions(updatedQuestions);
      
      // Increment questionsRemaining when a question is deleted
      setQuestionsRemaining(prev => prev + 1);
      
      showToast.success('Question deleted');
    }
  };
  
  // Delete all questions
  const deleteAllQuestions = () => {
    if (window.confirm('Are you sure you want to delete all questions? This action cannot be undone.')) {
      setQuestions([]);
      setQuestionsRemaining(examMetadata.numberOfQuestions);
      showToast.success('All questions deleted');
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
  
  // Add this function to format questions according to the schema
  const formatQuestionsForSubmission = (questions) => {
    return questions.map(q => ({
      question: q.questionText,
      options: q.options.map(opt => opt.text),
      questionType: q.questionType,
      allowMultiple: q.questionType === 'multiple',
      correctAnswer: q.questionType === 'single' 
        ? q.correctOption + 1  // Convert to 1-based index for single choice
        : q.correctOptions.map(opt => opt + 1) // Convert to 1-based index for multiple choice
    }));
  };

  // Handle exam submission
  const handleSubmitExam = async () => {
    if (questions.length === 0) {
      showToast.error('Please add at least one question');
      return;
    }

    if (questions.length < examMetadata.numberOfQuestions) {
      showToast.error(`Please add ${examMetadata.numberOfQuestions} questions as specified in exam settings`);
      return;
    }

    setSubmitting(true);
    try {
      // Prepare the exam data with all question details including images
      const examData = {
        examName: examMetadata.examName,
        description: examMetadata.description,
        subject: examMetadata.subject,
        timeLimit: examMetadata.timeLimit,
        passingPercentage: examMetadata.passingPercentage,
        questions: questions.map(q => ({
          questionText: q.questionText,
          questionImage: q.questionImage,
          questionType: q.questionType,
          allowMultiple: q.questionType === 'multiple',
          options: q.options.map(opt => ({
            text: typeof opt === 'string' ? opt : (opt.text || ''),
            image: typeof opt === 'string' ? null : (opt.image || null)
          })),
          correctAnswer: q.questionType === 'multiple'
            ? q.correctOptions.map(index => index + 1)  // Convert to 1-based index for multiple choice
            : q.correctOption + 1  // Convert to 1-based index for single choice
        }))
      };

      // Submit the exam using the correct endpoint
      const response = await axiosInstance.post('/api/exams/create-binary', examData);
      
      if (response.data && response.data.message) {
        showToast.success(response.data.message);
        navigate('/institute/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      showToast.error(error.response?.data?.error || 'Failed to create exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Go back to metadata step
  const goBackToMetadata = () => {
    setCurrentStep(1);
  };
  
  // Update the button text based on whether we're editing or adding
  const getActionButtonText = () => {
    if (editingQuestionIndex !== null) {
      return isUploading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Updating...
        </>
      ) : (
        <>
          <FaCheck className="mr-2" />
          Update Question
        </>
      );
    } else {
      return isUploading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Adding...
        </>
      ) : (
        <>
          <FaPlus className="mr-2" />
          Add Question
        </>
      );
    }
  };
  
  // Add a cancel edit button
  const cancelEdit = () => {
    setEditingQuestionIndex(null);
    
    // Reset the current question form
    setCurrentQuestion({
      questionText: '',
      questionImage: null,
      questionImagePreview: null,
      questionType: 'single',
      options: [
        { text: '', image: null, imagePreview: null },
        { text: '', image: null, imagePreview: null },
        { text: '', image: null, imagePreview: null },
        { text: '', image: null, imagePreview: null }
      ],
      correctOption: 0,
      correctOptions: []
    });
    
    // Check if we've already added all questions
    if (questions.length >= examMetadata.numberOfQuestions) {
      setQuestionsRemaining(0);
    }
  };
  
  // Keep only one version of handleFileSelect
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        showToast.error('Please select a valid Excel file (.xlsx or .xls)');
        e.target.value = '';
        return;
      }
      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('File size should be less than 5MB');
        e.target.value = '';
        return;
      }
      setExcelFile(file);
    }
  };

  // Handle Excel upload and processing
  const handleExcelUpload = async (e) => {
    if (!excelFile) {
      showToast.error("Please select an Excel file first");
      return;
    }

    setIsUploadingExcel(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);

      // Use your backend proxy endpoint instead of calling the Excel processor directly
      const response = await axiosInstance.post(
        "/api/proxy/excel",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      console.log("Excel processor response:", response.data);

      if (response.data && response.data.questions) {
        // Check if we got any errors back
        if (response.data.errors && response.data.errors.length > 0) {
          // Show errors but continue with valid questions
          response.data.errors.forEach(error => {
            showToast.error(error);
          });
        }

        // Transform the questions from Excel format to our app format
        const transformedQuestions = response.data.questions.map((q, idx) => {
          // Log the raw question for debugging
          console.log(`Processing question ${idx + 1}:`, q);
          
          // Ensure we have the question text
          const questionText = q.questionText || '';
          
          // Determine if it's single or multiple choice based on the questionType from backend
          const isMultipleChoice = q.questionType === 'multiple';
          
          // Format options - ensure we have 4 options with proper structure
          const formattedOptions = Array.isArray(q.options) ? q.options.map(opt => {
            if (typeof opt === 'string') {
              return { text: opt, image: null, imagePreview: null };
            }
            return { 
              text: opt.text || '', 
              image: opt.image || null, 
              imagePreview: opt.imagePreview || null 
            };
          }) : [];

          // Ensure we have at least 4 options
          while (formattedOptions.length < 4) {
            formattedOptions.push({ text: '', image: null, imagePreview: null });
          }
          
          if (isMultipleChoice) {
            // For multiple-choice questions
            let correctOptions = [];
            
            if (Array.isArray(q.correctOptions) && q.correctOptions.length > 0) {
              // The backend provides 0-based indices in correctOptions
              correctOptions = q.correctOptions;
              console.log(`Question ${idx + 1} (multiple): Using correctOptions:`, correctOptions);
            } else {
              console.log(`Question ${idx + 1} (multiple): No valid correctOptions found, using empty array`);
            }
            
            return {
              questionText,
              questionImage: null,
              questionImagePreview: null,
              questionType: 'multiple',
              options: formattedOptions,
              correctOption: 0, // Default value for multiple-choice
              correctOptions: correctOptions // Use the array directly
            };
          } else {
            // For single-choice questions
            // The backend provides 0-based index in correctOption
            let correctOption = 0;
            
            if (typeof q.correctOption === 'number' && q.correctOption >= 0) {
              correctOption = q.correctOption;
              console.log(`Question ${idx + 1} (single): Using correctOption:`, correctOption);
            } else {
              console.log(`Question ${idx + 1} (single): No valid correctOption found, using default (0)`);
            }
            
            return {
              questionText,
              questionImage: null,
              questionImagePreview: null,
              questionType: 'single',
              options: formattedOptions,
              correctOption: correctOption,
              correctOptions: [] // Empty array for single-choice
            };
          }
        });

        // Add the questions to our state
        setQuestions([...questions, ...transformedQuestions]);
        
        // Calculate remaining questions
        const newQuestionsCount = questions.length + transformedQuestions.length;
        if (newQuestionsCount >= examMetadata.numberOfQuestions) {
          setQuestionsRemaining(0);
        } else {
          setQuestionsRemaining(examMetadata.numberOfQuestions - newQuestionsCount);
        }
        
        // Reset the file input
        setExcelFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        showToast.success(`Imported ${transformedQuestions.length} questions from Excel`);
      } else {
        showToast.error('No questions were found in the Excel file');
      }
    } catch (error) {
      console.error('Excel upload error:', error);
      
      let errorMessage = 'Failed to process Excel file. Please ensure it follows the correct format.';
      
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast.error(errorMessage);
    } finally {
      setIsUploadingExcel(false);
    }
  };

  // Function to download sample Excel file
  const downloadSampleExcel = () => {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      // Header row
      ['Sr. No.', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer'],
      
      // Sample data rows
      [1, 'What is the capital of France?', 'London', 'Berlin', 'Paris', 'Madrid', 'C'],
      [2, 'Which planet is known as the Red Planet?', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'B'],
      [3, 'What is 2+2?', '3', '4', '5', '6', 'B'],
      [4, 'Which of these are primary colors? (Select all that apply)', 'Red', 'Green', 'Blue', 'Yellow', 'A,C,D'],
      [5, 'Who wrote "Romeo and Juliet"?', 'Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain', 'B'],
      
      // Empty row before notes
      [],
      
      // Notes section
      ['Notes:'],
      ['1. For single-choice questions, enter the letter of the correct option (A, B, C, or D) in the "Correct Answer" column.'],
      ['2. For multiple-choice questions, enter the letters of all correct options separated by commas (e.g., "A,C,D") in the "Correct Answer" column.'],
      ['3. The system will automatically detect if a question is multiple-choice based on the format of the "Correct Answer" column.'],
      ['4. All columns are required. Each question must have at least 2 options.']
    ]);
    
    // Set column widths
    const columnWidths = [
      { wch: 10 },  // Sr. No.
      { wch: 50 },  // Question
      { wch: 20 },  // Option A
      { wch: 20 },  // Option B
      { wch: 20 },  // Option C
      { wch: 20 },  // Option D
      { wch: 20 }   // Correct Answer
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Exam Format');
    
    // Generate xlsx file and trigger download
    XLSX.writeFile(workbook, 'sample_exam_format.xlsx');
    
    showToast.success('Sample Excel file downloaded. Use this format to create your exam questions.');
  };

  // Update the Excel upload button section in your JSX
  const renderExcelUploadSection = () => (
    <div className={`mb-8 p-6 rounded-2xl ${
      isDarkMode 
        ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
        : 'bg-white border border-gray-200'
    } shadow-xl`}>
      <h3 className="text-lg font-semibold mb-4">Import Questions</h3>
      <div className="flex items-center space-x-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".xlsx,.xls"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingExcel}
          className={`flex items-center px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } ${isUploadingExcel ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FaFileExcel className="mr-2" />
          Select Excel File
        </button>
        {excelFile && (
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {excelFile.name}
          </span>
        )}
        
        <button
          onClick={downloadSampleExcel}
          className={`flex items-center px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
          }`}
        >
          <FaDownload className="mr-2" /> Download Sample Format
        </button>
      </div>
      <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Download a sample Excel file with the correct format for your questions
      </p>
      {excelFile && (
        <button
          type="button"
          onClick={handleExcelUpload}
          disabled={isUploadingExcel}
          className={`mt-4 flex items-center px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            isUploadingExcel
              ? 'opacity-70 cursor-not-allowed'
              : isDarkMode
              ? 'bg-violet-600 hover:bg-violet-700'
              : 'bg-violet-600 hover:bg-violet-700'
          } text-white`}
        >
          {isUploadingExcel ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <FaUpload className="mr-2" />
              Upload and Process
            </>
          )}
        </button>
      )}
    </div>
  );

  // Add handleDragEnd function for drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;

    const updatedQuestions = Array.from(questions);
    const [movedQuestion] = updatedQuestions.splice(sourceIndex, 1);
    updatedQuestions.splice(destinationIndex, 0, movedQuestion);

    setQuestions(updatedQuestions);
  };

  // Function to handle manual reordering through dropdown
  const handleQuestionReorder = (questionIndex, newPosition) => {
    if (questionIndex === newPosition) return;

    const updatedQuestions = [...questions];
    const [movedQuestion] = updatedQuestions.splice(questionIndex, 1);
    updatedQuestions.splice(newPosition, 0, movedQuestion);
    setQuestions(updatedQuestions);
  };

  // Update the renderQuestion function to handle multiple-choice questions
  const renderQuestion = (question, index) => (
    <Draggable key={index} draggableId={`question-${index}`} index={index}>
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`p-6 rounded-xl transition-all duration-200 ${
            isDarkMode 
              ? snapshot.isDragging 
                ? 'bg-gray-800 ring-2 ring-violet-500 shadow-lg'
                : 'bg-gray-800 shadow-md border border-gray-700 hover:border-gray-600'
              : snapshot.isDragging 
                ? 'bg-white ring-2 ring-violet-500 shadow-lg'
                : 'bg-white shadow-md border border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium mr-2 ${
                  isDarkMode
                    ? 'bg-violet-600/20 text-violet-400'
                    : 'bg-violet-100 text-violet-700'
                }`}>
                  {index + 1}
                </span>
                
                <span className={`text-xs font-medium uppercase tracking-wider px-2 py-1 rounded ${
                  question.questionType === 'multiple'
                    ? isDarkMode 
                      ? 'bg-indigo-900/50 text-indigo-400' 
                      : 'bg-indigo-100 text-indigo-700'
                    : isDarkMode 
                      ? 'bg-violet-900/50 text-violet-400' 
                      : 'bg-violet-100 text-violet-700'
                }`}>
                  {question.questionType === 'multiple' ? 'Multiple Choice' : 'Single Choice'}
                </span>
              </div>
              
              <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {question.questionText}
              </h3>
              
              {question.questionImage && (
                <div className="mb-4">
                  <img 
                    src={question.questionImage} 
                    alt="Question" 
                    className="max-h-32 rounded-lg object-contain"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <div 
                    key={optIndex}
                    className={`flex items-center p-3 rounded-lg ${
                      // For single-choice questions
                      question.questionType === 'single' && question.correctOption === optIndex
                        ? isDarkMode 
                          ? 'bg-green-900/20 border border-green-800/50' 
                          : 'bg-green-50 border border-green-200'
                        // For multiple-choice questions
                        : question.questionType === 'multiple' && question.correctOptions.includes(optIndex)
                          ? isDarkMode 
                            ? 'bg-green-900/20 border border-green-800/50' 
                            : 'bg-green-50 border border-green-200'
                          // Non-correct options
                          : isDarkMode 
                            ? 'bg-gray-700/50 border border-gray-700' 
                            : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full mr-3 ${
                      // For single-choice questions
                      question.questionType === 'single' && question.correctOption === optIndex
                        ? isDarkMode 
                          ? 'bg-green-600/80 text-white' 
                          : 'bg-green-600 text-white'
                        // For multiple-choice questions
                        : question.questionType === 'multiple' && question.correctOptions.includes(optIndex)
                          ? isDarkMode 
                            ? 'bg-green-600/80 text-white' 
                            : 'bg-green-600 text-white'
                          // Non-correct options
                          : isDarkMode 
                            ? 'bg-gray-700 text-gray-400' 
                            : 'bg-white text-gray-600 border border-gray-300'
                    }`}>
                      {/* Show checkmark for correct options */}
                      {(question.questionType === 'single' && question.correctOption === optIndex) || 
                       (question.questionType === 'multiple' && question.correctOptions.includes(optIndex)) ? (
                        <FaCheck size={12} />
                      ) : (
                        String.fromCharCode(65 + optIndex)
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
                        {option.text}
                      </span>
                    </div>
                    
                    {option.image && (
                      <div className="ml-2">
                        <img 
                          src={option.image} 
                          alt={`Option ${String.fromCharCode(65 + optIndex)}`} 
                          className="h-10 w-10 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col items-center ml-4">
              <div {...provided.dragHandleProps} className="mb-2">
                <FaBars className={`cursor-move ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => editQuestion(index)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Edit question"
                >
                  <FaEdit />
                </button>
                <button
                  type="button"
                  onClick={() => deleteQuestion(index)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' 
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                  }`}
                  title="Delete question"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </Draggable>
  );

  // Modify your questions list rendering to use DragDropContext
  const renderQuestionsList = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="questions">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-4"
          >
            {questions.map((question, index) => renderQuestion(question, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );

  // Add EditQuestionModal component
  const EditQuestionModal = () => {
    if (!isEditModalOpen) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg ${
              isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'
            } p-6`}
          >
            {/* Close button */}
            <button
              onClick={closeEditModal}
              className={`absolute top-4 right-4 p-2 rounded-full ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <FaTimes />
            </button>
            
            <h2 className="text-2xl font-bold mb-6">
              Edit Question {editingQuestionIndex + 1}
            </h2>
            
            {/* Question form content */}
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
                  id="question-image-upload-modal"
                />
                <label
                  htmlFor="question-image-upload-modal"
                  className={`flex items-center px-4 py-2 rounded-lg cursor-pointer ${
                    isDarkMode 
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } ${isUploadingQuestionImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploadingQuestionImage ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaImage className="mr-2" />
                      {currentQuestion.questionImage ? 'Change Image' : 'Add Image'}
                    </>
                  )}
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
                      disabled={isUploadingQuestionImage}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Question Type Selection */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Question Type
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleQuestionTypeChange('single')}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    currentQuestion.questionType === 'single'
                      ? 'bg-violet-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">○</span>
                  Single Choice
                </button>
                <button
                  type="button"
                  onClick={() => handleQuestionTypeChange('multiple')}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    currentQuestion.questionType === 'multiple'
                      ? 'bg-violet-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">☐</span>
                  Multiple Choice
                </button>
              </div>
              {currentQuestion.questionType === 'multiple' && (
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Students will be able to select multiple answers for this question
                </p>
              )}
            </div>
            
            {/* Options */}
            <div className="space-y-4">
              <label className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Options {currentQuestion.questionType === 'multiple' && '(Select all correct answers)'}
              </label>
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => handleCorrectOptionChange(index)}
                      className={`mt-2 p-2 rounded-lg transition-colors ${
                        currentQuestion.questionType === 'single'
                          ? currentQuestion.correctOption === index
                            ? 'bg-green-500 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-100 text-gray-700'
                          : currentQuestion.correctOptions.includes(index)
                            ? 'bg-green-500 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {currentQuestion.questionType === 'single' ? (
                        <span className="block w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                          {currentQuestion.correctOption === index && (
                            <span className="block w-2 h-2 rounded-full bg-current" />
                          )}
                        </span>
                      ) : (
                        <span className="block w-4 h-4 rounded border-2 border-current flex items-center justify-center">
                          {currentQuestion.correctOptions.includes(index) && (
                            <span className="block w-2 h-2 bg-current" />
                          )}
                        </span>
                      )}
                    </button>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionTextChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className={`w-full px-4 py-2 rounded-lg ${
                          isDarkMode
                            ? 'bg-gray-800 text-white border-gray-700 focus:border-violet-500'
                            : 'bg-white text-gray-900 border-gray-300 focus:border-violet-500'
                        } border focus:ring-2 focus:ring-violet-200 transition-colors`}
                      />
                    </div>
                  </div>
                  
                  {/* Option Image Upload */}
                  <div className="flex items-center gap-4 ml-10">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleOptionImageUpload(e, index)}
                      ref={(el) => (optionImageRefs.current[index] = el)}
                      className="hidden"
                      id={`option-image-upload-${index}`}
                    />
                    <label
                      htmlFor={`option-image-upload-${index}`}
                      className={`flex items-center px-3 py-1 rounded-lg cursor-pointer transition-all duration-200 ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                      } ${isUploading && currentUploadingOptionIndex === index ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isUploading && currentUploadingOptionIndex === index ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FaImage className="mr-2" size={14} />
                          {option.image ? 'Change Image' : 'Add Image'}
                        </>
                      )}
                    </label>
                    
                    {option.image && (
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded overflow-hidden border border-gray-300">
                          <img 
                            src={option.imagePreview || option.image} 
                            alt={`Option ${index + 1}`} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOptionImage(index)}
                          className={`p-1 rounded-full ${
                            isDarkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-500 hover:bg-red-200'
                          }`}
                          title="Remove image"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              {editingQuestionIndex !== null && (
                <button
                  type="button"
                  onClick={closeEditModal}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={addQuestion}
                disabled={isUploading || isUploadingQuestionImage}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-violet-600 hover:bg-violet-700 text-white' 
                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  getActionButtonText()
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0A0F1C] text-white' : 'bg-gray-50 text-gray-900'} pt-24 pb-12`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with improved styling */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Create New Exam</h1>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Set up your exam details and add questions
            </p>
          </div>
          <button
            onClick={() => navigate('/institute/dashboard')}
            className={`flex items-center px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
                : 'bg-white hover:bg-gray-50 text-gray-700 shadow-sm border border-gray-200'
            }`}
          >
            <FaArrowLeft className="mr-2 h-4 w-4" /> Back
          </button>
        </div>
        
        {/* Progress Steps with improved visual feedback */}
        <div className="mb-10">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-semibold transition-all duration-200 ${
                currentStep >= 1 
                  ? isDarkMode
                    ? 'bg-violet-600 text-white ring-4 ring-violet-500/20' 
                    : 'bg-violet-600 text-white ring-4 ring-violet-500/20'
                  : isDarkMode 
                    ? 'bg-gray-800 text-gray-400' 
                    : 'bg-gray-100 text-gray-500'
              }`}>
                1
              </div>
              <div className={`ml-4 text-base font-medium ${
                currentStep >= 1 
                  ? isDarkMode ? 'text-white' : 'text-gray-900' 
                  : isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Exam Details
              </div>
            </div>
            
            <div className={`w-24 h-1 mx-8 rounded ${
              currentStep >= 2 
                ? 'bg-violet-600' 
                : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`} />
            
            <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-semibold transition-all duration-200 ${
                currentStep >= 2 
                  ? isDarkMode
                    ? 'bg-violet-600 text-white ring-4 ring-violet-500/20' 
                    : 'bg-violet-600 text-white ring-4 ring-violet-500/20'
                  : isDarkMode 
                    ? 'bg-gray-800 text-gray-400' 
                    : 'bg-gray-100 text-gray-500'
              }`}>
                2
              </div>
              <div className={`ml-4 text-base font-medium ${
                currentStep >= 2 
                  ? isDarkMode ? 'text-white' : 'text-gray-900' 
                  : isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Questions
              </div>
            </div>
          </div>
        </div>
        
        {/* Step 1: Exam Metadata with improved card styling */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              isDarkMode 
                ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
                : 'bg-white border border-gray-200'
            } rounded-2xl shadow-xl p-8`}
          >
            <h2 className="text-2xl font-bold mb-8">Exam Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  className={`w-full px-4 py-3 rounded-lg border text-base transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-900/50 border-gray-600 text-white focus:border-violet-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-violet-500'
                  } focus:ring-2 focus:ring-violet-500/20 focus:outline-none`}
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
                  className={`w-full px-4 py-3 rounded-lg border text-base transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-900/50 border-gray-600 text-white focus:border-violet-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-violet-500'
                  } focus:ring-2 focus:ring-violet-500/20 focus:outline-none`}
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
                  className={`w-full px-4 py-3 rounded-lg border text-base transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-900/50 border-gray-600 text-white focus:border-violet-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-violet-500'
                  } focus:ring-2 focus:ring-violet-500/20 focus:outline-none`}
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
                  className={`w-full px-4 py-3 rounded-lg border text-base transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-900/50 border-gray-600 text-white focus:border-violet-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-violet-500'
                  } focus:ring-2 focus:ring-violet-500/20 focus:outline-none`}
                  required
                />
              </div>
            </div>
            
            {/* Description */}
            <div className="mt-8">
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={examMetadata.description}
                onChange={handleMetadataChange}
                rows="4"
                className={`w-full px-4 py-3 rounded-lg border text-base transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-900/50 border-gray-600 text-white focus:border-violet-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-violet-500'
                } focus:ring-2 focus:ring-violet-500/20 focus:outline-none`}
                placeholder="Enter exam description"
              />
            </div>
            
            {/* Number of Questions */}
            <div className="mt-8">
              <label className="block text-sm font-medium mb-2">
                Number of Questions*
              </label>
              <input
                type="number"
                name="numberOfQuestions"
                value={examMetadata.numberOfQuestions}
                onChange={handleMetadataChange}
                min="1"
                max="20"
                className={`w-full px-4 py-3 rounded-lg border text-base transition-colors duration-200 ${
                  isDarkMode 
                    ? 'bg-gray-900/50 border-gray-600 text-white focus:border-violet-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-violet-500'
                } focus:ring-2 focus:ring-violet-500/20 focus:outline-none`}
                required
              />
            </div>
            
            {/* Next Button */}
            <div className="mt-10 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={proceedToQuestions}
                className={`px-8 py-3 rounded-lg font-medium text-white bg-violet-600 hover:bg-violet-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                  isDarkMode ? 'ring-offset-gray-900' : 'ring-offset-white'
                }`}
              >
                Next: Add Questions
              </motion.button>
            </div>
          </motion.div>
        )}
        
        {/* Step 2: Questions with improved styling */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Excel upload section with improved styling */}
            <div className={`mb-8 p-6 rounded-2xl ${
              isDarkMode 
                ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
                : 'bg-white border border-gray-200'
            } shadow-xl`}>
              <h3 className="text-lg font-semibold mb-4">Import Questions</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingExcel}
                  className={`flex items-center px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  } ${isUploadingExcel ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FaFileExcel className="mr-2" />
                  Select Excel File
                </button>
                {excelFile && (
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {excelFile.name}
                  </span>
                )}
                
                <button
                  onClick={downloadSampleExcel}
                  className={`flex items-center px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
                >
                  <FaDownload className="mr-2" /> Download Sample Format
                </button>
              </div>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Download a sample Excel file with the correct format for your questions
              </p>
              {excelFile && (
                <button
                  type="button"
                  onClick={handleExcelUpload}
                  disabled={isUploadingExcel}
                  className={`mt-4 flex items-center px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    isUploadingExcel
                      ? 'opacity-70 cursor-not-allowed'
                      : isDarkMode
                      ? 'bg-violet-600 hover:bg-violet-700'
                      : 'bg-violet-600 hover:bg-violet-700'
                  } text-white`}
                >
                  {isUploadingExcel ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaUpload className="mr-2" />
                      Upload and Process
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Questions Progress with improved styling */}
            <div className={`mb-8 p-6 rounded-2xl ${
              isDarkMode 
                ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
                : 'bg-white border border-gray-200'
            } shadow-xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Questions Progress
                </h2>
                <div className="flex items-center gap-3">
                  {questions.length > 0 && (
                    <button
                      type="button"
                      onClick={deleteAllQuestions}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center ${
                        isDarkMode 
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 ring-1 ring-red-400/30' 
                          : 'bg-red-50 hover:bg-red-100 text-red-600 ring-1 ring-red-600/20'
                      }`}
                    >
                      <FaTrash size={12} className="mr-1.5" />
                      Delete All
                    </button>
                  )}
                  <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    questionsRemaining === 0
                      ? isDarkMode 
                        ? 'bg-green-500/10 text-green-400 ring-1 ring-green-400/30' 
                        : 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                      : isDarkMode 
                        ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-400/30' 
                        : 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
                  }`}>
                    {questionsRemaining === 0 
                      ? 'All questions added!' 
                      : `${questionsRemaining} question${questionsRemaining !== 1 ? 's' : ''} remaining`}
                  </div>
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                  <div 
                    className="transition-all duration-300 ease-out bg-violet-600 rounded-full"
                    style={{ 
                      width: `${Math.min(100, (questions.length / examMetadata.numberOfQuestions) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Questions List */}
            {questions.length > 0 && (
              <div className={`mb-8 p-6 rounded-2xl ${
                isDarkMode 
                  ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
                  : 'bg-white border border-gray-200'
              } shadow-xl`}>
                <h2 className="text-2xl font-bold mb-6">
                  Questions ({questions.length})
                </h2>
                
                {renderQuestionsList()}
              </div>
            )}
            
            {/* Show question form only if we haven't added all required questions or if we're editing */}
            {(questionsRemaining > 0 || editingQuestionIndex !== null) ? (
              <div id="question-form" className={`p-6 rounded-2xl ${
                isDarkMode 
                  ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
                  : 'bg-white border border-gray-200'
              } shadow-xl`}>
                <h2 className="text-2xl font-bold mb-6">
                  {editingQuestionIndex !== null 
                    ? `Edit Question ${editingQuestionIndex + 1}` 
                    : `Add Question ${examMetadata.numberOfQuestions - questionsRemaining + 1}`}
                </h2>
                
                {/* Question form content */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Question Text or Image*
                  </label>
                  <textarea
                    value={currentQuestion.questionText}
                    onChange={handleQuestionTextChange}
                    rows="4"
                    className={`w-full px-4 py-3 rounded-lg border text-base transition-colors duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-900/50 border-gray-600 text-white focus:border-violet-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-violet-500'
                    } focus:ring-2 focus:ring-violet-500/20 focus:outline-none`}
                    placeholder="Enter question text"
                  />
                  
                  <div className="flex items-center mt-4">
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
                      className={`flex items-center px-4 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                      } ${isUploadingQuestionImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isUploadingQuestionImage ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FaImage className="mr-2" />
                          {currentQuestion.questionImage ? 'Change Image' : 'Add Image'}
                        </>
                      )}
                    </label>
                    
                    {currentQuestion.questionImagePreview && (
                      <div className="ml-4 flex items-center">
                        <img 
                          src={currentQuestion.questionImagePreview} 
                          alt="Question Preview" 
                          className="h-16 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={removeQuestionImage}
                          className={`ml-2 p-2 rounded-full transition-colors duration-200 ${
                            isDarkMode 
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' 
                              : 'bg-red-50 hover:bg-red-100 text-red-600'
                          }`}
                          title="Remove image"
                          disabled={isUploadingQuestionImage}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Question Type Selection */}
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Question Type
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange('single')}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        currentQuestion.questionType === 'single'
                          ? 'bg-violet-600 text-white'
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-2">○</span>
                      Single Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange('multiple')}
                      className={`px-4 py-2 rounded-lg flex items-center ${
                        currentQuestion.questionType === 'multiple'
                          ? 'bg-violet-600 text-white'
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-2">☐</span>
                      Multiple Choice
                    </button>
                  </div>
                  {currentQuestion.questionType === 'multiple' && (
                    <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Students will be able to select multiple answers for this question
                    </p>
                  )}
                </div>
                
                {/* Options */}
                <div className="space-y-4">
                  <label className={`block text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Options {currentQuestion.questionType === 'multiple' && '(Select all correct answers)'}
                  </label>
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <div className="flex items-start gap-4">
                        <button
                          type="button"
                          onClick={() => handleCorrectOptionChange(index)}
                          className={`mt-2 p-2 rounded-lg transition-colors ${
                            currentQuestion.questionType === 'single'
                              ? currentQuestion.correctOption === index
                                ? 'bg-green-500 text-white'
                                : isDarkMode
                                  ? 'bg-gray-700 text-gray-300'
                                  : 'bg-gray-100 text-gray-700'
                              : currentQuestion.correctOptions.includes(index)
                                ? 'bg-green-500 text-white'
                                : isDarkMode
                                  ? 'bg-gray-700 text-gray-300'
                                  : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {currentQuestion.questionType === 'single' ? (
                            <span className="block w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                              {currentQuestion.correctOption === index && (
                                <span className="block w-2 h-2 rounded-full bg-current" />
                              )}
                            </span>
                          ) : (
                            <span className="block w-4 h-4 rounded border-2 border-current flex items-center justify-center">
                              {currentQuestion.correctOptions.includes(index) && (
                                <span className="block w-2 h-2 bg-current" />
                              )}
                            </span>
                          )}
                        </button>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => handleOptionTextChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className={`w-full px-4 py-2 rounded-lg ${
                              isDarkMode
                                ? 'bg-gray-800 text-white border-gray-700 focus:border-violet-500'
                                : 'bg-white text-gray-900 border-gray-300 focus:border-violet-500'
                            } border focus:ring-2 focus:ring-violet-200 transition-colors`}
                          />
                        </div>
                      </div>
                      
                      {/* Option Image Upload */}
                      <div className="flex items-center gap-4 ml-10">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleOptionImageUpload(e, index)}
                          ref={(el) => (optionImageRefs.current[index] = el)}
                          className="hidden"
                          id={`option-image-upload-${index}`}
                        />
                        <label
                          htmlFor={`option-image-upload-${index}`}
                          className={`flex items-center px-3 py-1 rounded-lg cursor-pointer transition-all duration-200 ${
                            isDarkMode 
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600' 
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                          } ${isUploading && currentUploadingOptionIndex === index ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isUploading && currentUploadingOptionIndex === index ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <FaImage className="mr-2" size={14} />
                              {option.image ? 'Change Image' : 'Add Image'}
                            </>
                          )}
                        </label>
                        
                        {option.image && (
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded overflow-hidden border border-gray-300">
                              <img 
                                src={option.imagePreview || option.image} 
                                alt={`Option ${index + 1}`} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeOptionImage(index)}
                              className={`p-1 rounded-full ${
                                isDarkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-500 hover:bg-red-200'
                              }`}
                              title="Remove image"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  {editingQuestionIndex !== null && (
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={addQuestion}
                    disabled={isUploading || isUploadingQuestionImage}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-violet-600 hover:bg-violet-700 text-white' 
                        : 'bg-violet-600 hover:bg-violet-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      getActionButtonText()
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Show preview and submit section when all questions are added */
              <div className={`p-8 rounded-2xl ${
                isDarkMode 
                  ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' 
                  : 'bg-white border border-gray-200'
              } shadow-xl text-center`}>
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                  isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                }`}>
                  <FaCheck className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold mb-4">All Questions Added!</h2>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-lg mb-8`}>
                  You've added all {examMetadata.numberOfQuestions} questions for this exam. 
                  Review your questions above and submit when ready.
                </p>
                
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={goBackToMetadata}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Edit Exam Details
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitExam}
                    disabled={isSubmitting}
                    className={`px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-violet-600 hover:bg-violet-700' 
                        : 'bg-violet-600 hover:bg-violet-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              </div>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Add the EditQuestionModal with improved styling */}
      <EditQuestionModal />
    </div>
  );
};

export default InstituteExamCreationScreen;