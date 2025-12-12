import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, MessageSquare, Target, ArrowRight, Loader2 } from "lucide-react";

export default function SharePage() {
  const [, setLocation] = useLocation();
  const [sharedData, setSharedData] = useState<{
    title?: string;
    text?: string;
    url?: string;
  }>({});
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get("title") || "";
    const text = params.get("text") || "";
    const url = params.get("url") || "";

    setSharedData({ title, text, url });
    setIsProcessing(false);
  }, []);

  const handleAskAI = () => {
    const query = [sharedData.title, sharedData.text, sharedData.url]
      .filter(Boolean)
      .join(" - ");
    
    setLocation(`/ai-assistant?query=${encodeURIComponent(query)}`);
  };

  const handleAddToGoal = () => {
    setLocation("/financial-goals");
  };

  const handleGoToDashboard = () => {
    setLocation("/");
  };

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="share-loading">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Processing shared content...</p>
        </div>
      </div>
    );
  }

  const hasContent = sharedData.title || sharedData.text || sharedData.url;

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6" data-testid="share-page">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Shared Content</CardTitle>
              <CardDescription>
                You shared something with Twealth
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasContent ? (
            <>
              {sharedData.title && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Title</p>
                  <p className="text-foreground" data-testid="text-shared-title">
                    {sharedData.title}
                  </p>
                </div>
              )}
              {sharedData.text && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Content</p>
                  <p className="text-foreground" data-testid="text-shared-text">
                    {sharedData.text}
                  </p>
                </div>
              )}
              {sharedData.url && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">URL</p>
                  <a 
                    href={sharedData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                    data-testid="link-shared-url"
                  >
                    {sharedData.url}
                  </a>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No content was shared. Try sharing something from another app!
            </p>
          )}
        </CardContent>
      </Card>

      {hasContent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What would you like to do?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleAskAI}
              className="w-full justify-between"
              variant="outline"
              data-testid="button-ask-ai"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Ask AI about this
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={handleAddToGoal}
              className="w-full justify-between"
              variant="outline"
              data-testid="button-add-goal"
            >
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Create a financial goal
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={handleGoToDashboard}
              className="w-full"
              data-testid="button-go-dashboard"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {!hasContent && (
        <div className="flex justify-center">
          <Button onClick={handleGoToDashboard} data-testid="button-back-home">
            Back to Home
          </Button>
        </div>
      )}
    </div>
  );
}
