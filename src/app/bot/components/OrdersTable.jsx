import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Calendar,
  UserCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getOrders } from '@/lib/api';
import { ORDER_STATUSES } from '@/lib/utils';
import InfiniteScroll from 'react-infinite-scroll-component';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Сегодня' },
  { value: 'current_week', label: 'Текущая неделя' },
  { value: 'current_month', label: 'Текущий месяц' },
  { value: 'three_months', label: '3 месяца' },
  { value: 'year', label: 'Год' },
  { value: 'all_time', label: 'За все время' },
];

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

const getOrderStatusStyle = (status) => {
  const styles = {
    'w-ap': {
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

export default function OrdersTable({
  botId,
  clientId = null,
  showPeriodFilter = true,
  showClientColumn = true,
  showManagerColumn = true,
  initialPeriod = 'current_month',
  title = 'Заказы',
  currency = 'руб',
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  
  const limit = 20;

  // Загрузка заказов
  const loadOrders = async (pageNum = 1, periodFilter = selectedPeriod, append = false) => {
    if (!botId) return;
    
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setOrders([]);
    }
    setError(null);
    
    try {
      const response = await getOrders(botId, pageNum, limit, periodFilter, clientId);
      const newOrders = response.orders || [];
      
      if (append) {
        setOrders(prev => [...prev, ...newOrders]);
      } else {
        setOrders(newOrders);
      }
      
      setTotal(response.count || 0);
      setCurrentPage(pageNum);
      setHasMore(newOrders.length === limit && (response.count || 0) > pageNum * limit);
    } catch (err) {
      console.error('Ошибка загрузки заказов:', err);
      setError(true);
      if (!append) {
        setOrders([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Загружаем заказы при изменении параметров
  useEffect(() => {
    if (botId) {
      setCurrentPage(1);
      setHasMore(true);
      loadOrders(1, selectedPeriod, false);
    }
  }, [botId, selectedPeriod, clientId]);

  const loadMoreOrders = () => {
    if (!loadingMore && hasMore && !error) {
      loadOrders(currentPage + 1, selectedPeriod, true);
    }
  };

  return (
    <Card className="custom-card border-border/50 overflow-hidden">
      <CardHeader className="border-b bg-muted/40 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">
              {title} {total > 0 && `(${total})`}
            </CardTitle>
          </div>
          {showPeriodFilter && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={selectedPeriod} 
                onValueChange={setSelectedPeriod}
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
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {error ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Не удалось загрузить заказы</p>
          </div>
        ) : (
          loading && orders.length === 0 ? (
            <div className="overflow-hidden rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер</TableHead>
                    {showClientColumn && <TableHead>Клиент</TableHead>}
                    {showManagerColumn && <TableHead>Менеджер</TableHead>}
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      {showClientColumn && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {showManagerColumn && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : orders.length > 0 ? (
            <InfiniteScroll
              dataLength={orders.length}
              next={loadMoreOrders}
              hasMore={hasMore}
              scrollThreshold={0.8}
              loader={
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-muted-foreground">Загружаем еще...</span>
                </div>
              }
            >
              <div className="overflow-hidden rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Номер</TableHead>
                      {showClientColumn && <TableHead>Клиент</TableHead>}
                      {showManagerColumn && <TableHead>Менеджер</TableHead>}
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Создан</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {orders.map((order, index) => (
                        <motion.tr
                          key={order.id}
                          custom={index}
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <TableCell className="font-medium">#{order.number}</TableCell>
                          {showClientColumn && (
                            <TableCell>
                              <Link 
                                to={`/${botId}/users/${order.client?.id}`}
                                className="flex items-center gap-2 hover:text-primary transition-colors"
                              >
                                {order.client?.photo_url ? (
                                  <img 
                                    src={order.client.photo_url} 
                                    alt="" 
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10">
                                    <UserCircle2 className="w-4 h-4 text-primary" />
                                  </div>
                                )}
                                <span>
                                  {order.client?.first_name} {order.client?.last_name || ''}
                                </span>
                              </Link>
                            </TableCell>
                          )}
                          {showManagerColumn && (
                            <TableCell>
                              <Link 
                                to={`/${botId}/managers/${order.manager?.id}`}
                                className="flex items-center gap-2 hover:text-primary transition-colors"
                              >
                                {order.manager?.photo_url ? (
                                  <img 
                                    src={order.manager.photo_url} 
                                    alt="" 
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10">
                                    <UserCircle2 className="w-4 h-4 text-primary" />
                                  </div>
                                )}
                                <span>
                                  {order.manager?.first_name} {order.manager?.last_name || ''}
                                </span>
                              </Link>
                            </TableCell>
                          )}
                          <TableCell className="font-medium text-primary">
                            {order.total} {currency}
                          </TableCell>
                          <TableCell>
                            <span 
                              className="px-2 py-1 rounded-md text-xs font-medium"
                              style={getOrderStatusStyle(order.status)}
                            >
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
            </InfiniteScroll>
          ) : (
            <div className="overflow-hidden rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер</TableHead>
                    {showClientColumn && <TableHead>Клиент</TableHead>}
                    {showManagerColumn && <TableHead>Менеджер</TableHead>}
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell 
                      colSpan={3 + (showClientColumn ? 1 : 0) + (showManagerColumn ? 1 : 0)} 
                      className="text-center py-8 text-muted-foreground"
                    >
                      {showPeriodFilter ? 'Нет заказов за выбранный период' : 'Нет заказов'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

