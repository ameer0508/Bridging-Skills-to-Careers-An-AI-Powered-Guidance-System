import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SkillBridge ErrorBoundary caught an exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div role="alert" data-testid="error-boundary" className="min-h-87.5 p-8 rounded-2xl border border-rose-500/30 bg-aurora-canvas/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 text-center">

          <div className="p-3 rounded-full bg-rose-500/10 text-rose-700">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg">
            <h3 className="text-lg font-bold text-white">
              {this.props.fallbackTitle || 'Workspace Recovered From Exception'}
            </h3>
            <p className="text-xs text-aurora-muted">
              An unexpected runtime error occurred. Telemetry cache state remains secure.
            </p>
            {/* Technical details only while developing: users never see stack traces */}
            {import.meta.env.DEV && this.state.error && (
              <div role="region" aria-label="Error details" tabIndex={0} className="p-3 rounded-xl bg-rose-50 border border-rose-500/20 text-rose-700 text-xs text-left font-mono overflow-auto max-h-40">
                <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-rose-700/80 mt-1 whitespace-pre-wrap">{this.state.error.stack.split('\n').slice(0, 4).join('\n')}</pre>
                )}
              </div>
            )}
          </div>

          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Workspace</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
