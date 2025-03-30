import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { telegramAuth } from '@/lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const isSessionSaved = !!window.TelegramLogin;
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    window.onTelegramAuth = async function (data, webApp = false) {
      try {
        setLoading(true);
        const response = await telegramAuth(data, webApp);
        localStorage.setItem('access_token', response.access_token);
        toast.success('Добро пожаловать в Botly!');
        navigate('/');
      } catch (error) {
        toast.error('Не удалось войти через Telegram');
        console.error('Ошибка Telegram auth:', error);
      } finally {
        setLoading(false);
      }
    };
    if (localStorage.getItem('access_token')) {
      window.location.href = '/';
    }

    const tg = window.Telegram.WebApp;

    if (tg?.initData) {
      window.onTelegramAuth({ init_data: tg.initData }, true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?7';
      script.setAttribute('data-telegram-login', import.meta.env.VITE_TELEGRAM_BOT_NAME);
      // script.setAttribute('data-telegram-login', 'botly_bbot');
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
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
          <div
            id="telegram-widget-container"
            className="flex justify-center"
            style={{ display: `${loading ? 'none' : 'block'}` }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
