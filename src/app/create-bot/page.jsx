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
import { ArrowLeft, LogOut, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { validateBotToken, createBot } from '@/lib/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'react-hot-toast';

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
    localStorage.removeItem('access_token');
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
          <h1 className="text-2xl font-semibold">Добавление магазина</h1>

          <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-5 w-5" /> Выход
          </Button>
        </div>

        <div className="flex justify-center py-6">
          <div className="w-full max-w-2xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card className="custom-card border-border/50">
                  <CardContent className="space-y-8 p-6">
                    <FormField
                      control={form.control}
                      name="token"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Токен бота</FormLabel>
                          <FormControl>
                            <Input
                              className="h-11"
                              placeholder="123456789:ABcdEfGhIjKlMnOpQrStUvWxYz"
                              disabled={isValidated}
                              {...field}
                            />
                          </FormControl>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="mb-2 text-muted-foreground">
                              Чтобы получить токен бота:
                            </span>
                            <ol className="ml-4 space-y-1">
                              <li>
                                1. Откройте{' '}
                                <a
                                  href="https://t.me/BotFather"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-600"
                                >
                                  @BotFather
                                </a>{' '}
                                в Telegram
                              </li>
                              <li>2. Отправьте команду /newbot</li>
                              <li>3. Следуйте инструкциям для создания бота</li>
                              <li>4. Скопируйте полученный токен</li>
                            </ol>
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
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                            Проверка...
                          </>
                        ) : (
                          'Проверить'
                        )}
                      </Button>
                      {validationError && (
                        <span className="text-sm text-destructive">{validationError}</span>
                      )}
                      {isValidated && <span className="text-sm text-primary">Токен проверен</span>}
                    </div>

                    {isValidated && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Название</FormLabel>
                              <FormControl>
                                <Input
                                  className="h-11"
                                  placeholder="Название магазина"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Username</FormLabel>
                              <FormControl>
                                <Input className="h-11" disabled {...field} />
                              </FormControl>
                              <FormMessage />
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
                                      <p>В этой валюте будут отображаться цены в магазине</p>
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
                                    <SelectItem value="RUB">RUB</SelectItem>
                                    <SelectItem value="BYN">BYN</SelectItem>
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
                                        Это сообщение будет отправлено пользователю при первом
                                        запуске бота
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <FormControl>
                                <Textarea
                                  className="min-h-[100px] resize-y"
                                  placeholder="Введите приветственное сообщение..."
                                  {...field}
                                />
                              </FormControl>
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
                      className="sm:px-12 h-11 animate-in fade-in slide-in-from-bottom-4 duration-300"
                    >
                      Создать магазин
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
