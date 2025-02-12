import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { apiSlice } from './slices/apiSlice';

// Custom middleware to handle auth persistence
const authMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  if (action.type?.startsWith('auth/')) {
    const authState = store.getState().auth;
    localStorage.setItem('userInfo', JSON.stringify(authState.userInfo));
  }
  return result;
};

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat([apiSlice.middleware, authMiddleware]),
  devTools: process.env.NODE_ENV !== 'production',
  preloadedState: {
    auth: {
      userInfo: localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo'))
        : null,
      isAuthenticated: false,
      loading: true,
      error: null,
    },
  },
});

export default store;
