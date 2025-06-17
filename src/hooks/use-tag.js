import { useState, useEffect, useCallback } from 'react';
import { loadTag } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useTag(botId, tagId) {
  const [tag, setTag] = useState(null);
  const [loading, setLoading] = useState(false);

  const getTag = useCallback(async () => {
    setLoading(true);
    try {
      const response = await loadTag(botId, tagId);
      setTag(response);
    } catch (err) {
      toast.error(`Не удалось загрузить тег: ${err?.message}` || err);
    } finally {
      setLoading(false);
    }
  }, [botId, tagId]);

  useEffect(() => {
    if (!botId || !tagId) return;
    getTag();
  }, [botId, tagId, getTag]);

  return {
    tag,
    setTag,
    loading,
  };
}

export default useTag;
