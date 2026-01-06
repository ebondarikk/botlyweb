import { useState, useEffect } from 'react';
import { getUsers } from '@/lib/api';

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
        // Сначала пробуем найти пользователя в первых 50 записях
        const response = await getUsers(botId, 1, 50, '', '');
        
        if (!ignore) {
          const foundUser = response.users?.find(u => u.id.toString() === userId.toString());
          
          if (foundUser) {
            setUser(foundUser);
          } else {
            // Если не найден, попробуем поиск по tg_id
            const searchResponse = await getUsers(botId, 1, 50, userId, '');
            const searchedUser = searchResponse.users?.find(u => u.tg_id === userId || u.id.toString() === userId.toString());
            
            if (searchedUser) {
              setUser(searchedUser);
            } else {
              setError('Пользователь не найден');
            }
          }
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
