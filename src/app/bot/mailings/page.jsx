import * as React from 'react';
import { useEffect, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <Tabs value={publishedFilter} onValueChange={setPublishedFilter}>
              <TabsList className="w-full">
                <TabsTrigger value="">Все</TabsTrigger>
                <TabsTrigger value="false">Неопубликованные</TabsTrigger>
                <TabsTrigger value="true">Опубликованные</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="overflow-x-auto rounded-md relative">
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

        <div className="flex py-2 flex-col md:flex-row justify-between w-full">
          <div className="mb-4 text-lg">Найдено {count} рассылок</div>

          <Button asChild>
            <Link to="add" className="btn-primary">
              Добавить рассылку
            </Link>
          </Button>
        </div>

        {/* Карточки рассылок */}
        <div className="py-4">
          <InfiniteScroll
            dataLength={mailings.length}
            next={nextPage}
            hasMore={mailings.length < count}
            scrollThreshold={0.5}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            loader={<div className="col-span-full text-center p-4">Загрузка...</div>}
          >
            {mailings.map((mailing) => (
              <Link to={`/${bot.id}/mailings/${mailing.id}`} key={mailing.id}>
                <Card
                  key={mailing.id}
                  className="flex flex-col custom-card h-[320px] group transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50"
                >
                  <CardHeader
                    className={cn(
                      'flex-grow relative min-h-[200px] p-6 rounded-t-lg overflow-hidden',
                      mailing.preview_image
                        ? 'before:absolute before:inset-0 before:bg-gradient-to-b before:from-black/60 before:to-black/90 before:z-0'
                        : 'bg-muted/20',
                    )}
                  >
                    {mailing.preview_image && (
                      <div
                        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${mailing.preview_image})` }}
                      />
                    )}
                    <div className="relative z-1 h-full flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-auto">
                        <CardTitle
                          className={cn(
                            'text-lg font-semibold line-clamp-4 leading-snug',
                            mailing.preview_image
                              ? 'text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]'
                              : 'text-foreground',
                          )}
                        >
                          {mailing.content}
                        </CardTitle>
                        {mailing.published && (
                          <Badge variant="success" className="shadow-sm">
                            Опубликовано
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardFooter className="flex justify-between items-center pt-4 px-6 border-t border-border/40 bg-card">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted-foreground/70">Создано:</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatDate(mailing.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 text-right">
                      <span className="text-xs text-muted-foreground/70">Публикаций:</span>
                      <span className="text-sm font-medium text-foreground">
                        {mailing.publishes.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 text-right">
                      <span className="text-xs text-muted-foreground/70">
                        Последняя публикация:
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {formatDate(mailing.last_published_at)}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </InfiniteScroll>
        </div>
      </div>
    </BotLayout>
  );
}
