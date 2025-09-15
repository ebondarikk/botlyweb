import React from 'react';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion.tsx';
import { Truck, Save } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { z } from 'zod';
import { updateDeliverySettings } from '@/lib/api';
import { toast } from 'react-hot-toast';
import DeliveryZoneEditor from '@/components/DeliveryZoneEditor';

const deliverySettingsSchema = z.object({
  is_active: z.boolean(),
  zones: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'Название зоны обязательно'),
    is_active: z.boolean(),
    type: z.enum(['city', 'district', 'polygon']),
    polygon: z.array(z.object({
      lat: z.number(),
      lng: z.number(),
    })).optional(),
    center: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    radius: z.number().optional(),
  })).min(1, 'Добавьте хотя бы одну зону доставки'),
});

export default function DeliverySettings({
  bot,
  deliverySettings,
  setDeliverySettings,
  loading,
  setLoading,
  initialLoading,
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

  const handleZonesChange = (newZones) => {
    setDeliverySettings({
      ...deliverySettings,
      zones: newZones,
    });
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

  // Компонент скелетона для загрузки
  const DeliverySettingsSkeleton = () => (
    <motion.div variants={itemVariants} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm mb-6 custom-card overflow-hidden">
        <div className="flex justify-between w-full px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h2 className="text-lg font-medium">Доставка</h2>
              <p className="text-sm text-muted-foreground">
                Настройте зоны доставки и их параметры
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Скелетон для переключателя активации доставки */}
          <div className="flex items-center justify-between py-4 px-4 bg-muted/50 rounded-lg h-[60px]">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
          
          {/* Скелетон для редактора зон доставки */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
          
          {/* Скелетон для кнопки сохранения */}
          <div className="pt-6 border-t">
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Показываем скелетон во время начальной загрузки
  if (initialLoading) {
    return <DeliverySettingsSkeleton />;
  }

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
                  Настройте зоны доставки и их параметры
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between py-4 px-4 bg-muted/50 rounded-lg h-[60px]">
                <Label className="font-medium">Активировать доставку</Label>
                <Switch
                  checked={deliverySettings?.is_active}
                  onCheckedChange={(checked) =>
                    setDeliverySettings({ ...deliverySettings, is_active: checked })
                  }
                />
              </div>

              {deliverySettings?.is_active && (
                <>
                  <DeliveryZoneEditor
                    zones={deliverySettings.zones || []}
                    onZonesChange={handleZonesChange}
                    currency={bot.currency}
                  />
                  
                  {errors.zones && (
                    <div className="p-3 border border-destructive rounded-lg bg-destructive/5">
                      <p className="text-sm text-destructive">{errors.zones}</p>
                    </div>
                  )}
                </>
              )}

              <div className="pt-6 border-t">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          onClick={handleSaveDeliverySettings}
                          disabled={loading || !bot?.can_manage_delivery}
                          className="h-11 px-8 flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {loading ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {bot?.tariff?.is_default && !bot?.can_manage_delivery && (
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
