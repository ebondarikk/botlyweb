import * as React from 'react';
import { useEffect, useState } from 'react';
import { SearchIcon, GripVertical, Plus, Folder, Package } from 'lucide-react';
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
import { useCategories } from '@/hooks/use-categories';
import { useBot } from '@/context/BotContext';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BotLayout from '@/app/bot/layout';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function CategorySkeleton() {
  return (
    <Card className="overflow-hidden custom-card border-border/50">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative pr-8">
          <div className="w-full sm:w-auto">
            <Skeleton className="h-6 w-48 bg-muted/50" />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 bg-muted/50" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24 bg-muted/50" />
            </div>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Skeleton className="h-6 w-6 rounded bg-muted/50" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableCard({ category, botId, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    animateLayoutChanges: () => false,
  });

  const style = {
    transform: CSS.Transform.toString(
      transform && {
        x: 0,
        y: transform.y,
        scaleX: 1,
        scaleY: 1,
      },
    ),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.8 : 1,
    cursor: disabled ? 'default' : 'grab',
    touchAction: 'none',
    willChange: 'transform',
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden custom-card border-border/50 hover:border-primary/50 transition-all duration-300
        ${isDragging ? 'shadow-lg ring-2 ring-primary/20' : 'hover:bg-card/70'}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Link
            to={`/${botId}/categories/${category.id}`}
            className="flex-grow flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <div className="w-full sm:w-auto flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/5">
                <Folder className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-medium group-hover:text-primary transition-colors">
                {category.name}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted">
                <span className="text-sm text-muted-foreground">Порядок:</span>
                <span className="font-medium text-foreground">{category.index}</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{category.products_count}</span>
              </div>
            </div>
          </Link>
          {!disabled && (
            <button
              type="button"
              className="flex-shrink-0 p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Перетащить категорию"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CategoriesList() {
  const { bot } = useBot();
  const { categories, search, setSearch, count, nextPage, loading, reorderCategories } =
    useCategories(bot?.id);
  const [isReordering, setIsReordering] = useState(false);

  const [items, setItems] = useState(categories);

  useEffect(() => {
    setItems(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 1,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      index: idx + 1,
    }));

    setItems(newItems);
    setIsReordering(true);

    try {
      await reorderCategories(newItems.map(({ id, index }) => ({ id, index })));
    } catch (error) {
      console.error('Ошибка при изменении порядка:', error);
      setItems(categories);
    } finally {
      setIsReordering(false);
    }
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
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              id="search"
              type="search"
              value={search}
              placeholder="Поиск..."
              className="pl-10 bg-muted/50 border-none"
              onChange={(event) => setSearch(event.target.value)}
              disabled={isReordering}
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
            {loading ? <Skeleton className="h-6 w-48 bg-muted/50" /> : `Найдено ${count} категорий`}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    asChild
                    disabled={
                      (bot?.categories_limit !== null && bot?.categories_limit <= 0) || isReordering
                    }
                    className={`transition-all duration-200 ${
                      (bot?.categories_limit !== null && bot?.categories_limit <= 0) || isReordering
                        ? 'bg-muted cursor-not-allowed opacity-60'
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                  >
                    <Link
                      to={
                        bot?.categories_limit !== null && bot?.categories_limit <= 0 ? '#' : 'add'
                      }
                      className="flex items-center gap-2"
                      onClick={(e) => {
                        if (bot?.categories_limit !== null && bot?.categories_limit <= 0) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Добавить категорию
                    </Link>
                  </Button>
                </div>
              </TooltipTrigger>
              {bot?.categories_limit !== null && bot?.categories_limit <= 0 && (
                <TooltipContent>
                  <p>
                    Лимит категорий исчерпан. Для добавления новых категорий необходимо повысить
                    тариф.
                  </p>
                </TooltipContent>
              )}
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
                  <CategorySkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[]}
            >
              <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <AnimatePresence>
                  <motion.div
                    className="grid gap-4"
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
                  >
                    {items.map((category) => (
                      <motion.div
                        key={category.id}
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
                        <SortableCard category={category} botId={bot?.id} disabled={!!search} />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </motion.div>
    </BotLayout>
  );
}
