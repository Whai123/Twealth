import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ConfirmationPattern } from '@/lib/aiConfirmation';

interface ConfirmationButtonsProps {
  confirmation: ConfirmationPattern;
  onConfirm: () => void;
  onDecline: () => void;
  disabled?: boolean;
}

export function ConfirmationButtons({ 
  confirmation, 
  onConfirm, 
  onDecline,
  disabled = false 
}: ConfirmationButtonsProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<'yes' | 'no' | null>(null);

  const handleConfirm = () => {
    setSelected('yes');
    onConfirm();
  };

  const handleDecline = () => {
    setSelected('no');
    onDecline();
  };

  // Removed action emojis for professional design

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Plus className="w-3 h-3" />
        <span>{t('aiAssistant.confirmAction')}</span>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleConfirm}
          disabled={disabled || selected !== null}
          className={`
            flex-1 h-12 sm:h-11 text-base sm:text-sm
            bg-white dark:bg-gray-900 
           
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-md hover:shadow-lg
            transform
           
            ${selected === 'yes' ? 'ring-2 ring-green-500 ring-offset-2' : ''}
          `}
          data-testid="button-confirm-yes"
        >
          <Check className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
          {t('common.yes')}
        </Button>
        
        <Button
          onClick={handleDecline}
          disabled={disabled || selected !== null}
          variant="outline"
          className={`
            flex-1 h-12 sm:h-11 text-base sm:text-sm
            border-2 border-red-200 dark:border-red-800
            hover:bg-red-50 dark:hover:bg-red-950/20
            hover:border-red-300 dark:hover:border-red-700
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-sm hover:shadow-md
            transform
           
            ${selected === 'no' ? 'ring-2 ring-red-500 ring-offset-2 bg-red-50 dark:bg-red-950/20' : ''}
          `}
          data-testid="button-confirm-no"
        >
          <X className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
          {t('common.no')}
        </Button>
      </div>
      
      {selected && (
        <div className="text-xs text-center text-muted-foreground">
          {selected === 'yes' 
            ? `${t('aiAssistant.processingRequest')}`
            : `${t('aiAssistant.actionCancelled')}`
          }
        </div>
      )}
    </div>
  );
}
