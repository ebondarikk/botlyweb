import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Store, ArrowRight } from 'lucide-react';

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
          bots.map((bot) => (
            <motion.div
              key={bot.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/20 custom-card overflow-hidden"
                onClick={() => handleSelectBot(bot)}
              >
                <CardContent className="p-6">
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
                </CardContent>
              </Card>
            </motion.div>
          ))
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
