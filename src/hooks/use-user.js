import { useState, useEffect } from 'react';
import { getUser } from '@/lib/api';

export function useUser(botId, userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      if (!botId || !userId) return;

      setLoading(true);
      setError(null);

      try {
        const user = await getUser(botId, userId);

        if (!ignore) {
          setUser(user);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Ошибка загрузки пользователя:', err);
          setError('Не удалось загрузить данные пользователя');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      ignore = true;
    };
  }, [botId, userId]);

  return {
    user,
    loading,
    error,
    setUser,
  };
}

export default useUser;
