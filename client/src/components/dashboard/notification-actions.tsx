import { useState } from"react";
import { useLocation } from"wouter";
import { 
 Dialog, 
 DialogContent, 
 DialogDescription,
 DialogHeader,
 DialogTitle 
} from"@/components/ui/dialog";
import TransactionForm from"@/components/forms/transaction-form";
import GoalForm from"@/components/forms/goal-form";
import AddFundsForm from"@/components/forms/add-funds-form";
import { useToast } from"@/hooks/use-toast";
import { safeString } from "@/lib/safe-render";

interface NotificationActionHandler {
 openTransactionForm: (data?: any) => void;
 openGoalForm: (data?: any) => void;
 openAddFundsForm: (goalId: string, goalTitle: string, currentAmount: string, targetAmount: string) => void;
 navigateToTransactions: (category?: string) => void;
 navigateToGoal: (goalId: string) => void;
}

interface NotificationActionsProps {
 children: (handlers: NotificationActionHandler) => React.ReactNode;
}

export default function NotificationActions({ children }: NotificationActionsProps) {
 const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
 const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
 const [isAddFundsFormOpen, setIsAddFundsFormOpen] = useState(false);
 const [addFundsData, setAddFundsData] = useState<{
  goalId: string;
  goalTitle: string;
  currentAmount: string;
  targetAmount: string;
 } | null>(null);
 const [transactionFormData, setTransactionFormData] = useState<any>(null);
 const [goalFormData, setGoalFormData] = useState<any>(null);
 
 const [, setLocation] = useLocation();
 const { toast } = useToast();

 const handlers: NotificationActionHandler = {
  openTransactionForm: (data) => {
   setTransactionFormData(data);
   setIsTransactionFormOpen(true);
  },

  openGoalForm: (data) => {
   setGoalFormData(data);
   setIsGoalFormOpen(true);
  },

  openAddFundsForm: (goalId, goalTitle, currentAmount, targetAmount) => {
   setAddFundsData({ goalId, goalTitle, currentAmount, targetAmount });
   setIsAddFundsFormOpen(true);
  },

  navigateToTransactions: (category) => {
   if (category) {
    setLocation(`/money-tracking?category=${category}`);
   } else {
    setLocation('/money-tracking');
   }
   toast({
    title:"Navigating to Transactions",
    description: category ? `Showing ${safeString(category)} transactions` :"Viewing all transactions",
   });
  },

  navigateToGoal: (goalId) => {
   setLocation(`/financial-goals`);
   toast({
    title:"Navigating to Goal",
    description:"Opening financial goals page",
   });
  }
 };

 const handleTransactionFormSuccess = () => {
  setIsTransactionFormOpen(false);
  setTransactionFormData(null);
  toast({
   title:"Transaction Added",
   description:"Your transaction has been recorded successfully.",
  });
 };

 const handleGoalFormSuccess = () => {
  setIsGoalFormOpen(false);
  setGoalFormData(null);
  toast({
   title:"Goal Created",
   description:"Your financial goal has been created successfully.",
  });
 };

 const handleAddFundsSuccess = () => {
  setIsAddFundsFormOpen(false);
  setAddFundsData(null);
 };

 return (
  <>
   {children(handlers)}

   {/* Transaction Form Modal */}
   <Dialog open={isTransactionFormOpen} onOpenChange={setIsTransactionFormOpen}>
    <DialogContent className="max-w-lg">
     <DialogHeader>
      <DialogTitle>Add Transaction</DialogTitle>
      <DialogDescription>
       Record a new income, expense, or transfer transaction.
      </DialogDescription>
     </DialogHeader>
     <TransactionForm onSuccess={handleTransactionFormSuccess} />
    </DialogContent>
   </Dialog>

   {/* Goal Form Modal */}
   <Dialog open={isGoalFormOpen} onOpenChange={setIsGoalFormOpen}>
    <DialogContent className="max-w-lg">
     <DialogHeader>
      <DialogTitle>Create Financial Goal</DialogTitle>
      <DialogDescription>
       Set up a new savings goal to track your progress.
      </DialogDescription>
     </DialogHeader>
     <GoalForm onSuccess={handleGoalFormSuccess} />
    </DialogContent>
   </Dialog>

   {/* Add Funds Form Modal */}
   {addFundsData && (
    <Dialog open={isAddFundsFormOpen} onOpenChange={setIsAddFundsFormOpen}>
     <DialogContent className="max-w-lg">
      <DialogHeader>
       <DialogTitle>Add Funds to Goal</DialogTitle>
       <DialogDescription>
        Add money to your "{safeString(addFundsData.goalTitle)}" goal.
       </DialogDescription>
      </DialogHeader>
      <AddFundsForm
       goalId={addFundsData.goalId}
       goalTitle={addFundsData.goalTitle}
       currentAmount={addFundsData.currentAmount}
       targetAmount={addFundsData.targetAmount}
       onSuccess={handleAddFundsSuccess}
      />
     </DialogContent>
    </Dialog>
   )}
  </>
 );
}