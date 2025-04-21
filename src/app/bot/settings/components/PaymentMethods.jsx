import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { CreditCard, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { getPaymentMethods, updatePaymentMethods } from '@/lib/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { z } from 'zod';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx';

const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Введите название метода оплаты'),
  is_active: z.boolean(),
  is_default: z.boolean(),
  details: z.string().optional(),
});

export default function PaymentMethods({ bot, openAccordion, setOpenAccordion }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchPaymentMethods = async () => {
    try {
      const data = await getPaymentMethods(bot.id);
      setPaymentMethods(data.payment_methods);
    } catch (error) {
      toast.error('Ошибка при загрузке методов оплаты');
    }
  };

  useEffect(() => {
    if (bot) {
      fetchPaymentMethods();
    }
  }, [bot]);

  const validateAllMethods = () => {
    const newErrors = {};
    let isValid = true;

    paymentMethods.forEach((method, index) => {
      try {
        paymentMethodSchema.parse(method);
      } catch (error) {
        isValid = false;
        error.errors.forEach((err) => {
          newErrors[`${index}_${err.path[0]}`] = err.message;
        });
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSaveAllMethods = async () => {
    if (!validateAllMethods()) {
      return;
    }

    setLoading(true);
    try {
      await updatePaymentMethods(bot.id, paymentMethods);
      toast.success('Методы оплаты сохранены');
      fetchPaymentMethods();
    } catch (error) {
      toast.error('Ошибка при сохранении методов оплаты');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMethod = (methodId) => {
    if (paymentMethods.length <= 1) {
      toast.error('Должен быть хотя бы один метод оплаты');
      return;
    }

    setPaymentMethods(paymentMethods.filter((method) => method.id !== methodId));
  };

  const handleAddMethod = () => {
    if (paymentMethods.length >= 5) {
      toast.error('Максимальное количество методов оплаты - 5');
      return;
    }

    const newMethod = {
      name: '',
      is_active: true,
      is_default: false,
      details: '',
    };
    setPaymentMethods([...paymentMethods, newMethod]);
  };

  const handleSetDefault = (methodId) => {
    const updatedMethods = paymentMethods.map((method) => ({
      ...method,
      is_default: method.id === methodId,
    }));
    setPaymentMethods(updatedMethods);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Accordion
        type="single"
        collapsible
        value={openAccordion}
        onValueChange={setOpenAccordion}
        className="rounded-xl border bg-card text-card-foreground shadow-sm mb-6 custom-card overflow-hidden"
      >
        <AccordionItem value="payment_methods" className="border-none">
          <AccordionTrigger className="flex justify-between w-full px-6 py-0 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4 py-6">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-lg font-medium">Методы оплаты</h2>
                <p className="text-sm text-muted-foreground">
                  Настройте способы оплаты для ваших клиентов
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-6 space-y-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddMethod}
                disabled={paymentMethods.length >= 5}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить метод оплаты
              </Button>

              <div className="space-y-4">
                {paymentMethods.map((method, index) => (
                  <Card key={method.id || `new-${index}`} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Название</Label>
                        <Input
                          value={method.name}
                          onChange={(e) => {
                            const updatedMethod = { ...method, name: e.target.value };
                            setPaymentMethods(
                              paymentMethods.map((m, i) => (i === index ? updatedMethod : m)),
                            );
                          }}
                          className={
                            errors[`${index}_name`]
                              ? 'border-destructive focus:ring-destructive'
                              : ''
                          }
                        />
                        {errors[`${index}_name`] && (
                          <p className="text-sm text-destructive">{errors[`${index}_name`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Дополнительная информация</Label>
                        <Input
                          value={method.details || ''}
                          placeholder="Номер карты, другие реквизиты"
                          onChange={(e) => {
                            const updatedMethod = { ...method, details: e.target.value };
                            setPaymentMethods(
                              paymentMethods.map((m, i) => (i === index ? updatedMethod : m)),
                            );
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`is_active_${method.id || `new-${index}`}`}
                            checked={method.is_active || method.is_default}
                            disabled={method.is_default}
                            onCheckedChange={(checked) => {
                              const updatedMethod = { ...method, is_active: checked };
                              setPaymentMethods(
                                paymentMethods.map((m, i) => (i === index ? updatedMethod : m)),
                              );
                            }}
                          />
                          <Label htmlFor={`is_active_${method.id || `new-${index}`}`}>
                            Активен
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`is_default_${method.id || `new-${index}`}`}
                            checked={method.is_default}
                            onCheckedChange={() => handleSetDefault(method.id)}
                          />
                          <Label htmlFor={`is_default_${method.id || `new-${index}`}`}>
                            По умолчанию
                          </Label>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMethod(method.id)}
                        disabled={loading || paymentMethods.length <= 1 || method.is_default}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-start">
                {!bot?.can_manage_payment_methods ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          onClick={handleSaveAllMethods}
                          disabled={loading || !bot?.can_manage_payment_methods}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {loading ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Для настройки методов оплаты необходимо повысить тариф</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    onClick={handleSaveAllMethods}
                    disabled={loading || !bot?.can_manage_payment_methods}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
}
