import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Package, ArrowLeft } from 'lucide-react';
import { TARIFF_THEMES, LIMIT_ICONS } from '@/lib/constants/tariffs';
import { motion } from 'framer-motion';
import ConfirmTariffDialog from './ConfirmTariffDialog';

export default function TariffDialog({
  isOpen,
  onClose,
  tariffs,
  currentTariffId,
  onSelect,
  nextPaymentAt,
  preselectTariffId,
  trialDays,
}) {
  const [selectedTariffId, setSelectedTariffId] = useState(null);
  const [step, setStep] = useState('select'); // 'select' or 'confirm'

  const currentTariff = tariffs.find((t) => t.id === currentTariffId);
  const selectedTariff = tariffs.find((t) => t.id === selectedTariffId);

  const handleClose = () => {
    setSelectedTariffId(null);
    setStep('select');
    onClose();
  };

  const handleTariffSelect = (tariffId) => {
    setSelectedTariffId(tariffId);
    setStep('confirm');
  };

  const handleConfirm = () => {
    return onSelect(selectedTariffId);
  };

  const handleBack = () => {
    setStep('select');
    setSelectedTariffId(null);
  };

  const formatLimit = (limit) => (limit === 0 ? '∞' : limit);

  const getBorderClasses = (theme, isCurrentTariff) => {
    if (theme.sort === 0)
      return isCurrentTariff ? 'border-zinc-200' : 'border-border hover:border-zinc-300';
    if (theme.sort === 1)
      return isCurrentTariff ? 'border-blue-100' : 'border-border hover:border-blue-200';
    if (theme.sort === 2)
      return isCurrentTariff ? 'border-purple-100' : 'border-border hover:border-purple-200';
    if (theme.sort === 3)
      return isCurrentTariff ? 'border-amber-100' : 'border-border hover:border-amber-200';
    return 'border-border';
  };

  const getShadowClasses = (theme, isCurrentTariff) => {
    if (!isCurrentTariff) return '';
    if (theme.sort === 0) return 'shadow-lg shadow-zinc-200/50';
    if (theme.sort === 1) return 'shadow-lg shadow-blue-200/50';
    if (theme.sort === 2) return 'shadow-lg shadow-purple-200/50';
    if (theme.sort === 3) return 'shadow-lg shadow-amber-200/50';
    return '';
  };

  const getBadgeClasses = (theme) => {
    if (theme.sort === 0) return 'bg-zinc-600 text-white';
    if (theme.sort === 1) return 'bg-blue-500 text-white';
    if (theme.sort === 2) return 'bg-purple-500 text-white';
    if (theme.sort === 3) return 'bg-amber-500 text-white';
    return 'bg-zinc-600 text-white';
  };

  const getIconBgClasses = (theme) => {
    if (theme.sort === 0) return 'bg-zinc-100';
    if (theme.sort === 1) return 'bg-blue-100';
    if (theme.sort === 2) return 'bg-purple-100';
    if (theme.sort === 3) return 'bg-amber-100';
    return 'bg-zinc-100';
  };

  const getIconColorClasses = (theme) => {
    if (theme.sort === 0) return 'text-zinc-600';
    if (theme.sort === 1) return 'text-blue-600';
    if (theme.sort === 2) return 'text-purple-600';
    if (theme.sort === 3) return 'text-amber-600';
    return 'text-zinc-600';
  };

  const getButtonClasses = (theme, isCurrentTariff) => {
    if (isCurrentTariff) return 'bg-muted hover:bg-muted/90';
    if (theme.sort === 0) return 'bg-zinc-600 hover:bg-zinc-700 text-white';
    if (theme.sort === 1) return 'bg-blue-500 hover:bg-blue-600 text-white';
    if (theme.sort === 2) return 'bg-purple-500 hover:bg-purple-600 text-white';
    if (theme.sort === 3)
      return 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white';
    return 'bg-zinc-600 hover:bg-zinc-700 text-white';
  };

  const getThemeIcon = (theme) => {
    const Icon = theme?.icon || Package;
    return <Icon />;
  };

  // Preselect tariff and open confirm when requested
  React.useEffect(() => {
    if (isOpen && preselectTariffId && step === 'select' && !selectedTariffId) {
      setSelectedTariffId(preselectTariffId);
      setStep('confirm');
    }
  }, [isOpen, preselectTariffId, step, selectedTariffId]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[1200px] p-0 max-h-[calc(100vh-64px)] flex flex-col">
        <DialogHeader className="p-6 pb-0 flex-shrink-0 flex flex-row items-center">
          {step === 'confirm' && (
            <Button variant="ghost" size="icon" className="mr-4" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <DialogTitle className="text-2xl font-semibold">
            {step === 'select' ? 'Выберите тариф' : 'Смена тарифа'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' ? (
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 min-h-min">
              {tariffs.map((tariff, index) => {
                const theme = TARIFF_THEMES[tariff.sort] || TARIFF_THEMES.default;
                const isCurrentTariff = tariff.id === currentTariffId;
                const borderClasses = getBorderClasses(theme, isCurrentTariff);
                const shadowClasses = getShadowClasses(theme, isCurrentTariff);
                const badgeClasses = getBadgeClasses(theme);
                const iconBgClasses = getIconBgClasses(theme);
                const iconColorClasses = getIconColorClasses(theme);
                const buttonClasses = getButtonClasses(theme, isCurrentTariff);

                return (
                  <motion.div
                    key={tariff.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: 'easeOut',
                    }}
                    className={`relative flex flex-col rounded-xl border transition-all duration-200 h-full ${borderClasses} ${shadowClasses}`}
                  >
                    {isCurrentTariff && (
                      <div
                        className={`absolute -top-3 left-1/2 -translate-x-1/2 ${badgeClasses} text-xs font-medium px-3 py-1 rounded-full shadow-sm`}
                      >
                        Текущий тариф
                      </div>
                    )}

                    <div className="p-6 flex-1">
                      <div className="space-y-4">
                        <div className={`p-2.5 w-fit rounded-lg ${iconBgClasses}`}>
                          <div className={`w-6 h-6 ${iconColorClasses}`}>{getThemeIcon(theme)}</div>
                        </div>

                        <div>
                          <h3 className="font-semibold text-xl">{tariff.name}</h3>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-3xl font-bold">{tariff.price}</span>
                            <span className="text-muted-foreground">BYN/мес</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <LIMIT_ICONS.Positions className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span>
                              Товаров:{' '}
                              <span className="font-medium">
                                {formatLimit(tariff.positions_limit)}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <LIMIT_ICONS.Categories className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span>
                              Категорий:{' '}
                              <span className="font-medium">
                                {formatLimit(tariff.categories_limit)}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <LIMIT_ICONS.Managers className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span>
                              Менеджеров:{' '}
                              <span className="font-medium">
                                {formatLimit(tariff.managers_limit)}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <LIMIT_ICONS.News className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span>
                              Рассылок:{' '}
                              <span className="font-medium">{formatLimit(tariff.news_limit)}</span>
                            </span>
                          </div>
                        </div>

                        {tariff.features.length > 0 && (
                          <div className="space-y-2.5 pt-4 border-t">
                            {tariff.features.map((feature) => (
                              <div
                                key={`${tariff.id}-${feature}`}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className={`h-5 w-5 rounded-full ${iconBgClasses} flex items-center justify-center shrink-0`}
                                >
                                  <Check className={`w-3 h-3 ${iconColorClasses}`} />
                                </div>
                                <span className="text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      <Button
                        className={`w-full ${buttonClasses}`}
                        disabled={isCurrentTariff}
                        onClick={() => handleTariffSelect(tariff.id)}
                      >
                        {isCurrentTariff ? 'Текущий тариф' : 'Выбрать'}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="min-h-[calc(100vh-200px)] w-full flex items-center justify-center"
            >
              <div className="w-full max-w-[800px] py-8">
                <ConfirmTariffDialog
                  isOpen
                  onClose={handleBack}
                  selectedTariff={selectedTariff}
                  currentTariff={currentTariff}
                  nextPaymentAt={nextPaymentAt}
                  onConfirm={handleConfirm}
                  embedded
                  trialDays={trialDays}
                />
              </div>
            </motion.div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
