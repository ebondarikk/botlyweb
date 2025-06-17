import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Tag as TagIcon,
  Save,
  Trash2,
  AlertTriangle,
  Hash,
  Palette,
} from 'lucide-react';
import { useTag } from '@/hooks/use-tag';
import { updateTag, createTag, deleteTag } from '@/lib/api';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import BotLayout from '@/app/bot/layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { HexColorPicker } from 'react-colorful';

const PRESET_COLORS = [
  '#ef4444', // красный
  '#22c55e', // зеленый
  '#eab308', // желтый
  '#3b82f6', // синий
  '#f97316', // оранжевый
];

export const TagSchema = z.object({
  name: z.string().min(1, 'Введите название').max(15, 'До 15 символов'),
  color: z
    .string()
    .min(1, 'Выберите цвет')
    .regex(/^#([0-9a-fA-F]{6})$/, 'Введите корректный hex-код цвета'),
});

function getDefaultValues(tag) {
  if (!tag) {
    return { name: '', color: PRESET_COLORS[0] };
  }
  return {
    name: tag.name || '',
    color: tag.color || PRESET_COLORS[0],
  };
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function ColorPalette({ value, onChange }) {
  const isPreset = PRESET_COLORS.includes(value);
  return (
    <div className="w-full">
      <div className="bg-muted/40 rounded-xl p-4 flex flex-col items-center gap-4 border border-border/50">
        <div className="flex gap-2 flex-wrap justify-center mb-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                value === color ? 'border-primary ring-2 ring-primary/30' : 'border-border'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Выбрать цвет ${color}`}
              onClick={() => onChange(color)}
            >
              {value === color && <Palette className="w-4 h-4 text-primary" />}
            </button>
          ))}
          {!isPreset && (
            <button
              key={value}
              type="button"
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 border-primary ring-2 ring-primary/30"
              style={{ backgroundColor: value }}
              aria-label={`Выбранный цвет ${value}`}
              onClick={() => onChange(value)}
            >
              <Palette className="w-4 h-4 text-primary" />
            </button>
          )}
        </div>
        <HexColorPicker color={value} onChange={onChange} className="mb-2" />
        <div className="relative w-full max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground select-none">
            #
          </span>
          <input
            type="text"
            value={value.replace(/^#/, '')}
            onChange={(e) =>
              onChange(`#${e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)}`)
            }
            maxLength={6}
            placeholder="000000"
            className="pl-7 pr-2 h-11 w-full border rounded-lg border-muted bg-background text-base placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            style={{ letterSpacing: '0.05em' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function TagFormPage() {
  const params = useParams();
  const navigate = useNavigate();

  const {
    tag: existingTag,
    setTag: setExistingTag,
    loading,
  } = useTag(params.bot_id, params.tag_id);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const defaultValues = getDefaultValues(existingTag);

  const form = useForm({
    defaultValues,
    resolver: zodResolver(TagSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (existingTag) {
      form.reset(getDefaultValues(existingTag));
    }
  }, [existingTag]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      if (existingTag) {
        await updateTag(params.bot_id, params.tag_id, values);
        toast.success('Ярлык успешно сохранен');
      } else {
        await createTag(params.bot_id, values);
        toast.success('Ярлык успешно создан');
      }
      navigate(-1);
    } catch (error) {
      toast.error(error?.details?.errorMessage || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteTag(params.bot_id, params.tag_id);
      toast.success('Ярлык успешно удален');
      navigate(-1);
    } catch (error) {
      toast.error('Ошибка при удалении');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <BotLayout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full px-4 md:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 py-6"
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => navigate(`/${params.bot_id}/tags`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {existingTag ? 'Редактировать ярлык' : 'Добавить ярлык'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Заполните информацию о ярлыке</p>
          </div>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-8"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </motion.div>
        ) : (
          <div className="max-w-xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <AnimatePresence>
                  {existingTag && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="custom-card border-border/50 overflow-hidden mb-4">
                        <CardHeader className="border-b bg-muted/40 px-6">
                          <div className="flex items-center gap-2">
                            <TagIcon className="w-5 h-5 text-primary" />
                            <CardTitle className="text-base">Информация о ярлыке</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                            <span
                              className="inline-block w-6 h-6 rounded-full border border-border shadow"
                              style={{ backgroundColor: existingTag?.color }}
                              title={existingTag?.color}
                            />
                            <div>
                              <span className="text-sm text-muted-foreground">Цвет:</span>
                              <span className="text-sm font-medium ml-1">{existingTag?.color}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="custom-card border-border/50 overflow-hidden">
                    <CardHeader className="border-b bg-muted/40 px-6">
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base">Основная информация</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Название</FormLabel>
                            <FormControl>
                              <Input className="h-11" maxLength={15} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Цвет</FormLabel>
                            <FormControl>
                              <ColorPalette value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col sm:flex-row justify-between gap-4 pt-2"
                >
                  <Button
                    type="submit"
                    disabled={saving}
                    className="sm:px-12 h-11 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Button>

                  {!!existingTag && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive h-11 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Удалить ярлык
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Удаление ярлыка
                          </DialogTitle>
                          <DialogDescription className="pt-2">
                            Вы действительно хотите удалить этот ярлык? Это действие нельзя
                            отменить.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={(e) => e.target.closest('dialog').close()}
                          >
                            Отмена
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={onDelete}
                            disabled={deleting}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            {deleting ? 'Удаление...' : 'Удалить'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </motion.div>
              </form>
            </Form>
          </div>
        )}
      </motion.div>
    </BotLayout>
  );
}
