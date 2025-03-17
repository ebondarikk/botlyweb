import { useState, useEffect, useCallback, useRef } from 'react';
import { getMailing, publishMailing } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useMailing(botId, mailingId) {
  const [mailing, setMailing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const intervalRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const checkPublishStatus = useCallback(async () => {
    try {
      const response = await getMailing(botId, mailingId);

      setMailing((prev) => ({
        ...prev,
        publishes: response.publishes,
      }));

      // Если все публикации завершены, останавливаем опрос
      const allDone = response.publishes.every((publish) => publish.done || publish.error);
      if (allDone) {
        stopPolling();
      }
    } catch (err) {
      console.error('Ошибка при получении статуса публикации:', err);
      // В случае ошибки тоже останавливаем опрос
      stopPolling();
    }
  }, [botId, mailingId, stopPolling]);

  const startPolling = useCallback(() => {
    // Останавливаем предыдущий опрос, если был
    stopPolling();

    // Делаем первую проверку немедленно
    checkPublishStatus();

    // Запускаем интервал для последующих проверок
    intervalRef.current = setInterval(checkPublishStatus, 1000);
  }, [checkPublishStatus, stopPolling]);

  const getMail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMailing(botId, mailingId);
      setMailing(response);

      // Проверяем, есть ли незавершенные публикации
      const hasUnfinished = response?.publishes?.some((publish) => !publish.done && !publish.error);
      if (hasUnfinished) {
        startPolling();
      }
    } catch (err) {
      toast.error(`Не удалось загрузить рассылку: ${err?.message}` || err);
    } finally {
      setLoading(false);
    }
  }, [botId, mailingId, startPolling]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      const result = await publishMailing(botId, mailingId);
      toast.success('Рассылка будет опубликована в ближайшее время');

      // Обновляем публикации и запускаем опрос
      setMailing((prev) => ({
        ...prev,
        publishes: result.publishes,
      }));
      startPolling();

      return true;
    } catch (error) {
      toast.error('Ошибка при публикации');
      return false;
    } finally {
      setPublishing(false);
    }
  }, [botId, mailingId, startPolling]);

  // Загружаем данные при монтировании
  useEffect(() => {
    if (!botId || !mailingId) return;
    getMail();

    return stopPolling;
  }, [botId, mailingId, getMail, stopPolling]);

  return {
    mailing,
    setMailing,
    loading,
    publishing,
    handlePublish,
  };
}

export default useMailing;
