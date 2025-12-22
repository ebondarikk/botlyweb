import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  getSubscription,
  getTariffs,
  updateSubscriptionEmail,
  updateSubscription,
  cancelSubscription,
} from '@/lib/api';
import { TARIFF_THEMES } from '@/lib/constants/tariffs';
import { useBot } from '@/context/BotContext';
import {
  ArrowLeft,
  Receipt,
  Package,
  Users,
  Newspaper,
  Check,
  HelpCircle,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import BotLayout from '@/app/bot/layout';
import { toast } from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import TariffDialog from './TariffDialog';

function SubscriptionStatusAlert({ status }) {
  if (status === 'active') return null;

  const getAlertContent = () => {
    switch (status) {
      case 'failed_attempt':
        return {
          title: 'Неудачная попытка списания',
          description:
            'Попытка списания средств не удалась. Система повторит попытку завтра. После 3 неудачных попыток списания подписка будет приостановлена, а магазин заблокирован. Пожалуйста, обновите данные карты или свяжитесь с поддержкой.',
          className: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
        };
      case 'blocked':
        return {
          title: 'Подписка приостановлена',
          description:
            'После 3 неудачных попыток списания подписка была приостановлена, а магазин заблокирован. Пожалуйста, обновите данные карты или свяжитесь с поддержкой.',
          className: 'bg-red-500/10 border-red-500/20 text-red-500',
        };
      default:
        return null;
    }
  };

  const content = getAlertContent();
  if (!content) return null;

  return (
    <div className={`mb-6 p-4 rounded-lg border ${content.className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium">{content.title}</h3>
          <p className="text-sm mt-1">{content.description}</p>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionPage() {
  const { bot } = useBot();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [tariffs, setTariffs] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [preselectStandard, setPreselectStandard] = useState(false);
  const [trialDays, setTrialDays] = useState(null);
  const [standardTariffId, setStandardTariffId] = useState(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [billingEmail, setBillingEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  const getPaymentStatusStyle = (status) => {
    switch (status) {
      case 'successful':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'successful':
        return 'Оплачен';
      case 'pending':
        return 'В обработке';
      default:
        return 'Ошибка';
    }
  };

  const formatLimit = (limit) => (limit === 0 ? '∞' : limit);

  const handlePaymentStatus = () => {
    const status = searchParams.get('status');
    const transactionId = searchParams.get('transaction_id');

    if (!(status && transactionId && subscription?.payments)) return;

    const payment = subscription.payments.find((p) => p.id === transactionId);
    if (!payment) return;

    const tariffName = payment.pay_for;

    if (status === 'failed') {
      const reason = payment.reason ? `: ${payment.reason}` : '';
      toast.error(`Не удалось оплатить тариф ${tariffName}\n${reason}`);
    } else if (status === 'successful') {
      toast.success(`Тариф ${tariffName} успешно оплачен`);
    }

    // Очищаем параметры из URL
    navigate('.', { replace: true });
  };

  const fetchSubscription = async () => {
    try {
      setIsLoading(true);
      const response = await getSubscription(bot.id);
      setSubscription(response);
      setBillingEmail(response.email || '');
    } catch (error) {
      console.error(error);
      toast.error('Не удалось загрузить информацию о подписке');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTariffs = async () => {
    try {
      const response = await getTariffs();
      setTariffs(response.tariffs);
      const standard = (response.tariffs || []).find((t) => t.name?.toLowerCase?.() === 'стандарт' || t.sort === 2);
      if (standard) setStandardTariffId(standard.id);
    } catch (error) {
      console.error(error);
      toast.error('Не удалось загрузить список тарифов');
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setBillingEmail(email);
    if (emailError) setEmailError('');
  };

  const handleSaveEmail = async () => {
    if (!billingEmail) {
      setEmailError('Введите email');
      return;
    }

    if (!validateEmail(billingEmail)) {
      setEmailError('Неверный формат email');
      return;
    }

    try {
      setIsSavingEmail(true);
      await updateSubscriptionEmail(bot.id, billingEmail);
      setSubscription((prev) => ({ ...prev, billing_email: billingEmail }));
      toast.success('Email успешно сохранен');
    } catch (error) {
      console.log(error);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      await cancelSubscription(bot.id);
      await fetchSubscription();
      toast.success('Подписка успешно отменена');
    } catch (error) {
      toast.error(error?.details?.errorMessage);
    } finally {
      setIsCancelling(false);
    }
    setIsCancelDialogOpen(false);
  };

  const showCancelButton = () => {
    return !subscription?.tariff?.is_default && !subscription?.next_tariff?.is_default;
  };

  useEffect(() => {
    if (bot) {
      if (!subscription) {
        fetchSubscription();
      }
      if (!tariffs.length) {
        fetchTariffs();
      }
    }
  }, [bot]);

  useEffect(() => {
    if (subscription && tariffs.length > 0) {
      console.log('handlePaymentStatus');
      handlePaymentStatus();
    }
  }, [subscription, tariffs]);

  useEffect(() => {
    // Открытие модалки и предвыбор тарифа через query (?open=tariff&select=standard&trial=14)
    const open = searchParams.get('open');
    const select = searchParams.get('select');
    const trial = parseInt(searchParams.get('trial') || '', 10);
    if (open === 'tariff') {
      setIsDialogOpen(true);
      if (select === 'standard') setPreselectStandard(true);
      if (!Number.isNaN(trial)) setTrialDays(trial);
      // очищать URL не будем, чтобы вернувшись пользователь мог повторно открыть
    }
  }, [searchParams]);

  const handleTariffSelect = async (tariffId) => {
    try {
      const response = await updateSubscription(bot.id, tariffId, trialDays ? { trial: trialDays } : undefined);

      if (response.payment_url) {
        window.location.href = response.payment_url;
      } else {
        await fetchSubscription();
        setIsDialogOpen(false);
        toast.success('Тариф успешно изменен');
      }
    } catch (error) {
      toast.error(error?.details?.errorMessage);
    }
  };

  const theme = TARIFF_THEMES[subscription?.tariff?.sort] || TARIFF_THEMES.default;
  const activeTo = subscription?.active_to ? new Date(subscription.active_to) : null;

  const getSubscriptionStatusText = () => {
    if (!activeTo) return null;
    if (subscription?.tariff?.is_default) return null;

    const dateText = activeTo.toLocaleDateString('ru-RU');
    const nextTariff = subscription?.next_tariff;

    if (nextTariff?.id === subscription?.tariff?.id) {
      return `Автопродление ${dateText}`;
    }

    if (nextTariff?.is_default) {
      return `Активен до ${dateText}`;
    }

    if (nextTariff) {
      return `Активен до ${dateText}, затем применяется ${nextTariff.name}`;
    }

    return `Активен до ${dateText}`;
  };

  const getIconBgClasses = (themeObj) => {
    if (themeObj.sort === 0) return 'bg-zinc-100';
    if (themeObj.sort === 1) return 'bg-blue-100';
    if (themeObj.sort === 2) return 'bg-purple-100';
    if (themeObj.sort === 3) return 'bg-amber-100';
    return 'bg-zinc-100';
  };

  const getIconColorClasses = (themeObj) => {
    if (themeObj.sort === 0) return 'text-zinc-600';
    if (themeObj.sort === 1) return 'text-blue-600';
    if (themeObj.sort === 2) return 'text-purple-600';
    if (themeObj.sort === 3) return 'text-amber-600';
    return 'text-zinc-600';
  };

  const getButtonClasses = (themeObj) => {
    if (themeObj.sort === 0) return 'bg-zinc-600 hover:bg-zinc-700 text-white';
    if (themeObj.sort === 1) return 'bg-blue-500 hover:bg-blue-600 text-white';
    if (themeObj.sort === 2) return 'bg-purple-500 hover:bg-purple-600 text-white';
    if (themeObj.sort === 3)
      return 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white';
    return 'bg-zinc-600 hover:bg-zinc-700 text-white';
  };

  const getThemeIcon = (themeObj) => {
    const Icon = themeObj?.icon || Package;
    return <Icon />;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  if (isLoading) {
    return (
      <BotLayout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full px-4 md:px-8"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 py-6"
          >
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted/80"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-semibold">Управление подпиской</h1>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto pb-8"
          >
            {/* Email для счетов - Скелетон */}
            <motion.div variants={itemVariants}>
              <Card className="rounded-xl border bg-card text-card-foreground shadow-sm custom-card mb-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6 px-6 py-6">
                  <div className="flex items-start sm:items-center gap-4 w-full">
                    <div className="p-2 rounded-md">
                      <Skeleton className="w-6 h-6 bg-gray-200" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-6 w-32 bg-gray-200" />
                      <Skeleton className="h-4 w-48 bg-gray-200" />
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch w-full sm:min-w-[400px]">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <Skeleton className="flex-1 h-10 bg-gray-200" />
                      <Skeleton className="w-24 h-10 bg-gray-200" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Текущий тариф - Скелетон */}
            <motion.div variants={itemVariants}>
              <Card className="rounded-xl border bg-card text-card-foreground shadow-sm custom-card mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-6">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="p-2 rounded-md">
                      <Skeleton className="w-6 h-6 bg-gray-200" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-32 bg-gray-200" />
                      <Skeleton className="h-8 w-24 bg-gray-200" />
                    </div>
                  </div>
                  <Skeleton className="w-full sm:w-32 h-10 bg-gray-200" />
                </div>

                <div className="px-6 pb-6 border-t space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {['positions', 'categories', 'managers', 'news'].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <Skeleton className="w-4 h-4 bg-gray-200" />
                        <div className="flex-1 flex justify-between items-center">
                          <Skeleton className="h-4 w-20 bg-gray-200" />
                          <Skeleton className="h-4 w-8 bg-gray-200" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* История платежей - Скелетон */}
            <motion.div variants={itemVariants}>
              <Card className="rounded-xl border bg-card text-card-foreground shadow-sm custom-card">
                <div className="flex items-center gap-4 px-6 py-6">
                  <div className="p-2 rounded-md">
                    <Skeleton className="w-5 h-5 bg-gray-200" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-32 bg-gray-200" />
                    <Skeleton className="h-4 w-48 bg-gray-200" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </BotLayout>
    );
  }

  return (
    <BotLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 py-6"
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-muted/80"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Управление подпиской</h1>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto pb-8"
        >
          {subscription && <SubscriptionStatusAlert status={subscription.status} />}

          <Accordion type="single" collapsible defaultValue="tariff" className="space-y-6">
            {/* Email для счетов */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="rounded-xl border bg-card text-card-foreground shadow-sm custom-card mb-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6 px-6 py-6">
                  <div className="flex items-start sm:items-center gap-4 w-full">
                    <div className="p-2 rounded-md bg-primary/10 shrink-0">
                      <Receipt className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-medium">Email для счетов</h2>
                      <p className="text-sm text-muted-foreground">
                        На этот адрес будут отправляться счета и уведомления
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch w-full sm:min-w-[400px]">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        value={billingEmail}
                        onChange={handleEmailChange}
                        className={`flex-1 ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      />
                      <Button
                        className="shrink-0"
                        size="default"
                        disabled={isSavingEmail || billingEmail === subscription?.billing_email}
                        onClick={handleSaveEmail}
                      >
                        {isSavingEmail ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          'Сохранить'
                        )}
                      </Button>
                    </div>
                    {emailError && <p className="text-sm text-red-500 mt-2">{emailError}</p>}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Текущий тариф */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="rounded-xl border bg-card text-card-foreground shadow-sm custom-card mb-6 overflow-hidden group">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-6">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`p-2.5 rounded-xl ${getIconBgClasses(theme)}`}
                    >
                      <div className={`w-6 h-6 ${getIconColorClasses(theme)}`}>
                        {getThemeIcon(theme)}
                      </div>
                    </motion.div>
                    <div className="flex-1">
                      <h2 className="text-lg font-medium group-hover:text-primary transition-colors">
                        {subscription?.tariff?.name || 'Текущий тариф'}
                      </h2>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-baseline gap-1"
                      >
                        <span className="text-2xl font-bold">{subscription?.tariff?.price}</span>
                        <span className="text-muted-foreground">BYN/мес</span>
                      </motion.div>
                      {getSubscriptionStatusText() && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {getSubscriptionStatusText()}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    className={`w-full sm:w-auto ${getButtonClasses(theme)}`}
                    onClick={() => setIsDialogOpen(true)}
                  >
                    Сменить тариф
                  </Button>
                </div>

                <div className="px-6 pb-6 border-t space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 flex justify-between md:justify-start items-baseline">
                          <span>Товаров:</span>
                          <span className="font-medium ml-8 md:ml-4">
                            {formatLimit(subscription?.tariff?.positions_limit)}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 flex justify-between md:justify-start items-baseline">
                          <span>Категорий:</span>
                          <span className="font-medium ml-8 md:ml-4">
                            {formatLimit(subscription?.tariff?.categories_limit)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 flex justify-between md:justify-start items-baseline">
                          <span>Менеджеров:</span>
                          <span className="font-medium ml-8 md:ml-4">
                            {formatLimit(subscription?.tariff?.managers_limit)}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 flex justify-between md:justify-start items-baseline">
                          <span>Рассылок:</span>
                          <span className="font-medium ml-8 md:ml-4">
                            {formatLimit(subscription?.tariff?.news_limit)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {subscription?.tariff?.features?.length > 0 && (
                    <div className="space-y-2.5 pt-4 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                        {subscription.tariff.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2">
                            <div
                              className={`h-5 w-5 rounded-full ${getIconBgClasses(theme)} flex items-center justify-center shrink-0`}
                            >
                              <Check className={`w-3 h-3 ${getIconColorClasses(theme)}`} />
                            </div>
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showCancelButton() && (
                    <div className="flex items-center justify-end pt-4 border-t">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive h-11 flex items-center gap-2"
                          >
                            <Ban className="w-4 h-4" />
                            Отменить подписку
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Отмена подписки</DialogTitle>
                            <DialogDescription className="pt-2">
                              Вы действительно хотите отменить подписку? Текущий тариф будет активен
                              до{' '}
                              {activeTo.toLocaleDateString('ru-RU', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                              , после чего будет применен Бесплатный тариф.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={(e) => e.target.closest('dialog').close()}
                            >
                              Отмена
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={handleCancelSubscription}
                              disabled={isCancelling}
                            >
                              {isCancelling ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                  Отмена подписки...
                                </div>
                              ) : (
                                'Отменить подписку'
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* История платежей */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <AccordionItem value="payments" className="border-none">
                <Card className="rounded-xl border bg-card text-card-foreground shadow-sm custom-card overflow-hidden">
                  <AccordionTrigger className="flex justify-between w-full px-6 py-0 [&[data-state=open]>div]:pb-4">
                    <div className="flex items-center gap-4 py-6">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Receipt className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <h2 className="text-lg font-medium">История платежей</h2>
                        <p className="text-sm text-muted-foreground">
                          История ваших платежей и счетов
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-6">
                      <div className="divide-y">
                        {subscription?.payments.length === 0 ? (
                          <div className="py-8 w-full text-center text-muted-foreground text-sm">
                            Нет истории платежей
                          </div>
                        ) : (
                          subscription.payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                            >
                              <div>
                                <div className="font-medium">{payment.pay_for}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(payment.created_at).toLocaleDateString('ru-RU', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="font-medium">{payment.amount} BYN</div>
                                <div className="flex items-center gap-2 min-w-[90px]">
                                  <div
                                    className={`px-2 py-1 text-xs rounded-full flex-grow text-center ${getPaymentStatusStyle(
                                      payment.status,
                                    )}`}
                                  >
                                    {getPaymentStatusText(payment.status)}
                                  </div>
                                  {payment.status === 'failed' && payment.reason && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex-shrink-0">
                                            <HelpCircle className="w-4 h-4 text-red-500 cursor-help" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">{payment.reason}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </motion.div>
          </Accordion>
        </motion.div>

        <TariffDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          tariffs={tariffs}
          currentTariffId={subscription?.tariff?.id}
          onSelect={handleTariffSelect}
          nextPaymentAt={activeTo}
          preselectTariffId={preselectStandard ? standardTariffId : null}
          trialDays={trialDays}
        />
      </motion.div>
    </BotLayout>
  );
}

export default SubscriptionPage;
