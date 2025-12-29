import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Loader2 } from 'lucide-react';

interface Props {
 children: ReactNode;
 fallback?: ReactNode;
}

interface State {
 hasError: boolean;
 error?: Error;
 isRecovering: boolean;
}

const RECOVERY_KEY = 'twealth_error_recovery_attempts';
const MAX_RECOVERY_ATTEMPTS = 2;

function isStaleModuleError(error: Error): boolean {
  const message = error.message?.toLowerCase() || '';
  const stack = error.stack?.toLowerCase() || '';
  const combined = message + ' ' + stack;
  
  return (
    combined.includes('minified react error #300') ||
    combined.includes('dynamically imported module') ||
    combined.includes('failed to fetch dynamically') ||
    combined.includes('loading chunk') ||
    combined.includes('loading css chunk') ||
    combined.includes('mime type') ||
    combined.includes('unexpected token') ||
    (combined.includes('syntaxerror') && combined.includes('unexpected'))
  );
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
    const attempts = getRecoveryAttempts() + 1;
    sessionStorage.setItem(RECOVERY_KEY, attempts.toString());
  } catch {
    // Ignore storage errors
  }
}

export function clearRecoveryAttempts(): void {
  try {
    sessionStorage.removeItem(RECOVERY_KEY);
  } catch {
    // Ignore storage errors
  }
}

async function clearAllCachesAndReload(): Promise<void> {
  console.log('[ErrorBoundary] Clearing caches and reloading...');
  
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[ErrorBoundary] Cleared', cacheNames.length, 'caches');
    }
  } catch (e) {
    console.warn('[ErrorBoundary] Failed to clear caches:', e);
  }
  
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
      console.log('[ErrorBoundary] Unregistered', registrations.length, 'service workers');
    }
  } catch (e) {
    console.warn('[ErrorBoundary] Failed to unregister SW:', e);
  }
  
  localStorage.removeItem('app_version');
  
  incrementRecoveryAttempts();
  
  setTimeout(() => {
    window.location.replace(window.location.href.split('?')[0] + '?v=' + Date.now());
  }, 100);
}

class ErrorBoundary extends Component<Props, State> {
 public state: State = {
  hasError: false,
  isRecovering: false
 };

 public static getDerivedStateFromError(error: Error): Partial<State> {
  return { hasError: true, error };
 }

 public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error('Error boundary caught an error:', error, errorInfo);
  
  if (isStaleModuleError(error)) {
    const attempts = getRecoveryAttempts();
    console.log('[ErrorBoundary] Stale module error detected, attempt:', attempts + 1);
    
    if (attempts < MAX_RECOVERY_ATTEMPTS) {
      this.setState({ isRecovering: true });
      clearAllCachesAndReload();
      return;
    } else {
      console.log('[ErrorBoundary] Max recovery attempts reached, showing error UI');
      clearRecoveryAttempts();
    }
  }
  
  if (import.meta.env.DEV) {
   console.group('Error Boundary Details');
   console.error('Error:', error);
   console.error('Component Stack:', errorInfo.componentStack);
   console.groupEnd();
  }
 }

 private handleRetry = async () => {
  this.setState({ isRecovering: true });
  await clearAllCachesAndReload();
 };

 private handleGoHome = async () => {
  this.setState({ isRecovering: true });
  
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }
  } catch {
    // Ignore errors
  }
  
  localStorage.removeItem('app_version');
  window.location.replace('/?v=' + Date.now());
 };

 public render() {
  if (this.state.isRecovering) {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center bg-background dark:bg-black"
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
   if (this.props.fallback) {
    return this.props.fallback;
   }

   const isStaleError = this.state.error && isStaleModuleError(this.state.error);

   return (
    <div 
     className="fixed inset-0 flex items-center justify-center bg-background dark:bg-black p-4 sm:p-6"
     style={{ 
      paddingTop: 'max(1rem, env(safe-area-inset-top))',
      paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      paddingLeft: 'max(1rem, env(safe-area-inset-left))',
      paddingRight: 'max(1rem, env(safe-area-inset-right))'
     }}
     role="alert" 
     aria-live="assertive"
    >
     <Card className="w-full max-w-sm sm:max-w-md border-destructive/30 dark:border-red-500/30 bg-card dark:bg-zinc-900 shadow-xl">
      <CardHeader className="pb-3 sm:pb-4">
       <CardTitle className="flex items-center gap-2.5 sm:gap-3 text-destructive dark:text-red-400 text-lg sm:text-xl">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-destructive/10 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
         <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
        </div>
        {isStaleError ? 'Update Required' : 'Something went wrong'}
       </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5">
       <p className="text-sm sm:text-base text-muted-foreground dark:text-zinc-400 leading-relaxed">
        {isStaleError 
          ? 'A new version is available. Please reload to continue.'
          : (this.state.error?.message || 'An unexpected error occurred while loading this page.')
        }
       </p>
       
       {import.meta.env.DEV && this.state.error?.stack && (
        <details className="text-xs">
         <summary className="cursor-pointer text-muted-foreground hover:text-foreground py-2 min-h-[44px] flex items-center">
          View error details
         </summary>
         <pre className="mt-2 p-3 bg-muted dark:bg-zinc-800 rounded-lg overflow-auto max-h-40 text-xs">
          {this.state.error.stack}
         </pre>
        </details>
       )}
       
       <div className="flex flex-col sm:flex-row gap-3">
        <Button 
         onClick={this.handleRetry}
         className="flex-1 min-h-[48px] sm:min-h-[44px] text-sm sm:text-base font-medium bg-primary hover:bg-primary/90 touch-target"
         data-testid="button-retry-error"
         aria-label="Reload the app"
        >
         <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
         {isStaleError ? 'Reload App' : 'Try Again'}
        </Button>
        <Button 
         onClick={this.handleGoHome}
         variant="outline"
         className="flex-1 min-h-[48px] sm:min-h-[44px] text-sm sm:text-base font-medium border-border/60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 touch-target"
         data-testid="button-go-home"
         aria-label="Go to homepage"
        >
         <Home className="w-4 h-4 mr-2" aria-hidden="true" />
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
