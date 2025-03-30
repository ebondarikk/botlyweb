import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

const detectCardBrand = (number) => {
  const cleanNumber = number.replace(/\D/g, '');

  if (!cleanNumber) return '';

  // Определяем паттерны для разных брендов
  const patterns = {
    visa: /^4/,
    mastercard: /^(5[1-5]|2[2-7]2[0-1])/,
    amex: /^3[47]/,
    mir: /^220[0-4]/,
    belcard: /^9112/,
  };

  // Проверяем номер на соответствие паттернам
  const foundBrand = Object.entries(patterns).find(([brand, pattern]) => pattern.test(cleanNumber));

  return foundBrand ? foundBrand[0] : 'unknown';
};

export default function BillingPage() {
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });

  const [cardBrand, setCardBrand] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let formattedValue = value;
    if (name === 'number') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim();
      setCardBrand(detectCardBrand(formattedValue));
    } else if (name === 'expiry') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .substr(0, 5);
    } else if (name === 'cvc') {
      formattedValue = value.replace(/\D/g, '').substr(0, 3);
    } else if (name === 'name') {
      formattedValue = value.toUpperCase();
    }

    setCardData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Здесь будет логика отправки данных карты
      toast.success('Карта успешно добавлена');
    } catch (error) {
      toast.error('Ошибка при добавлении карты');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-xl custom-card">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-semibold mb-2 drop-shadow-sm">Добавление карты</h1>
          <p className="text-muted-foreground drop-shadow-sm">
            Введите данные вашей банковской карты
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Номер карты</label>
              <div className="relative">
                <Input
                  name="number"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.number}
                  onChange={handleInputChange}
                  maxLength={19}
                  required
                />
                {cardBrand && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium capitalize text-muted-foreground">
                    {cardBrand}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Срок действия</label>
                <Input
                  name="expiry"
                  placeholder="MM/YY"
                  value={cardData.expiry}
                  onChange={handleInputChange}
                  maxLength={5}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CVC</label>
                <Input
                  name="cvc"
                  type="password"
                  placeholder="123"
                  value={cardData.cvc}
                  onChange={handleInputChange}
                  maxLength={3}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Имя держателя карты</label>
              <Input
                name="name"
                placeholder="IVAN IVANOV"
                value={cardData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                'Добавить карту'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
