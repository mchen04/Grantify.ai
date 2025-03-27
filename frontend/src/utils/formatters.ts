/**
 * Utility functions for formatting and displaying data consistently across the application
 */

/**
 * Format a date string to a human-readable format
 * @param dateString - ISO date string or null
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'No deadline specified';
  
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate days remaining from a date string
 * @param dateString - ISO date string or null
 * @returns Number of days remaining or null if no date
 */
export const calculateDaysRemaining = (dateString: string | null): number | null => {
  if (!dateString) return null;
  
  return Math.ceil(
    (new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
};

/**
 * Format a number as currency
 * @param amount - Amount to format or null
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | null): string => {
  if (amount === null || amount === undefined) return 'Not specified';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Truncate text with ellipsis if it exceeds the specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis or original text
 */
export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return 'No description available';
  
  return text.length > maxLength
    ? `${text.substring(0, maxLength)}...`
    : text;
};

/**
 * Get appropriate deadline color based on days remaining
 * @param daysRemaining - Number of days remaining or null
 * @returns CSS class name for the appropriate color
 */
export const getDeadlineColorClass = (daysRemaining: number | null): string => {
  if (daysRemaining === null) return 'text-green-600';
  if (daysRemaining < 30) return 'text-red-600';
  if (daysRemaining < 60) return 'text-orange-600';
  return 'text-green-600';
};