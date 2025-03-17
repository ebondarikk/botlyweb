import React, { useState, useEffect, useCallback } from 'react';
import { loadCategory } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useCategory(botId, categoryId) {
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCategory = useCallback(
    async (categoryId) => {
      setLoading(true);
      try {
        const response = await loadCategory(botId, categoryId);
        setCategory(response);
      } catch (err) {
        toast.error(`Не удалось загрузить категорию: ${err?.message}` || err);
      } finally {
        setLoading(false);
      }
    },
    [botId],
  );

  useEffect(() => {
    if (!botId || !categoryId) return;
    getCategory(categoryId);
  }, [botId, categoryId, getCategory]);

  return {
    category,
    setCategory,
    loading,
  };
}

export default useCategory;
