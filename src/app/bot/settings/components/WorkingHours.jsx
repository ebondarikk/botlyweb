import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Clock, Save, Plus, Trash2, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-hot-toast';
import { getScheduleSettings, updateScheduleSettings } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Понедельник' },
  { key: 'tuesday', label: 'Вторник' },
  { key: 'wednesday', label: 'Среда' },
  { key: 'thursday', label: 'Четверг' },
  { key: 'friday', label: 'Пятница' },
  { key: 'saturday', label: 'Суббота' },
  { key: 'sunday', label: 'Воскресенье' },
];

// Компонент выбора времени
const TimePicker = ({ value, onChange, placeholder, min, max, disabled }) => {
  return (
    <Input
      type="time"
      step="900"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      disabled={disabled}
      className="w-20 sm:w-24 text-center appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
    />
  );
};

// Компонент диапазона времени
const TimeRange = ({ range, onChange, onRemove, canRemove, prevRanges, isValid }) => {
  const handleFromChange = (from) => {
    onChange({ ...range, from });
  };

  const handleToChange = (to) => {
    onChange({ ...range, to });
  };

  // Вычисляем минимальное время для начала (после окончания предыдущего диапазона)
  const minFromTime = prevRanges.length > 0 
    ? getNextTime(prevRanges[prevRanges.length - 1].to) 
    : '00:00';

  // Минимальное время окончания (после начала текущего диапазона)
  const minToTime = range.from ? getNextTime(range.from) : '00:01';

  // Проверяем валидность диапазона
  const isRangeValid = range.from && range.to && range.from < range.to;
  const hasTimeConflict = !isValid;

  return (
    <div
      className={`p-3 border rounded-lg ${
        hasTimeConflict ? 'border-destructive bg-destructive/5' : 'bg-muted/30'
      }`}
    >
      {/* Основная строка с временем */}
      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">с</Label>
          <TimePicker
            value={range.from}
            onChange={handleFromChange}
            placeholder="00:00"
            min={minFromTime}
            max="23:45"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">по</Label>
          <TimePicker
            value={range.to}
            onChange={handleToChange}
            placeholder="23:59"
            min={minToTime}
            max="23:59"
            disabled={!range.from}
          />
        </div>
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-destructive hover:bg-destructive/10 hover:text-destructive sm:ml-auto"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* Сообщение об ошибке */}
      {hasTimeConflict && (
        <div className="mt-2 text-xs text-destructive">
          Некорректное время
        </div>
      )}
    </div>
  );
};

// Компонент дня недели
const DaySchedule = ({ day, schedule, onChange, onCopyFrom }) => {
  // Валидация диапазонов времени
  const validateRanges = (ranges) => {
    const validationResults = ranges.map((range, index) => {
      if (!range.from || !range.to) return false;
      if (range.from >= range.to) return false;
      
      // Проверяем пересечения с предыдущими диапазонами
      for (let i = 0; i < index; i++) {
        const prevRange = ranges[i];
        if (!prevRange.from || !prevRange.to) continue;
        if (range.from < prevRange.to) return false;
      }
      
      return true;
    });
    
    return validationResults;
  };

  const addTimeRange = () => {
    const lastRange = schedule.schedule[schedule.schedule.length - 1];
    const newFrom = lastRange && lastRange.to !== '23:59' 
      ? getNextTime(lastRange.to) 
      : '09:00';
    
    const newTo = newFrom === '23:45' ? '23:59' : getNextTime(newFrom, 60); // +1 час по умолчанию
    const newRange = { from: newFrom, to: newTo };
    
    onChange({
      ...schedule,
      schedule: [...schedule.schedule, newRange],
    });
  };

  const removeTimeRange = (index) => {
    const newSchedule = schedule.schedule.filter((_, i) => i !== index);
    onChange({
      ...schedule,
      schedule: newSchedule,
    });
  };

  const updateTimeRange = (index, newRange) => {
    const newSchedule = [...schedule.schedule];
    newSchedule[index] = newRange;
    onChange({
      ...schedule,
      schedule: newSchedule,
    });
  };

  const canAddRange = () => {
    if (!schedule.is_working || schedule.schedule.length === 0) return true;
    const lastRange = schedule.schedule[schedule.schedule.length - 1];
    if (!lastRange.to) return false;
    return lastRange.to !== '23:59';
  };

  const validationResults = validateRanges(schedule.schedule);
  const hasValidSchedule = schedule.schedule.length > 0 && validationResults.every(Boolean);

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3">
          <Switch
            checked={schedule.is_working}
            onCheckedChange={(checked) =>
              onChange({
                ...schedule,
                is_working: checked,
                schedule: checked && schedule.schedule.length === 0 
                  ? [{ from: '09:00', to: '18:00' }] 
                  : schedule.schedule,
              })
            }
          />
          <Label className="font-medium">{day.label}</Label>
        </div>
        {schedule.is_working && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                <Copy className="w-3 h-3 mr-1" />
                Копировать
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Скопировать расписание на:
                </Label>
                {DAYS_OF_WEEK.filter(d => d.key !== day.key).map((targetDay) => (
                  <button
                    key={targetDay.key}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded"
                    onClick={() => onCopyFrom(day.key, targetDay.key)}
                  >
                    {targetDay.label}
                  </button>
                ))}
                <hr className="my-1" />
                {/* <button
                  className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded"
                  onClick={() => {
                    DAYS_OF_WEEK.filter(d => d.key !== day.key).forEach(targetDay => {
                      onCopyFrom(day.key, targetDay.key);
                    });
                  }}
                >
                  Все остальные дни
                </button> */}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {schedule.is_working && (
        <div className="space-y-3">
          {schedule.schedule.map((range, index) => (
            <TimeRange
              key={index}
              range={range}
              onChange={(newRange) => updateTimeRange(index, newRange)}
              onRemove={() => removeTimeRange(index)}
              canRemove={schedule.schedule.length > 1}
              prevRanges={schedule.schedule.slice(0, index)}
              isValid={validationResults[index]}
            />
          ))}
          
          {canAddRange() && (
            <Button
              variant="outline"
              size="sm"
              onClick={addTimeRange}
              className="w-full"
              disabled={!hasValidSchedule && schedule.schedule.length > 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить период
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Утилита для получения следующего времени с заданным интервалом
const getNextTime = (timeString, addMinutes = 15) => {
  if (!timeString) return '00:00';
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + addMinutes;
  
  if (totalMinutes >= 24 * 60) return '23:59';
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
};

// Валидация расписания
const validateSchedule = (scheduleData) => {
  let isValid = true;

  Object.entries(scheduleData.schedule).forEach(([day, daySchedule]) => {
    if (!daySchedule.is_working) return;

    const ranges = daySchedule.schedule;
    if (ranges.length === 0) {
      isValid = false;
      return;
    }

    // Проверяем каждый диапазон
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      
      if (!range.from || !range.to) {
        isValid = false;
        return;
      }

      // Проверяем что время окончания больше времени начала
      if (range.from >= range.to) {
        isValid = false;
        return;
      }

      // Проверяем пересечения с предыдущими диапазонами
      for (let j = 0; j < i; j++) {
        const prevRange = ranges[j];
        if (!prevRange.from || !prevRange.to) continue;
        if (range.from < prevRange.to) {
          isValid = false;
          return;
        }
      }
    }
  });

  return isValid;
};

export default function WorkingHours({
  bot,
  openAccordion,
  setOpenAccordion,
}) {
  const [scheduleData, setScheduleData] = useState({
    is_active: false,
    schedule: DAYS_OF_WEEK.reduce((acc, day) => ({
      ...acc,
      [day.key]: {
        is_working: false,
        schedule: [],
      },
    }), {}),
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchScheduleSettings = async () => {
    try {
      setInitialLoading(true);
      const data = await getScheduleSettings(bot.id);
      setScheduleData(data);
    } catch (error) {
      toast.error('Ошибка при загрузке настроек расписания');
      console.error('Error fetching schedule:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (bot) {
      fetchScheduleSettings();
    }
  }, [bot]);

  const handleSaveSchedule = async () => {
    setLoading(true);
    try {
      await updateScheduleSettings(bot.id, scheduleData);
      toast.success('Расписание работы сохранено');
    } catch (error) {
      toast.error('Ошибка при сохранении расписания');
      console.error('Error saving schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Проверяем общую валидность расписания
  const isScheduleValid = validateSchedule(scheduleData);

  const handleDayScheduleChange = (dayKey, newSchedule) => {
    setScheduleData({
      ...scheduleData,
      schedule: {
        ...scheduleData.schedule,
        [dayKey]: newSchedule,
      },
    });
  };

  const handleCopySchedule = (fromDay, toDay) => {
    const fromSchedule = scheduleData.schedule[fromDay];
    setScheduleData({
      ...scheduleData,
      schedule: {
        ...scheduleData.schedule,
        [toDay]: {
          ...fromSchedule,
          schedule: [...fromSchedule.schedule],
        },
      },
    });
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  // Компонент скелетона для загрузки
  const WorkingHoursSkeleton = () => (
    <motion.div variants={itemVariants} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm mb-6 custom-card overflow-hidden">
        <div className="flex justify-between w-full px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h2 className="text-lg font-medium">Режим работы</h2>
              <p className="text-sm text-muted-foreground">
                Настройте часы работы бота по дням недели
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between py-4 px-4 bg-muted/50 rounded-lg h-[60px]">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
          
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.key} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-11 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-6 border-t">
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Показываем скелетон во время начальной загрузки
  if (initialLoading) {
    return <WorkingHoursSkeleton />;
  }

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Accordion
        type="single"
        collapsible
        value={openAccordion}
        onValueChange={setOpenAccordion}
        className="rounded-xl border bg-card text-card-foreground shadow-sm mb-6 custom-card overflow-hidden"
      >
        <AccordionItem value="working-hours" className="border-none">
          <AccordionTrigger className="flex justify-between w-full px-6 py-0 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4 py-6">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-lg font-medium">Режим работы</h2>
                <p className="text-sm text-muted-foreground">
                  Настройте часы работы бота по дням недели
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-6 space-y-6">
              {/* Переключатель активации режима работы */}
              <div className="flex items-center justify-between py-4 px-4 bg-muted/50 rounded-lg h-[60px]">
                <Label className="font-medium">Активировать режим работы</Label>
                <Switch
                  checked={scheduleData.is_active}
                  onCheckedChange={(checked) =>
                    setScheduleData({ ...scheduleData, is_active: checked })
                  }
                />
              </div>

              {scheduleData.is_active && (
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map((day) => (
                    <DaySchedule
                      key={day.key}
                      day={day}
                      schedule={scheduleData.schedule[day.key]}
                      onChange={(newSchedule) => handleDayScheduleChange(day.key, newSchedule)}
                      onCopyFrom={handleCopySchedule}
                    />
                  ))}
                </div>
              )}

              {/* Кнопка сохранения */}
              <div className="pt-6 border-t">
                <Button
                  onClick={handleSaveSchedule}
                  disabled={loading || (scheduleData.is_active && !isScheduleValid)}
                  className="h-11 px-8 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </Button>
                {scheduleData.is_active && !isScheduleValid && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Исправьте ошибки в расписании для сохранения
                  </p>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
}
