import * as React from 'react';
import { useEffect, useState } from 'react';
import { SearchIcon, Plus, Send, Clock, Calendar, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { useMailings } from '@/hooks/use-mailings';
import { useBot } from '@/context/BotContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import BotLayout from '@/app/bot/layout';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Badge } from '@/components/ui/badge';

function MailingSkeleton() {
  return (
    <Card className="flex flex-col custom-card h-[320px] border-border/50">
      <CardHeader className="flex-grow min-h-[200px] p-6 rounded-t-lg bg-muted/20">
        <div className="h-full flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-auto">
            <div className="w-3/4">
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted/50 rounded" />
                <div className="h-4 w-2/3 bg-muted/50 rounded" />
                <div className="h-4 w-1/2 bg-muted/50 rounded" />
              </div>
            </div>
            <div className="h-6 w-24 bg-muted/50 rounded-full" />
          </div>
        </div>
      </CardHeader>
      <CardFooter className="flex justify-between items-center pt-4 px-6 border-t border-border/40">
        <div className="h-8 w-24 bg-muted/50 rounded" />
        <div className="h-8 w-24 bg-muted/50 rounded" />
        <div className="h-8 w-24 bg-muted/50 rounded" />
      </CardFooter>
    </Card>
  );
}

export default function MailingsList() {
  const { bot } = useBot();
  const {
    mailings,
    search,
    setSearch,
    count,
    nextPage,
    loading,
    publishedFilter,
    setPublishedFilter,
  } = useMailings(bot?.id);

  const [items, setItems] = useState(mailings);

  useEffect(() => {
    setItems(mailings);
  }, [mailings]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8"
        >
          <div className="w-full md:w-fit">
            <Tabs value={publishedFilter} onValueChange={setPublishedFilter}>
              <TabsList className="w-full bg-muted/50 p-1">
                <TabsTrigger
                  value=""
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Все
                </TabsTrigger>
                <TabsTrigger
                  value="false"
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Неопубликованные
                </TabsTrigger>
                <TabsTrigger
                  value="true"
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Опубликованные
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              id="search"
              type="search"
              value={search}
              placeholder="Поиск..."
              className="pl-10 bg-muted/50 border-none"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex py-4 flex-col md:flex-row justify-between w-full gap-4 items-center"
        >
          <div className="text-lg font-medium">Найдено {count} рассылок</div>

          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="add" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Добавить рассылку
            </Link>
          </Button>
        </motion.div>

        {/* Карточки рассылок */}
        <div className="py-4">
          {loading ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {Array.from({ length: 6 }).map((_, idx) => (
                <motion.div
                  key={`skeleton-${idx}`}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.5,
                        ease: [0.4, 0, 0.2, 1],
                      },
                    },
                  }}
                >
                  <MailingSkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <InfiniteScroll
              dataLength={mailings.length}
              next={nextPage}
              hasMore={mailings.length < count}
              scrollThreshold={0.5}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              loader={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full flex justify-center p-4"
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </motion.div>
              }
            >
              <AnimatePresence>
                {mailings.map((mailing, index) => (
                  <motion.div
                    key={mailing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Link to={`/${bot.id}/mailings/${mailing.id}`}>
                      <Card className="flex flex-col custom-card h-[320px] group transition-all duration-300 ease-in-out border-border/50 hover:border-primary/50 overflow-hidden">
                        <CardHeader
                          className={cn(
                            'flex-grow relative min-h-[200px] p-6 rounded-t-lg overflow-hidden',
                            mailing.preview_image
                              ? 'before:absolute before:inset-0 before:bg-gradient-to-b before:from-black/40 before:via-black/60 before:to-black/90 before:z-0 before:transition-opacity before:duration-300 group-hover:before:opacity-70'
                              : 'bg-muted/20',
                          )}
                        >
                          {mailing.preview_image && (
                            <motion.div
                              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-500"
                              style={{ backgroundImage: `url(${mailing.preview_image})` }}
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                            />
                          )}
                          <div className="relative z-1 h-full flex flex-col">
                            <div className="flex items-start justify-between gap-3">
                              {mailing.published ? (
                                <Badge
                                  variant="success"
                                  className="shadow-lg flex items-center gap-1.5 bg-primary/90"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Опубликовано
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="shadow-lg flex items-center gap-1.5 bg-card/80 backdrop-blur-sm"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  Черновик
                                </Badge>
                              )}
                            </div>

                            <div className="mt-auto">
                              <CardTitle
                                className={cn(
                                  'text-lg font-semibold line-clamp-4 leading-snug transition-all duration-300',
                                  mailing.preview_image
                                    ? 'text-white drop-shadow-lg group-hover:text-primary-foreground'
                                    : 'text-foreground group-hover:text-primary',
                                )}
                              >
                                {mailing.content}
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>

                        <CardFooter className="flex justify-between items-center pt-4 px-6 border-t border-border/40 bg-card/95 backdrop-blur-sm">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="opacity-70">Создано</span>
                            </span>
                            <span className="text-sm font-medium text-foreground/90">
                              {formatDate(mailing.created_at)}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5 text-right">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5 justify-end">
                              <Send className="w-3.5 h-3.5" />
                              <span className="opacity-70">Публикаций</span>
                            </span>
                            <span className="text-sm font-medium text-primary">
                              {mailing.publishes.length}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5 text-right">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5 justify-end">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="opacity-70">Последняя</span>
                            </span>
                            <span className="text-sm font-medium text-foreground/90">
                              {formatDate(mailing.last_published_at)}
                            </span>
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </InfiniteScroll>
          )}
        </div>
      </motion.div>
    </BotLayout>
  );
}
