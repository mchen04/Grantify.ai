import { isDevelopment } from './constants';

/**
 * Logger utility for consistent logging across the application
 * Provides different log levels and only logs in development mode by default
 */
class Logger {
  private context: string;
  
  /**
   * Create a new logger instance
   * @param context - The context for this logger (usually component or file name)
   */
  constructor(context: string = 'App') {
    this.context = context;
  }
  
  /**
   * Format a log message with context
   * @param message - The message to format
   * @returns Formatted message with context
   */
  private formatMessage(message: string): string {
    return `[${this.context}] ${message}`;
  }
  
  /**
   * Log an informational message
   * @param message - The message to log
   * @param data - Optional data to include
   */
  info(message: string, data?: any): void {
    if (isDevelopment) {
      if (data) {
        console.info(this.formatMessage(message), data);
      } else {
        console.info(this.formatMessage(message));
      }
    }
  }
  
  /**
   * Log a warning message
   * @param message - The message to log
   * @param data - Optional data to include
   */
  warn(message: string, data?: any): void {
    if (isDevelopment) {
      if (data) {
        console.warn(this.formatMessage(message), data);
      } else {
        console.warn(this.formatMessage(message));
      }
    }
  }
  
  /**
   * Log an error message
   * @param message - The message to log
   * @param error - The error object or message
   * @param data - Optional additional data
   */
  error(message: string, error?: any, data?: any): void {
    // Always log errors, but with different detail levels based on environment
    const formattedMessage = this.formatMessage(message);
    
    if (isDevelopment) {
      // In development, log full error details
      console.error(formattedMessage, error, data);
    } else {
      // In production, log minimal information and potentially send to error tracking service
      console.error(formattedMessage);
      
      // Here you could add code to send errors to a service like Sentry
      // if (window.Sentry) {
      //   window.Sentry.captureException(error, {
      //     extra: {
      //       context: this.context,
      //       message,
      //       ...data
      //     }
      //   });
      // }
    }
  }
  
  /**
   * Log a debug message (only in development)
   * @param message - The message to log
   * @param data - Optional data to include
   */
  debug(message: string, data?: any): void {
    if (isDevelopment) {
      if (data) {
        console.debug(this.formatMessage(message), data);
      } else {
        console.debug(this.formatMessage(message));
      }
    }
  }
  
  /**
   * Create a child logger with a sub-context
   * @param subContext - The sub-context to add
   * @returns A new logger with the combined context
   */
  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`);
  }
}

// Create and export a default logger instance
export const logger = new Logger();

// Export the Logger class for creating context-specific loggers
export default Logger;