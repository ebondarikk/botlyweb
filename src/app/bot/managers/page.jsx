import * as React from 'react';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useManagers } from '@/hooks/use-managers';
import { useBot } from '@/context/BotContext';
import { motion, AnimatePresence } from 'framer-motion';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  SearchIcon,
  UserCircle2,
  Shield,
  Users2,
  ExternalLink,
  Plus,
  Ban,
  ChevronRight,
  User,
  Hash,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BotLayout from '@/app/bot/layout';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function ManagerSkeleton() {
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

export default function ManagersList() {
  const { bot } = useBot();
  const {
    managers,
    count,
    loading,
    loadingManagerId,
    search,
    activeFilter,
    setActiveFilter,
    updateManager,
    setSearch,
  } = useManagers(bot?.id);

  const handleActiveToggle = useCallback(
    (managerId, isActive) => {
      updateManager(managerId, { is_active: isActive });
    },
    [updateManager],
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
          className="flex flex-col gap-4 mb-8"
        >
          <div className="flex justify-center sm:justify-start">
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full sm:w-fit">
              <TabsList className="w-full sm:w-auto bg-muted/50 p-1">
                <TabsTrigger
                  value=""
                  className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-w-[100px]"
                >
                  <Users2 className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">Все</span>
                </TabsTrigger>
                <TabsTrigger
                  value="true"
                  className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-w-[100px]"
                >
                  <UserCircle2 className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">Активные</span>
                </TabsTrigger>
                <TabsTrigger
                  value="false"
                  className="flex-1 sm:flex-initial data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-w-[100px]"
                >
                  <Ban className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">Неактивные</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                id="search"
                type="search"
                value={search}
                placeholder="Поиск..."
                className="pl-10 bg-muted/50 border-none w-full"
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90 shrink-0">
              <Link to="add" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="truncate">Добавить менеджера</span>
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6 text-lg font-medium"
        >
          {loading ? <Skeleton className="h-6 w-48 bg-muted/50" /> : `Найдено ${count} менеджеров`}
        </motion.div>

        <div className="space-y-4">
          {loading && !managers.length ? (
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
                  <ManagerSkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div className="grid gap-4">
                {managers.map((manager, index) => (
                  <motion.div
                    key={manager.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link to={`/${bot.id}/managers/${manager.id}`}>
                      <Card className="overflow-hidden custom-card border-border/50 hover:border-primary/50 transition-all duration-300 group hover:bg-muted/30">
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div
                                className={`p-2.5 rounded-xl shrink-0 ${manager.is_active ? 'bg-primary/10' : 'bg-muted'}`}
                              >
                                <User
                                  className={`w-6 h-6 ${manager.is_active ? 'text-primary' : 'text-muted-foreground'}`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                  <span className="font-medium text-lg group-hover:text-primary transition-colors truncate">
                                    {manager.first_name}
                                  </span>
                                  {manager.is_admin && (
                                    <Badge
                                      variant="default"
                                      className="flex items-center gap-1.5 bg-primary/10 text-primary border-none shrink-0"
                                    >
                                      <Shield className="w-3.5 h-3.5" />
                                      <span className="truncate">Администратор</span>
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Hash className="w-3.5 h-3.5" />
                                    <span>{manager.id}</span>
                                  </div>
                                  {manager.username && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                                      <a
                                        href={`https://t.me/${manager.username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        @{manager.username}
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 ml-auto">
                              <div className="flex items-center gap-3">
                                {manager.is_active ? (
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1.5 border-primary/20 bg-primary/5 whitespace-nowrap"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="text-primary">Активен</span>
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1.5 border-muted-foreground/20 whitespace-nowrap"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">Неактивен</span>
                                  </Badge>
                                )}
                                <Switch
                                  checked={manager.is_active}
                                  disabled={manager.id === loadingManagerId}
                                  onCheckedChange={(checked) =>
                                    handleActiveToggle(manager.id, checked)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  id={`active-toggle-${manager.id}`}
                                />
                              </div>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground/40 group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </BotLayout>
  );
}
