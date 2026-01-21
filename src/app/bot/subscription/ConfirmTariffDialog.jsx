import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TARIFF_THEMES } from '@/lib/constants/tariffs';
import { toast } from 'react-hot-toast';
import { Info } from 'lucide-react';

export default function ConfirmTariffDialog({
  isOpen,
  onClose,
  selectedTariff,
  currentTariff,
  nextPaymentAt,
  onConfirm,
  embedded = false,
  trialDays = null,
}) {
  const [isUpgrade, setIsUpgrade] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentTheme = TARIFF_THEMES[currentTariff?.sort] || TARIFF_THEMES.default;
  const selectedTheme = TARIFF_THEMES[selectedTariff?.sort] || TARIFF_THEMES.default;

  useEffect(() => {
    if (selectedTariff && currentTariff) {
      setIsUpgrade(selectedTariff.sort > currentTariff.sort);
    }
  }, [selectedTariff, currentTariff]);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      const response = await onConfirm();

      if (response.ok && response.payment_url) {
        window.location.href = response.payment_url;
      } else {
        onClose();
      }
    } catch (error) {
      // toast.error(error?.details?.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div className={`space-y-8 ${embedded ? 'w-full' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-stretch gap-6"
      >
        <div
          className={`flex-1 p-6 rounded-xl custom-card relative overflow-hidden group ${currentTheme.colors.border}`}
        >
          <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${currentTheme.colors.medium}`}
          />
          <div className={`${currentTheme.colors.iconBg} w-fit p-2 rounded-lg mb-3`}>
            <div className={`w-6 h-6 ${currentTheme.colors.iconColor}`}>
              {React.createElement(currentTheme.icon)}
            </div>
          </div>
          <div className="text-sm text-muted-foreground font-medium">Текущий тариф</div>
          <div className="font-semibold mt-2">{currentTariff?.name}</div>
          <div className={`text-xl font-bold mt-1 ${currentTheme.colors.iconColor}`}>
            {currentTariff?.price} BYN/мес
          </div>
        </div>

        <div className="flex items-center justify-center">
          {isUpgrade ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rotate-90 md:rotate-0"
            >
              <ArrowUp className="w-8 h-8 text-green-500" />
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rotate-90 md:rotate-0"
            >
              <ArrowDown className="w-8 h-8 text-amber-500" />
            </motion.div>
          )}
        </div>

        <div
          className={`flex-1 p-6 rounded-xl custom-card relative overflow-hidden group ${selectedTheme.colors.border}`}
        >
          <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${selectedTheme.colors.medium}`}
          />
          <div className={`${selectedTheme.colors.iconBg} w-fit p-2 rounded-lg mb-3`}>
            <div className={`w-6 h-6 ${selectedTheme.colors.iconColor}`}>
              {React.createElement(selectedTheme.icon)}
            </div>
          </div>
          <div className="text-sm text-muted-foreground font-medium">Новый тариф</div>
          <div className="font-semibold mt-2">{selectedTariff?.name}</div>
          <div className={`text-xl font-bold mt-1 ${selectedTheme.colors.iconColor}`}>
            {selectedTariff?.price} BYN/мес
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isUpgrade ? (
          <div
            className={`rounded-xl custom-card p-6 relative overflow-hidden group ${selectedTheme.colors.border}`}
          >
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${selectedTheme.colors.medium}`}
            />
            {trialDays ? (
              <p className="text-sm leading-relaxed">
                Для вас действует специальное предложение: {trialDays} дней тарифа «Стандарт» без оплаты. После триала — списание{' '}
                <span className={`font-bold ${selectedTheme.colors.iconColor}`}>{selectedTariff?.price} BYN/мес</span>.
              </p>
            ) : (
              <p className="text-sm leading-relaxed">
                При повышении тарифа оплата будет произведена сейчас. Сумма к оплате:{' '}
                <span className={`font-bold ${selectedTheme.colors.iconColor}`}>{selectedTariff?.price} BYN</span>.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl custom-card p-6 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">
              При понижении тарифа новые условия начнут действовать со следующего периода оплаты:
              <span className="font-bold text-amber-700 block mt-2">
                {formatDate(nextPaymentAt)}
              </span>
              <span>
                Cумма к оплате: <span className="font-bold text-amber-700 inline">0 BYN</span>,{' '}
                затем{' '}
                <span className="font-bold text-amber-700 inline">
                  {selectedTariff?.price} BYN/мес
                </span>
              </span>
            </p>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-4"
      >
        <Button
          className={`flex-1 h-12 transition-colors ${selectedTheme.colors.button}`}
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span>Подождите...</span>
            </div>
          ) : isUpgrade ? (
            'Перейти к оплате'
          ) : (
            'Понизить тариф'
          )}
        </Button>
        {isUpgrade && (
          <div className="flex items-start gap-2">
            <Info className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Переходя к оплате, вы автоматически соглашаетесь с публичной офертой, размещенной на сайте <a className="underline" href="https://botly.by" target="_blank" rel="noopener noreferrer">botly.by</a>, а также даете свое согласи на периодический платеж</p>

          </div>
        )}
      </motion.div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] p-0 rounded-xl custom-card max-h-[90vh] overflow-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-center mb-4 sm:mb-6">
            Смена тарифа
          </DialogTitle>
        </DialogHeader>
        <div className="p-6">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
