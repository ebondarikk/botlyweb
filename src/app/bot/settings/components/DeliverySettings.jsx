import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx';
import { Truck, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { z } from 'zod';
import { updateDeliverySettings } from '@/lib/api';
import { toast } from 'react-hot-toast';

const formatCurrency = (value) => {
  if (!value && value !== 0) return '';
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const parseCurrencyInput = (value) => {
  if (!value) return null;
  const normalizedValue = value.replace(/,/g, '.').replace(/\s/g, '');
  const number = parseFloat(normalizedValue);
  return Number.isNaN(number) ? null : Number(number.toFixed(2));
};

const handleNumberInput = (e, field, currentSettings, setSettings) => {
  let { value } = e.target;

  if (value.includes('.')) {
    const [whole, decimal] = value.split('.');
    if (decimal.length > 2) {
      value = `${whole}.${decimal.slice(0, 2)}`;
    }
  }

  setSettings({
    ...currentSettings,
    [field]: value ? Number(parseFloat(value).toFixed(2)) : null,
  });
};

const deliverySettingsSchema = z
  .object({
    is_active: z.boolean(),
    condition: z.enum([
      'always_paid',
      'paid_and_free_on_min_check',
      'unavailable_and_paid_on_min_check',
      'unavailable_and_free_on_min_check',
    ]),
    min_check: z.number().nullable().optional(),
    cost: z.number().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const needsMinCheck = [
      'paid_and_free_on_min_check',
      'unavailable_and_paid_on_min_check',
      'unavailable_and_free_on_min_check',
    ].includes(data.condition);

    const needsCost = [
      'always_paid',
      'paid_and_free_on_min_check',
      'unavailable_and_paid_on_min_check',
    ].includes(data.condition);

    if (needsMinCheck && (!data.min_check || data.min_check <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Укажите минимальную сумму заказа',
        path: ['min_check'],
      });
    }

    if (needsCost && (!data.cost || data.cost <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Укажите стоимость доставки',
        path: ['cost'],
      });
    }
  });

export default function DeliverySettings({
  bot,
  deliverySettings,
  setDeliverySettings,
  loading,
  setLoading,
  openAccordion,
  setOpenAccordion,
}) {
  const [errors, setErrors] = React.useState({});

  const validateForm = () => {
    try {
      deliverySettingsSchema.parse(deliverySettings);
      setErrors({});
      return true;
    } catch (error) {
      const formattedErrors = {};
      error.errors.forEach((err) => {
        formattedErrors[err.path[0]] = err.message;
      });
      setErrors(formattedErrors);
      return false;
    }
  };

  const handleSaveDeliverySettings = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await updateDeliverySettings(bot.id, deliverySettings);
      toast.success('Настройки доставки сохранены');
    } catch (error) {
      toast.error('Ошибка при сохранении настроек доставки');
    } finally {
      setLoading(false);
    }
  };

  const conditionOptions = [
    { value: 'always_paid', label: 'Всегда доступна платно' },
    {
      value: 'paid_and_free_on_min_check',
      label: 'Доступно платно и бесплатно при сумме заказа больше минимальной',
    },
    {
      value: 'unavailable_and_paid_on_min_check',
      label: 'Доступна платно при сумме заказа больше минимальной',
    },
    {
      value: 'unavailable_and_free_on_min_check',
      label: 'Доступна бесплатно при сумме заказа больше минимальной',
    },
  ];

  const needsMinCheck = [
    'paid_and_free_on_min_check',
    'unavailable_and_paid_on_min_check',
    'unavailable_and_free_on_min_check',
  ].includes(deliverySettings?.condition);

  const needsCost = [
    'always_paid',
    'paid_and_free_on_min_check',
    'unavailable_and_paid_on_min_check',
  ].includes(deliverySettings?.condition);

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
        <AccordionItem value="delivery" className="border-none">
          <AccordionTrigger className="flex justify-between w-full px-6 py-0 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4 py-6">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-lg font-medium">Доставка</h2>
                <p className="text-sm text-muted-foreground">
                  Настройте параметры доставки заказов
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 px-4 bg-muted/50 rounded-lg h-[60px]">
                <Label className="font-medium">Активировать доставку</Label>
                <Switch
                  checked={deliverySettings?.is_active}
                  onCheckedChange={(checked) =>
                    setDeliverySettings({ ...deliverySettings, is_active: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium block">Условия доставки</Label>
                <Select
                  value={deliverySettings.condition}
                  onValueChange={(value) =>
                    setDeliverySettings({ ...deliverySettings, condition: value })
                  }
                >
                  <SelectTrigger className="h-11 bg-background">
                    <SelectValue placeholder="Выберите условие доставки" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {needsMinCheck && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium block">Минимальная сумма заказа</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`h-11 bg-background ${errors.min_check ? 'border-destructive focus:ring-destructive' : ''}`}
                      value={deliverySettings.min_check || ''}
                      onChange={(e) =>
                        handleNumberInput(e, 'min_check', deliverySettings, setDeliverySettings)
                      }
                      onInput={(e) => {
                        if (e.target.value.includes('.')) {
                          const [whole, decimal] = e.target.value.split('.');
                          if (decimal?.length > 2) {
                            e.target.value = `${whole}.${decimal.slice(0, 2)}`;
                          }
                        }
                      }}
                      placeholder="0.00"
                    />
                    {errors.min_check && (
                      <p className="text-sm text-destructive mt-1.5">{errors.min_check}</p>
                    )}
                  </div>
                )}

                {needsCost && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium block">Стоимость доставки</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`h-11 bg-background ${errors.cost ? 'border-destructive focus:ring-destructive' : ''}`}
                      value={deliverySettings.cost || ''}
                      onChange={(e) =>
                        handleNumberInput(e, 'cost', deliverySettings, setDeliverySettings)
                      }
                      onInput={(e) => {
                        if (e.target.value.includes('.')) {
                          const [whole, decimal] = e.target.value.split('.');
                          if (decimal?.length > 2) {
                            e.target.value = `${whole}.${decimal.slice(0, 2)}`;
                          }
                        }
                      }}
                      placeholder="0.00"
                    />
                    {errors.cost && (
                      <p className="text-sm text-destructive mt-1.5">{errors.cost}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          onClick={handleSaveDeliverySettings}
                          disabled={loading || bot?.tariff?.is_default}
                          className="h-11 px-8 flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {loading ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {bot?.tariff?.is_default && (
                      <TooltipContent>
                        <p>Для настройки доставки необходимо повысить тариф</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
}
