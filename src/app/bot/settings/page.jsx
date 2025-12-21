import React, { useState, useEffect } from 'react';
import { getDeliverySettings, updateBot } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, ListTodo, ChevronRight, Save, Bot as BotIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import BotLayout from '@/app/bot/layout';
import { Badge } from '@/components/ui/badge';
import { useBot } from '@/context/BotContext';
import DeliverySettings from './components/DeliverySettings';
import PaymentMethods from './components/PaymentMethods';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const { bot, setBot } = useBot();
  const params = useParams();
  const bot_id = params?.bot_id;
  
  const [deliverySettings, setDeliverySettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [openAccordion, setOpenAccordion] = useState('bot-settings');
  const navigate = useNavigate();
  
  // Состояния для редактирования бота
  const [welcomeText, setWelcomeText] = useState('');
  const [saving, setSaving] = useState(false);

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
      setWelcomeText(bot.welcome_text || '');
    }
  }, [bot]);

  const handleSaveBotSettings = async () => {
    if (!bot_id) return;
    setSaving(true);
    try {
      const updatedBot = await updateBot(bot_id, {
        welcome_text: welcomeText,
      });
      setBot(updatedBot);
      toast.success('Настройки бота обновлены');
    } catch (error) {
      toast.error('Ошибка обновления настроек');
    } finally {
      setSaving(false);
    }
  };

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
          {/* Настройки бота */}
          <motion.div variants={itemVariants} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
            <Accordion
              type="single"
              collapsible
              value={openAccordion}
              onValueChange={setOpenAccordion}
              className="rounded-xl border bg-card text-card-foreground shadow-sm mb-6 custom-card overflow-hidden"
            >
              <AccordionItem value="bot-settings" className="border-none">
                <AccordionTrigger className="flex justify-between w-full px-6 py-0 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 py-6">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <BotIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <h2 className="text-lg font-medium">Настройки бота</h2>
                      <p className="text-sm text-muted-foreground">Основные настройки</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-6 space-y-6">
                    {/* Валюта (только для чтения) */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-muted-foreground">
                        Валюта
                      </label>
                      <Input
                        value={bot?.currency || ''}
                        disabled
                        className="bg-muted/50"
                      />
                    </div>

                    {/* Приветственное сообщение */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-muted-foreground">
                        Приветственное сообщение
                      </label>
                      <Textarea
                        className="min-h-[100px] resize-y"
                        value={welcomeText}
                        onChange={(e) => setWelcomeText(e.target.value)}
                        placeholder="Введите приветственное сообщение..."
                      />
                    </div>

                    {/* Кнопка сохранения */}
                    <div className="flex justify-start pt-4">
                      <Button
                        onClick={handleSaveBotSettings}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Сохранение...' : 'Сохранить'}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>

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
