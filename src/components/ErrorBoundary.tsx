import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

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
    console.error('ErrorBoundary ha intercettato un errore non gestito:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-destructive/40 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold tracking-tight text-foreground">Si è verificato un errore inatteso</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                L'applicazione ha intercettato un'eccezione a runtime. I tuoi dati salvati o cifrati rimangono al sicuro nel browser o su Drive.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-background/80 border border-border rounded-lg text-left overflow-auto max-h-36">
                <p className="font-mono text-[11px] text-destructive break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <Button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ricarica Applicazione</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
