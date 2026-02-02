import toast from 'react-hot-toast';

export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      background: '#10b981',
      color: '#fff',
      fontFamily: 'Heebo, sans-serif',
      direction: 'rtl',
    },
  });
};

export const showError = (message, options = {}) => {
  toast.error(message, {
    duration: options.duration ?? 4000,
    position: 'top-center',
    style: {
      background: '#ef4444',
      color: '#fff',
      fontFamily: 'Heebo, sans-serif',
      direction: 'rtl',
      maxWidth: '90vw',
    },
    ...options,
  });
};

export const showInfo = (message) => {
  toast(message, {
    duration: 3000,
    position: 'top-center',
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
      fontFamily: 'Heebo, sans-serif',
      direction: 'rtl',
    },
  });
};