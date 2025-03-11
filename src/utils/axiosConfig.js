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
      const errorMessage = error.response.data?.error || 'An error occurred';
      console.error(`Server error (${error.response.status}):`, errorMessage);
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // Handle network errors
      console.error('Network Error:', error.request);
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('Request timeout. Please try again.'));
      }
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Handle other errors
      console.error('Error:', error.message);
      return Promise.reject(error);
    }
  }
);

export default axiosInstance; 