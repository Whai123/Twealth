import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet";
import TransactionForm from "@/components/forms/transaction-form";

interface ResponsiveTransactionDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

export function ResponsiveTransactionDialog({
  open,
  onOpenChange,
  triggerButton,
}: ResponsiveTransactionDialogProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const defaultTrigger = (
    <Button
      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm min-h-[44px] hidden md:flex"
      data-testid="button-add-transaction"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add
    </Button>
  );

  const handleSuccess = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetTrigger asChild>
          {triggerButton || defaultTrigger}
        </BottomSheetTrigger>
        <BottomSheetContent>
          <TransactionForm onSuccess={handleSuccess} />
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <TransactionForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
