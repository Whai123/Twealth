import { safeRender } from '@/lib/safe-render';

interface SafeTextProps {
  children: unknown;
  fallback?: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function SafeText({ 
  children, 
  fallback = '', 
  className,
  as: Component = 'span' 
}: SafeTextProps) {
  const content = safeRender(children);
  if (content === null && !fallback) return null;
  
  return (
    <Component className={className}>
      {content ?? fallback}
    </Component>
  );
}

export default SafeText;
