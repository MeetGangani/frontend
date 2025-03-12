import React from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

export const showToast = {
  success: (message, options = {}) => {
    const { icon, ...restOptions } = options;
    
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-green-500 dark:border-green-600`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {icon || <FaCheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            Dismiss
          </button>
        </div>
      </div>
    ), {
      id: message, // Prevents duplicate toasts
      duration: 4000,
      ...restOptions
    });
  },
  
  error: (message, options = {}) => {
    const { icon, ...restOptions } = options;
    
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-red-500 dark:border-red-600`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {icon || <FaExclamationCircle className="h-5 w-5 text-red-500 dark:text-red-400" />}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            Dismiss
          </button>
        </div>
      </div>
    ), {
      id: message, // Prevents duplicate toasts
      duration: 5000,
      ...restOptions
    });
  },
  
  warning: (message, options = {}) => {
    const { icon, ...restOptions } = options;
    
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-yellow-500 dark:border-yellow-600`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {icon || <FaExclamationTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            Dismiss
          </button>
        </div>
      </div>
    ), {
      id: message, // Prevents duplicate toasts
      duration: 5000,
      ...restOptions
    });
  },
  
  info: (message, options = {}) => {
    const { icon, ...restOptions } = options;
    
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-blue-500 dark:border-blue-600`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              {icon || <FaInfoCircle className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            Dismiss
          </button>
        </div>
      </div>
    ), {
      id: message, // Prevents duplicate toasts
      duration: 4000,
      ...restOptions
    });
  },
  
  loading: (message, options = {}) => {
    return toast.loading(message, {
      id: message,
      ...options
    });
  },
  
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
  
  // Custom toast with full control
  custom: (render, options = {}) => {
    return toast.custom(render, {
      ...options
    });
  }
}; 