'use client';

import { useState, useEffect, useCallback } from 'react';
import { getManagers, updateManager } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useManagers(botId, { initialPage = 1, initialLimit = 10 } = {}) {
  const [managers, setManagers] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, _setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingManagerId, setLoadingManagerId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('');

  const pagesCount = Math.ceil(count / limit);

  const setSearch = (value) => {
    setPage(1);
    _setSearch(value);
  };

  // eslint-disable-next-line no-underscore-dangle
  const _updateManager = useCallback(
    async (managerId, ...params) => {
      if (loadingManagerId) {
        toast.error('Дождитесь обновления предыдущего менеджера');
        return;
      }
      setLoadingManagerId(managerId);
      try {
        const response = await updateManager(botId, managerId, ...params);
        setManagers(
          managers.map((manager) => {
            if (manager.id === managerId) {
              return response;
            }
            return manager;
          }),
        );
      } catch (err) {
        toast.error(err?.details?.errorMessage);
      } finally {
        setLoadingManagerId(null);
      }
    },
    [loadingManagerId, managers],
  );

  const loadManagers = useCallback(async () => {
    if (!botId) return;
    setLoading(true);
    try {
      const response = await getManagers(botId, search, activeFilter);
      setManagers(page === initialPage ? response.managers : [...managers, ...response.managers]);
      setCount(response.count);
    } catch (err) {
      toast.error(`Не удалось загрузить менеджеров: ${err?.message}` || err);
    } finally {
      setLoading(false);
    }
  }, [botId, page, limit, search, activeFilter]);

  useEffect(() => {
    if (!botId) return;
    loadManagers();
  }, [botId, page, limit, search, activeFilter]);

  const nextPage = () => {
    if (page < pagesCount) {
      setPage((prev) => prev + 1);
    }
  };

  const previousPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  return {
    managers,
    count,
    page,
    limit,
    pagesCount,
    activeFilter,
    loading,
    search,
    loadingManagerId,
    nextPage,
    previousPage,
    setPage,
    setLimit,
    setSearch,
    setActiveFilter,
    updateManager: _updateManager,
  };
}

export default useManagers;
