import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { telegramAuth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const navigate = useNavigate();
  const isSessionSaved = !!window.TelegramLogin;

  useEffect(() => {
    window.onTelegramAuth = async function (user) {
      try {
        const response = await telegramAuth(user);
        localStorage.setItem('access_token', response.access_token);
        toast.success('Добро пожаловать в Botly!');
        navigate('/');
      } catch (error) {
        toast.error('Не удалось войти через Telegram');
        console.error('Ошибка Telegram auth:', error);
      }
    };
    if (localStorage.getItem('access_token')) {
      window.location.href = '/';
    }

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?7';
    script.setAttribute('data-telegram-login', 'botly_developer_bot');
    // script.setAttribute('data-telegram-login', 'sushi_and_rolls_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-userpic', 'true');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    // script.async = true;

    const container = document.getElementById('telegram-widget-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
      if (isSessionSaved) {
        //
      }
    }

    return () => {
      delete window.onTelegramAuth;
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-xl custom-card">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-semibold mb-2 drop-shadow-sm">Вход в Botly</h1>
          <p className="text-muted-foreground drop-shadow-sm">
            Ваш Telegram-магазин — легко и быстро
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <p className="text-center text-muted-foreground mb-6 drop-shadow-sm">
            Войдите через Telegram и начните управлять своим магазином.
          </p>
          <div id="telegram-widget-container" className="flex justify-center" />
        </CardContent>
      </Card>
    </div>
  );
}
