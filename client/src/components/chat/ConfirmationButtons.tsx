import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles } from 'lucide-react';
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

  // Action-specific emojis
  const getActionEmoji = () => {
    switch (confirmation.actionType) {
      case 'goal': return '🎯';
      case 'transaction': return '💰';
      case 'event': return '📅';
      case 'budget': return '💵';
      case 'group': return '👥';
      default: return '✨';
    }
  };

  return (
    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="w-3 h-3 text-yellow-500" />
        <span>{t('aiAssistant.confirmAction')}</span>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleConfirm}
          disabled={disabled || selected !== null}
          className={`
            flex-1 h-12 sm:h-11 text-base sm:text-sm
            bg-gradient-to-r from-green-500 to-emerald-600 
            hover:from-green-600 hover:to-emerald-700
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-md hover:shadow-lg
            transform hover:scale-105 active:scale-95
            transition-all duration-200
            ${selected === 'yes' ? 'ring-2 ring-green-500 ring-offset-2' : ''}
          `}
          data-testid="button-confirm-yes"
        >
          <Check className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
          {getActionEmoji()} {t('common.yes')}
          {selected === 'yes' && (
            <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
          )}
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
            transform hover:scale-105 active:scale-95
            transition-all duration-200
            ${selected === 'no' ? 'ring-2 ring-red-500 ring-offset-2 bg-red-50 dark:bg-red-950/20' : ''}
          `}
          data-testid="button-confirm-no"
        >
          <X className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
          {t('common.no')}
        </Button>
      </div>
      
      {selected && (
        <div className="text-xs text-center text-muted-foreground animate-in fade-in duration-200">
          {selected === 'yes' 
            ? `✅ ${t('aiAssistant.processingRequest')}`
            : `❌ ${t('aiAssistant.actionCancelled')}`
          }
        </div>
      )}
    </div>
  );
}
