import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { LucideIcon, Target, Receipt, PiggyBank, MessageSquare, Coins, Calendar, Bell, Users, LineChart, FileText, BarChart3, CreditCard, Briefcase, Wallet } from "lucide-react";

interface EmptyStateProps {
  illustration?: 'transactions' | 'goals' | 'budgets' | 'conversations' | 'crypto' | 'calendar' | 'notifications' | 'friends' | 'insights' | 'investments' | 'debts' | 'assets';
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  actionTestId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface EmptyStateConfig {
  icon: LucideIcon;
  iconBgClass: string;
  iconClass: string;
}

const emptyStateConfigs: Record<NonNullable<EmptyStateProps['illustration']>, EmptyStateConfig> = {
  transactions: {
    icon: Receipt,
    iconBgClass: "bg-blue-50 dark:bg-blue-950/30",
    iconClass: "text-blue-600 dark:text-blue-400"
  },
  goals: {
    icon: Target,
    iconBgClass: "bg-green-50 dark:bg-green-950/30",
    iconClass: "text-green-600 dark:text-green-400"
  },
  budgets: {
    icon: PiggyBank,
    iconBgClass: "bg-purple-50 dark:bg-purple-950/30",
    iconClass: "text-purple-600 dark:text-purple-400"
  },
  conversations: {
    icon: MessageSquare,
    iconBgClass: "bg-blue-50 dark:bg-blue-950/30",
    iconClass: "text-blue-600 dark:text-blue-400"
  },
  crypto: {
    icon: Coins,
    iconBgClass: "bg-orange-50 dark:bg-orange-950/30",
    iconClass: "text-orange-600 dark:text-orange-400"
  },
  calendar: {
    icon: Calendar,
    iconBgClass: "bg-teal-50 dark:bg-teal-950/30",
    iconClass: "text-teal-600 dark:text-teal-400"
  },
  notifications: {
    icon: Bell,
    iconBgClass: "bg-gray-50 dark:bg-gray-900/30",
    iconClass: "text-gray-600 dark:text-gray-400"
  },
  friends: {
    icon: Users,
    iconBgClass: "bg-pink-50 dark:bg-pink-950/30",
    iconClass: "text-pink-600 dark:text-pink-400"
  },
  insights: {
    icon: LineChart,
    iconBgClass: "bg-blue-50 dark:bg-blue-950/30",
    iconClass: "text-blue-600 dark:text-blue-400"
  },
  investments: {
    icon: BarChart3,
    iconBgClass: "bg-emerald-50 dark:bg-emerald-950/30",
    iconClass: "text-emerald-600 dark:text-emerald-400"
  },
  debts: {
    icon: CreditCard,
    iconBgClass: "bg-red-50 dark:bg-red-950/30",
    iconClass: "text-red-600 dark:text-red-400"
  },
  assets: {
    icon: Briefcase,
    iconBgClass: "bg-amber-50 dark:bg-amber-950/30",
    iconClass: "text-amber-600 dark:text-amber-400"
  }
};

const sizeClasses = {
  sm: {
    container: 'py-8 px-4',
    iconWrapper: 'w-12 h-12',
    icon: 'w-5 h-5',
    title: 'text-sm',
    description: 'text-xs max-w-xs',
    button: 'h-8 text-xs'
  },
  md: {
    container: 'py-12 px-4',
    iconWrapper: 'w-16 h-16',
    icon: 'w-7 h-7',
    title: 'text-lg',
    description: 'text-sm max-w-sm',
    button: 'h-9 text-sm'
  },
  lg: {
    container: 'py-16 px-6',
    iconWrapper: 'w-20 h-20',
    icon: 'w-9 h-9',
    title: 'text-xl',
    description: 'text-base max-w-md',
    button: 'h-10'
  }
};

export default function EmptyState({
  illustration,
  icon: CustomIcon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  actionTestId,
  size = 'md',
  className
}: EmptyStateProps) {
  const config = illustration ? emptyStateConfigs[illustration] : null;
  const Icon = CustomIcon || config?.icon || Wallet;
  const sizes = sizeClasses[size];
  
  const buttonContent = (
    <Button 
      onClick={onAction} 
      data-testid={actionTestId || `empty-state-action`} 
      className={cn("min-h-[44px]", sizes.button)}
    >
      {actionLabel}
    </Button>
  );

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        className
      )} 
      data-testid="empty-state"
    >
      {illustration ? (
        <div 
          className={cn(
            "rounded-2xl flex items-center justify-center mb-5",
            sizes.iconWrapper,
            config?.iconBgClass
          )}
        >
          <Icon className={cn(sizes.icon, config?.iconClass)} />
        </div>
      ) : (
        <div className="mb-5">
          <Icon className={cn("text-muted-foreground/40", sizes.icon === 'w-5 h-5' ? 'w-12 h-12' : sizes.icon === 'w-7 h-7' ? 'w-14 h-14' : 'w-16 h-16')} />
        </div>
      )}

      <div className={cn("space-y-2 mb-6", sizes.description.split(' ').pop())}>
        <h3 className={cn("font-semibold text-foreground tracking-tight", sizes.title)}>{title}</h3>
        <p className={cn("text-muted-foreground leading-relaxed", sizes.description)}>{description}</p>
      </div>

      {actionLabel && (onAction || actionHref) && (
        actionHref ? (
          <Link href={actionHref}>
            {buttonContent}
          </Link>
        ) : (
          buttonContent
        )
      )}
    </div>
  );
}

export function EmptyStateMinimal({
  icon: Icon = Wallet,
  message,
  className
}: {
  icon?: LucideIcon;
  message: string;
  className?: string;
}) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center py-8",
        className
      )}
      data-testid="empty-state-minimal"
    >
      <Icon className="w-8 h-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function EmptyStateInline({
  message,
  actionLabel,
  onAction,
  actionHref,
  className
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}) {
  const button = actionLabel && (onAction || actionHref) && (
    <Button variant="outline" size="sm" onClick={onAction} className="min-h-[36px]">
      {actionLabel}
    </Button>
  );

  return (
    <div 
      className={cn(
        "flex items-center justify-center gap-4 py-6 px-4 rounded-xl border border-dashed border-border/60 bg-muted/20",
        className
      )}
      data-testid="empty-state-inline"
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      {actionHref && button ? (
        <Link href={actionHref}>{button}</Link>
      ) : button}
    </div>
  );
}

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
      <rect x="30" y="15" width="60" height="90" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="40" y1="28" x2="80" y2="28" stroke="currentColor" strokeWidth="2" />
      <line x1="40" y1="42" x2="70" y2="42" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="77" cy="42" r="2" fill="currentColor" />
      <line x1="40" y1="52" x2="65" y2="52" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="77" cy="52" r="2" fill="currentColor" />
      <line x1="40" y1="62" x2="68" y2="62" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="77" cy="62" r="2" fill="currentColor" />
      <line x1="40" y1="72" x2="72" y2="72" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="77" cy="72" r="2" fill="currentColor" />
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
      <circle cx="60" cy="60" r="35" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="60" cy="60" r="25" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="60" cy="60" r="15" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="60" cy="60" r="5" fill="currentColor" />
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
      <ellipse cx="60" cy="65" rx="30" ry="25" stroke="currentColor" strokeWidth="2" fill="none" />
      <ellipse cx="82" cy="60" rx="8" ry="6" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="79" cy="59" r="1.5" fill="currentColor" />
      <circle cx="82" cy="61" r="1.5" fill="currentColor" />
      <path
        d="M 48 45 Q 42 40 45 35"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="55" cy="58" r="2.5" fill="currentColor" />
      <rect x="55" y="42" width="10" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="45" y1="90" x2="45" y2="100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="55" y1="90" x2="55" y2="100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="65" y1="90" x2="65" y2="100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="75" y1="90" x2="75" y2="100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
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

export { TransactionsIllustration, GoalsIllustration, BudgetsIllustration };
