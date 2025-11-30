import * as React from"react"
import * as CheckboxPrimitive from"@radix-ui/react-checkbox"
import { Check } from"lucide-react"

import { cn } from"@/lib/utils"

const Checkbox = React.forwardRef<
 React.ElementRef<typeof CheckboxPrimitive.Root>,
 React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
 <CheckboxPrimitive.Root
  ref={ref}
  className={cn(
   "peer relative h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 cursor-pointer rounded-md ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
   "before:absolute before:inset-[11px] before:h-5 before:w-5 before:rounded-md before:border before:border-input before:transition-colors before:bg-background",
   "data-[state=checked]:before:bg-primary data-[state=checked]:before:border-primary",
   "hover:before:border-primary/60",
   className
  )}
  {...props}
 >
  <CheckboxPrimitive.Indicator
   className={cn("flex items-center justify-center text-primary-foreground z-10")}
  >
   <Check className="h-3.5 w-3.5" strokeWidth={3} />
  </CheckboxPrimitive.Indicator>
 </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
