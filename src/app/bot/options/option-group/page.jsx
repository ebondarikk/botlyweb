import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertTriangle,
  Settings2,
  Package,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import BotLayout from '@/app/bot/layout';
import OptionsManager from '@/components/OptionsManager';
import {
  getOptionGroup,
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  getComponents,
  createComponent,
} from '@/lib/api';

// Схема валидации
const OptionGroupSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  is_active: z.boolean(),
  options: z.array(z.object({
    id: z.number().optional(),
    component: z.object({
      id: z.number(),
      name: z.string(),
    }),
    price: z.number().nullable(),
    max_count: z.number().nullable(),
    is_active: z.boolean(),
  })).optional(),
});

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

export default function OptionGroupFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const isEdit = params.group_id && params.group_id !== 'create';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [componentsLoaded, setComponentsLoaded] = useState(false);

  const form = useForm({
    resolver: zodResolver(OptionGroupSchema),
    mode: 'onSubmit', // Отключаем автоматическую валидацию и отправку
    defaultValues: {
      name: '',
      is_active: true,
      options: [],
    },
  });

  // Загрузка данных группы опций при редактировании
  useEffect(() => {
    if (isEdit) {
      loadOptionGroup();
    }
  }, [isEdit, params.group_id]);

  const loadOptionGroup = async () => {
    try {
      setLoading(true);
      const group = await getOptionGroup(params.bot_id, params.group_id);
      
      form.reset({
        name: group.name || '',
        is_active: group.is_active,
        options: group.options || [],
      });
    } catch (error) {
      console.error('Ошибка загрузки группы опций:', error);
      toast.error('Ошибка загрузки группы опций');
      navigate(`/${params.bot_id}/options`);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка компонентов
  const loadComponents = async () => {
    if (componentsLoaded) return;
    
    setComponentsLoading(true);
    try {
      const response = await getComponents(params.bot_id);
      setAvailableComponents(response.components || []);
      setComponentsLoaded(true);
    } catch (error) {
      console.error('Ошибка загрузки компонентов:', error);
      toast.error('Ошибка загрузки компонентов');
    } finally {
      setComponentsLoading(false);
    }
  };

  // Создание нового компонента
  const handleCreateComponent = async (name) => {
    try {
      const newComponent = await createComponent(params.bot_id, { name });
      setAvailableComponents(prev => [...prev, newComponent]);
      toast.success('Компонент создан');
      return newComponent;
    } catch (error) {
      console.error('Ошибка создания компонента:', error);
      throw error;
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      // Подготавливаем опции для отправки
      const optionsData = (data.options || []).map((option) => ({
        ...(option.id && { id: option.id }),
        component_id: option.component.id,
        price: option.price,
        max_count: option.max_count,
        is_active: option.is_active,
      }));

      const groupData = {
        name: data.name,
        is_active: data.is_active,
        options: optionsData,
      };

      if (isEdit) {
        await updateOptionGroup(params.bot_id, params.group_id, groupData);
        toast.success('Группа опций обновлена');
      } else {
        const newGroup = await createOptionGroup(params.bot_id, groupData);
        toast.success('Группа опций создана');
        navigate(`/${params.bot_id}/options/${newGroup.id}`);
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast.error('Ошибка при сохранении группы опций');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteOptionGroup(params.bot_id, params.group_id);
      toast.success('Группа опций удалена');
      navigate(`/${params.bot_id}/options`);
    } catch (error) {
      console.error('Ошибка удаления:', error);
      toast.error('Ошибка при удалении группы опций');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <BotLayout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full px-4 md:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 py-6"
        >
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => navigate(`/${params.bot_id}/options`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {isEdit ? 'Редактировать группу опций' : 'Создать группу опций'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Настройте группу опций для товаров
            </p>
          </div>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-8"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </motion.div>
        ) : (
          <Form {...form}>
            <form onSubmit={(e) => {
              e.preventDefault();
              console.log('Form submit prevented - use Save button');
            }} className="space-y-8">
              <motion.div
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Основная информация */}
                <motion.div custom={0} variants={cardVariants}>
                  <Card className="custom-card border-border/50 overflow-hidden">
                    <CardHeader className="border-b bg-muted/40 px-6">
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base">Основная информация</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Название группы</FormLabel>
                            <FormControl>
                              <Input className="h-11" placeholder="Например: Добавки" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-3">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="group-active"
                              />
                              <FormLabel
                                htmlFor="group-active"
                                className="text-sm font-medium cursor-pointer"
                              >
                                Активная группа
                              </FormLabel>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Опции */}
                <motion.div custom={1} variants={cardVariants}>
                  <Card className="custom-card border-border/50 overflow-hidden">
                    <CardHeader className="border-b bg-muted/40 px-6">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base">Опции группы</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <FormField
                        control={form.control}
                        name="options"
                        render={({ field }) => (
                          <FormItem>
                            <OptionsManager
                              value={field.value || []}
                              onChange={field.onChange}
                              availableComponents={availableComponents}
                              onCreateComponent={handleCreateComponent}
                              loading={componentsLoading}
                              onLoadComponents={loadComponents}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row justify-between gap-4"
              >
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    const data = form.getValues();
                    const isValid = form.trigger();
                    if (isValid) {
                      onSubmit(data);
                    }
                  }}
                  className="sm:px-12 h-11 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>

                {isEdit && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive h-11 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить группу
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Удаление группы опций
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                          Вы действительно хотите удалить эту группу опций? Это действие нельзя отменить.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={(e) => e.target.closest('dialog').close()}
                        >
                          Отмена
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={onDelete}
                          disabled={deleting}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {deleting ? 'Удаление...' : 'Удалить'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </motion.div>
            </form>
          </Form>
        )}
      </motion.div>
    </BotLayout>
  );
}
