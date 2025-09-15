import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { connectQuickResto } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Loader2, Globe, User, Lock } from 'lucide-react';

export default function QuickRestoConnectDialog({ 
  open, 
  onOpenChange, 
  botId, 
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    domain: '',
    login: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.domain || !formData.login || !formData.password) {
      toast.error('Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    
    try {
      const response = await connectQuickResto(botId, {
        domain: formData.domain,
        login: formData.login,
        password: formData.password
      });
      
      // Проверяем результат валидации из тела ответа
      if (response.success) {
        toast.success('QuickResto успешно подключен!');
        onSuccess();
        onOpenChange(false);
        setFormData({ domain: '', login: '', password: '' });
        setFieldErrors({}); // Очищаем ошибки полей
      } else {
        // Показываем ошибку валидации из поля data
        const errorMessage = response.data || 'Ошибка валидации данных';
        toast.error(`Ошибка подключения: ${errorMessage}`);
        
        // Определяем, к какому полю относится ошибка
        let fieldName = null;
        if (errorMessage.toLowerCase().includes('домен') || errorMessage.toLowerCase().includes('domain')) {
          fieldName = 'domain';
        } else if (errorMessage.toLowerCase().includes('логин') || errorMessage.toLowerCase().includes('login')) {
          fieldName = 'login';
        } else if (errorMessage.toLowerCase().includes('пароль') || errorMessage.toLowerCase().includes('password')) {
          fieldName = 'password';
        }
        
        // Устанавливаем ошибку для конкретного поля
        if (fieldName) {
          setFieldErrors({ [fieldName]: errorMessage });
        } else {
          // Если не удалось определить поле, показываем общую ошибку
          setFieldErrors({ general: errorMessage });
        }
      }
    } catch (error) {
      const errorMessage = error?.message || 'Ошибка подключения к QuickResto';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Подключение QuickResto
          </DialogTitle>
          <DialogDescription>
            Введите данные для подключения к системе QuickResto. 
            После подключения ваш бот сможет синхронизировать меню и заказы.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {fieldErrors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{fieldErrors.general}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="domain" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Субдомен
            </Label>
            <div className="relative">
              <Input
                id="domain"
                type="text"
                placeholder="ax609"
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                className={`pr-20 ${fieldErrors.domain ? 'border-red-500' : ''}`}
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                .quickresto.ru
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Введите только часть домена до .quickresto.ru
            </p>
            {fieldErrors.domain && (
              <p className="text-xs text-red-500">{fieldErrors.domain}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="login" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Логин API
            </Label>
            <Input
              id="login"
              type="text"
              placeholder="Введите логин API"
              value={formData.login}
              onChange={(e) => handleInputChange('login', e.target.value)}
              className={fieldErrors.login ? 'border-red-500' : ''}
              disabled={loading}
            />
            {fieldErrors.login && (
              <p className="text-xs text-red-500">{fieldErrors.login}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Пароль API
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Введите пароль API"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={fieldErrors.password ? 'border-red-500' : ''}
              disabled={loading}
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-500">{fieldErrors.password}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Подключение...
                </>
              ) : (
                'Подключить'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
