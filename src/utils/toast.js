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
  loading: (message) => {
    toast.loading(message, {
      id: message,
    });
  },
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
}; 