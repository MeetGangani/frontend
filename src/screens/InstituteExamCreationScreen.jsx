import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaPlus, FaTrash, FaImage, FaCheck, FaTimes, FaEdit, FaFileExcel, FaUpload, FaGripVertical } from 'react-icons/fa';
import axios from 'axios';
import { showToast } from '../utils/toast';
import config from '../config/config';
import axiosInstance from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const InstituteExamCreationScreen = () => { 
  const { isDarkMode } = useTheme();
  const { userInfo } = useSelector((state) => state.auth);
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
  
  // Refs for file inputs
  const questionImageRef = useRef(null);
  const optionImageRefs = useRef([]);
  
  // Add a state to track if we're editing a question
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  
  // Add a state to track how many questions have been added
  const [questionsRemaining, setQuestionsRemaining] = useState(5);
  
  // Add new state for Excel upload
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const fileInputRef = useRef(null);
  
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
    
    try {
      setIsUploading(true);
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Create form data
      const formData = new FormData();
      formData.append('images', file);
      
      // Upload to server using the deployed backend URL
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
      
      // Update the current question with the image URL
      setCurrentQuestion({
        ...currentQuestion,
        questionImage: response.data.imageUrls[0],
        questionImagePreview: previewUrl
      });
      
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast.error('Failed to upload image: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUploading(false);
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
    
    try {
      setIsUploading(true);
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Create form data
      const formData = new FormData();
      formData.append('images', file);
      
      // Upload to server using the deployed backend URL
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
      
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast.error('Failed to upload image: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUploading(false);
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
  
  // Add a function to edit a question
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
  };
  
  // Modify the addQuestion function to handle editing
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
  
  // Update the submitExam function to use the deployed backend URL
  // Update the submitExam function to better handle image data
  const submitExam = async () => {
    try {
      setSubmitting(true);
      
      // Validate exam data
      if (!examMetadata.examName.trim()) {
        toast.error('Please enter an exam name');
        setSubmitting(false);
        return;
      }
      
      if (questions.length === 0) {
        toast.error('Please add at least one question');
        setSubmitting(false);
        return;
      }
      
      // Prepare exam data - simplify the structure to avoid circular references
      const examData = {
        examName: examMetadata.examName.trim(),
        description: examMetadata.description.trim(),
        subject: examMetadata.subject.trim(),
        timeLimit: parseInt(examMetadata.timeLimit),
        passingPercentage: parseInt(examMetadata.passingPercentage),
        questions: questions.map(q => ({
          questionText: q.questionText || '',
          questionImage: q.questionImage || null,
          questionType: q.questionType || 'single',
          options: q.options.map(opt => ({
            text: opt.text || '',
            image: opt.image || null
          })),
          correctOption: q.questionType === 'single' ? q.correctOption : -1,
          correctOptions: q.questionType === 'multiple' ? q.correctOptions : []
        }))
      };
      
      console.log('Sending exam data:', JSON.stringify(examData));
      
      // Send to server with increased timeout
      const response = await axiosInstance.post('/api/exams/create-binary', examData, {
        timeout: 120000, // 2 minutes timeout for large payloads
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Exam created successfully!');
      navigate('/institute/dashboard');
    } catch (error) {
      console.error('Error creating exam:', error);
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        toast.error(error.response.data.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error('Server did not respond. Please try again later.');
      } else {
        console.error('Error message:', error.message);
        toast.error('Failed to create exam: ' + error.message);
      }
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
  
  // Handle Excel file selection
  const handleExcelFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
          file.type === "application/vnd.ms-excel") {
        setExcelFile(file);
      } else {
        toast.error("Please select a valid Excel file");
        e.target.value = '';
      }
    }
  };

  // Handle Excel upload and processing
  const handleExcelUpload = async () => {
    if (!excelFile) {
      toast.error("Please select an Excel file first");
      return;
    }

    // Check if the number of questions is set
    if (!examMetadata.numberOfQuestions) {
      toast.error("Please set the number of questions in exam metadata first");
      return;
    }

    setIsUploadingExcel(true);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);

      const response = await axiosInstance.post('/api/proxy/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.questions) {
        // Check if the number of questions matches
        if (response.data.questions.length !== examMetadata.numberOfQuestions) {
          toast.error(`Excel file contains ${response.data.questions.length} questions but you specified ${examMetadata.numberOfQuestions} questions. Please adjust the number of questions or use a different Excel file.`);
          return;
        }

        // Update questions state with processed data
        const processedQuestions = response.data.questions.map(q => ({
          questionText: q.question,
          questionImage: null,
          questionImagePreview: null,
          questionType: 'single',
          options: q.options.map(opt => ({
            text: opt,
            image: null,
            imagePreview: null
          })),
          correctOption: q.correctAnswer - 1,
          correctOptions: []
        }));

        setQuestions(processedQuestions);
        setQuestionsRemaining(0); // All questions are now added
        
        toast.success(`Successfully loaded ${response.data.questions.length} questions`);
        setExcelFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Excel upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to process Excel file');
    } finally {
      setIsUploadingExcel(false);
    }
  };

  // Add this in your JSX where you want the Excel upload button to appear
  const renderExcelUpload = () => (
    <div className={`mt-4 p-4 border rounded-lg ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Import Questions from Excel
      </h3>
      <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Note: The Excel file must contain exactly {examMetadata.numberOfQuestions} questions as specified in the exam metadata.
      </p>
      <div className="flex items-center space-x-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleExcelFileChange}
          accept=".xlsx,.xls"
          className="hidden"
        />
        <button
          onClick={() => {
            if (!examMetadata.numberOfQuestions) {
              toast.error("Please set the number of questions in exam metadata first");
              return;
            }
            fileInputRef.current?.click();
          }}
          className={`flex items-center px-4 py-2 rounded-lg ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <FaFileExcel className="mr-2" />
          Select Excel File
        </button>
        {excelFile && (
          <button
            onClick={handleExcelUpload}
            disabled={isUploadingExcel}
            className={`flex items-center px-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-violet-600 hover:bg-violet-500 text-white' 
                : 'bg-violet-500 hover:bg-violet-400 text-white'
            } ${isUploadingExcel ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FaUpload className="mr-2" />
            {isUploadingExcel ? 'Uploading...' : 'Upload and Process'}
          </button>
        )}
      </div>
      {excelFile && (
        <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Selected file: {excelFile.name}
        </p>
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

  // Modify the renderQuestion function
  const renderQuestion = (question, index) => (
    <Draggable key={index} draggableId={`question-${index}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-4 p-4 rounded-lg ${
            isDarkMode 
              ? 'bg-[#1a1f2e] border border-gray-700' 
              : 'bg-white border border-gray-200'
          } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
        >
          <div className="flex items-start space-x-4">
            <div {...provided.dragHandleProps} className="pt-1">
              <FaGripVertical className={`w-5 h-5 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  <select
                    value={index}
                    onChange={(e) => handleQuestionReorder(index, parseInt(e.target.value))}
                    className={`form-select w-20 py-1 px-2 rounded-md text-sm ${
                      isDarkMode 
                        ? 'bg-gray-800 text-white border-gray-700' 
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  >
                    {questions.map((_, i) => (
                      <option key={i} value={i}>
                        Q{i + 1}
                      </option>
                    ))}
                  </select>
                  <h3 className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {question.questionText.substring(0, 50)}
                    {question.questionText.length > 50 ? '...' : ''}
                  </h3>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => editQuestion(index)}
                    className={`p-1.5 rounded-lg ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title="Edit question"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(index)}
                    className={`p-1.5 rounded-lg ${
                      isDarkMode 
                        ? 'hover:bg-red-900/50 text-red-400' 
                        : 'hover:bg-red-100 text-red-600'
                    }`}
                    title="Delete question"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Question content */}
              <div className={`mt-3 pl-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <p className="mb-3">{question.questionText}</p>
                {question.questionImage && (
                  <img 
                    src={question.questionImagePreview} 
                    alt={`Question ${index + 1}`}
                    className="mb-3 max-h-40 rounded-lg"
                  />
                )}
                
                {/* Options */}
                <div className="space-y-2 mt-4">
                  {question.options.map((option, optIndex) => (
                    <div 
                      key={optIndex}
                      className={`p-2 rounded-lg ${
                        question.correctOption === optIndex
                          ? isDarkMode 
                            ? 'bg-green-900/30 border-green-700'
                            : 'bg-green-50 border-green-200'
                          : isDarkMode
                            ? 'bg-gray-800/50'
                            : 'bg-gray-50'
                      } border`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span>{option.text}</span>
                      </div>
                      {option.image && (
                        <img 
                          src={option.imagePreview} 
                          alt={`Option ${String.fromCharCode(65 + optIndex)}`}
                          className="mt-2 max-h-32 rounded-lg"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
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
            
            {/* Number of Questions */}
            <div className="mt-6">
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
                className={`w-full px-4 py-2 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-violet-500 focus:border-transparent`}
                required
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
            {/* Add the Excel upload section at the top of the questions step */}
            {renderExcelUpload()}
            
            {/* Questions Progress */}
            <div className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Questions Progress
                </h2>
                <div className={`px-4 py-2 rounded-lg ${
                  questionsRemaining === 0
                    ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                    : isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                }`}>
                  {questionsRemaining === 0 
                    ? 'All questions added!' 
                    : `${questionsRemaining} question${questionsRemaining !== 1 ? 's' : ''} remaining`}
                </div>
              </div>
              
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div 
                  className="bg-violet-600 h-2.5 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, (questions.length / examMetadata.numberOfQuestions) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
            
            {/* Questions List */}
            {questions.length > 0 && (
              <div className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-xl shadow-lg p-6 mb-8`}>
                <h2 className="text-2xl font-bold mb-6">
                  Questions ({questions.length})
                </h2>
                
                {renderQuestionsList()}
              </div>
            )}
            
            {/* Show question form only if we haven't added all required questions or if we're editing */}
            {(questionsRemaining > 0 || editingQuestionIndex !== null) ? (
              <div id="question-form" className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-xl shadow-lg p-6`}>
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
                
                {/* Question Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Question Type
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange('single')}
                      className={`px-4 py-2 rounded-lg ${
                        currentQuestion.questionType === 'single'
                          ? isDarkMode 
                            ? 'bg-violet-700 text-white' 
                            : 'bg-violet-600 text-white'
                          : isDarkMode 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Single Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange('multiple')}
                      className={`px-4 py-2 rounded-lg ${
                        currentQuestion.questionType === 'multiple'
                          ? isDarkMode 
                            ? 'bg-violet-700 text-white' 
                            : 'bg-violet-600 text-white'
                          : isDarkMode 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Multiple Choice
                    </button>
                  </div>
                  <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {currentQuestion.questionType === 'single' 
                      ? 'Students can select only one correct answer.' 
                      : 'Students can select multiple correct answers.'}
                  </p>
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
                                currentQuestion.questionType === 'single'
                                  ? currentQuestion.correctOption === index
                                    ? isDarkMode 
                                      ? 'bg-green-900 text-green-300' 
                                      : 'bg-green-500 text-white'
                                    : isDarkMode 
                                      ? 'bg-gray-700 text-gray-400' 
                                      : 'bg-gray-200 text-gray-500'
                                  : currentQuestion.correctOptions.includes(index)
                                    ? isDarkMode 
                                      ? 'bg-green-900 text-green-300' 
                                      : 'bg-green-500 text-white'
                                    : isDarkMode 
                                      ? 'bg-gray-700 text-gray-400' 
                                      : 'bg-gray-200 text-gray-500'
                              }`}
                              title={
                                currentQuestion.questionType === 'single'
                                  ? currentQuestion.correctOption === index ? "Correct answer" : "Mark as correct"
                                  : currentQuestion.correctOptions.includes(index) ? "Correct answer" : "Mark as correct"
                              }
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
                <div className="flex justify-end space-x-3">
                  {editingQuestionIndex !== null && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className={`px-6 py-2 rounded-lg font-medium ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                      }`}
                    >
                      Cancel
                    </button>
                  )}
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
                        {editingQuestionIndex !== null ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        {editingQuestionIndex !== null ? (
                          <>
                            <FaCheck className="mr-2" />
                            Update Question
                          </>
                        ) : (
                          <>
                            <FaPlus className="mr-2" />
                            Add Question
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Show preview and submit section when all questions are added */
              <div className={`${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <div className="text-center py-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                    isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                  } mb-4`}>
                    <FaCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">All Questions Added!</h2>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                    You've added all {examMetadata.numberOfQuestions} questions for this exam. 
                    Review your questions above and submit when ready.
                  </p>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      type="button"
                      onClick={goBackToMetadata}
                      className={`px-6 py-3 rounded-lg font-medium ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                      }`}
                    >
                      Edit Exam Details
                    </button>
                    <button
                      type="button"
                      onClick={submitExam}
                      disabled={isSubmitting}
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
                        <>
                          <FaCheck className="mr-2" />
                          Submit Exam
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation buttons */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={goBackToMetadata}
                className={`px-6 py-2 rounded-lg font-medium ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                }`}
              >
                <FaArrowLeft className="mr-2 inline" /> Back to Exam Details
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InstituteExamCreationScreen;