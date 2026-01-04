import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

const MAX_RETRIES = 5;
const RETRY_KEY = 'eb_retries';
const LAST_RETRY_KEY = 'eb_last_retry';

function getRetryCount(): number {
  try {
    const lastRetry = parseInt(sessionStorage.getItem(LAST_RETRY_KEY) || '0', 10);
    const now = Date.now();
    // Reset retry count if last retry was more than 30 seconds ago
    if (now - lastRetry > 30000) {
      sessionStorage.removeItem(RETRY_KEY);
      return 0;
    }
    return parseInt(sessionStorage.getItem(RETRY_KEY) || '0', 10);
  } catch {
    return 0;
  }
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
  public state: State = { hasError: false };

  public componentDidMount() {
    clearRecoveryAttempts();
  }

  public static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error('[App] Error:', error.message);
    
    const retries = incrementRetryCount();
    
    if (retries <= MAX_RETRIES) {
      // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
      const delay = Math.min(100 * Math.pow(2, retries - 1), 2000);
      setTimeout(() => silentRecover(), delay);
    } else {
      // After max retries, still auto-recover but with longer delay
      // This gives the server time to stabilize
      setTimeout(() => {
        clearRecoveryAttempts();
        silentRecover();
      }, 5000);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Always show loading - never show error UI or reload buttons
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
