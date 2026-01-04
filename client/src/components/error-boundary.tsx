import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorType: 'auth' | 'chunk' | 'other' | null;
  errorMessage: string;
  recoveryAttempted: boolean;
}

const CHUNK_RECOVERY_KEY = 'twealth_chunk_recovery_v2';

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
         msg.includes('minified react error') ||
         msg.includes('dynamically imported module');
}

async function clearAllCachesAndSW(): Promise<void> {
  try {
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[ErrorBoundary] Cleared all caches:', cacheNames);
    }
    
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
      console.log('[ErrorBoundary] Unregistered all service workers:', registrations.length);
    }
  } catch (e) {
    console.warn('[ErrorBoundary] Cache/SW cleanup failed:', e);
  }
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, errorType: null, errorMessage: '', recoveryAttempted: false };

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
      window.location.replace('/login');
      return;
    }
    
    // Chunk errors: attempt ONE auto-recovery with cache clearing
    if (isChunkError(error)) {
      const lastRecoveryTime = sessionStorage.getItem(CHUNK_RECOVERY_KEY);
      const now = Date.now();
      
      // Only attempt recovery if we haven't tried in the last 30 seconds
      if (!lastRecoveryTime || (now - parseInt(lastRecoveryTime, 10)) > 30000) {
        console.log('[ErrorBoundary] Chunk error, attempting one-time recovery...');
        sessionStorage.setItem(CHUNK_RECOVERY_KEY, now.toString());
        
        // Clear caches and reload with cache-buster
        clearAllCachesAndSW().then(() => {
          const url = new URL(window.location.href);
          url.searchParams.set('v', now.toString());
          window.location.replace(url.toString());
        });
        return;
      }
      
      console.log('[ErrorBoundary] Chunk recovery already attempted, showing manual instructions');
      this.setState({ recoveryAttempted: true });
      return;
    }
    
    console.log('[ErrorBoundary] Non-recoverable error, showing fallback UI');
  }

  private handleHardRefresh = async () => {
    await clearAllCachesAndSW();
    const url = new URL(window.location.href);
    url.searchParams.set('v', Date.now().toString());
    window.location.replace(url.toString());
  };

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
      
      // For chunk errors - show recovery UI
      if (this.state.errorType === 'chunk') {
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
              <p className="text-lg font-medium text-foreground mb-2">Loading issue</p>
              <p className="text-sm text-muted-foreground mb-4">
                {this.state.recoveryAttempted 
                  ? "Auto-recovery didn't work. Please clear your browser data for this site."
                  : "Refreshing with updated files..."}
              </p>
              {this.state.recoveryAttempted && (
                <div className="space-y-3">
                  <button 
                    onClick={this.handleHardRefresh}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                    data-testid="button-hard-refresh"
                  >
                    Try Hard Refresh
                  </button>
                  <p className="text-xs text-muted-foreground">
                    iOS Safari: Settings → Safari → Clear History and Website Data
                  </p>
                </div>
              )}
              {!this.state.recoveryAttempted && (
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              )}
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
              data-testid="button-refresh"
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
  try {
    sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
  } catch {
    // Ignore storage errors
  }
}

export default ErrorBoundary;
