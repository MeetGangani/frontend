import axios from 'axios';
import config from '../config/config';

const axiosInstance = axios.create({
  baseURL: config.API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000 // Default timeout of 30 seconds
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // For file uploads, remove Content-Type header to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Log request for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
    }
    return response;
  },
  (error) => {
    // Log error for debugging
    console.error('Axios Error:', error);

    if (error.response) {
      // Server responded with an error status code
      const errorData = error.response.data;
      console.error(`Server error (${error.response.status}):`, errorData);
      
      // Check for session conflict error
      if (errorData?.message && errorData.message.includes('already logged in on another')) {
        return Promise.reject({
          status: error.response.status,
          data: errorData
        });
      }
      
      // Return the error data directly to preserve the original error structure
      return Promise.reject({
        status: error.response.status,
        data: errorData
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
      
      if (error.code === 'ECONNABORTED') {
        return Promise.reject({
          status: 'TIMEOUT',
          message: 'Request timeout. Please try again.',
          error: error
        });
      }
      
      return Promise.reject({
        status: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
        error: error
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
      return Promise.reject({
        status: 'REQUEST_ERROR',
        message: error.message || 'An unexpected error occurred',
        error: error
      });
    }
  }
);

export default axiosInstance; 