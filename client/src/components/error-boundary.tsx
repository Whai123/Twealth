import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorType: 'auth' | 'chunk' | 'react300' | 'other' | null;
  errorMessage: string;
  componentStack: string;
}

function isReact300Error(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return msg.includes('objects are not valid as a react child') || 
         msg.includes('minified react error #300') ||
         msg.includes('invariant=300');
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
  // Only catch actual chunk/module loading errors, NOT generic React errors
  return msg.includes('loading chunk') || 
         msg.includes('failed to fetch dynamically imported module') ||
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
  public state: State = { hasError: false, errorType: null, errorMessage: '', componentStack: '' };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    if (isAuthError(error)) {
      return { hasError: true, errorType: 'auth', errorMessage: error.message };
    }
    
    if (isChunkError(error)) {
      return { hasError: true, errorType: 'chunk', errorMessage: error.message };
    }
    
    if (isReact300Error(error)) {
      return { hasError: true, errorType: 'react300', errorMessage: error.message };
    }
    
    return { hasError: true, errorType: 'other', errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error.message);
    console.error('[ErrorBoundary] Error type:', this.state.errorType);
    console.error('[ErrorBoundary] Error stack:', error.stack);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    
    // Store component stack for display
    this.setState({ componentStack: errorInfo.componentStack || '' });
    
    // Special logging for React #300 errors to help identify the culprit
    if (isReact300Error(error)) {
      console.error('=== REACT ERROR #300 DETECTED ===');
      console.error('[React300] This error occurs when an object is rendered as a React child');
      console.error('[React300] Component stack (look for the deepest component):');
      console.error(errorInfo.componentStack);
      console.error('[React300] The deepest component in the stack likely has a JSX expression like {someObject} that should be {safeString(someObject)}');
      
      // Try to extract the problematic value from the error message
      const match = error.message.match(/object with keys \{([^}]+)\}/);
      if (match) {
        console.error('[React300] PROBLEMATIC OBJECT KEYS:', match[1]);
      }
      
      // Log all cached query data to help identify the source
      try {
        const queryCache = (window as any).__REACT_QUERY_STATE__;
        if (queryCache) {
          console.error('[React300] Query cache state available for debugging');
        }
      } catch (e) {
        // Ignore
      }
      
      console.error('=================================');
    }
    
    // Auth errors: redirect to login (single redirect, no loop)
    if (isAuthError(error)) {
      console.log('[ErrorBoundary] Auth error, redirecting to login');
      window.location.replace('/login');
      return;
    }
    
    // CHUNK ERRORS: Auto-recover ONCE (fixes iOS Safari loading issues)
    if (isChunkError(error)) {
      const recoveryKey = 'chunk_recovery_attempted';
      const alreadyAttempted = sessionStorage.getItem(recoveryKey) === '1';
      
      if (!alreadyAttempted) {
        console.log('[ErrorBoundary] Chunk error detected - AUTO-RECOVERING (one-shot)');
        sessionStorage.setItem(recoveryKey, '1');
        
        // Clear caches and SW, then reload with cache-buster
        clearAllCachesAndSW().then(() => {
          const url = new URL(window.location.href);
          url.searchParams.set('v', Date.now().toString());
          window.location.replace(url.toString());
        }).catch(() => {
          // If cleanup fails, still try the reload
          const url = new URL(window.location.href);
          url.searchParams.set('v', Date.now().toString());
          window.location.replace(url.toString());
        });
        return;
      }
      
      console.log('[ErrorBoundary] Chunk error - auto-recovery already attempted, showing manual instructions');
    }
    
    // For ALL other errors: NO automatic reload to prevent loops
    // Just log and show fallback UI - user can manually refresh
    console.log('[ErrorBoundary] Showing fallback UI (NO automatic reload)');
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
      
      // For chunk errors - show clear instructions with manual fix steps
      // This only shows if auto-recovery already failed once
      if (this.state.errorType === 'chunk') {
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
              <p className="text-lg font-medium text-foreground mb-2">Loading issue</p>
              <p className="text-sm text-muted-foreground mb-4">
                The app couldn't load correctly. Please clear your browser cache.
              </p>
              <div className="space-y-4">
                <button 
                  onClick={this.handleHardRefresh}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                  data-testid="button-hard-refresh"
                >
                  Try Again
                </button>
                
                <div className="text-left bg-muted/30 p-3 rounded-md">
                  <p className="text-sm font-medium text-foreground mb-2">If the problem persists:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open <strong>Settings</strong> on your device</li>
                    <li>Go to <strong>Safari</strong> (or your browser)</li>
                    <li>Tap <strong>Clear History and Website Data</strong></li>
                    <li>Or: Advanced → Website Data → find twealth.ltd → Delete</li>
                    <li>Return here and refresh the page</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      // For React #300 errors - show detailed component stack
      if (this.state.errorType === 'react300') {
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-background p-4 overflow-auto">
            <div className="text-center max-w-lg w-full">
              <p className="text-lg font-medium text-foreground mb-2">Display Error</p>
              <p className="text-sm text-muted-foreground mb-4">
                A data display issue occurred. Please try refreshing.
              </p>
              {this.state.componentStack && (
                <details className="text-left mb-4">
                  <summary className="text-xs text-muted-foreground cursor-pointer mb-2">
                    Technical Details (tap to expand)
                  </summary>
                  <div className="text-xs font-mono bg-muted/30 p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap">
                    {this.state.componentStack}
                  </div>
                </details>
              )}
              <div className="space-y-2">
                <button 
                  onClick={this.handleHardRefresh}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                  data-testid="button-refresh-300"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      // For other errors - show more details to help debug
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <p className="text-lg font-medium text-foreground mb-2">Something went wrong</p>
            <p className="text-sm text-muted-foreground mb-2">Please refresh the page to try again.</p>
            <div className="text-xs text-muted-foreground/60 mb-4 font-mono break-all max-h-32 overflow-auto text-left bg-muted/20 p-2 rounded">
              {this.state.errorMessage || 'Unknown error'}
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                data-testid="button-refresh"
              >
                Refresh Page
              </button>
              <button 
                onClick={this.handleHardRefresh}
                className="w-full px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80"
                data-testid="button-clear-cache"
              >
                Clear Cache & Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function clearRecoveryAttempts(): void {
  // No-op - keeping for backwards compatibility
  // No automatic recovery attempts are made anymore
}

export default ErrorBoundary;
