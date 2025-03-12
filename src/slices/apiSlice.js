import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from '../config/config.js';
import { logout } from './authSlice';

// Update the base URL to your deployed backend
export const baseUrl = 'https://backdeploy-9bze.onrender.com';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || 'https://backdeploy-9bze.onrender.com',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.userInfo?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    // Don't set X-Forwarded-Proto header, let the server handle HTTPS
    return headers;
  }
});

// Create a custom base query with error handling and auth checks
const baseQueryWithAuth = async (args, api, extraOptions) => {
  try {
    let result = await baseQuery(args, api, extraOptions);

    // Handle authentication errors
    if (result?.error?.status === 401) {
      // Check if it's a session conflict error
      if (result?.error?.data?.message?.includes('already logged in on another')) {
        // Don't logout for session conflicts, let the component handle it
        return result;
      }
      
      // For other 401 errors, logout the user
      api.dispatch(logout());
      return result;
    }

    // Handle 403 Forbidden responses
    if (result?.error?.status === 403) {
      window.location.href = '/unauthorized';
    }

    // Handle network errors
    if (result?.error?.status === 'FETCH_ERROR') {
      console.error('Network error:', result.error);
      result.error.data = { 
        message: 'Unable to connect to server. Please check your internet connection.' 
      };
    }

    return result;
  } catch (error) {
    console.error('API request error:', error);
    return {
      error: {
        status: 'FETCH_ERROR',
        data: { 
          message: 'An unexpected error occurred. Please try again later.' 
        },
        error: error
      }
    };
  }
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithAuth,
  tagTypes: ['User', 'Exam', 'Result', 'Upload'],
  endpoints: (builder) => ({
    // Add any common endpoints here
    healthCheck: builder.query({
      query: () => 'health'
    })
  })
});

// Export hooks for common endpoints
export const { useHealthCheckQuery } = apiSlice;