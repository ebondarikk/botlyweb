import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
      // navigate(-1);
    } catch (error) {
      toast.error('Ошибка при сохранении');
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
      <div className="w-full">
        <Card className="custom-card border-none shadow-none">
          <CardHeader className="flex flex-row items-center gap-4 px-8 pt-6 pb-8">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted/80"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-2xl font-semibold">
              {existingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-8">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}

            {!loading && (
              <div className="max-w-2xl">
                {existingCategory && (
                  <div className="bg-card rounded-xl border p-6 mb-8 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Порядок:</span>
                      <span className="text-sm font-medium">{existingCategory?.index}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Количество товаров:</span>
                      <span className="text-sm font-medium">
                        {existingCategory?.products_count}
                      </span>
                    </div>
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="bg-card rounded-xl border space-y-8">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold mb-3 block">
                              Название
                            </FormLabel>
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
                            <FormLabel className="text-base font-semibold mb-3 block">
                              Описание
                            </FormLabel>
                            <FormControl>
                              <Textarea className="min-h-[160px] resize-y" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
                      <Button type="submit" disabled={saving} className="sm:px-12 h-11">
                        {saving ? 'Сохранение...' : 'Сохранить'}
                      </Button>

                      {!!existingCategory && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive/10 h-11"
                            >
                              Удалить категорию
                            </Button>
                          </DialogTrigger>
                          {existingCategory.products_count === 0 ? (
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Удаление категории</DialogTitle>
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
                                >
                                  {deleting ? 'Удаление...' : 'Удалить'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          ) : (
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Удаление невозможно</DialogTitle>
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
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BotLayout>
  );
}
