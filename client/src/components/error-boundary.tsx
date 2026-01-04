import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorType: 'auth' | 'chunk' | 'other' | null;
  errorMessage: string;
}

function isAuthError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return msg.includes('401') || 
         msg.includes('sign in') || 
         msg.includes('unauthorized') ||
         msg.includes('please sign in') ||
         msg.includes('authentication');
}

function isChunkError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return msg.includes('loading chunk') || 
         msg.includes('failed to fetch dynamically imported module') ||
         msg.includes('minified react error');
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, errorType: null, errorMessage: '' };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    if (isAuthError(error)) {
      return { hasError: true, errorType: 'auth', errorMessage: error.message };
    }
    
    if (isChunkError(error)) {
      return { hasError: true, errorType: 'chunk', errorMessage: error.message };
    }
    
    return { hasError: true, errorType: 'other', errorMessage: error.message };
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error.message);
    console.error('[ErrorBoundary] Error type:', this.state.errorType);
    
    // Auth errors: redirect to login (single redirect, no loop)
    if (isAuthError(error)) {
      console.log('[ErrorBoundary] Auth error, redirecting to login');
      // Use replace to prevent back-button loops
      window.location.replace('/login');
      return;
    }
    
    // For ALL other errors (including chunk): just log, NO RELOAD
    // This prevents Safari refresh loops
    console.log('[ErrorBoundary] Non-auth error, showing fallback UI (NO RELOAD)');
  }

  public render() {
    if (this.state.hasError) {
      // For auth errors, show loading while redirecting
      if (this.state.errorType === 'auth') {
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Redirecting to login...</p>
            </div>
          </div>
        );
      }
      
      // For chunk errors - show clear instructions (NO AUTO RELOAD)
      if (this.state.errorType === 'chunk') {
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
              <p className="text-lg font-medium text-foreground mb-2">Loading issue</p>
              <p className="text-sm text-muted-foreground mb-4">
                The app didn't load correctly. Please refresh the page manually.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }
      
      // For other errors - simple fallback
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <p className="text-lg font-medium text-foreground mb-2">Something went wrong</p>
            <p className="text-sm text-muted-foreground mb-4">Please refresh the page to try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function clearRecoveryAttempts(): void {
  // No-op - keeping for backwards compatibility
}

export default ErrorBoundary;
