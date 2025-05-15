import React, { Component, ErrorInfo, ReactNode } from 'react';
import { isDevelopment } from '../utils/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree,
 * log those errors, and display a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    if (isDevelopment) {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log to a service like Sentry
    // if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    //   if (window.Sentry) {
    //     window.Sentry.captureException(error);
    //   }
    // }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary p-4 border border-red-300 bg-red-50 rounded-md">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">
            We're sorry, but there was an error loading this component.
          </p>
          {isDevelopment && this.state.error && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-sm font-mono overflow-auto max-h-40">
              <p className="text-red-500">{this.state.error.toString()}</p>
            </div>
          )}
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;