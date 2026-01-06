import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User2,
  Hash,
  ExternalLink,
  Ban,
  Shield,
  UserCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import BotLayout from '@/app/bot/layout';
import { toast } from 'react-hot-toast';
import { updateUser } from '@/lib/api';
import { useUser } from '@/hooks/use-user';
import OrdersTable from '@/app/bot/components/OrdersTable';




const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};


export default function DetailClient() {
  const params = useParams();
  const navigate = useNavigate();
  const { user, loading, error, setUser } = useUser(params.bot_id, params.user_id);
  const [updatingUser, setUpdatingUser] = useState(false);

  // Обработка ошибок загрузки пользователя
  useEffect(() => {
    if (error) {
      toast.error(error);
      navigate(`/${params.bot_id}/users`);
    }
  }, [error, navigate, params.bot_id]);


  const handleBlockToggle = async (shouldBlock) => {
    if (!user || updatingUser) return;
    
    setUpdatingUser(true);
    try {
      await updateUser(params.bot_id, user.id, { is_blocked: shouldBlock });
      setUser({ ...user, is_blocked: shouldBlock });
      toast.success(shouldBlock ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      toast.error('Не удалось обновить статус пользователя');
    } finally {
      setUpdatingUser(false);
    }
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 py-6"
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => navigate(`/${params.bot_id}/users`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              Карточка клиента
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Подробная информация о клиенте и его заказах
            </p>
          </div>
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
          <div className="max-w-4xl">
            {/* Информация о пользователе */}
            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}>
              <Card className="custom-card border-border/50 overflow-hidden">
                <CardHeader className="border-b bg-muted/40 px-6">
                  <div className="flex items-center gap-2">
                    <User2 className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">Информация о клиенте</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {user && (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                      {user.photo_url ? (
                        <img 
                          src={user.photo_url} 
                          alt={`${user.first_name} ${user.last_name || ''}`}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-primary/10">
                          <User2 className="w-8 h-8 text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">
                          {user.first_name} {user.last_name || ''}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5" />
                            <span>{user.tg_id}</span>
                          </div>
                          {user.username && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <a
                                href={`https://t.me/${user.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
                              >
                                @{user.username}
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            {user.is_blocked ? (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1.5 border-destructive/20 bg-destructive/5 w-fit"
                              >
                                <Ban className="w-3.5 h-3.5 text-destructive" />
                                <span className="text-destructive">Заблокирован</span>
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1.5 border-primary/20 bg-primary/5 w-fit"
                              >
                                <Shield className="w-3.5 h-3.5 text-primary" />
                                <span className="text-primary">Активен</span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {user.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                            </span>
                            <Switch
                              checked={user.is_blocked}
                              disabled={updatingUser}
                              onCheckedChange={handleBlockToggle}
                              id={`block-toggle-${user.id}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Заказы клиента */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={1}
              className="mt-8"
            >
              <OrdersTable
                botId={params.bot_id}
                clientId={params.user_id}
                showPeriodFilter={false}
                showClientColumn={false}
                showManagerColumn={true}
                initialPeriod="all_time"
                title="Заказы"
                currency="руб"
              />
            </motion.div>
          </div>
        )}
      </motion.div>
    </BotLayout>
  );
}
