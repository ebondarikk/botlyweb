import React, { useState, useEffect, useCallback } from 'react';
import { loadManager } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useManager(botId, managerId) {
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(false);

  const getManager = useCallback(
    async (managerId) => {
      setLoading(true);
      try {
        const response = await loadManager(botId, managerId);
        setManager(response);
      } catch (err) {
        toast.error(`Не удалось загрузить менеджера: ${err?.message}` || err);
      } finally {
        setLoading(false);
      }
    },
    [botId],
  );

  useEffect(() => {
    if (!botId || !managerId) return;
    getManager(managerId);
  }, [botId, managerId, getManager]);

  return {
    manager,
    setManager,
    loading,
  };
}

export default useManager;
