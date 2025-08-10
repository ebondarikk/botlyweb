import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getMe, updateMe } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const decodeToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      if (decoded) {
        localStorage.setItem('user', JSON.stringify(decoded));
        setUser(decoded);
      }
    } catch (error) {
      console.error('Ошибка при расшифровке токена:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (token && !storedUser) {
      decodeToken(token);
    } else if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, []);

  // Подтягиваем актуальные данные пользователя с сервера
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    (async () => {
      try {
        const me = await getMe();
        if (me) {
          localStorage.setItem('user', JSON.stringify(me));
          setUser(me);
          if (!me.email) {
            setEmailDialogOpen(true);
          }
        }
      } catch (e) {
        // если токен протух — редирект на логин произойдет внутри apiRequest
      }
    })();
  }, []);

  const isEmailValid = useMemo(() => {
    if (!emailInput) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(emailInput.trim());
  }, [emailInput]);

  const handleSaveEmail = async () => {
    if (!isEmailValid || savingEmail) return;
    try {
      setSavingEmail(true);
      await updateMe({ email: emailInput.trim() });
      const me = await getMe();
      if (me) {
        localStorage.setItem('user', JSON.stringify(me));
        setUser(me);
      }
      setEmailDialogOpen(false);
    } catch (e) {
      // Ошибка обработки будет показана глобально, если нужно
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    user && (
      <UserContext.Provider value={{ user }}>
        {children}
        <Dialog open={emailDialogOpen} onOpenChange={(open) => { if (open) setEmailDialogOpen(true); }}>
          <DialogContent hideClose>
            <DialogHeader>
              <DialogTitle>Укажите ваш email</DialogTitle>
              <DialogDescription>Для связи и квитанций укажите адрес электронной почты.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isEmailValid) {
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
              <Button disabled={!isEmailValid || savingEmail} onClick={handleSaveEmail}>
                {savingEmail ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </UserContext.Provider>
    )
  );
}

// Хук для использования пользователя
export function useUser() {
  return useContext(UserContext);
}
