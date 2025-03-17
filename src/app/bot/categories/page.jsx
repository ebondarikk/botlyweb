import * as React from 'react';
import { useEffect, useState } from 'react';
import { SearchIcon, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
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

function CategorySkeleton() {
  return (
    <Card className="overflow-hidden custom-card">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative pr-8">
          <div className="w-full sm:w-auto">
            <Skeleton className="h-6 w-48 bg-gray-200" />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 bg-gray-200" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24 bg-gray-200" />
            </div>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Skeleton className="h-6 w-6 rounded bg-gray-200" />
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
      className={`overflow-hidden custom-card ${isDragging ? 'shadow-lg' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/${botId}/categories/${category.id}`}
            className="flex-grow flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <div className="w-full sm:w-auto">
              <span className="text-lg font-medium">{category.name}</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Порядок:</span>
                <span className="font-medium">{category.index}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Товаров:</span>
                <span className="font-medium">{category.products_count}</span>
              </div>
            </div>
          </Link>
          {!disabled && (
            <button
              type="button"
              className="flex-shrink-0"
              aria-label="Перетащить категорию"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-6 w-6 text-gray-400 cursor-grab" />
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
      setItems(categories); // Восстанавливаем предыдущий порядок в случае ошибки
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <BotLayout>
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="search"
              type="search"
              value={search}
              placeholder="Поиск..."
              className="pl-10"
              onChange={(event) => setSearch(event.target.value)}
              disabled={isReordering}
            />
          </div>
        </div>

        <div className="flex py-4 flex-col md:flex-row justify-between w-full">
          <div className="mb-4 text-lg">
            {loading ? <Skeleton className="h-6 w-48 bg-gray-200" /> : `Найдено ${count} категорий`}
          </div>

          <Button asChild disabled={isReordering}>
            <Link to="add" className="btn-primary">
              Добавить категорию
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <CategorySkeleton key={`skeleton-${idx}`} />
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[]}
            >
              <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <div className="grid gap-4">
                  {items.map((category) => (
                    <SortableCard
                      key={category.id}
                      category={category}
                      botId={bot?.id}
                      disabled={!!search}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </BotLayout>
  );
}
