import { useState, ReactNode } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Archive, Flag, Edit, Trash2, Check, MoreHorizontal } from "lucide-react";

interface SwipeAction {
  id: string;
  icon: any;
  label: string;
  color: string;
  bgColor: string;
  onAction: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  className?: string;
}

const defaultLeftActions: SwipeAction[] = [
  {
    id: "archive",
    icon: Archive,
    label: "Archive",
    color: "text-white",
    bgColor: "bg-blue-500",
    onAction: () => {},
  },
];

const defaultRightActions: SwipeAction[] = [
  {
    id: "delete",
    icon: Trash2,
    label: "Delete",
    color: "text-white",
    bgColor: "bg-red-500",
    onAction: () => {},
  },
];

export function SwipeableCard({
  children,
  leftActions = defaultLeftActions,
  rightActions = defaultRightActions,
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  className = "",
}: SwipeableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const x = useMotionValue(0);
  
  const leftOpacity = useTransform(x, [0, threshold], [0, 1]);
  const rightOpacity = useTransform(x, [-threshold, 0], [1, 0]);
  
  const leftScale = useTransform(x, [0, threshold], [0.8, 1]);
  const rightScale = useTransform(x, [-threshold, 0], [1, 0.8]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    const offsetX = info.offset.x;

    if (offsetX > threshold && leftActions.length > 0) {
      leftActions[0].onAction();
      onSwipeRight?.();
    } else if (offsetX < -threshold && rightActions.length > 0) {
      rightActions[0].onAction();
      onSwipeLeft?.();
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {leftActions.length > 0 && (
        <motion.div
          style={{ opacity: leftOpacity, scale: leftScale }}
          className={`absolute inset-y-0 left-0 flex items-center justify-start pl-4 ${leftActions[0].bgColor} rounded-l-xl`}
        >
          <div className="flex flex-col items-center gap-1">
            {(() => {
              const IconComponent = leftActions[0].icon;
              return <IconComponent className={`w-5 h-5 ${leftActions[0].color}`} />;
            })()}
            <span className={`text-xs font-medium ${leftActions[0].color}`}>
              {leftActions[0].label}
            </span>
          </div>
        </motion.div>
      )}

      {rightActions.length > 0 && (
        <motion.div
          style={{ opacity: rightOpacity, scale: rightScale }}
          className={`absolute inset-y-0 right-0 flex items-center justify-end pr-4 ${rightActions[0].bgColor} rounded-r-xl`}
        >
          <div className="flex flex-col items-center gap-1">
            {(() => {
              const IconComponent = rightActions[0].icon;
              return <IconComponent className={`w-5 h-5 ${rightActions[0].color}`} />;
            })()}
            <span className={`text-xs font-medium ${rightActions[0].color}`}>
              {rightActions[0].label}
            </span>
          </div>
        </motion.div>
      )}

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={`relative bg-card rounded-xl ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        whileTap={{ cursor: "grabbing" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

interface TransactionSwipeCardProps {
  transaction: {
    id: number;
    description: string;
    amount: string;
    type: string;
    category: string;
    date: string;
  };
  onArchive?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  children: ReactNode;
}

export function TransactionSwipeCard({
  transaction,
  onArchive,
  onDelete,
  onEdit,
  children,
}: TransactionSwipeCardProps) {
  const leftActions: SwipeAction[] = [
    {
      id: "complete",
      icon: Check,
      label: "Done",
      color: "text-white",
      bgColor: "bg-green-500",
      onAction: onArchive || (() => {}),
    },
  ];

  const rightActions: SwipeAction[] = [
    {
      id: "delete",
      icon: Trash2,
      label: "Delete",
      color: "text-white",
      bgColor: "bg-red-500",
      onAction: onDelete || (() => {}),
    },
  ];

  return (
    <SwipeableCard
      leftActions={leftActions}
      rightActions={rightActions}
      className="mb-2"
    >
      {children}
    </SwipeableCard>
  );
}

interface GoalSwipeCardProps {
  goal: {
    id: number;
    title: string;
    currentAmount: string;
    targetAmount: number;
  };
  onAddFunds?: () => void;
  onEdit?: () => void;
  children: ReactNode;
}

export function GoalSwipeCard({
  goal,
  onAddFunds,
  onEdit,
  children,
}: GoalSwipeCardProps) {
  const leftActions: SwipeAction[] = [
    {
      id: "add-funds",
      icon: () => (
        <span className="text-lg font-bold text-white">+$</span>
      ),
      label: "Add Funds",
      color: "text-white",
      bgColor: "bg-green-500",
      onAction: onAddFunds || (() => {}),
    },
  ];

  const rightActions: SwipeAction[] = [
    {
      id: "edit",
      icon: Edit,
      label: "Edit",
      color: "text-white",
      bgColor: "bg-blue-500",
      onAction: onEdit || (() => {}),
    },
  ];

  return (
    <SwipeableCard
      leftActions={leftActions}
      rightActions={rightActions}
      className="mb-3"
    >
      {children}
    </SwipeableCard>
  );
}
