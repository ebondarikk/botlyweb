import * as React from 'react';
import { useCallback } from 'react';
import { useUsers } from '@/hooks/use-users';
import { useBot } from '@/context/BotContext';
import { motion, AnimatePresence } from 'framer-motion';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { SearchIcon, UserCircle2, ExternalLink, Ban, Shield, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BotLayout from '@/app/bot/layout';
import { Switch } from '@/components/ui/switch';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Badge } from '@/components/ui/badge';

function UserSkeleton() {
  return (
    <Card className="overflow-hidden custom-card border-border/50">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row flex-grow gap-2 md:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-8 bg-muted/50" />
              <Skeleton className="h-4 w-16 bg-muted/50" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12 bg-muted/50" />
              <Skeleton className="h-4 w-24 bg-muted/50" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20 bg-muted/50" />
              <Skeleton className="h-4 w-32 bg-muted/50" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24 bg-muted/50" />
            <Skeleton className="h-6 w-10 rounded-full bg-muted/50" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UsersList() {
  const { bot } = useBot();
  const {
    users,
    count,
    loading,
    loadingUserId,
    search,
    nextPage,
    blockedFilter,
    setBlockedFilter,
    updateUser,
    setSearch,
  } = useUsers(bot?.id, {
    initialPage: 1,
    initialLimit: 16,
  });

  const handleBlockToggle = useCallback(
    (userId, shouldBlock) => {
      updateUser(userId, { is_blocked: shouldBlock });
    },
    [updateUser],
  );

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
          className="flex flex-col lg:flex-row gap-4 mb-8"
        >
          <div className="flex justify-center sm:justify-start flex-1">
            <Tabs
              value={blockedFilter}
              onValueChange={setBlockedFilter}
              className="w-full sm:w-fit"
            >
              <TabsList className="w-full sm:w-auto bg-muted/50 p-1">
                <TabsTrigger
                  value=""
                  className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-w-[100px]"
                >
                  <Shield className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">Все</span>
                </TabsTrigger>
                <TabsTrigger
                  value="false"
                  className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-w-[100px]"
                >
                  <UserCircle2 className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">Активные</span>
                </TabsTrigger>
                <TabsTrigger
                  value="true"
                  className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-w-[100px]"
                >
                  <Ban className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">Заблокированные</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="relative w-full lg:w-80">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              type="search"
              value={search}
              placeholder="Поиск..."
              className="pl-9 py-2 bg-muted/50 border-none w-full"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6 text-lg font-medium"
        >
          {loading ? <Skeleton className="h-6 w-48 bg-muted/50" /> : `Найдено ${count} клиентов`}
        </motion.div>

        <div className="space-y-4">
          {loading && !users.length && (
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
              className="grid gap-4"
            >
              {Array.from({ length: 8 }).map((_, idx) => (
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
                  <UserSkeleton />
                </motion.div>
              ))}
            </motion.div>
          )}
          <InfiniteScroll
            dataLength={users.length}
            next={nextPage}
            hasMore={users.length < count}
            scrollThreshold={0.5}
            loader={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-4 mt-4"
              >
                {Array.from({ length: 3 }).map((_, idx) => (
                  <UserSkeleton key={`loader-${idx}`} />
                ))}
              </motion.div>
            }
          >
            <AnimatePresence>
              <motion.div className="grid gap-4">
                {users.map((user) => (
                  <motion.div
                    key={user.id}
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
                    <Card
                      className={`overflow-hidden custom-card border-border/50 hover:border-primary/50 transition-all duration-300 group
                        ${user.is_blocked ? 'bg-destructive/5' : 'hover:bg-muted/30'}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {user.photo_url ? (
                              <img 
                                src={user.photo_url} 
                                alt={`${user.first_name} ${user.last_name || ''}`}
                                className="w-12 h-12 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-12 h-12 flex items-center justify-center rounded-lg shrink-0 ${user.is_blocked ? 'bg-destructive/10' : 'bg-primary/10'}`}
                              >
                                <UserCircle2
                                  className={`w-6 h-6 ${user.is_blocked ? 'text-destructive' : 'text-primary'}`}
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <span className="font-medium text-base group-hover:text-primary transition-colors truncate">
                                  {user.first_name} {user.last_name || ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Hash className="w-3.5 h-3.5" />
                                  <span>{user.tg_id}</span>
                                </div>
                                {user.username && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                                    <a
                                      href={`https://t.me/${user.username}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      @{user.username}
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-auto">
                            {user.is_blocked ? (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1.5 border-destructive/20 bg-destructive/5 whitespace-nowrap"
                              >
                                <Ban className="w-3.5 h-3.5 text-destructive shrink-0" />
                                <span className="text-destructive">Заблокирован</span>
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1.5 border-primary/20 bg-primary/5 whitespace-nowrap"
                              >
                                <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="text-primary">Активен</span>
                              </Badge>
                            )}
                            <Switch
                              checked={user.is_blocked}
                              disabled={user.id === loadingUserId}
                              onCheckedChange={(checked) => handleBlockToggle(user.id, checked)}
                              id={`block-toggle-${user.id}`}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </InfiniteScroll>
        </div>
      </motion.div>
    </BotLayout>
  );
}
