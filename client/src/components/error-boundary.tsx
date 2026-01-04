import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

const MAX_RETRIES = 2;
const RETRY_KEY = 'error_boundary_retries';

function getRetryCount(): number {
  try {
    return parseInt(sessionStorage.getItem(RETRY_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

function incrementRetryCount(): number {
  try {
    const count = getRetryCount() + 1;
    sessionStorage.setItem(RETRY_KEY, String(count));
    return count;
  } catch {
    return 0;
  }
}

export function clearRecoveryAttempts(): void {
  try {
    sessionStorage.removeItem(RETRY_KEY);
  } catch {}
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public componentDidMount() {
    // App loaded successfully - clear retry counter
    clearRecoveryAttempts();
  }

  public static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error.message);
    
    // Only auto-retry a limited number of times to prevent loops
    const retries = incrementRetryCount();
    
    if (retries <= MAX_RETRIES) {
      console.log(`[ErrorBoundary] Auto-refreshing (attempt ${retries}/${MAX_RETRIES})...`);
      
      // Clear caches silently and reload
      this.silentRefresh();
    } else {
      console.log('[ErrorBoundary] Max retries reached, showing reload button');
    }
  }

  private async silentRefresh() {
    try {
      // Clear browser caches
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
    } catch {}
    
    // Hard refresh with cache bypass
    window.location.href = '/?t=' + Date.now();
  }

  private handleReload = () => {
    clearRecoveryAttempts();
    window.location.href = '/?t=' + Date.now();
  };

  public render() {
    if (this.state.hasError) {
      const retries = getRetryCount();
      
      // Show minimal UI only after max retries
      if (retries > MAX_RETRIES) {
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Something went wrong.</p>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                data-testid="button-reload"
              >
                Reload
              </button>
            </div>
          </div>
        );
      }
      
      // Show loading while auto-refreshing
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
