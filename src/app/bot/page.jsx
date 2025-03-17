import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useBot } from '@/context/BotContext';
import { Skeleton } from '@/components/ui/skeleton';
import { updateBot } from '@/lib/api';
import { toast } from 'react-hot-toast';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ORDER_STATUSES } from '@/lib/utils';
import BotLayout from './layout';

// Функция для форматирования даты
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// ,,ункция для форматирования даты в графике
const formatChartDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
};

function BotPage() {
  const { bot, loading, setBot } = useBot();
  const [currency, setCurrency] = useState('');
  const [welcomeText, setWelcomeText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && bot) {
      setCurrency(bot?.currency);
      setWelcomeText(bot?.welcome_text);
    }
  }, [bot, loading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedBot = await updateBot(bot.id, {
        currency,
        welcome_text: welcomeText,
      });
      setBot(updatedBot);
      toast.success('Данные обновлены');
    } catch (error) {
      toast.error('Ошибка обновления');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BotLayout>
      <div className="w-full">
        {/* Информация о боте */}
        <Card className="border-none shadow-none">
          <CardHeader className="flex flex-row items-center gap-4 px-8 pt-6 pb-8">
            <CardTitle className="text-2xl font-semibold">
              {loading ? <Skeleton className="h-8 w-40" /> : bot?.fullname}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8">
            <div className="custom-card rounded-xl border p-8 bg-card/50">
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                {/* Левая часть: ID и Пользователь */}
                <div className="flex flex-col gap-4">
                  {loading ? (
                    <>
                      <Skeleton className="h-7 w-32" />
                      <Skeleton className="h-7 w-40" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-base text-muted-foreground">ID:</span>
                        <span className="text-base font-medium">{bot?.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base text-muted-foreground">Username:</span>
                        <span className="text-base font-medium">@{bot?.username}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Правая часть: Редактируемые поля */}
                <div className="flex-1 max-w-xl space-y-8">
                  {loading ? (
                    <>
                      <Skeleton className="h-[72px] w-full" />
                      <Skeleton className="h-[132px] w-full" />
                    </>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <p className="text-base font-semibold">Валюта</p>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Выберите валюту" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="BYN">BYN</SelectItem>
                              <SelectItem value="RUB">RUB</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <p className="text-base font-semibold">Приветственное сообщение</p>
                        <Textarea
                          className="min-h-[100px] resize-y"
                          value={welcomeText}
                          onChange={(e) => setWelcomeText(e.target.value)}
                          placeholder="Введите приветственное сообщение..."
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {!loading && (
                <div className="flex justify-end mt-8">
                  <Button onClick={handleSave} disabled={saving} className="sm:px-12 h-11">
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              )}
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="custom-card rounded-xl border p-6 bg-card/50">
                <p className="text-sm font-medium text-muted-foreground mb-2">Заказы</p>
                <div className="text-2xl font-semibold">
                  {loading ? <Skeleton className="h-8 w-16" /> : bot?.orders_count}
                </div>
              </div>
              <div className="custom-card rounded-xl border p-6 bg-card/50">
                <p className="text-sm font-medium text-muted-foreground mb-2">Клиенты</p>
                <div className="text-2xl font-semibold">
                  {loading ? <Skeleton className="h-8 w-16" /> : bot?.users_count}
                </div>
              </div>
              <div className="custom-card rounded-xl border p-6 bg-card/50">
                <p className="text-sm font-medium text-muted-foreground mb-2">Средний чек</p>
                <div className="text-2xl font-semibold">
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    `${bot?.average_bill} ${bot?.currency}`
                  )}
                </div>
              </div>
            </div>

            {/* График продаж */}
            <div className="custom-card rounded-xl border p-8 mt-8 bg-card/50">
              <h3 className="text-base font-semibold mb-6">Доход</h3>
              <div className="h-64">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {bot?.revenue?.length ? (
                      <LineChart data={bot?.revenue}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#4F46E5"
                          name="Выручка"
                          strokeWidth={2}
                        />
                      </LineChart>
                    ) : (
                      <p className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        Нет данных
                      </p>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Последние заказы */}
            <div className="custom-card rounded-xl border p-8 mt-8 bg-card/50">
              <h3 className="text-base font-semibold mb-6">Последние заказы</h3>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Создан</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bot?.last_orders?.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.fullname}</TableCell>
                        <TableCell>
                          {order.total} {bot?.currency}
                        </TableCell>
                        <TableCell>{ORDER_STATUSES[order.status]}</TableCell>
                        <TableCell>{formatDate(order.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </BotLayout>
  );
}

export default BotPage;
