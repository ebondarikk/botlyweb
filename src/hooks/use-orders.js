import { useState, useEffect, useCallback } from 'react';
import { getOrders } from '@/lib/api';

export function useOrders(botId, initialPeriod = 'current_month') {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [period, setPeriod] = useState(initialPeriod);
  
  const limit = 20;

  const loadOrders = async (pageNum = 1, periodFilter = period, append = false) => {
    if (!botId) return;
    
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setOrders([]);
    }
    setError(null);
    
    try {
      const response = await getOrders(botId, pageNum, limit, periodFilter);
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

  // Загружаем заказы при изменении botId или периода
  useEffect(() => {
    if (botId) {
      setCurrentPage(1);
      setHasMore(true);
      loadOrders(1, period, false);
    }
  }, [botId, period]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !error) {
      loadOrders(currentPage + 1, period, true);
    }
  }, [loadingMore, hasMore, error, currentPage, period, botId]);

  const changePeriod = (newPeriod) => {
    setPeriod(newPeriod);
  };

  return {
    orders,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    period,
    loadMore,
    changePeriod,
  };
}
