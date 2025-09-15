'use client';

import { useState, useEffect, useCallback } from 'react';
import { getIntegrations } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useIntegrations(botId) {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadIntegrations = useCallback(async () => {
    if (!botId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getIntegrations(botId);
      setIntegrations(response);
    } catch (err) {
      const errorMessage = err?.message || 'Ошибка загрузки интеграций';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const refreshIntegrations = useCallback(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  return {
    integrations,
    loading,
    error,
    refreshIntegrations,
  };
}
