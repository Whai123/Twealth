import { ReactNode, isValidElement } from "react"
import { useToast } from"../../hooks/use-toast"
import {
 Toast,
 ToastClose,
 ToastDescription,
 ToastProvider,
 ToastTitle,
 ToastViewport,
} from"./toast"

function safeRender(value: unknown): ReactNode {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (isValidElement(value)) return value;
  if (typeof value === 'object') {
    console.warn('[Toaster] Unexpected object in toast:', value);
    return null;
  }
  return String(value);
}

export function Toaster() {
 const { toasts } = useToast()

 return (
  <ToastProvider duration={5000}>
   {toasts.map(function ({ id, title, description, action, icon, variant, ...props }) {
    return (
     <Toast key={id} variant={variant} {...props}>
      <div className="grid gap-0.5 flex-1">
       {title && <ToastTitle>{safeRender(title)}</ToastTitle>}
       {description && (
        <ToastDescription>{safeRender(description)}</ToastDescription>
       )}
      </div>
      {action}
      <ToastClose />
     </Toast>
    )
   })}
   <ToastViewport />
  </ToastProvider>
 )
}
