import React from 'react';
import toast from 'react-hot-toast';

export const showToast = {
  success: (message) => {
    toast.success(message, {
      id: message, // Prevents duplicate toasts
    });
  },
  error: (message) => {
    toast.error(message, {
      id: message, // Prevents duplicate toasts
    });
  },
  warning: (message) => {
    toast.custom((t) =>
      React.createElement(
        'div',
        { className: `toast-warning ${t.visible ? 'animate-enter' : 'animate-leave'}` },
        message
      ),
      {
        id: message, // Prevents duplicate toasts
      }
    );
  },
  loading: (message) => {
    toast.loading(message, {
      id: message,
    });
  },
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
}; 