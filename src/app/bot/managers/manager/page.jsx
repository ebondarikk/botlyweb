import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { createManager, updateManager, deleteManager, checkManagerUsername } from '@/lib/api';
import BotLayout from '@/app/bot/layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
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
import { useManager } from '@/hooks/use-manager';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Определяем схему валидации
export const ManagerSchema = z.object({
  username: z.string(),
  is_active: z.boolean(),
  name: z.string().optional(),
});

function getDefaultValues(manager) {
  if (!manager) {
    return { username: '', is_active: false, name: '' };
  }
  return {
    username: manager.username || '',
    is_active: manager.is_active || false,
    name: manager.first_name || '',
  };
}

// Функция для парсинга username
function parseUsername(rawUsername) {
  let username = rawUsername.trim();
  if (username.startsWith('https://t.me/')) {
    username = username.replace('https://t.me/', '');
  } else if (username.startsWith('@')) {
    username = username.substring(1);
  }
  return username;
}

export default function ManagerFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);

  const {
    manager: existingManager,
    setManager: setExistingManager,
    loading,
  } = useManager(params.bot_id, params.manager_id);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checking, setChecking] = useState(false);

  const isEditMode = !!existingManager;

  const defaultValues = getDefaultValues(existingManager);

  const form = useForm({
    defaultValues,
    resolver: zodResolver(ManagerSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (existingManager) {
      form.reset(getDefaultValues(existingManager));
    }
  }, [existingManager]);

  // Проверка username через бекенд
  const onCheckUsername = async () => {
    const rawUsername = form.getValues('username');
    if (!rawUsername) return;
    const parsedUsername = parseUsername(rawUsername);
    setChecking(true);
    try {
      const response = await checkManagerUsername(params.bot_id, parsedUsername);
      // Ожидается, что response содержит поле name
      form.setValue('name', response.first_name || '');
      setIsVerified(true);
      toast.success('Менеджер проверен');
    } catch (error) {
      setIsVerified(false);
      toast.error(error?.details?.errorMessage);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Сбрасываем верификацию при изменении username
    if (!isEditMode) {
      const subscription = form.watch((value, { name }) => {
        if (name === 'username') {
          setIsVerified(false);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [form, isEditMode]);

  // Обработка сабмита формы
  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        username: parseUsername(values.username),
      };
      if (isEditMode) {
        // При редактировании обновляется только статус активности
        await updateManager(params.bot_id, params.manager_id, { is_active: payload.is_active });
        toast.success('Менеджер обновлен успешно');
      } else {
        const response = await createManager(params.bot_id, payload);
        toast.success('Менеджер добавлен успешно');
        navigate(`/${params.bot_id}/managers/${response.id}`);
      }
    } catch (error) {
      toast.error(error?.details?.errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteManager(params.bot_id, params.manager_id);
      toast.success('Менеджер удален успешно');
      navigate(`/${params.bot_id}/managers`);
    } catch (error) {
      toast.error(error?.details?.errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <BotLayout>
      <div className="w-full px-4 md:px-8">
        <div className="flex items-center gap-4 py-6">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-muted/80"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {isEditMode ? 'Редактировать менеджера' : 'Добавить менеджера'}
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="max-w-2xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card className="custom-card border-border/50">
                  <CardContent className="space-y-8 p-6">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Username</FormLabel>
                          <FormControl>
                            <Input
                              className="h-11"
                              placeholder="@username или https://t.me/username"
                              {...field}
                              disabled={isEditMode}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!isEditMode && (
                      <div className="flex items-center gap-4">
                        <Button
                          type="button"
                          variant="default"
                          onClick={onCheckUsername}
                          disabled={checking || !form.getValues('username')}
                          className="min-w-[120px]"
                        >
                          {checking ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                              Проверка...
                            </>
                          ) : (
                            'Проверить'
                          )}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {isVerified ? (
                            <span className="text-primary">Менеджер проверен</span>
                          ) : (
                            'Менеджер должен быть пользователем магазина'
                          )}
                        </span>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Имя</FormLabel>
                          <FormControl>
                            <Input className="h-11" {...field} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-semibold">Активность</FormLabel>
                            <FormDescription className="text-sm text-muted-foreground">
                              Активные менеджеры принимают заказы
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              aria-label="Переключатель активности менеджера"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {isEditMode && existingManager?.is_admin && (
                      <div className="flex items-center gap-2 py-2">
                        <span className="text-sm font-medium text-primary bg-primary/10 rounded-full px-2 py-1">
                          Администратор
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Права администратора предоставлены
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <Button
                    type="submit"
                    disabled={saving || (!isEditMode && !isVerified)}
                    className="sm:px-12 h-11"
                  >
                    {saving && isEditMode && 'Сохранение...'}
                    {saving && !isEditMode && 'Создание...'}
                    {!saving && isEditMode && 'Сохранить'}
                    {!saving && !isEditMode && 'Добавить'}
                  </Button>

                  {isEditMode && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive/10 h-11"
                        >
                          Удалить менеджера
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Удаление менеджера</DialogTitle>
                          <DialogDescription className="pt-2">
                            Вы действительно хотите удалить данного менеджера? Это действие нельзя
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
                    </Dialog>
                  )}
                </div>
              </form>
            </Form>
          </div>
        )}
      </div>
    </BotLayout>
  );
}
