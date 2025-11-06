import { LucideIcon } from"lucide-react";
import { Button } from"./ui/button";
import { cn } from"@/lib/utils";

interface EmptyStateProps {
 icon: LucideIcon;
 title: string;
 description: string;
 action?: {
  label: string;
  onClick: () => void;
  testId?: string;
 };
 className?: string;
}

export function EmptyState({
 icon: Icon,
 title,
 description,
 action,
 className,
}: EmptyStateProps) {
 return (
  <div
   className={cn(
   "flex flex-col items-center justify-center p-12 text-center",
    className
   )}
  >
   <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
    <Icon className="h-10 w-10 text-muted-foreground" />
   </div>
   <h3 className="text-lg font-semibold mb-2">{title}</h3>
   <p className="text-sm text-muted-foreground mb-6 max-w-sm">
    {description}
   </p>
   {action && (
    <Button onClick={action.onClick} data-testid={action.testId}>
     {action.label}
    </Button>
   )}
  </div>
 );
}
