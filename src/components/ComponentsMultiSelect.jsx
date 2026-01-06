import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, X, GripVertical, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';

function SortableComponentItem({ component, onRemove, onToggleRemovable, dragOverlay }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.component_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || dragOverlay ? 0.8 : 1,
    zIndex: isDragging || dragOverlay ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 bg-background/30 border border-border rounded-md transition-all hover:bg-muted/50 text-sm",
        isDragging && "shadow-lg bg-background border-primary/50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-primary transition-colors touch-none"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      
      <span className="font-medium truncate max-w-[120px]">{component.name}</span>
      
      <div className="flex items-center gap-1.5 shrink-0">
        <Switch
          id={`removable-${component.component_id}`}
          checked={component.is_removable}
          onCheckedChange={onToggleRemovable}
          size="sm"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {component.is_removable ? 'Удаляемый' : 'Обязательный'}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-1"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function ComponentsMultiSelect({
  value = [],
  onChange,
  availableComponents = [],
  onCreateComponent,
  loading = false,
  onOpen,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [activeDragComponent, setActiveDragComponent] = useState(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Фильтрация и сортировка компонентов
  const filteredComponents = availableComponents
    .filter((component) =>
      component.name.toLowerCase().includes(searchValue.toLowerCase())
    )
    .sort((a, b) => {
      const aSelected = value.some((selected) => selected.component_id === a.id);
      const bSelected = value.some((selected) => selected.component_id === b.id);
      
      // Выбранные компоненты в конец списка
      if (aSelected && !bSelected) return 1;
      if (!aSelected && bSelected) return -1;
      
      // Остальные по алфавиту
      return a.name.localeCompare(b.name);
    });

  // Показывать ли опцию создания нового компонента
  const showCreateOption = searchValue.trim() && 
    !availableComponents.some(c => c.name.toLowerCase() === searchValue.toLowerCase());

  const handleToggleComponent = (component) => {
    const isSelected = value.some((selected) => selected.component_id === component.id);
    
    if (isSelected) {
      // Убираем компонент из выбранных
      const newValue = value.filter((selected) => selected.component_id !== component.id);
      // Обновляем индексы
      const updatedValue = newValue.map((item, i) => ({ ...item, index: i }));
      onChange(updatedValue);
    } else {
      // Добавляем компонент к выбранным
      const newComponent = {
        // Не добавляем id для новых компонентов - он будет создан на бэкенде
        component_id: component.id,
        index: value.length,
        is_removable: true,
        name: component.name,
      };
      onChange([...value, newComponent]);
    }
    
    setSearchValue('');
    // Не закрываем dropdown, оставляем открытым для выбора следующего компонента
  };

  const handleCreateAndSelect = async () => {
    if (!searchValue.trim() || !onCreateComponent) return;
    
    try {
      const newComponent = await onCreateComponent(searchValue.trim());
      handleToggleComponent(newComponent);
    } catch (error) {
      toast.error('Ошибка при создании компонента');
    }
  };

  const handleRemoveComponent = (index) => {
    const newValue = value.filter((_, i) => i !== index);
    // Обновляем индексы
    const updatedValue = newValue.map((item, i) => ({ ...item, index: i }));
    onChange(updatedValue);
  };

  const handleToggleRemovable = (index) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], is_removable: !newValue[index].is_removable };
    onChange(newValue);
  };

  // Drag and drop handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const component = value.find((c) => c.component_id === active.id);
    setActiveDragComponent(component);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragComponent(null);

    if (!over || active.id === over.id) return;

    const oldIndex = value.findIndex((c) => c.component_id === active.id);
    const newIndex = value.findIndex((c) => c.component_id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newValue = arrayMove(value, oldIndex, newIndex);
      // Обновляем индексы после перестановки
      const updatedValue = newValue.map((item, i) => ({ ...item, index: i }));
      onChange(updatedValue);
    }
  };

  const handleDragCancel = () => {
    setActiveDragComponent(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Выбранные компоненты */}
      {value.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={value.map((c) => c.component_id)}
            strategy={rectSortingStrategy}
          >
            <div className="flex flex-wrap gap-2">
              {value.map((component, index) => (
                <SortableComponentItem
                  key={component.component_id}
                  component={component}
                  onRemove={() => handleRemoveComponent(index)}
                  onToggleRemovable={() => handleToggleRemovable(index)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeDragComponent ? (
              <SortableComponentItem
                component={activeDragComponent}
                dragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Селектор для добавления компонентов */}
      <Popover open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen && onOpen) {
          onOpen();
        }
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 cursor-pointer hover:bg-background hover:text-white"
            disabled={loading}
          >
            {loading ? 'Загрузка...' : 'Добавить компонент...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[90vw] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Поиск или создание компонента..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Загрузка...' : 'Введите название компонента чтобы создать'}
              </CommandEmpty>
              
              {/* Опция создания нового компонента */}
              {showCreateOption && onCreateComponent && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateAndSelect}
                    className="text-primary hover:bg-primary/20 hover:text-white aria-selected:bg-primary/20 aria-selected:text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Создать "{searchValue}"
                  </CommandItem>
                </CommandGroup>
              )}
              
              {/* Существующие компоненты */}
              {filteredComponents.length > 0 && (
                <CommandGroup>
                  {filteredComponents.map((component) => {
                    const isSelected = value.some((c) => c.component_id === component.id);
                    return (
                      <CommandItem
                        key={component.id}
                        value={component.name}
                        onSelect={() => handleToggleComponent(component)}
                        className={cn(
                          "hover:bg-background/20 selected:bg-background/20 hover:text-white aria-selected:bg-background/20 aria-selected:text-white",
                          isSelected && "opacity-60"
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {component.name}
                        {isSelected && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            Выбран
                          </span>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Информация о выбранных компонентах */}
      {value.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Выбрано компонентов: {value.length}
        </div>
      )}
    </div>
  );
}
