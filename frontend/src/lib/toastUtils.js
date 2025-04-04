import toast from "react-hot-toast";

/**
 * Utility functions for displaying toast messages with consistent styling and behavior
 * These functions help prevent duplicate toast messages by using the message as the ID
 */

/**
 * Show a success toast message
 * @param {string} message - The message to display
 * @param {Object} options - Additional options for the toast
 */
export const showSuccessToast = (message, options = {}) => {
  // Check if a toast with this message already exists
  const existingToast = toast.custom((t) => t.message === message);
  if (existingToast) {
    toast.dismiss(existingToast);
  }

  toast.success(message, {
    duration: 3000,
    ...options,
  });
};

/**
 * Show an error toast message
 * @param {string} message - The message to display
 * @param {Object} options - Additional options for the toast
 */
export const showErrorToast = (message, options = {}) => {
  // Dismiss any existing toasts with the same message
  toast.dismiss(message);

  toast.error(message, {
    duration: 4000,
    ...options,
  });
};

/**
 * Show an info toast message
 * @param {string} message - The message to display
 * @param {Object} options - Additional options for the toast
 */
export const showInfoToast = (message, options = {}) => {
  // Dismiss any existing toasts with the same message
  toast.dismiss(message);

  toast(message, {
    duration: 3000,
    ...options,
  });
};

/**
 * Show a loading toast message
 * @param {string} message - The message to display
 * @returns {string} - The ID of the toast for later dismissal
 */
export const showLoadingToast = (message) => {
  // Dismiss any existing toasts with the same message
  toast.dismiss(message);

  return toast.loading(message);
};

/**
 * Dismiss a specific toast by ID
 * @param {string} id - The ID of the toast to dismiss
 */
export const dismissToast = (id) => {
  toast.dismiss(id);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};
