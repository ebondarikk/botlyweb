import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBots } from '@/lib/api';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { LogOut, Plus } from 'lucide-react';
import { BotSelector } from './bot-selector';

export default function HomePage() {
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSelectBot = (bot) => {
    localStorage.setItem('selected_bot_id', bot.id);
    navigate(`/${bot.id}`);
  };

  useEffect(() => {
    async function loadBots() {
      try {
        const data = await getBots();
        setBots(data.bots);
        setCount(data.count);
        localStorage.setItem('bots', JSON.stringify(data.bots));
      } catch (error) {
        console.log(error);
        toast.error('Ошибка загрузки ботов');
      } finally {
        setLoading(false);
      }
    }

    const token = localStorage.getItem('access_token');
    // const selectedBot = localStorage.getItem("selected_bot_id");

    if (!token) {
      navigate('/login');
    }
    if (!bots.length && count === null) {
      loadBots();
    }
  }, [navigate, bots, setBots]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    window.location.href = '/';
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 w-full">
      <div className="w-full flex justify-end px-4">
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut /> Выход
        </Button>
      </div>
      <div className="min-h-screen p-4 w-full sm:w-2/3">
        <h1 className="text-3xl font-bold text-center mb-6">Выберите магазин для работы</h1>
        <div className="flex justify-center mb-8">
          <Button
            variant="default"
            onClick={() => navigate('/add')}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 font-medium shadow-md hover:shadow-lg transition-all duration-200 px-6"
          >
            <Plus size={26} /> Создать новый магазин
          </Button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="w-full p-4 border rounded-md animate-pulse custom-card">
                <div className="h-5 text-xl bg-gray-300 rounded w-full mb-2" />
                <div className="h-5 bg-gray-300 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <BotSelector bots={bots} handleSelectBot={handleSelectBot} />
        )}
      </div>
    </div>
  );
}
