import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ 
  message = "Something went wrong", 
  onRetry,
  compact = false 
}: ErrorStateProps) {
  if (compact) {
    return (
      <div className="flex items-center justify-center py-4 px-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
        <div className="flex items-center gap-3 text-sm">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-red-700 dark:text-red-400">{message}</span>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-7 px-2 text-red-700 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/10 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Oops!</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          className="shadow-sm hover:shadow-md transition-all"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}
