import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'default' | 'text' | 'heading' | 'avatar' | 'button' | 'card';
}

function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  const variantClasses = {
    default: '',
    text: 'h-4',
    heading: 'h-6',
    avatar: 'rounded-full',
    button: 'h-10 rounded-lg',
    card: 'rounded-xl',
  };

  return (
    <div
      className={cn(
        "skeleton rounded-md bg-muted/60 dark:bg-muted/30",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-8 w-3/5" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-[200px]" />
            <Skeleton className="h-3 w-3/4 max-w-[150px]" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      ))}
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="rounded-xl border bg-card p-5 md:p-6 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

const CHART_HEIGHTS = [75, 45, 60, 80, 55, 70, 50, 85, 65, 72, 58, 68];

function SkeletonChart() {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2 h-48 px-2">
        {CHART_HEIGHTS.map((height, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 rounded-t-md" 
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between px-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

function SkeletonLineChart() {
  return (
    <div className="space-y-4">
      <div className="h-48 relative">
        <Skeleton className="absolute inset-0 rounded-lg" />
      </div>
      <div className="flex justify-between px-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-3 w-10" />
        ))}
      </div>
    </div>
  );
}

function SkeletonPieChart() {
  return (
    <div className="flex items-center justify-center gap-8">
      <Skeleton className="h-40 w-40 rounded-full" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonEvent() {
  return (
    <div className="rounded-xl border p-4 bg-card">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

function SkeletonTransaction() {
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/20">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-5 w-20 ml-auto" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  );
}

function SkeletonGoal() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      </div>
      <Skeleton className="h-2.5 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

function SkeletonConversation() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

function SkeletonMessage({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className={cn("space-y-2 max-w-[70%]", isUser && "items-end")}>
        <Skeleton className={cn("h-20 w-64 rounded-xl", isUser ? "rounded-tr-sm" : "rounded-tl-sm")} />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function SkeletonBudget() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16 ml-auto" />
        </div>
      </div>
      <Skeleton className="h-2.5 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

function SkeletonCryptoCard() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      </div>
      <SkeletonLineChart />
    </div>
  );
}

function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
    xl: 'h-20 w-20',
  };
  
  return <Skeleton className={cn("rounded-full flex-shrink-0", sizeClasses[size])} />;
}

function SkeletonButton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-28',
    lg: 'h-12 w-36',
  };
  
  return <Skeleton className={cn("rounded-lg", sizeClasses[size])} />;
}

function SkeletonInput() {
  return <Skeleton className="h-10 w-full rounded-lg" />;
}

function SkeletonTextarea() {
  return <Skeleton className="h-24 w-full rounded-lg" />;
}

function SkeletonDashboard() {
  return (
    <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <Skeleton className="h-6 w-32 mb-6" />
          <SkeletonChart />
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <Skeleton className="h-6 w-40 mb-6" />
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <SkeletonTransaction key={i} />
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <SkeletonGoal key={i} />
        ))}
      </div>
    </div>
  );
}

function SkeletonPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="space-y-4 text-center">
        <div className="inline-block">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        </div>
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-3 w-24 mx-auto" />
      </div>
    </div>
  );
}

function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-card">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonCalendar() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
        {[...Array(35)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function SkeletonForm() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <SkeletonInput />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <SkeletonInput />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <SkeletonTextarea />
      </div>
      <div className="flex justify-end gap-3">
        <SkeletonButton size="md" />
        <SkeletonButton size="md" />
      </div>
    </div>
  );
}

function SkeletonProfile() {
  return (
    <div className="rounded-xl border bg-card p-8 shadow-sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <SkeletonAvatar size="xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
        <div className="flex gap-4 pt-4">
          <SkeletonButton size="sm" />
          <SkeletonButton size="sm" />
        </div>
      </div>
    </div>
  );
}

function SkeletonNotification() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border bg-card">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-2 w-2 rounded-full" />
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonStat,
  SkeletonChart,
  SkeletonLineChart,
  SkeletonPieChart,
  SkeletonEvent,
  SkeletonTransaction,
  SkeletonGoal,
  SkeletonConversation,
  SkeletonMessage,
  SkeletonBudget,
  SkeletonCryptoCard,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonInput,
  SkeletonTextarea,
  SkeletonDashboard,
  SkeletonPage,
  SkeletonList,
  SkeletonCalendar,
  SkeletonForm,
  SkeletonProfile,
  SkeletonNotification,
};
