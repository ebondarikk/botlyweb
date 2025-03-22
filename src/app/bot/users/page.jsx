import * as React from 'react';
import { useCallback } from 'react';
import { useUsers } from '@/hooks/use-users';
import { useBot } from '@/context/BotContext';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BotLayout from '@/app/bot/layout';
import { Switch } from '@/components/ui/switch';
import InfiniteScroll from 'react-infinite-scroll-component';

function UserSkeleton() {
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
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="w-full md:w-fit">
            <Tabs value={blockedFilter} onValueChange={setBlockedFilter}>
              <TabsList className="w-full">
                <TabsTrigger className="w-full" value="">
                  Все
                </TabsTrigger>
                <TabsTrigger className="w-full" value="false">
                  Активные
                </TabsTrigger>
                <TabsTrigger className="w-full" value="true">
                  Заблокированные
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

        <div className="mb-4 text-lg">
          {loading ? <Skeleton className="h-6 w-48" /> : `Найдено ${count} клиентов`}
        </div>

        <div className="space-y-4">
          {loading && !users.length && (
            <div className="grid gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <UserSkeleton key={idx} />
              ))}
            </div>
          )}
          <InfiniteScroll
            dataLength={users.length}
            next={nextPage}
            hasMore={users.length < count}
            scrollThreshold={0.5}
            loader={
              <div className="grid gap-4 mt-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <UserSkeleton key={idx} />
                ))}
              </div>
            }
          >
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className="overflow-hidden custom-card">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-col md:flex-row flex-grow gap-1 md:gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">ID:</span>
                          <span className="font-medium">{user.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Имя:</span>
                          <span className="font-medium">{user.first_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Username:</span>
                          <span className="font-medium">
                            {user.username ? (
                              <a
                                href={`https://t.me/${user.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-gray-400 underline"
                              >
                                @{user.username}
                              </a>
                            ) : (
                              '—'
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Заблокирован</span>
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
              ))}
            </div>
          </InfiniteScroll>
        </div>
      </div>
    </BotLayout>
  );
}
