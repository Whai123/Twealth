import { useState, useRef, useCallback } from "react";
import { motion, PanInfo, useMotionValue, useTransform, animate } from "framer-motion";
import { Archive, Flag, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  type: string;
  description: string;
  category: string;
  date: string;
  amount: string;
  goalId?: number;
  isArchived?: boolean;
  isFlagged?: boolean;
}

interface SwipeableTransactionItemProps {
  transaction: Transaction;
  onArchive?: (id: number) => void;
  onFlag?: (id: number) => void;
}

const SWIPE_THRESHOLD = 80;

export function SwipeableTransactionItem({ 
  transaction, 
  onArchive, 
  onFlag 
}: SwipeableTransactionItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  
  const archiveOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const flagOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && onArchive) {
      event.preventDefault();
      animate(x, -300, {
        duration: 0.3,
        ease: "easeOut",
        onComplete: () => {
          onArchive(transaction.id);
          x.set(0);
        }
      });
    } else if (event.key === 'ArrowRight' && onFlag) {
      event.preventDefault();
      animate(x, 300, {
        duration: 0.3,
        ease: "easeOut",
        onComplete: () => {
          onFlag(transaction.id);
          x.set(0);
        }
      });
    } else if (event.key === 'a' && onArchive) {
      event.preventDefault();
      onArchive(transaction.id);
    } else if (event.key === 'f' && onFlag) {
      event.preventDefault();
      onFlag(transaction.id);
    }
  }, [x, onArchive, onFlag, transaction.id]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
        return <TrendingUp className="text-green-600" size={16} />;
      case "expense":
        return <TrendingDown className="text-red-600" size={16} />;
      case "transfer":
        return <DollarSign className="text-blue-600" size={16} />;
      default:
        return <DollarSign className="text-gray-600" size={16} />;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case "income":
        return "text-green-600";
      case "expense":
        return "text-red-600";
      case "transfer":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    const swipeDistance = info.offset.x;
    
    if (swipeDistance < -SWIPE_THRESHOLD && onArchive) {
      // Slide out left with confirmation animation
      animate(x, -300, {
        duration: 0.3,
        ease: "easeOut",
        onComplete: () => {
          onArchive(transaction.id);
          // Reset position for when item reappears
          x.set(0);
        }
      });
    } else if (swipeDistance > SWIPE_THRESHOLD && onFlag) {
      // Slide out right with confirmation animation
      animate(x, 300, {
        duration: 0.3,
        ease: "easeOut",
        onComplete: () => {
          onFlag(transaction.id);
          // Reset position for when item reappears
          x.set(0);
        }
      });
    } else {
      // Snap back to original position if threshold not met
      animate(x, 0, {
        duration: 0.3,
        ease: "easeOut"
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      role="button"
      aria-label={`${transaction.description || transaction.category}: ${transaction.type === "income" ? "+" : "-"}$${Math.abs(parseFloat(transaction.amount)).toLocaleString()}. Press left arrow or A to archive, right arrow or F to flag.`}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={cn(
        "relative overflow-hidden rounded-lg border outline-none",
        isFocused && "ring-2 ring-blue-500 ring-offset-2 ring-offset-background"
      )}
    >
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        <motion.div 
          style={{ opacity: archiveOpacity }}
          className="flex items-center gap-2 text-red-600 font-medium"
        >
          <Archive size={20} />
          <span className="text-sm">Archive</span>
        </motion.div>
        
        <motion.div 
          style={{ opacity: flagOpacity }}
          className="flex items-center gap-2 text-amber-600 font-medium"
        >
          <span className="text-sm">Flag</span>
          <Flag size={20} />
        </motion.div>
      </div>

      {/* Draggable Transaction Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          "flex items-center justify-between bg-background border-0 rounded-lg transition-colors relative z-10",
          isDragging ? "cursor-grabbing" : "cursor-grab hover:bg-muted/50"
        )}
      >
        <div 
          className="flex items-center min-w-0 flex-1" 
          style={{ 
            gap: 'var(--space-3)', 
            padding: 'var(--space-3)'
          }}
        >
          <div 
            className="bg-muted rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ width: '32px', height: '32px' }}
          >
            {getTransactionIcon(transaction.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 
              className="font-medium text-foreground truncate" 
              data-testid={`text-transaction-${transaction.id}`}
              style={{ fontSize: 'var(--text-sm)' }}
              title={transaction.description || transaction.category}
            >
              {transaction.description || transaction.category}
            </h4>
            <div 
              className="flex items-center text-muted-foreground" 
              style={{ gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}
            >
              <span>{new Date(transaction.date).toLocaleDateString()}</span>
              <span>•</span>
              <span className="capitalize">
                {transaction.category.replace('_', ' ')}
              </span>
              {transaction.isArchived && (
                <>
                  <span>•</span>
                  <span className="text-red-600 flex items-center gap-1">
                    <Archive size={12} />
                    Archived
                  </span>
                </>
              )}
              {transaction.isFlagged && (
                <>
                  <span>•</span>
                  <span className="text-amber-600 flex items-center gap-1">
                    <Flag size={12} />
                    Flagged
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0" style={{ paddingRight: 'var(--space-3)' }}>
          <span 
            className={`font-semibold whitespace-nowrap ${getAmountColor(transaction.type)}`}
            style={{ fontSize: 'var(--text-base)' }}
            data-testid={`text-amount-${transaction.id}`}
          >
            {transaction.type === "income" ? "+" : "-"}${Math.abs(parseFloat(transaction.amount)).toLocaleString()}
          </span>
          {transaction.goalId && (
            <p 
              className="text-muted-foreground whitespace-nowrap" 
              style={{ fontSize: 'var(--text-xs)' }}
            >
              Goal contribution
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
