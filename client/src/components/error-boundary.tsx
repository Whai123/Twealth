import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
 children: ReactNode;
 fallback?: ReactNode;
}

interface State {
 hasError: boolean;
 error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
 public state: State = {
  hasError: false
 };

 public static getDerivedStateFromError(error: Error): State {
  return { hasError: true, error };
 }

 public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error('Error boundary caught an error:', error, errorInfo);
  
  if (import.meta.env.DEV) {
   console.group('Error Boundary Details');
   console.error('Error:', error);
   console.error('Component Stack:', errorInfo.componentStack);
   console.groupEnd();
  }
 }

 private handleRetry = () => {
  this.setState({ hasError: false, error: undefined });
 };

 public render() {
  if (this.state.hasError) {
   if (this.props.fallback) {
    return this.props.fallback;
   }

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
        Something went wrong
       </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5">
       <p className="text-sm sm:text-base text-muted-foreground dark:text-zinc-400 leading-relaxed">
        {this.state.error?.message || 'An unexpected error occurred while loading this page.'}
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
         aria-label="Try loading again"
        >
         <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
         Try Again
        </Button>
        <Button 
         onClick={() => window.location.href = '/'}
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