import * as React from"react"
import * as ToastPrimitives from"@radix-ui/react-toast"
import { cva, type VariantProps } from"class-variance-authority"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from"lucide-react"

import { cn } from"@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
 React.ElementRef<typeof ToastPrimitives.Viewport>,
 React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
 <ToastPrimitives.Viewport
  ref={ref}
  className={cn(
  "fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[380px]",
   className
  )}
  style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
  {...props}
 />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
"group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 pr-10 shadow-lg backdrop-blur-sm transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
 {
  variants: {
   variant: {
    default:"border-border/50 bg-background/95 text-foreground shadow-md",
    success:"border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100",
    warning:"border-amber-200 dark:border-amber-800/50 bg-amber-50/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100",
    info:"border-blue-200 dark:border-blue-800/50 bg-blue-50/95 dark:bg-blue-950/90 text-blue-900 dark:text-blue-100",
    destructive:"border-red-200 dark:border-red-800/50 bg-red-50/95 dark:bg-red-950/90 text-red-900 dark:text-red-100",
   },
  },
  defaultVariants: {
   variant:"default",
  },
 }
)

const variantIcons = {
 default: null,
 success: CheckCircle2,
 warning: AlertTriangle,
 info: Info,
 destructive: AlertCircle,
}

const variantIconColors = {
 default:"text-foreground",
 success:"text-emerald-600 dark:text-emerald-400",
 warning:"text-amber-600 dark:text-amber-400",
 info:"text-blue-600 dark:text-blue-400",
 destructive:"text-red-600 dark:text-red-400",
}

const Toast = React.forwardRef<
 React.ElementRef<typeof ToastPrimitives.Root>,
 React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants> & { showIcon?: boolean }
>(({ className, variant, showIcon = true, children, ...props }, ref) => {
 const IconComponent = variant ? variantIcons[variant] : null
 const iconColor = variant ? variantIconColors[variant] : variantIconColors.default
 
 return (
  <ToastPrimitives.Root
   ref={ref}
   className={cn(toastVariants({ variant }), className)}
   role="status"
   aria-live="polite"
   aria-atomic="true"
   {...props}
  >
   {showIcon && IconComponent && (
    <div className="flex-shrink-0 mt-0.5">
     <IconComponent className={cn("h-5 w-5", iconColor)} />
    </div>
   )}
   {children}
  </ToastPrimitives.Root>
 )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
 React.ElementRef<typeof ToastPrimitives.Action>,
 React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
 <ToastPrimitives.Action
  ref={ref}
  className={cn(
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
   className
  )}
  {...props}
 />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
 React.ElementRef<typeof ToastPrimitives.Close>,
 React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
 <ToastPrimitives.Close
  ref={ref}
  className={cn(
  "absolute right-2 top-2 rounded-lg p-1.5 opacity-60 transition-all hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring hover:bg-black/5 dark:hover:bg-white/10",
   className
  )}
  toast-close=""
  aria-label="Close notification"
  {...props}
 >
  <X className="h-4 w-4" aria-hidden="true" />
 </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
 React.ElementRef<typeof ToastPrimitives.Title>,
 React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
 <ToastPrimitives.Title
  ref={ref}
  className={cn("text-sm font-semibold leading-tight", className)}
  {...props}
 />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
 React.ElementRef<typeof ToastPrimitives.Description>,
 React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
 <ToastPrimitives.Description
  ref={ref}
  className={cn("text-sm opacity-80 leading-snug", className)}
  {...props}
 />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
 type ToastProps,
 type ToastActionElement,
 ToastProvider,
 ToastViewport,
 Toast,
 ToastTitle,
 ToastDescription,
 ToastClose,
 ToastAction,
}
