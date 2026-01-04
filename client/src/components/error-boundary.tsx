import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorType: 'auth' | 'chunk' | 'other' | null;
}

const MAX_RETRIES = 3;
const RETRY_KEY = 'eb_retries';
const LAST_RETRY_KEY = 'eb_last_retry';
const GAVE_UP_KEY = 'eb_gave_up';

function getRetryCount(): number {
  try {
    const lastRetry = parseInt(sessionStorage.getItem(LAST_RETRY_KEY) || '0', 10);
    const now = Date.now();
    if (now - lastRetry > 60000) {
      sessionStorage.removeItem(RETRY_KEY);
      sessionStorage.removeItem(GAVE_UP_KEY);
      return 0;
    }
    return parseInt(sessionStorage.getItem(RETRY_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

function hasGivenUp(): boolean {
  try {
    return sessionStorage.getItem(GAVE_UP_KEY) === '1';
  } catch {
    return false;
  }
}

function markGaveUp(): void {
  try {
    sessionStorage.setItem(GAVE_UP_KEY, '1');
  } catch {}
}

function incrementRetryCount(): number {
  try {
    const count = getRetryCount() + 1;
    sessionStorage.setItem(RETRY_KEY, String(count));
    sessionStorage.setItem(LAST_RETRY_KEY, String(Date.now()));
    return count;
  } catch {
    return 0;
  }
}

export function clearRecoveryAttempts(): void {
  try {
    sessionStorage.removeItem(RETRY_KEY);
    sessionStorage.removeItem(LAST_RETRY_KEY);
    sessionStorage.removeItem(GAVE_UP_KEY);
  } catch {}
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

async function clearCachesOnly(): Promise<void> {
  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  } catch {}
}

async function silentRecover(): Promise<void> {
  await clearCachesOnly();
  window.location.href = '/?r=' + Date.now();
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, errorType: null };

  public componentDidMount() {
    clearRecoveryAttempts();
    console.log('[App] Successfully loaded, recovery attempts cleared');
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    if (hasGivenUp()) {
      return { hasError: true, errorType: 'other' };
    }
    
    if (isAuthError(error)) {
      return { hasError: true, errorType: 'auth' };
    }
    
    if (isChunkError(error)) {
      return { hasError: true, errorType: 'chunk' };
    }
    
    return { hasError: true, errorType: 'other' };
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error('[App] Error caught:', error.message);
    
    // Auth errors: redirect to login, don't reload
    if (isAuthError(error)) {
      console.log('[App] Auth error detected, redirecting to login');
      window.location.href = '/login';
      return;
    }
    
    // Chunk loading errors: try to recover
    if (isChunkError(error)) {
      console.log('[App] Chunk error detected, attempting recovery');
      const retries = incrementRetryCount();
      
      if (retries <= MAX_RETRIES) {
        const delay = Math.min(500 * Math.pow(2, retries - 1), 3000);
        console.log(`[App] Recovery attempt ${retries}/${MAX_RETRIES} in ${delay}ms`);
        setTimeout(() => silentRecover(), delay);
      } else {
        console.log('[App] Max recovery attempts reached, stopping');
        markGaveUp();
      }
      return;
    }
    
    // Other errors: just log, don't reload (prevents loops)
    console.log('[App] Non-critical error, not reloading');
  }

  public render() {
    if (this.state.hasError) {
      // For auth errors, show brief loading while redirecting
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
      
      // For chunk errors during recovery, show loading
      if (this.state.errorType === 'chunk' && !hasGivenUp()) {
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-background">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        );
      }
      
      // For other errors or after giving up, show simple error with retry
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

export default ErrorBoundary;
