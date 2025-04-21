import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FolderOpen,
  FileText,
  Package,
  Save,
  Trash2,
  AlertTriangle,
  Hash,
  ListTodo,
} from 'lucide-react';
import { useCategory } from '@/hooks/use-category';
import { updateCategory, createCategory, deleteCategory } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import BotLayout from '@/app/bot/layout';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export const CategorySchema = z.object({
  name: z.string().min(3, 'Название должно содержать минимум 3 символа'),
  description: z.string().optional(),
});

function getDefaultValues(category) {
  if (!category) {
    return { name: '', description: '' };
  }
  return {
    name: category.name || '',
    description: category.description || '',
  };
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

export default function CategoryFormPage() {
  const params = useParams();
  const navigate = useNavigate();

  const {
    category: existingCategory,
    setCategory: setExistingCategory,
    loading,
  } = useCategory(params.bot_id, params.category_id);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const defaultValues = getDefaultValues(existingCategory);

  const form = useForm({
    defaultValues,
    resolver: zodResolver(CategorySchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (existingCategory) {
      form.reset(getDefaultValues(existingCategory));
    }
  }, [existingCategory]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      if (existingCategory) {
        const resp = await updateCategory(params.bot_id, params.category_id, values);
        toast.success('Категория успешно сохранена');
      } else {
        await createCategory(params.bot_id, values);
        toast.success('Категория успешно создана');
      }
      navigate(-1);
    } catch (error) {
      toast.error(error?.details?.errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteCategory(params.bot_id, params.category_id);
      toast.success('Категория успешно удалена');
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
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {existingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Заполните информацию о категории</p>
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
          <div className="max-w-2xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <AnimatePresence>
                  {existingCategory && (
                    <motion.div
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      custom={0}
                    >
                      <Card className="custom-card border-border/50 overflow-hidden">
                        <CardHeader className="border-b bg-muted/40 px-6">
                          <div className="flex items-center gap-2">
                            <ListTodo className="w-5 h-5 text-primary" />
                            <CardTitle className="text-base">Информация о категории</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                              <Hash className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <span className="text-sm text-muted-foreground">Порядок:</span>
                                <span className="text-sm font-medium ml-1">
                                  {existingCategory?.index}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <span className="text-sm text-muted-foreground">Товаров:</span>
                                <span className="text-sm font-medium ml-1">
                                  {existingCategory?.products_count}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1}>
                  <Card className="custom-card border-border/50 overflow-hidden">
                    <CardHeader className="border-b bg-muted/40 px-6">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-primary" />
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
                              <Input className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Описание</FormLabel>
                            <FormControl>
                              <Textarea className="min-h-[160px] resize-y" {...field} />
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

                  {!!existingCategory && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive h-11 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Удалить категорию
                        </Button>
                      </DialogTrigger>
                      {existingCategory.products_count === 0 ? (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-destructive" />
                              Удаление категории
                            </DialogTitle>
                            <DialogDescription className="pt-2">
                              Вы действительно хотите удалить эту категорию? Это действие нельзя
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
                      ) : (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-destructive" />
                              Удаление невозможно
                            </DialogTitle>
                            <DialogDescription className="pt-2">
                              Пока категория содержит товары, удалить её невозможно.
                              <p className="mt-2 text-muted-foreground">
                                Сначала переместите или удалите все товары из этой категории.
                              </p>
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={(e) => e.target.closest('dialog').close()}
                            >
                              Понятно
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      )}
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
