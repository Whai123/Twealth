import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Loader2, LogIn } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorType: 'stale_module' | 'auth' | 'generic';
  isRecovering: boolean;
}

const RECOVERY_KEY = 'twealth_error_recovery_attempts';
const RECOVERY_IN_PROGRESS_KEY = 'twealth_recovery_in_progress';
const MAX_RECOVERY_ATTEMPTS = 2;

function classifyError(error: Error): 'stale_module' | 'auth' | 'generic' {
  const message = error.message?.toLowerCase() || '';
  const stack = error.stack?.toLowerCase() || '';
  const combined = message + ' ' + stack;
  
  if (
    combined.includes('minified react error #300') ||
    combined.includes('dynamically imported module') ||
    combined.includes('failed to fetch dynamically') ||
    combined.includes('loading chunk') ||
    combined.includes('loading css chunk') ||
    combined.includes('mime type') ||
    (combined.includes('unexpected token') && combined.includes('<')) ||
    (combined.includes('syntaxerror') && combined.includes('unexpected'))
  ) {
    return 'stale_module';
  }
  
  if (
    combined.includes('401') ||
    combined.includes('unauthorized') ||
    combined.includes('not authenticated') ||
    combined.includes('session expired')
  ) {
    return 'auth';
  }
  
  return 'generic';
}

function getRecoveryAttempts(): number {
  try {
    return parseInt(sessionStorage.getItem(RECOVERY_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

function incrementRecoveryAttempts(): void {
  try {
    sessionStorage.setItem(RECOVERY_KEY, String(getRecoveryAttempts() + 1));
  } catch {}
}

export function clearRecoveryAttempts(): void {
  try {
    sessionStorage.removeItem(RECOVERY_KEY);
  } catch {}
}

function isRecoveryInProgress(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_IN_PROGRESS_KEY) === 'true';
  } catch {
    return false;
  }
}

function setRecoveryInProgress(value: boolean): void {
  try {
    if (value) {
      sessionStorage.setItem(RECOVERY_IN_PROGRESS_KEY, 'true');
    } else {
      sessionStorage.removeItem(RECOVERY_IN_PROGRESS_KEY);
    }
  } catch {}
}

async function clearCachesAndReload(): Promise<void> {
  console.log('[ErrorBoundary] Clearing caches and forcing fresh reload...');
  
  setRecoveryInProgress(true);
  
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  } catch {}
  
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }
  } catch {}
  
  localStorage.removeItem('app_version');
  incrementRecoveryAttempts();
  
  // Use fetch to get fresh HTML and replace page content completely
  // This bypasses browser cache more reliably than location.replace
  setTimeout(async () => {
    try {
      const response = await fetch('/?nocache=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const html = await response.text();
        document.open();
        document.write(html);
        document.close();
        return;
      }
    } catch (e) {
      console.log('[ErrorBoundary] Fetch failed, falling back to reload');
    }
    // Fallback to regular reload
    window.location.href = '/?v=' + Date.now();
  }, 100);
}

class ErrorBoundary extends Component<Props, State> {
  private recoveryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  
  public state: State = {
    hasError: false,
    errorType: 'generic',
    isRecovering: false
  };

  public componentDidMount() {
    // If we just recovered from a reload, clear the flag - app loaded successfully
    if (isRecoveryInProgress()) {
      console.log('[ErrorBoundary] Recovery successful, clearing recovery state');
      setRecoveryInProgress(false);
      clearRecoveryAttempts();
    }
  }
  
  public componentWillUnmount() {
    if (this.recoveryTimeoutId) {
      clearTimeout(this.recoveryTimeoutId);
    }
  }
  
  private startRecoveryTimeout() {
    if (this.recoveryTimeoutId) return; // Already started
    
    this.recoveryTimeoutId = setTimeout(() => {
      if (this.state.isRecovering) {
        console.log('[ErrorBoundary] Recovery timeout, forcing redirect');
        setRecoveryInProgress(false);
        clearRecoveryAttempts();
        window.location.href = '/?recovered=' + Date.now();
      }
    }, 3000);
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorType: classifyError(error) };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error);
    
    // DO NOT auto-reload - let the user manually reload to prevent infinite loops
    // The index.html inline scripts already handle cache clearing
    // ErrorBoundary just shows error UI and lets user decide when to reload
    
    if (import.meta.env.DEV) {
      console.group('Error Details');
      console.error('Error:', error);
      console.error('Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  private handleRetry = () => {
    this.setState({ isRecovering: true });
    clearCachesAndReload();
  };

  private handleLogin = () => {
    window.location.href = '/login';
  };

  private handleGoHome = () => {
    this.setState({ isRecovering: true });
    clearCachesAndReload().then(() => {
      window.location.replace('/?v=' + Date.now());
    });
  };

  public render() {
    if (this.state.isRecovering) {
      this.startRecoveryTimeout();
      
      return (
        <div 
          className="fixed inset-0 flex flex-col items-center justify-center bg-background dark:bg-black z-[9999]"
          style={{ 
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground text-sm">Updating app...</p>
        </div>
      );
    }

    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { errorType, error } = this.state;
      const isAuth = errorType === 'auth';
      const isStale = errorType === 'stale_module';

      return (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-background dark:bg-black p-4"
          style={{ 
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
          role="alert"
        >
          <Card className="w-full max-w-md border-destructive/30 dark:border-red-500/30 bg-card dark:bg-zinc-900 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5 text-destructive dark:text-red-400 text-lg">
                <div className="w-8 h-8 rounded-full bg-destructive/10 dark:bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                {isAuth ? 'Session Expired' : isStale ? 'Update Required' : 'Something went wrong'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground dark:text-zinc-400">
                {isAuth 
                  ? 'Your session has expired. Please log in again to continue.'
                  : isStale 
                    ? 'A new version is available. Please reload to continue.'
                    : error?.message || 'An unexpected error occurred.'
                }
              </p>
              
              {import.meta.env.DEV && error?.stack && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground py-2">Details</summary>
                  <pre className="mt-2 p-3 bg-muted dark:bg-zinc-800 rounded-lg overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                {isAuth ? (
                  <Button 
                    onClick={this.handleLogin}
                    className="flex-1 min-h-[48px] bg-primary hover:bg-primary/90"
                    data-testid="button-login"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Log In
                  </Button>
                ) : (
                  <Button 
                    onClick={this.handleRetry}
                    className="flex-1 min-h-[48px] bg-primary hover:bg-primary/90"
                    data-testid="button-retry-error"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {isStale ? 'Reload App' : 'Try Again'}
                  </Button>
                )}
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 min-h-[48px] border-border/60 dark:border-zinc-700"
                  data-testid="button-go-home"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
