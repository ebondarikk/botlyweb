/* eslint-disable no-undef */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { telegramAuth, updateMe } from '@/lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [widgetCreated, setWidgetCreated] = React.useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState('');
  const [savingEmail, setSavingEmail] = React.useState(false);
  const [pendingUserId, setPendingUserId] = React.useState(null);
  const isEmailValid = React.useMemo(() => {
    if (!emailInput) return false;
    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(emailInput.trim());
  }, [emailInput]);

  const handleSaveEmail = async () => {
    if (!isEmailValid || savingEmail) return;
    try {
      setSavingEmail(true);
      await updateMe({ id: pendingUserId, email: emailInput.trim() });
      toast.success('Email сохранён');
      setEmailDialogOpen(false);
      navigate('/');
    } catch (e) {
      toast.error('Не удалось сохранить email');
    } finally {
      setSavingEmail(false);
    }
  };

  // Создаем виджет только один раз
  useEffect(() => {
    // Проверяем, что мы в браузере
    if (typeof window === 'undefined') return;

    window.onTelegramAuth = async function (data, webApp = false) {
      try {
        setLoading(true);
        const response = await telegramAuth(data, webApp);
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          // eslint-disable-next-line no-undef
          localStorage.setItem('access_token', response.access_token);
        }
        const userHasEmail = Boolean(response?.user?.email);
        const userId = response?.user?.id;

        if (!userHasEmail && userId) {
          setPendingUserId(userId);
          setEmailDialogOpen(true);
        } else {
          toast.success('Добро пожаловать в Botly!');
          navigate('/');
        }
      } catch (error) {
        toast.error('Не удалось войти через Telegram');
        console.error('Ошибка Telegram auth:', error);
      } finally {
        setLoading(false);
      }
    };

    if (
      typeof window !== 'undefined' &&
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('access_token')
    ) {
      window.location.href = '/';
      return;
    }

    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

    if (tg?.initData) {
      window.onTelegramAuth({ init_data: tg.initData }, true);
    } else if (typeof document !== 'undefined' && !widgetCreated) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?7';
      // script.setAttribute('data-telegram-login', import.meta.env.VITE_TELEGRAM_BOT_NAME);
      script.setAttribute('data-telegram-login', 'botly_bbot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-userpic', 'true');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');

      const container = document.getElementById('telegram-widget-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(script);
        setWidgetCreated(true);
      }
    }

    // eslint-disable-next-line consistent-return
    return () => {
      if (typeof window !== 'undefined') {
        delete window.onTelegramAuth;
      }
    };
  }, [navigate]); // Убрал loading из зависимостей

  return (
    <div className="min-h-screen bg-background">
      {/* Логотип и название сверху */}
      <div className="flex items-center justify-center pt-12 pb-16">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center p-2">
            <img src="/botly.ico" alt="Botly" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Botly</h1>
        </div>
      </div>

      {/* Вертикальная карточка входа */}
      <div className="flex justify-center px-4">
        <Card className="w-full max-w-md custom-card">
          <CardContent className="p-8">
            {/* Заголовок */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Вход в систему</h2>
              <p className="text-muted-foreground">Управление Telegram-магазином</p>
            </div>

            {/* Кнопка входа */}
            <div className="space-y-6 relative">
              {/* Лоадер поверх виджета */}
              {loading && (
                <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-sidebar-primary border-t-transparent mr-3" />
                    <span className="text-muted-foreground">Вход...</span>
                  </div>
                </div>
              )}

              {/* Контейнер всегда существует */}
              <div className="space-y-6">
                <div id="telegram-widget-container" className="flex justify-center" />
                <p className="text-sm text-muted-foreground text-center">
                  Войдите через аккаунт Telegram
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={(open) => {
        // Запрещаем закрытие, пока не сохраним email
        if (open) setEmailDialogOpen(true);
      }}>
        <DialogContent hideClose>
          <DialogHeader>
            <DialogTitle>Укажите ваш email</DialogTitle>
            <DialogDescription>
              Для связи и квитанций укажите адрес электронной почты.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="you@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveEmail();
                }
              }}
              className={!isEmailValid && emailInput ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {!isEmailValid && emailInput && (
              <p className="text-sm text-destructive">Введите корректный адрес электронной почты</p>
            )}
          </div>
          <DialogFooter>
            <Button
              disabled={savingEmail || !isEmailValid}
              onClick={handleSaveEmail}
            >
              {savingEmail ? 'Сохранение…' : 'Сохранить и продолжить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
