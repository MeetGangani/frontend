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
    toast.custom((t) => (
      <div className={`toast-warning ${t.visible ? 'animate-enter' : 'animate-leave'} bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-lg`}>
        <div className="flex items-center justify-between">
          <p>{message}</p>
        </div>
      </div>
    ), {
      id: message, // Prevents duplicate toasts
    });
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