import { toast } from 'sonner';

export const showSuccess = (message) => {
  toast.success(message, {
    duration: 3000,
    style: {
      fontFamily: 'Heebo, sans-serif',
      direction: 'rtl',
    },
  });
};

export const showError = (message, options = {}) => {
  toast.error(message, {
    duration: options.duration ?? 4000,
    style: {
      fontFamily: 'Heebo, sans-serif',
      direction: 'rtl',
    },
    ...options,
  });
};

export const showInfo = (message) => {
  toast.info(message, {
    duration: 3000,
    style: {
      fontFamily: 'Heebo, sans-serif',
      direction: 'rtl',
    },
  });
};

export const showWarning = (message) => {
  toast.warning(message, {
    duration: 3500,
    style: {
      fontFamily: 'Heebo, sans-serif',
      direction: 'rtl',
    },
  });
};
