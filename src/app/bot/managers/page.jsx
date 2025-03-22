import * as React from 'react';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useManagers } from '@/hooks/use-managers';
import { useBot } from '@/context/BotContext';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BotLayout from '@/app/bot/layout';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

function ManagerSkeleton() {
  return (
    <Card className="overflow-hidden custom-card">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row flex-grow gap-1 md:gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-8 bg-gray-200" />
              <Skeleton className="h-4 w-16 bg-gray-200" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12 bg-gray-200" />
              <Skeleton className="h-4 w-24 bg-gray-200" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20 bg-gray-200" />
              <Skeleton className="h-4 w-32 bg-gray-200" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24 bg-gray-200" />
            <Skeleton className="h-6 w-10 rounded-full bg-gray-200" />
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
  } = useManagers(bot?.id, {
    // initialPage: 1,
    // initialLimit: 1000, // Получим сразу все менеджеры
  });

  const handleActiveToggle = useCallback(
    (managerId, isActive) => {
      updateManager(managerId, { is_active: isActive });
    },
    [updateManager],
  );

  return (
    <BotLayout>
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="w-full md:w-fit">
            <Tabs value={activeFilter} onValueChange={setActiveFilter}>
              <TabsList className="w-full">
                <TabsTrigger className="w-full" value="">
                  Все
                </TabsTrigger>
                <TabsTrigger className="w-full" value="true">
                  Активные
                </TabsTrigger>
                <TabsTrigger className="w-full" value="false">
                  Неактивные
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="search"
              type="search"
              value={search}
              placeholder="Поиск..."
              className="pl-10"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="flex py-4 flex-col md:flex-row justify-between w-full">
          <div className="mb-4 text-lg">
            {loading ? (
              <Skeleton className="h-6 w-48 bg-gray-200" />
            ) : (
              `Найдено ${count} менеджеров`
            )}
          </div>

          <Button asChild>
            <Link to="add" className="btn-primary">
              Добавить менеджера
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          {loading && !managers.length && (
            <div className="grid gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <ManagerSkeleton key={idx} />
              ))}
            </div>
          )}
          {!loading && (
            <div className="grid gap-4">
              {managers.map((manager) => (
                <Link to={`/${bot.id}/managers/${manager.id}`} key={manager.id}>
                  <Card key={manager.id} className="overflow-hidden custom-card">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-col md:flex-row flex-grow gap-1 md:gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">ID:</span>
                            <span className="font-medium">{manager.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Имя:</span>
                            <span className="font-medium">{manager.first_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Username:</span>
                            <span className="font-medium">
                              {manager.username ? (
                                <a
                                  href={`https://t.me/${manager.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-gray-400 underline"
                                >
                                  @{manager.username}
                                </a>
                              ) : (
                                '—'
                              )}
                            </span>
                          </div>
                          {manager.is_admin && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Админ</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Активен</span>
                          <Switch
                            checked={manager.is_active}
                            disabled={manager.id === loadingManagerId}
                            onCheckedChange={(checked) => handleActiveToggle(manager.id, checked)}
                            id={`active-toggle-${manager.id}`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </BotLayout>
  );
}
