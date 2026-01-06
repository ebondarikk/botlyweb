import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';

function OptionCard({ option, onUpdate, onRemove }) {
  const handleFieldChange = (field, value) => {
    const updatedOption = {
      ...option,
      [field]: value,
    };
    
    // Преобразуем значения для отправки
    if (field === 'price') {
      updatedOption.price = value !== '' ? parseFloat(value) || 0 : null;
    } else if (field === 'max_count') {
      updatedOption.max_count = value ? parseInt(value) : null;
    }
    
    onUpdate(updatedOption);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-3">
        {/* Верхняя строка: название + кнопка удаления */}
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm truncate pr-2">{option.component.name}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        {/* Нижняя строка: поля настроек */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Цена */}
          <div>
            <Label htmlFor={`price-${option.id || option.component.id}`} className="text-xs text-muted-foreground">
              Цена
            </Label>
            <Input
              id={`price-${option.id || option.component.id}`}
              type="number"
              step="0.01"
              min="0"
              placeholder="Бесплатно"
              value={option.price !== null ? option.price : ''}
              onChange={(e) => handleFieldChange('price', e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </div>
          
          {/* Макс. количество */}
          {/* <div>
            <Label htmlFor={`max_count-${option.id || option.component.id}`} className="text-xs text-muted-foreground">
              Макс. кол-во
            </Label>
            <Input
              id={`max_count-${option.id || option.component.id}`}
              type="number"
              min="1"
              placeholder="∞"
              value={option.max_count || ''}
              onChange={(e) => handleFieldChange('max_count', e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </div> */}
          
          {/* Активность */}
          <div>
            <Label className="text-xs text-muted-foreground">Активна</Label>
            <div className="flex items-center mt-1 h-8">
              <Switch
                id={`active-${option.id || option.component.id}`}
                checked={option.is_active}
                onCheckedChange={(checked) => handleFieldChange('is_active', checked)}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function OptionsManager({
  value = [],
  onChange,
  availableComponents = [],
  onCreateComponent,
  loading = false,
  onLoadComponents,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Фильтрация компонентов - исключаем уже выбранные
  const filteredComponents = availableComponents.filter(
    (component) =>
      !value.some((option) => option.component.id === component.id) &&
      component.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Показывать ли опцию создания нового компонента
  const showCreateOption = searchValue.trim() && 
    !availableComponents.some(c => c.name.toLowerCase() === searchValue.toLowerCase());

  const handleSelectComponent = (component) => {
    const newOption = {
      component: component,
      price: null,
      max_count: null,
      is_active: true,
    };
    onChange([...value, newOption]);
    setSearchValue('');
    setOpen(false);
  };

  const handleCreateAndSelect = async () => {
    if (!searchValue.trim() || !onCreateComponent) return;
    
    try {
      const newComponent = await onCreateComponent(searchValue.trim());
      handleSelectComponent(newComponent);
    } catch (error) {
      toast.error('Ошибка при создании компонента');
    }
  };

  const handleUpdateOption = (updatedOption) => {
    const newValue = value.map((option) =>
      option.component.id === updatedOption.component.id ? updatedOption : option
    );
    onChange(newValue);
  };

  const handleRemoveOption = (componentId) => {
    const newValue = value.filter((option) => option.component.id !== componentId);
    onChange(newValue);
  };

  const handleOpen = () => {
    setOpen(true);
    if (onLoadComponents) {
      onLoadComponents();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Список выбранных опций */}
      <AnimatePresence>
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {value.map((option) => (
              <OptionCard
                key={option.id || option.component.id}
                option={option}
                onUpdate={handleUpdateOption}
                onRemove={() => handleRemoveOption(option.component.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Селектор для добавления опций */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start h-11 cursor-pointer hover:bg-background hover:text-white"
            onClick={handleOpen}
            disabled={loading}
          >
            <Plus className="mr-2 h-4 w-4" />
            {loading ? 'Загрузка...' : 'Добавить опцию...'}
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
                  {filteredComponents.map((component) => (
                    <CommandItem
                      key={component.id}
                      value={component.name}
                      onSelect={() => handleSelectComponent(component)}
                      className="hover:bg-background/20 selected:bg-background/20 hover:text-white aria-selected:bg-background/20 aria-selected:text-white"
                    >
                      {component.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Информация о выбранных опциях */}
      {value.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Добавлено опций: {value.length}
        </div>
      )}
    </div>
  );
}
