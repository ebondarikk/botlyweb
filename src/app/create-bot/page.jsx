/* eslint-disable no-undef */
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, LogOut, HelpCircle, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { validateBotToken, createBot } from '@/lib/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';

const botSchema = z.object({
  token: z.string().min(1, 'Введите токен бота'),
  name: z.string().min(1, 'Введите название'),
  currency: z.string().min(1, 'Выберите валюту'),
  welcomeMessage: z.string().min(1, 'Введите приветственное сообщение'),
});

export default function CreateBot() {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState('');

  const form = useForm({
    resolver: zodResolver(botSchema),
    defaultValues: {
      token: '',
      name: '',
      currency: 'RUB',
      welcomeMessage:
        'Добро пожаловать в наш магазин! Нажмите на кнопку ниже, чтобы посмотреть меню и сделать заказ',
    },
  });

  const handleLogout = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token');
    }
    window.location.href = '/';
  }, []);

  const validateToken = async () => {
    setIsValidating(true);
    setValidationError('');

    try {
      setIsValidated(false);
      setValidationError('');
      const data = await validateBotToken(form.getValues('token'));

      setIsValidated(true);
      form.setValue('name', data.full_name);
      form.setValue('username', data.username);
    } catch (error) {
      console.error(error);
      setValidationError(error.details?.errorMessage || 'Ошибка валидации токена');
    } finally {
      setIsValidating(false);
    }
  };

  const onSubmit = async (values) => {
    try {
      const response = await createBot({
        token: values.token,
        name: values.name,
        currency: values.currency,
        welcome_text: values.welcomeMessage,
      });
      toast.success('Магазин успешно создан');
      navigate(`/${response.id}`);
    } catch (error) {
      console.error(error);
      toast.error(error.details?.errorMessage || 'Ошибка при создании магазина');
    }
  };

  const openBotFather = () => {
    window.open('https://t.me/BotFather', '_blank');
  };

  // Расчет прогресса
  const getProgress = () => {
    if (!form.getValues('token')) return 0;
    if (!isValidated) return 25;
    if (!form.getValues('name') || !form.getValues('welcomeMessage')) return 50;
    return 100;
  };

  const getStepText = () => {
    if (!form.getValues('token')) return 'Шаг 1 из 3: Получите токен бота';
    if (!isValidated) return 'Шаг 2 из 3: Проверьте токен';
    return 'Шаг 3 из 3: Настройте магазин';
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="w-full px-4 md:px-8">
        <div className="w-full flex justify-between items-center py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted/80"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
          <h1 className="text-2xl font-semibold">Создание магазина</h1>

          <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-5 w-5" /> Выход
          </Button>
        </div>

        <div className="flex justify-center py-6">
          <div className="w-full max-w-2xl">
            {/* Прогресс-бар */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{getStepText()}</span>
                <span className="text-sm text-muted-foreground">{getProgress()}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-sidebar-primary h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>

            {/* Информационный блок */}
            {!isValidated && (
              <div className="mb-6">
                <div className="border border-border/50 bg-muted/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sidebar-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-sidebar-primary text-sm">ℹ️</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">
                        Настройка займёт пару минут
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Получите токен в BotFather, и магазин будет готов к работе
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card className="custom-card border-border/50">
                  <CardContent className="space-y-8 p-6">
                    <FormField
                      control={form.control}
                      name="token"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2 mb-4">
                            <FormLabel className="text-base font-semibold">Токен бота</FormLabel>
                            {isValidated && (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Проверен
                              </Badge>
                            )}
                          </div>
                          <FormControl>
                            <Input
                              className="h-11"
                              placeholder="123456789:ABcdEfGhIjKlMnOpQrStUvWxYz"
                              disabled={isValidated}
                              {...field}
                            />
                          </FormControl>

                          {/* Инструкции */}
                          <div className="mt-4 p-3 border border-border/50 rounded-lg bg-muted/20">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-foreground">
                                Получение токена:
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={openBotFather}
                                className="h-7 text-xs"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                BotFather
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>
                                1. Откройте BotFather → отправьте{' '}
                                <code className="bg-muted px-1 rounded text-xs">/newbot</code>
                              </div>
                              <div>2. Введите название и username бота</div>
                              <div>3. Скопируйте полученный токен</div>
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="default"
                        onClick={validateToken}
                        disabled={isValidating || !form.getValues('token') || isValidated}
                        className="min-w-[120px] h-11"
                      >
                        {isValidating ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Проверка...
                          </>
                        ) : (
                          'Проверить токен'
                        )}
                      </Button>
                      {validationError && (
                        <span className="text-sm text-destructive">{validationError}</span>
                      )}
                    </div>

                    {isValidated && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        {/* Успешная валидация */}
                        <div className="p-3 border border-border/50 bg-muted/10 rounded-lg">
                          <div className="flex items-center gap-2 text-foreground">
                            <CheckCircle className="w-4 h-4 text-sidebar-primary" />
                            <span className="font-medium text-sm">Токен подтверждён</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-6">
                            Настройте параметры магазина
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">
                                Название магазина
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-11"
                                  placeholder="Мой крутой магазин"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Это название будет отображаться в заголовке бота
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">
                                Username бота
                              </FormLabel>
                              <FormControl>
                                <Input className="h-11" disabled {...field} />
                              </FormControl>
                              <FormDescription>
                                Ссылка на ваш бот: t.me/{field.value}
                              </FormDescription>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-2">
                                <FormLabel className="text-base font-semibold">Валюта</FormLabel>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>В этой валюте будут отображаться цены товаров</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Выберите валюту" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="RUB">RUB - Российский рубль</SelectItem>
                                    <SelectItem value="BYN">BYN - Белорусский рубль</SelectItem>
                                    <SelectItem value="USD">USD - Доллар США</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="welcomeMessage"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-2">
                                <FormLabel className="text-base font-semibold">
                                  Приветственное сообщение
                                </FormLabel>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        Первое сообщение, которое увидят ваши клиенты при запуске
                                        бота
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <FormControl>
                                <Textarea
                                  className="min-h-[100px] resize-y"
                                  placeholder="Добро пожаловать! Выберите товары из нашего каталога..."
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Сделайте его дружелюбным и информативным
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  {isValidated && (
                    <Button
                      type="submit"
                      size="lg"
                      className="px-8 h-12 text-base animate-in fade-in slide-in-from-bottom-4 duration-300"
                    >
                      🎉 Создать магазин
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
