import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import config from '../config/config.js';
import { logout } from './authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: config.API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    headers.set('Accept', 'application/json');
    // Force HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      headers.set('X-Forwarded-Proto', 'https');
    }
    return headers;
  }
});

// Create a custom base query with error handling and auth checks
const baseQueryWithAuth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 Unauthorized responses
  if (result?.error?.status === 401) {
    // Dispatch logout action
    api.dispatch(logout());
    // Redirect to login page
    window.location.href = '/login';
  }

  // Handle 403 Forbidden responses
  if (result?.error?.status === 403) {
    window.location.href = '/unauthorized';
  }

  // Handle network errors
  if (result?.error?.status === 'FETCH_ERROR') {
    result.error.message = 'Unable to connect to server. Please check your internet connection.';
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithAuth,
  tagTypes: ['User', 'Exam', 'Result'],
  endpoints: (builder) => ({
    // Add any common endpoints here
    healthCheck: builder.query({
      query: () => 'health'
    })
  })
});

// Export hooks for common endpoints
export const { useHealthCheckQuery } = apiSlice;
