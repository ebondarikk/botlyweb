import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Package2,
} from 'lucide-react';
import BotLayout from '@/app/bot/layout';
import { getOptionGroups } from '@/lib/api';
import { useBot } from '@/context/BotContext';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function OptionsPage() {
  const params = useParams();
  const navigate = useNavigate();

  const { bot } = useBot();
  
  const [optionGroups, setOptionGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOptionGroups = async () => {
    try {
      setLoading(true);
      const response = await getOptionGroups(params.bot_id);
      setOptionGroups(response.option_groups || []);
    } catch (error) {
      console.error('Ошибка загрузки групп опций:', error);
      toast.error('Ошибка загрузки групп опций');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptionGroups();
  }, [params.bot_id]);


  const handleCreateNew = () => {
    navigate(`/${params.bot_id}/options/create`);
  };

  const handleEdit = (groupId) => {
    navigate(`/${params.bot_id}/options/${groupId}`);
  };

  return (
    <BotLayout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full px-4 md:px-8"
      >
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6"
        >
          <div>
            <h1 className="text-2xl font-semibold">Группы опций</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Управление группами опций для товаров
            </p>
          </div>
          <Button onClick={handleCreateNew} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Создать группу
          </Button>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-8"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </motion.div>
        ) : (
          <motion.div
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            initial="hidden"
            animate="visible"
            className="grid gap-4"
          >
            {!optionGroups || optionGroups.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="p-4 rounded-full bg-muted/40 mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Нет групп опций</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  Создайте первую группу опций для управления дополнительными параметрами товаров
                </p>
                <Button onClick={handleCreateNew} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Создать группу опций
                </Button>
              </motion.div>
            ) : (
              optionGroups.map((group, index) => (
                <motion.div 
                  key={group.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden custom-card border-border/50 hover:border-primary/50 transition-all duration-300 group hover:bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* Основная информация */}
                        <div 
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleEdit(group.id)}
                        >
                          <div className="w-12 h-12 flex items-center justify-center rounded-lg shrink-0 bg-primary/10">
                            <Package2 className="w-6 h-6 text-primary" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="mb-1">
                              <span className="font-medium text-base group-hover:text-primary transition-colors truncate">
                                {group.name || 'Без названия'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                              <span>{group.options?.length || 0} опций</span>
                              
                              {group.options && group.options.length > 0 && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                                  <div className="flex flex-wrap gap-1.5">
                                    {group.options.slice(0, 3).map((option) => (
                                      <span 
                                        key={option.id} 
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                                      >
                                        {option.component.name}
                                        {option.price && (
                                          <span className="ml-1 text-primary/70">+{option.price} {bot?.currency}</span>
                                        )}
                                      </span>
                                    ))}
                                    {group.options.length > 3 && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                                        +{group.options.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Toggle активности */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm text-muted-foreground">
                            {group.is_active ? 'Активна' : 'Неактивна'}
                          </span>
                          <Switch
                            checked={group.is_active}
                            disabled
                            className="pointer-events-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </motion.div>
    </BotLayout>
  );
}
