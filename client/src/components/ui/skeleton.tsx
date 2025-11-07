import { cn } from"@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
 className?: string;
}

function Skeleton({ className, ...props }: SkeletonProps) {
 return (
  <div
   className={cn(
   "rounded-md bg-muted/60 dark:bg-muted/30",
    className
   )}
   {...props}
  />
 );
}

function SkeletonCard() {
 return (
  <div className="rounded-lg border bg-card p-6 shadow-sm">
   <div className="space-y-3">
    <Skeleton className="h-5 w-2/5" />
    <Skeleton className="h-8 w-3/5" />
    <Skeleton className="h-4 w-1/3" />
   </div>
  </div>
 );
}

function SkeletonTable() {
 return (
  <div className="space-y-3">
   {[...Array(5)].map((_, i) => (
    <div key={i} className="flex items-center gap-4">
     <Skeleton className="h-12 w-12 rounded-full" />
     <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-3/4" />
     </div>
     <Skeleton className="h-9 w-20" />
    </div>
   ))}
  </div>
 );
}

function SkeletonStat() {
 return (
  <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm">
   <div className="space-y-2">
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-3 w-1/3" />
   </div>
  </div>
 );
}

const CHART_HEIGHTS = [75, 45, 60, 80, 55, 70, 50, 85, 65, 72, 58, 68];

function SkeletonChart() {
 return (
  <div className="space-y-4">
   <div className="flex items-end gap-2 h-48">
    {CHART_HEIGHTS.map((height, i) => (
     <Skeleton 
      key={i} 
      className="flex-1" 
      style={{ height: `${height}%` }}
     />
    ))}
   </div>
   <div className="flex justify-between">
    {[...Array(6)].map((_, i) => (
     <Skeleton key={i} className="h-3 w-8" />
    ))}
   </div>
  </div>
 );
}

function SkeletonEvent() {
 return (
  <div className="rounded-lg border p-3 md:p-4 bg-card">
   <div className="flex items-start gap-3">
    <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
    <div className="flex-1 space-y-2">
     <Skeleton className="h-4 w-3/4" />
     <Skeleton className="h-3 w-1/2" />
    </div>
   </div>
  </div>
 );
}

function SkeletonTransaction() {
 return (
  <div className="flex items-center justify-between p-4 border-b last:border-0">
   <div className="flex items-center gap-3">
    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
    <div className="space-y-2">
     <Skeleton className="h-4 w-32" />
     <Skeleton className="h-3 w-24" />
    </div>
   </div>
   <Skeleton className="h-6 w-16" />
  </div>
 );
}

function SkeletonGoal() {
 return (
  <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
   <div className="flex items-start justify-between">
    <div className="space-y-2 flex-1">
     <Skeleton className="h-5 w-2/3" />
     <Skeleton className="h-4 w-1/3" />
    </div>
    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
   </div>
   <Skeleton className="h-2 w-full" />
   <div className="flex justify-between">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-4 w-20" />
   </div>
  </div>
 );
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
    <div className="rounded-lg border bg-card p-6 shadow-sm">
     <Skeleton className="h-6 w-32 mb-4" />
     <SkeletonChart />
    </div>
    <div className="rounded-lg border bg-card p-6 shadow-sm">
     <Skeleton className="h-6 w-40 mb-4" />
     <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
       <SkeletonTransaction key={i} />
      ))}
     </div>
    </div>
   </div>
  </div>
 );
}

function SkeletonPage() {
 return (
  <div className="flex items-center justify-center min-h-screen">
   <div className="space-y-4 text-center">
    <div className="inline-block">
     <Skeleton className="h-12 w-12 rounded-full" />
    </div>
    <Skeleton className="h-4 w-32 mx-auto" />
   </div>
  </div>
 );
}

export {
 Skeleton,
 SkeletonCard,
 SkeletonTable,
 SkeletonStat,
 SkeletonChart,
 SkeletonEvent,
 SkeletonTransaction,
 SkeletonGoal,
 SkeletonDashboard,
 SkeletonPage,
};
