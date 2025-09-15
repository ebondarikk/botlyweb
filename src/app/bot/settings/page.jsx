import React, { useState, useEffect } from 'react';
import { getDeliverySettings } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ListTodo, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BotLayout from '@/app/bot/layout';
import { Badge } from '@/components/ui/badge';
import { useBot } from '@/context/BotContext';
import DeliverySettings from './components/DeliverySettings';
import PaymentMethods from './components/PaymentMethods';

export default function SettingsPage() {
  const { bot } = useBot();
  const [deliverySettings, setDeliverySettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [openAccordion, setOpenAccordion] = useState('delivery');
  const navigate = useNavigate();

  const fetchDeliverySettings = async () => {
    try {
      setInitialLoading(true);
      const data = await getDeliverySettings(bot.id);
      setDeliverySettings({
        is_active: data.is_active || false,
        zones: data.zones || [],
      });
    } catch (error) {
      toast.error('Ошибка при загрузке настроек доставки');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (bot) {
      fetchDeliverySettings();
    }
  }, [bot]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  return (
    <BotLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full px-4 md:px-8"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 py-6"
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-muted/80"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Настройки</h1>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto pb-8"
        >
          <DeliverySettings
            bot={bot}
            deliverySettings={deliverySettings}
            setDeliverySettings={setDeliverySettings}
            loading={loading}
            setLoading={setLoading}
            initialLoading={initialLoading}
            openAccordion={openAccordion}
            setOpenAccordion={setOpenAccordion}
          />

          <PaymentMethods
            bot={bot}
            openAccordion={openAccordion}
            setOpenAccordion={setOpenAccordion}
          />

          {/* Статусы заказов */}
          <motion.div variants={itemVariants} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
            <Card className="custom-card p-6 cursor-not-allowed bg-opacity-50 group transition-all duration-300 hover:bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <ListTodo className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-medium">Статусы заказов</h2>
                  <p className="text-sm text-muted-foreground">Настройте этапы обработки заказов</p>
                </div>
                <div className="p-2 rounded-full text-muted-foreground/40 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="text-xs bg-card/80 backdrop-blur-sm">
                  Скоро
                </Badge>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </BotLayout>
  );
}
