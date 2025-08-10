import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getBotDetail, getBots } from '@/lib/api';

const BotContext = createContext(null);

export function BotProvider({ children }) {
  const params = useParams();
  const navigate = useNavigate();
  const bot_id = params?.bot_id;

  const [bot, setBot] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!!bot && bot_id != bot.id.toString()) {
      localStorage.setItem('selected_bot_id', bot.id);
      navigate(`/${bot.id}`);
    }
  }, [bot, navigate, bot_id]);

  useEffect(() => {
    async function loadBot() {
      if (!bot_id) {
        navigate('/');
        return;
      }
      try {
        setLoading(true);
        // Гарантируем, что список ботов есть в storage при прямом заходе по /:bot_id
        const botsJson = localStorage.getItem('bots');
        if (!botsJson) {
          try {
            const data = await getBots();
            localStorage.setItem('bots', JSON.stringify(data.bots || []));
          } catch (e) {
            // игнорируем 401 — обработается глобально
          }
        }
        const data = await getBotDetail(bot_id);
        setBot(data);
      } catch (error) {
        if (error?.status === 404) {
          toast.error('Бот не найден');
          navigate('/');
        } else {
          toast.error('Ошибка загрузки информации о боте');
        }
      } finally {
        setLoading(false);
      }
    }

    loadBot();
  }, [bot_id]);

  return <BotContext.Provider value={{ bot, setBot, loading }}>{children}</BotContext.Provider>;
}

export const useBot = () => {
  return useContext(BotContext);
};
