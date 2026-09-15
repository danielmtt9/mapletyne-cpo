import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught React UI error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-4 font-body">
          <div className="w-12 h-12 bg-status-fault/10 border border-status-fault text-status-fault flex items-center justify-center font-bold text-xl">
            !
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface">
            Operational View Render Notice
          </h2>
          <p className="text-xs font-mono text-on-surface-variant max-w-md">
            {this.state.error?.message || 'An unexpected rendering error occurred in this module.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-on-primary font-mono text-xs uppercase tracking-wider cursor-pointer"
            >
              Reload View
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('opencpo_admin_jwt');
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-surface-container border border-outline-variant/30 text-on-surface font-mono text-xs uppercase cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
