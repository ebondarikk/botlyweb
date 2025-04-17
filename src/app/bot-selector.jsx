import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Store, ArrowRight, Crown, AlertTriangle, Ban, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TARIFF_THEMES } from '@/lib/constants/tariffs';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

const getStatusInfo = (status) => {
  switch (status) {
    case 'active':
      return { color: 'bg-green-500/10 text-green-500', text: 'Активен' };
    case 'failed_attempt':
      return {
        color: 'bg-yellow-500/10 text-yellow-500',
        text: 'Проблема с оплатой',
        icon: AlertTriangle,
      };
    case 'blocked':
      return { color: 'bg-red-500/10 text-red-500', text: 'Заблокирован', icon: Ban };
    default:
      return { color: 'bg-gray-500/10 text-gray-500', text: 'Неизвестно' };
  }
};

const getBorderClasses = (theme) => {
  if (theme.sort === 0) return 'border-border hover:border-zinc-300';
  if (theme.sort === 1) return 'border-border hover:border-blue-200';
  if (theme.sort === 2) return 'border-border hover:border-purple-200';
  if (theme.sort === 3) return 'border-border hover:border-amber-200';
  return 'border-border';
};

const getShadowClasses = (theme) => {
  if (theme.sort === 0) return 'hover:shadow-lg hover:shadow-zinc-200/50';
  if (theme.sort === 1) return 'hover:shadow-lg hover:shadow-blue-200/50';
  if (theme.sort === 2) return 'hover:shadow-lg hover:shadow-purple-200/50';
  if (theme.sort === 3) return 'hover:shadow-lg hover:shadow-amber-200/50';
  return 'hover:shadow-lg hover:shadow-zinc-200/50';
};

const getBadgeClasses = (theme) => {
  if (theme.sort === 0) return 'bg-zinc-100 text-zinc-600';
  if (theme.sort === 1) return 'bg-blue-100 text-blue-600';
  if (theme.sort === 2) return 'bg-purple-100 text-purple-600';
  if (theme.sort === 3) return 'bg-amber-100 text-amber-600';
  return 'bg-zinc-100 text-zinc-600';
};

const getThemeIcon = (theme) => {
  const Icon = theme?.icon || Package;
  return <Icon className="w-3 h-3" />;
};

export function BotSelector({ bots, handleSelectBot }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
    >
      <AnimatePresence>
        {bots && bots.length > 0 ? (
          bots.map((bot) => {
            const theme = TARIFF_THEMES[bot.tariff.sort] || TARIFF_THEMES.default;
            const statusInfo = getStatusInfo(bot.status);
            const borderClasses = getBorderClasses(theme);
            const shadowClasses = getShadowClasses(theme);
            const badgeClasses = getBadgeClasses(theme);

            return (
              <motion.div
                key={bot.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 custom-card overflow-hidden ${borderClasses} ${shadowClasses}`}
                  onClick={() => handleSelectBot(bot)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-xl">
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                              {bot.fullname.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h2 className="text-lg font-semibold leading-none tracking-tight">
                              {bot.fullname}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">@{bot.username}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`${badgeClasses} flex items-center gap-1`}
                        >
                          {getThemeIcon(theme)}
                          {bot.tariff.name}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`${statusInfo.color} flex items-center gap-1`}
                        >
                          {statusInfo.icon && <statusInfo.icon className="w-3 h-3" />}
                          {statusInfo.text}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            variants={itemVariants}
            className="col-span-full flex flex-col items-center justify-center gap-4 p-8"
          >
            <div className="p-4 rounded-full bg-primary/10">
              <Store className="w-8 h-8 text-primary" />
            </div>
            <p className="text-center text-muted-foreground">Магазины не найдены</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default BotSelector;
