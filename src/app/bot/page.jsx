import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';
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
import { getDashboard } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Package,
  CreditCard,
  TrendingUp,
  Bot,
  ExternalLink,
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
import { ORDER_STATUSES } from '@/lib/utils';
import { TARIFF_THEMES } from '@/lib/constants/tariffs';
import BotLayout from './layout';
import OnboardingCard from '@/components/ui/onboarding-card';
import { getGoals } from '@/lib/api';
import { Rocket, CheckCircle2, Gift, Calendar, UserCircle2 } from 'lucide-react';
import { useOrders } from '@/hooks/use-orders';
import InfiniteScroll from 'react-infinite-scroll-component';
import OrdersTable from '@/app/bot/components/OrdersTable';

// Константы для периодов фильтрации
const PERIOD_OPTIONS = [
  { value: 'today', label: 'Сегодня' },
  { value: 'current_week', label: 'Текущая неделя' },
  { value: 'current_month', label: 'Текущий месяц' },
  { value: 'three_months', label: '3 месяца' },
  { value: 'year', label: 'Год' },
  { value: 'all_time', label: 'За все время' },
];

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

// Функция для получения стилей статуса заказа
const getOrderStatusStyle = (status) => {
  const styles = {
    'w-ap': { // waiting approval
      backgroundColor: 'rgba(255, 193, 7, 0.2)',
      color: '#b97b00',
      border: '1px solid rgba(255, 193, 7, 0.6)',
    },
    'ap': {
      backgroundColor: 'rgba(40, 167, 69, 0.2)',
      color: '#25a244',
      border: '1px solid rgba(40, 167, 69, 0.6)',
    },
    'ip': {
      backgroundColor: 'rgba(23, 162, 184, 0.2)',
      color: '#1696b6',
      border: '1px solid rgba(23, 162, 184, 0.6)',
    },
    'w-p': {
      backgroundColor: 'rgba(255, 193, 7, 0.2)',
      color: '#b97b00',
      border: '1px solid rgba(255, 193, 7, 0.6)',
    },
    'rd': {
      backgroundColor: 'rgba(40, 167, 69, 0.2)',
      color: '#25a244',
      border: '1px solid rgba(40, 167, 69, 0.6)',
    },
    'dec': {
      backgroundColor: 'rgba(220, 53, 69, 0.2)',
      color: '#ea2424',
      border: '1px solid rgba(220, 53, 69, 0.6)',
    },
  };
  
  return styles[status] || {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    color: '#6b7280',
    border: '1px solid rgba(107, 114, 128, 0.6)',
  };
};

function BotPage() {
  const { bot, loading, setBot } = useBot();
  const params = useParams();
  const bot_id = params?.bot_id;
  
  const [goals, setGoals] = useState([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [completeGoals, setCompleteGoals] = useState(null);
  const [hasDiscount, setHasDiscount] = useState(false);
  
  // Состояние для аналитических данных
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true); // Начинаем с true
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');

  // Хук для управления заказами
  const {
    orders,
    loading: ordersLoading,
    loadingMore: ordersLoadingMore,
    error: ordersError,
    hasMore: ordersHasMore,
    total: ordersTotal,
    period: ordersPeriod,
    loadMore: loadMoreOrders,
    changePeriod: changeOrdersPeriod,
  } = useOrders(bot_id, selectedPeriod);


  useEffect(() => {
    let ignore = false;
    async function loadGoals() {
      if (!bot_id) return;
      try {
        const data = await getGoals(bot_id);
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
  }, [bot_id]);

  // Загрузка аналитических данных - запускается параллельно с загрузкой бота
  useEffect(() => {
    let ignore = false;
    async function loadDashboard() {
      if (!bot_id) return;
      setDashboardLoading(true);
      try {
        const data = await getDashboard(bot_id, selectedPeriod);
        if (!ignore) {
          setDashboardData(data);
        }
      } catch (e) {
        console.error('Ошибка загрузки аналитики:', e);
      } finally {
        if (!ignore) {
          setDashboardLoading(false);
        }
      }
    }
    loadDashboard();
    return () => {
      ignore = true;
    };
  }, [bot_id, selectedPeriod]);


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
    { 
      title: 'Заказы', 
      value: dashboardLoading ? null : dashboardData?.orders_count, 
      icon: Package 
    },
    { 
      title: 'Клиенты', 
      value: dashboardLoading ? null : dashboardData?.users_count, 
      icon: Users 
    },
    { 
      title: 'Средний чек', 
      value: dashboardLoading || !bot ? null : `${dashboardData?.average_bill || 0} ${bot?.currency}`, 
      icon: CreditCard 
    },
    { 
      title: 'Общий доход', 
      value: dashboardLoading || !bot ? null : `${dashboardData?.total_revenue || 0} ${bot?.currency}`, 
      icon: TrendingUp 
    },
  ];

  const statusInfo = bot ? getStatusInfo(bot.status, bot_id) : null;
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
                window.location.href = `/${bot_id}/subscription?open=tariff&select=standard&trial=14`;
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
                    ? `/${bot_id}/products`
                    : first.id === 'add_categories'
                    ? `/${bot_id}/categories`
                    : first.id === 'setup_delivery'
                    ? `/${bot_id}/settings`
                    : `/${bot_id}`;
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
                    <a
                      href={`https://t.me/${bot?.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      @{bot?.username}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </CardHeader>
          <CardContent className="px-2">

            {/* Фильтр периода */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex items-center justify-end mb-6"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Select 
                  value={selectedPeriod} 
                  onValueChange={(value) => {
                    setSelectedPeriod(value);
                    changeOrdersPeriod(value);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {PERIOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>

            {/* Статистика */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                          {dashboardLoading ? <Skeleton className="h-8 w-16" /> : card.value}
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
                {dashboardLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {dashboardData?.revenue?.length ? (
                      <LineChart data={dashboardData.revenue}>
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => formatChartDate(value)}
                        />
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
                          labelFormatter={(value) => formatDate(value)}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--primary))"
                          name="Выручка"
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                          activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    ) : (
                      <p className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Нет данных за выбранный период
                      </p>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Заказы с бесконечным скроллом */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8"
            >
              <OrdersTable
                botId={bot_id}
                showPeriodFilter={true}
                showClientColumn={true}
                showManagerColumn={true}
                initialPeriod={selectedPeriod}
                title="Заказы"
                currency={bot?.currency || 'руб'}
              />
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </BotLayout>
  );
}

export default BotPage;
