import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  illustration?: 'transactions' | 'goals' | 'budgets';
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTestId?: string;
}

export default function EmptyState({
  illustration,
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionTestId
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="empty-state">
      {/* SVG Illustration or Icon */}
      <div className="mb-6">
        {illustration === 'transactions' && <TransactionsIllustration />}
        {illustration === 'goals' && <GoalsIllustration />}
        {illustration === 'budgets' && <BudgetsIllustration />}
        {Icon && !illustration && (
          <Icon className="w-16 h-16 text-muted-foreground/40" />
        )}
      </div>

      {/* Text Content */}
      <div className="max-w-sm space-y-2 mb-6">
        <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button onClick={onAction} data-testid={actionTestId} className="min-h-[44px]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Monochrome SVG Illustrations - Professional, minimal, no gradients

function TransactionsIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground/40"
    >
      {/* Receipt icon with transaction lines */}
      <rect x="30" y="15" width="60" height="90" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      
      {/* Receipt header */}
      <line x1="40" y1="28" x2="80" y2="28" stroke="currentColor" strokeWidth="2" />
      
      {/* Transaction lines */}
      <line x1="40" y1="42" x2="70" y2="42" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="77" cy="42" r="2" fill="currentColor" />
      
      <line x1="40" y1="52" x2="65" y2="52" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="77" cy="52" r="2" fill="currentColor" />
      
      <line x1="40" y1="62" x2="68" y2="62" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="77" cy="62" r="2" fill="currentColor" />
      
      <line x1="40" y1="72" x2="72" y2="72" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="77" cy="72" r="2" fill="currentColor" />
      
      {/* Receipt footer - total line */}
      <line x1="40" y1="88" x2="80" y2="88" stroke="currentColor" strokeWidth="2" />
      <line x1="40" y1="92" x2="80" y2="92" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function GoalsIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground/40"
    >
      {/* Target/bullseye icon */}
      <circle cx="60" cy="60" r="35" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="60" cy="60" r="25" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="60" cy="60" r="15" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="60" cy="60" r="5" fill="currentColor" />
      
      {/* Arrow pointing to center */}
      <path
        d="M 85 35 L 67 53"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 85 35 L 78 38 M 85 35 L 82 42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BudgetsIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground/40"
    >
      {/* Piggy bank outline */}
      <ellipse cx="60" cy="65" rx="30" ry="25" stroke="currentColor" strokeWidth="2" fill="none" />
      
      {/* Pig snout */}
      <ellipse cx="82" cy="60" rx="8" ry="6" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="79" cy="59" r="1.5" fill="currentColor" />
      <circle cx="82" cy="61" r="1.5" fill="currentColor" />
      
      {/* Pig ear */}
      <path
        d="M 48 45 Q 42 40 45 35"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Eye */}
      <circle cx="55" cy="58" r="2.5" fill="currentColor" />
      
      {/* Coin slot on top */}
      <rect x="55" y="42" width="10" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      
      {/* Legs */}
      <line x1="45" y1="90" x2="45" y2="100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="55" y1="90" x2="55" y2="100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="65" y1="90" x2="65" y2="100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="75" y1="90" x2="75" y2="100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Curly tail */}
      <path
        d="M 30 65 Q 25 65 25 60 Q 25 55 28 55"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
