import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Uncaught React UI error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-on-surface flex items-center justify-center p-6">
          <div className="tabler-card p-8 sm:p-12 max-w-2xl w-full text-center space-y-6 shadow-2xl border border-outline">
            {/* Error Icon */}
            <div className="w-20 h-20 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-5xl" aria-hidden="true">
                cloud_off
              </span>
            </div>

            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 inline-block">
                ERR_TELEMETRY_ENGINE_FAULT (500)
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-on-surface">
                Microgrid Telemetry Dispatcher Unreachable
              </h1>
              <p className="text-base text-on-surface-variant max-w-lg mx-auto">
                The Mapletyne EMS dashboard encountered an unexpected rendering exception while processing microgrid telemetry. Connected dispensers have defaulted to local autonomous power limits.
              </p>
            </div>

            {/* Diagnostic Monospace Terminal Box */}
            <div className="p-4 bg-surface-container-high rounded-xl text-left font-mono text-xs text-on-surface-variant space-y-1.5 border border-outline overflow-x-auto">
              <div className="text-rose-600 dark:text-rose-400 font-semibold">
                [EXCEPTION] {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown view fault'}
              </div>
              <div className="text-on-surface">
                [GATEWAY] Status: Fallback Safe State Active (100 kW Dispenser Cap)
              </div>
              {this.state.error?.stack && (
                <div className="text-slate-400 max-h-28 overflow-y-auto pt-1 border-t border-outline text-xs">
                  {this.state.error.stack.slice(0, 300)}...
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-6 py-3 bg-primary hover:opacity-95 text-white font-semibold text-base rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">refresh</span>
                <span>Reload Operations View</span>
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('opencpo_admin_jwt');
                  window.location.href = '/login';
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-outline bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
                <span>Return to Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
