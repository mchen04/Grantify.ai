import React, { useEffect, useState } from 'react';

interface ErrorMessageProps {
  message: string | null;
  onDismiss?: () => void;
  autoHideDuration?: number;
  variant?: 'error' | 'warning' | 'info' | 'success';
}

/**
 * A component to display error messages to users
 * Can be used for any type of message (error, warning, info, success)
 * Supports auto-dismissal and manual dismissal
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  autoHideDuration = 5000, // Default to 5 seconds
  variant = 'error'
}) => {
  const [visible, setVisible] = useState(false);
  
  // Set up auto-dismiss timer when message changes
  useEffect(() => {
    if (message) {
      setVisible(true);
      
      // Set up auto-dismiss timer if duration is provided
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          setVisible(false);
          if (onDismiss) onDismiss();
        }, autoHideDuration);
        
        // Clean up timer on unmount or when message changes
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
    }
  }, [message, autoHideDuration, onDismiss]);
  
  // Handle manual dismiss
  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };
  
  // Don't render anything if there's no message or it's not visible
  if (!message || !visible) {
    return null;
  }
  
  // Determine styles based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'error':
        return 'bg-red-50 border-red-300 text-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-300 text-yellow-700';
      case 'info':
        return 'bg-blue-50 border-blue-300 text-blue-700';
      case 'success':
        return 'bg-green-50 border-green-300 text-green-700';
      default:
        return 'bg-red-50 border-red-300 text-red-700';
    }
  };
  
  return (
    <div className={`rounded-md p-4 border ${getVariantStyles()} mb-4 flex justify-between items-start`} role="alert">
      <div>
        <span className="font-medium">
          {variant === 'error' && 'Error: '}
          {variant === 'warning' && 'Warning: '}
          {variant === 'info' && 'Info: '}
          {variant === 'success' && 'Success: '}
        </span>
        {message}
      </div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        <span className="sr-only">Dismiss</span>
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default ErrorMessage;