import * as React from 'react';
import { useEffect, useState } from 'react';
import { SearchIcon, GripVertical, Plus, Tag as TagIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTags } from '@/hooks/use-tags';
import { useBot } from '@/context/BotContext';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BotLayout from '@/app/bot/layout';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function TagSkeleton() {
  return (
    <Card className="overflow-hidden custom-card border-border/50">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative pr-8">
          <div className="w-full sm:w-auto flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full bg-muted/50" />
            <Skeleton className="h-6 w-32 bg-muted/50" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 bg-muted/50" />
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Skeleton className="h-6 w-6 rounded bg-muted/50" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableTagCard({ tag, botId }) {
  return (
    <Card className="overflow-hidden custom-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:bg-card/70">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Link
            to={`/${botId}/tags/${tag.id}`}
            className="flex-grow flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <div className="w-full sm:w-auto flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-border shadow-md transition-all duration-200 hover:scale-105"
                style={{ backgroundColor: tag.color }}
                title={tag.color}
              >
                <TagIcon className="w-5 h-5 text-white drop-shadow" />
              </span>
              <span className="text-lg font-medium group-hover:text-primary transition-colors">
                {tag.name}
              </span>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TagsList() {
  const { bot } = useBot();
  const { tags, search, setSearch, count, loading } = useTags(bot?.id);

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
          <div className="text-lg font-medium">
            {loading ? <Skeleton className="h-6 w-48 bg-muted/50" /> : `Найдено ${count} ярлыков`}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    asChild
                    className="transition-all duration-200 bg-primary hover:bg-primary/90"
                  >
                    <Link to="add" className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Добавить ярлык
                    </Link>
                  </Button>
                </div>
              </TooltipTrigger>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        <div className="space-y-4">
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
              className="grid gap-4"
            >
              {Array.from({ length: 8 }).map((_, idx) => (
                <motion.div
                  key={`skeleton-tag-${idx}`}
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
                  <TagSkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {tags.map((tag) => (
                <SortableTagCard key={tag.id} tag={tag} botId={bot?.id} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </BotLayout>
  );
}
