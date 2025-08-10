import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useBot } from '@/context/BotContext';
import { Skeleton } from '@/components/ui/skeleton';
import { updateBot } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Package,
  CreditCard,
  TrendingUp,
  Bot,
  ExternalLink,
  Save,
  AlertTriangle,
  Ban,
  Crown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ORDER_STATUSES } from '@/lib/utils';
import { TARIFF_THEMES } from '@/lib/constants/tariffs';
import BotLayout from './layout';
import OnboardingCard from '@/components/ui/onboarding-card';
import { getGoals } from '@/lib/api';
import { Rocket, CheckCircle2, Gift } from 'lucide-react';

// Функция для форматирования даты
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// ,,ункция для форматирования даты в графике
const formatChartDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

const getStatusInfo = (status, botId) => {
  switch (status) {
    case 'active':
      return { color: 'bg-green-500/10 text-green-500', text: 'Активен' };
    case 'failed_attempt':
      return {
        color: 'bg-yellow-500/10 text-yellow-500',
        text: 'Проблема с оплатой',
        icon: AlertTriangle,
        link: `/${botId}/subscription`,
      };
    case 'blocked':
      return {
        color: 'bg-red-500/10 text-red-500',
        text: 'Заблокирован',
        icon: Ban,
        link: `/${botId}/subscription`,
      };
    default:
      return { color: 'bg-gray-500/10 text-gray-500', text: 'Неизвестно' };
  }
};

const getBadgeClasses = (theme) => {
  if (theme.sort === 0) return 'bg-zinc-100 text-zinc-600';
  if (theme.sort === 1) return 'bg-blue-100 text-blue-600';
  if (theme.sort === 2) return 'bg-purple-100 text-purple-600';
  if (theme.sort === 3) return 'bg-amber-100 text-amber-600';
  return 'bg-zinc-100 text-zinc-600';
};

const getThemeIcon = (theme) => {
  const Icon = theme?.icon || Package;
  return <Icon className="w-3 h-3" />;
};

function BotPage() {
  const { bot, loading, setBot } = useBot();
  const [currency, setCurrency] = useState('');
  const [welcomeText, setWelcomeText] = useState('');
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [completeGoals, setCompleteGoals] = useState(null);
  const [hasDiscount, setHasDiscount] = useState(false);

  useEffect(() => {
    if (!loading && bot) {
      setCurrency(bot?.currency);
      setWelcomeText(bot?.welcome_text);
    }
  }, [bot, loading]);

  useEffect(() => {
    let ignore = false;
    async function loadGoals() {
      if (!bot?.id) return;
      try {
        const data = await getGoals(bot.id);
        if (!ignore) {
          const filtered = data?.goals || [];
          setGoals(filtered);
          setCompleteGoals(data?.complete_goals ?? null);
          setHasDiscount(Boolean(data?.has_discount));
          const done = filtered.filter((g) => g.completed).length;
          setShowWelcome(!data?.has_discount && filtered.length > 0 && done < filtered.length);
        }
      } catch (e) {
        // no-op
      }
    }
    loadGoals();
    return () => {
      ignore = true;
    };
  }, [bot?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedBot = await updateBot(bot.id, {
        currency,
        welcome_text: welcomeText,
      });
      setBot(updatedBot);
      toast.success('Данные обновлены');
    } catch (error) {
      toast.error('Ошибка обновления');
    } finally {
      setSaving(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    }),
  };

  const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    }),
  };

  const statsCards = [
    { title: 'Заказы', value: bot?.orders_count, icon: Package },
    { title: 'Клиенты', value: bot?.users_count, icon: Users },
    { title: 'Средний чек', value: `${bot?.average_bill} ${bot?.currency}`, icon: CreditCard },
  ];

  const statusInfo = bot ? getStatusInfo(bot.status, bot.id) : null;
  const theme = bot ? TARIFF_THEMES[bot.tariff?.sort] || TARIFF_THEMES.default : null;
  const badgeClasses = theme ? getBadgeClasses(theme) : '';

  return (
    <BotLayout>
      <div className="w-full">
        {/* Секция поздравления и предложения (если доступен бонус) */}
        {!loading && hasDiscount && (
          <div className="mb-4">
            <OnboardingCard
              variant="success"
              icon={<Gift className="w-5 h-5" />}
              title="Поздравляем! Онбординг пройден"
              description={
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Доступно специальное предложение: 14 дней тарифа «Стандарт» без оплаты.
                  </p>
                </div>
              }
              actionText="Активировать"
              onAction={() => {
                // Открываем модалку смены тарифа и заранее выберем Стандарт
                window.location.href = `/${bot?.id}/subscription?open=tariff&select=standard&trial=14`;
              }}
            />
          </div>
        )}

        {/* Экран приветствия/онбординг */}
        {!loading && showWelcome && (
          <div className="mb-4">
            <OnboardingCard
              icon={<Rocket className="w-5 h-5" />}
              title="Давайте запустим ваш магазин!"
              description={
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary text-sm font-medium">
                    <Gift className="w-4 h-4" />
                    Подарок: 14 дней тарифа «Стандарт» без оплаты
                  </div>
                  <p className="text-xs text-muted-foreground">Выполните эти шаги в течение 3 дней</p>
                  {(goals || []).map((g) => (
                    <div key={g.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full border ${
                          g.completed
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {g.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </span>
                      <span>
                        {g.id === 'add_products' && `Добавьте товары (${Math.min(g.current || 0, g.target || 3)}/${g.target || 3})`}
                        {g.id === 'add_categories' && `Добавьте категории (${Math.min(g.current || 0, g.target || 2)}/${g.target || 2})`}
                        {g.id === 'setup_delivery' && 'Настройте доставку'}
                        {g.id === 'share_link' && 'Опубликуйте ссылку'}
                      </span>
                    </div>
                  ))}
                </div>
              }
              actionText="Начать"
              onAction={() => {
                // ведем на первый невыполненный шаг
                const first = (goals || []).find((g) => !g.completed);
                if (!first) return;
                const url =
                  first.id === 'add_products'
                    ? `/${bot?.id}/products`
                    : first.id === 'add_categories'
                    ? `/${bot?.id}/categories`
                    : first.id === 'setup_delivery'
                    ? `/${bot?.id}/settings`
                    : `/${bot?.id}`;
                window.location.href = url;
              }}
              onDismiss={() => setShowWelcome(false)}
            />
          </div>
        )}
        {/* Информация о боте */}
        <Card className="border-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-4 px-2 pt-6 pb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4"
            >
              <div className="p-3 rounded-xl bg-primary/10">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl font-semibold">
                    {loading ? <Skeleton className="h-8 w-40" /> : bot?.fullname}
                  </CardTitle>
                  {!loading && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`${badgeClasses} flex items-center gap-1`}
                      >
                        {theme && getThemeIcon(theme)}
                        {bot?.tariff?.name}
                      </Badge>
                      {statusInfo && bot?.status !== 'active' && (
                        <Link to={statusInfo.link}>
                          <Badge
                            variant="secondary"
                            className={`${statusInfo.color} flex items-center gap-1`}
                          >
                            {statusInfo.icon && <statusInfo.icon className="w-3 h-3" />}
                            {statusInfo.text}
                          </Badge>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                {!loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 mt-1"
                  >
                    <p className="text-sm text-muted-foreground">Telegram Bot</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </CardHeader>
          <CardContent className="px-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="custom-card rounded-xl border p-6 bg-card/50 hover:bg-card/70 transition-all"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                {/* Левая часть: ID и Пользователь */}
                <div className="flex flex-col gap-6">
                  {loading ? (
                    <>
                      <Skeleton className="h-7 w-32" />
                      <Skeleton className="h-7 w-40" />
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm text-muted-foreground">ID:</span>
                        <span className="text-sm font-medium">{bot?.id}</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm text-muted-foreground">Username:</span>
                        <a
                          href={`https://t.me/${bot?.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          @{bot?.username}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </motion.div>
                    </>
                  )}
                </div>

                {/* Правая часть: Редактируемые поля */}
                <div className="flex-1 max-w-xl space-y-8">
                  {loading ? (
                    <>
                      <Skeleton className="h-[72px] w-full" />
                      <Skeleton className="h-[132px] w-full" />
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-3"
                      >
                        <p className="text-sm font-medium text-muted-foreground">Валюта</p>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Выберите валюту" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="BYN">BYN</SelectItem>
                              <SelectItem value="RUB">RUB</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3"
                      >
                        <p className="text-sm font-medium text-muted-foreground">
                          Приветственное сообщение
                        </p>
                        <Textarea
                          className="min-h-[100px] resize-y"
                          value={welcomeText}
                          onChange={(e) => setWelcomeText(e.target.value)}
                          placeholder="Введите приветственное сообщение..."
                        />
                      </motion.div>
                    </>
                  )}
                </div>
              </div>

              {!loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-end mt-8"
                >
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="sm:px-12 h-11 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Статистика */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-8">
              <AnimatePresence>
                {statsCards.map((card, i) => (
                  <motion.div
                    key={card.title}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    className="custom-card rounded-xl border p-6 bg-card/50 hover:bg-card/70 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <card.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                        <div className="text-2xl font-semibold mt-1">
                          {loading ? <Skeleton className="h-8 w-16" /> : card.value}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* График продаж */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              className="custom-card rounded-xl border p-6 mt-8 bg-card/50 hover:bg-card/70 transition-all"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold">Доход</h3>
              </div>
              <div className="h-64">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {bot?.revenue?.length ? (
                      <LineChart data={bot?.revenue}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            color: 'hsl(var(--foreground))',
                            fontSize: '14px',
                            padding: '8px 12px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#4F46E5"
                          name="Выручка"
                          strokeWidth={2}
                          dot={{ fill: '#4F46E5', r: 4 }}
                          activeDot={{ r: 6, fill: '#4F46E5' }}
                        />
                      </LineChart>
                    ) : (
                      <p className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Нет данных
                      </p>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Последние заказы */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="custom-card rounded-xl border p-6 mt-8 bg-card/50 hover:bg-card/70 transition-all"
            >
              <h3 className="text-base font-semibold mb-6">Последние заказы</h3>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="overflow-hidden rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Создан</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {bot?.last_orders?.map((order, index) => (
                          <motion.tr
                            key={order.id}
                            custom={index}
                            variants={tableRowVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                          >
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{order.fullname}</TableCell>
                            <TableCell className="font-medium text-primary">
                              {order.total} {bot?.currency}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                {ORDER_STATUSES[order.status]}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(order.created_at)}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </BotLayout>
  );
}

export default BotPage;
