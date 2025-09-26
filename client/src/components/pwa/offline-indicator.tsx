import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      // Hide message after 5 seconds
      setTimeout(() => setShowOfflineMessage(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <Card className={`transition-all duration-300 ${
        isOnline 
          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/50' 
          : 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/50'
      }`}>
        <CardContent className="py-2 px-4">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Back online! Data syncing...
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    You're offline
                  </span>
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    Your data will sync when back online
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}