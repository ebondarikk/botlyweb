import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBots } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, Plus, Store, Package, Users, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const headerVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.2 } },
  };

  const buttonVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { delay: 0.3 } },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center min-h-screen py-8 w-full bg-background"
    >
      <div className="w-full flex justify-end px-4">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" /> Выход
          </Button>
        </motion.div>
      </div>

      <div className="min-h-screen p-4 w-full sm:w-2/3">
        <motion.div
          variants={headerVariants}
          initial="initial"
          animate="animate"
          className="flex items-center gap-4 mb-6 justify-center"
        >
          <div className="p-3 rounded-xl bg-primary/10">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Выберите магазин для работы</h1>
        </motion.div>

        <motion.div
          variants={buttonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          className="flex justify-center mb-8"
        >
          <Button
            variant="default"
            onClick={() => navigate('/add')}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 font-medium shadow-md hover:shadow-lg transition-all duration-200 px-6 h-12"
          >
            <Plus className="w-5 h-5" /> Создать новый магазин
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
            >
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card key={`skeleton-${idx}`} className="w-full p-4 border custom-card">
                  <CardContent className="p-0 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex items-center gap-3 mt-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : (
            <BotSelector bots={bots} handleSelectBot={handleSelectBot} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
