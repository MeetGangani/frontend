import { apiSlice } from './apiSlice';
import config from '../config/config.js';

const USERS_URL = '/api/users';

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/auth`,
        method: 'POST',
        body: data,
        credentials: 'include'
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: `${USERS_URL}/logout`,
        method: 'POST',
        credentials: 'include'
      }),
    }),
    register: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}`,
        method: 'POST',
        body: data,
        credentials: 'include'
      }),
    }),
    updateUser: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/profile`,
        method: 'PUT',
        body: data,
        credentials: 'include'
      }),
    }),
    googleAuth: builder.mutation({
      query: () => ({
        url: `${USERS_URL}/auth/google`,
        method: 'GET',
        credentials: 'include'
      }),
    }),
    checkAuth: builder.query({
      query: () => ({
        url: `${USERS_URL}/check-auth`,
        method: 'GET',
        credentials: 'include'
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useUpdateUserMutation,
  useGoogleAuthMutation,
  useCheckAuthQuery,
} = userApiSlice;
