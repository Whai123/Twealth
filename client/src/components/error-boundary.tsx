import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  gaveUp: boolean;
}

const MAX_RETRIES = 3;
const RETRY_KEY = 'eb_retries';
const LAST_RETRY_KEY = 'eb_last_retry';
const GAVE_UP_KEY = 'eb_gave_up';

function getRetryCount(): number {
  try {
    const lastRetry = parseInt(sessionStorage.getItem(LAST_RETRY_KEY) || '0', 10);
    const now = Date.now();
    // Reset retry count if last retry was more than 60 seconds ago
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

async function silentRecover(): Promise<void> {
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
  
  // Navigate to fresh URL
  window.location.href = '/?r=' + Date.now();
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, gaveUp: false };

  public componentDidMount() {
    // Only clear if we successfully mounted (app is working)
    clearRecoveryAttempts();
    console.log('[App] Successfully loaded, recovery attempts cleared');
  }

  public static getDerivedStateFromError(): Partial<State> {
    // Check if we've already given up before deciding to recover
    if (hasGivenUp()) {
      return { hasError: true, gaveUp: true };
    }
    return { hasError: true, gaveUp: false };
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error('[App] Error:', error.message);
    
    // If we already gave up, don't try again
    if (hasGivenUp()) {
      this.setState({ gaveUp: true });
      return;
    }
    
    const retries = incrementRetryCount();
    
    if (retries <= MAX_RETRIES) {
      // Exponential backoff: 500ms, 1000ms, 2000ms
      const delay = Math.min(500 * Math.pow(2, retries - 1), 3000);
      console.log(`[App] Recovery attempt ${retries}/${MAX_RETRIES} in ${delay}ms`);
      setTimeout(() => silentRecover(), delay);
    } else {
      // Stop trying - mark as given up and just show loading forever
      // User can manually refresh if they want
      console.log('[App] Max recovery attempts reached, stopping');
      markGaveUp();
      this.setState({ gaveUp: true });
    }
  }

  public render() {
    if (this.state.hasError) {
      // Always show loading spinner - never show error UI or reload buttons
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
