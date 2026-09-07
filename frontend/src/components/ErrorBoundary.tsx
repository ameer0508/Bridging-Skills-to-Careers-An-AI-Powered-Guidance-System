import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-200">
          <h1 className="text-4xl font-bold mb-4 text-rose-500">Something went wrong</h1>
          <p className="text-slate-400 mb-6 max-w-lg text-center">
             An unexpected error occurred in the application. Our team has been notified.
          </p>
          <button 
             onClick={() => window.location.reload()}
             className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold transition-colors"
          >
             Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
