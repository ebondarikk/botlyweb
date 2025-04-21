import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  ArrowLeft,
  ImageIcon,
  Package,
  Layers,
  Tag,
  FileText,
  Settings2,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
} from 'lucide-react';

import ImageUpload from '@/components/image-upload';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '@/hooks/use-product';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProduct, createProduct, deleteProduct } from '@/lib/api';
import { useCategories } from '@/hooks/use-categories';
import BotLayout from '@/app/bot/layout';
import { useBot } from '@/context/BotContext';
import { ProductSchema } from './schema';

function getDefaultValues(product) {
  if (!product) {
    return {
      name: '',
      image: '',
      preview_image: '',
      price: '0.00',
      description: '',
      category: '',
      grouped: false,
      frozen: false,
      warehouse: false,
      warehouse_count: 0,
      subproducts: [],
    };
  }
  return {
    name: product.name || '',
    image: product.image || '',
    preview_image: product.preview_image || '',
    price: product.price || '0.00',
    description: product.description || '',
    category: product.category || '',
    grouped: typeof product.grouped !== 'undefined' ? product.grouped : false,
    frozen: product.frozen || false,
    warehouse: product.warehouse || false,
    warehouse_count: product.warehouse_count || 0,
    subproducts:
      product.subproducts?.map((sub) => ({
        name: sub.name || '',
        frozen: sub.frozen || false,
        warehouse: sub.warehouse || false,
        warehouse_count: sub.warehouse_count || 0,
      })) || [],
  };
}

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

export default function ProductFormPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { bot } = useBot();

  const { categories } = useCategories(params.bot_id);

  useEffect(() => {
    categories.unshift({ id: 'null', name: '-', value: '' });
  }, [categories]);

  const {
    product: existingProduct,
    setProduct: setExistingProduct,
    loading,
  } = useProduct(params.bot_id, params.product_id);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const defaultValues = existingProduct
    ? getDefaultValues(existingProduct)
    : getDefaultValues(null);

  const form = useForm({
    defaultValues,
    resolver: zodResolver(ProductSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (existingProduct) {
      const productValues = getDefaultValues(existingProduct);
      // Проверяем, существует ли категория в списке категорий
      if (productValues.category && categories.length > 0) {
        const categoryExists = categories.some(
          (cat) => (cat.value ? cat.value : cat.name) === productValues.category,
        );
        if (!categoryExists) {
          productValues.category = '';
        }
      }
      form.reset(productValues);
    }
  }, [existingProduct, form, categories]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'subproducts',
  });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (existingProduct) {
        const updatedProduct = await updateProduct(params.bot_id, existingProduct.id, {
          ...data,
        });
        setExistingProduct(updatedProduct);
        toast.success('Данные обновлены');
      } else {
        const product = await createProduct(params.bot_id, { ...data });
        navigate(`/${params.bot_id}/products/${product.id}`);
      }
    } catch (error) {
      toast.error(error?.details?.errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteProduct(params.bot_id, existingProduct.id);
      toast.success('Товар успешно удален');
      navigate(-1);
    } catch (error) {
      console.log(error);
      toast.error('Ошибка при удалении товара');
    } finally {
      setDeleting(false);
    }
  };

  const handleImageChange = (val) => {
    form.setValue('image', val);
  };

  const handleTabsChange = (value) => {
    form.setValue('grouped', value === 'grouped');
    if (value !== 'grouped') {
      form.setValue('subproducts', []);
    } else {
      form.setValue('warehouse', false);
      form.setValue('warehouse_count', null);
      append({
        name: '',
        frozen: false,
        warehouse: false,
        warehouse_count: 0,
      });
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
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {existingProduct ? 'Редактировать товар' : 'Добавить товар'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Заполните информацию о товаре</p>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                {/* Левая колонка */}
                <div className="space-y-6">
                  <motion.div custom={0} variants={cardVariants}>
                    <Card className="custom-card border-border/50 overflow-hidden">
                      <CardHeader className="border-b bg-muted/40 px-6">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-primary" />
                          <CardTitle className="text-base">Изображение товара</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <FormField
                          control={form.control}
                          name="image"
                          render={({ field }) => (
                            <FormItem>
                              <div className="mt-2">
                                <ImageUpload
                                  value={field.value}
                                  preview={existingProduct?.preview_image}
                                  onChange={handleImageChange}
                                  className="flex flex-col sm:flex-row gap-4 items-start"
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div custom={1} variants={cardVariants}>
                    <Card className="custom-card border-border/50 overflow-hidden">
                      <CardHeader className="border-b bg-muted/40 px-6">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-primary" />
                          <CardTitle className="text-base">Основная информация</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Название</FormLabel>
                              <FormControl>
                                <Input className="h-11" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Цена</FormLabel>
                              <FormControl>
                                <Input
                                  className="h-11"
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Категория</FormLabel>
                              <Select
                                value={field.value || ''}
                                onValueChange={(val) => field.onChange(val === '-' ? '' : val)}
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Выберите категорию" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem
                                      key={cat.id}
                                      value={cat.value ? cat.value : cat.name}
                                    >
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Описание</FormLabel>
                              <FormControl>
                                <Textarea className="min-h-[160px] resize-y" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Правая колонка */}
                <div className="space-y-6">
                  <motion.div custom={2} variants={cardVariants}>
                    <Card className="custom-card border-border/50 overflow-hidden">
                      <CardHeader className="border-b bg-muted/40 px-6">
                        <div className="flex items-center gap-2">
                          <Settings2 className="w-5 h-5 text-primary" />
                          <CardTitle className="text-base">Настройки товара</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <FormField
                          control={form.control}
                          name="grouped"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Тип товара</FormLabel>
                              <Tabs
                                value={field.value ? 'grouped' : 'simple'}
                                onValueChange={handleTabsChange}
                              >
                                <TabsList className="w-full">
                                  <TabsTrigger
                                    value="simple"
                                    className="w-1/2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                  >
                                    <Package className="w-4 h-4 mr-2" />
                                    Простой
                                  </TabsTrigger>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="w-1/2">
                                          <TabsTrigger
                                            value="grouped"
                                            className="w-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                            disabled={!bot?.can_create_grouped}
                                          >
                                            <Layers className="w-4 h-4 mr-2" />
                                            Сгруппированный
                                          </TabsTrigger>
                                        </div>
                                      </TooltipTrigger>
                                      {bot?.tariff?.is_default && (
                                        <TooltipContent>
                                          <p>
                                            Для создания сгруппированных товаров необходимо повысить
                                            тариф
                                          </p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </TabsList>
                              </Tabs>
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4 pl-1">
                          <FormField
                            control={form.control}
                            name="frozen"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center space-x-3">
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    id="product-frozen"
                                  />
                                  <FormLabel
                                    htmlFor="product-frozen"
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    Скрыть товар
                                  </FormLabel>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="warehouse"
                            render={({ field }) => (
                              <FormItem>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center space-x-3">
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          disabled={
                                            form.watch('grouped') || !bot?.can_manage_warehouse
                                          }
                                          id="product-warehouse"
                                        />
                                        <FormLabel
                                          htmlFor="product-warehouse"
                                          className="text-sm font-medium cursor-pointer"
                                        >
                                          Учитывать склад
                                        </FormLabel>
                                      </div>
                                    </TooltipTrigger>
                                    {!form.watch('grouped') && !bot?.can_manage_warehouse && (
                                      <TooltipContent>
                                        <p>Для управления складом необходимо повысить тариф</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {form.watch('warehouse') && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <FormField
                                control={form.control}
                                name="warehouse_count"
                                render={({ field }) => (
                                  <FormItem className="pl-10">
                                    <FormLabel className="text-sm mb-2 block">
                                      Количество на складе
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        className="w-36 h-11"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Варианты товара */}
                  <AnimatePresence>
                    {form.watch('grouped') && (
                      <motion.div
                        custom={3}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      >
                        <Card className="custom-card border-border/50 overflow-hidden">
                          <CardHeader className="border-b bg-muted/40 px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Layers className="w-5 h-5 text-primary" />
                                <CardTitle className="text-base">Варианты товара</CardTitle>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  append({
                                    name: '',
                                    frozen: false,
                                    warehouse: false,
                                    warehouse_count: 0,
                                  })
                                }
                                className="h-8 px-3"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Добавить
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6">
                            <AnimatePresence>
                              {fields.length > 0 ? (
                                <motion.div className="grid gap-6">
                                  {fields.map((fieldItem, idx) => (
                                    <motion.div
                                      key={fieldItem.id}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -20 }}
                                      className="bg-background border-2 border-border/50 shadow-sm rounded-xl p-6 space-y-6"
                                    >
                                      <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="h-6">
                                          Вариант #{idx + 1}
                                        </Badge>
                                        {form.watch('subproducts')?.length > 1 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 h-8 px-3"
                                            onClick={() => remove(idx)}
                                          >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Удалить
                                          </Button>
                                        )}
                                      </div>

                                      <FormField
                                        control={form.control}
                                        name={`subproducts.${idx}.name`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-sm mb-2 block">
                                              Название варианта
                                            </FormLabel>
                                            <FormControl>
                                              <Input className="h-11" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      <div className="space-y-4 pl-1">
                                        <FormField
                                          control={form.control}
                                          name={`subproducts.${idx}.frozen`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <div className="flex items-center space-x-3">
                                                <Switch
                                                  checked={field.value}
                                                  onCheckedChange={field.onChange}
                                                  id={`sub-frozen-${idx}`}
                                                />
                                                <FormLabel
                                                  htmlFor={`sub-frozen-${idx}`}
                                                  className="text-sm font-medium cursor-pointer"
                                                >
                                                  Скрыть вариант
                                                </FormLabel>
                                              </div>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <FormField
                                          control={form.control}
                                          name={`subproducts.${idx}.warehouse`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <div className="flex items-center space-x-3">
                                                      <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        id={`sub-warehouse-${idx}`}
                                                        disabled={!bot?.can_manage_warehouse}
                                                      />
                                                      <FormLabel
                                                        htmlFor={`sub-warehouse-${idx}`}
                                                        className="text-sm font-medium cursor-pointer"
                                                      >
                                                        Учитывать склад
                                                      </FormLabel>
                                                    </div>
                                                  </TooltipTrigger>
                                                  {!bot?.can_manage_warehouse && (
                                                    <TooltipContent>
                                                      <p>
                                                        Для управления складом необходимо повысить
                                                        тариф
                                                      </p>
                                                    </TooltipContent>
                                                  )}
                                                </Tooltip>
                                              </TooltipProvider>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />

                                        <AnimatePresence>
                                          {form.getValues(`subproducts.${idx}.warehouse`) && (
                                            <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: 'auto' }}
                                              exit={{ opacity: 0, height: 0 }}
                                            >
                                              <FormField
                                                control={form.control}
                                                name={`subproducts.${idx}.warehouse_count`}
                                                render={({ field }) => (
                                                  <FormItem className="pl-10">
                                                    <FormLabel className="text-sm mb-2 block">
                                                      Количество на складе
                                                    </FormLabel>
                                                    <FormControl>
                                                      <Input
                                                        type="number"
                                                        min="0"
                                                        className="w-36 h-11"
                                                        {...field}
                                                      />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    </motion.div>
                                  ))}
                                </motion.div>
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex flex-col items-center justify-center gap-4 py-8 bg-muted/40 rounded-xl"
                                >
                                  <div className="p-3 rounded-full bg-primary/10">
                                    <Layers className="w-6 h-6 text-primary" />
                                  </div>
                                  <p className="text-sm text-muted-foreground text-center">
                                    Нет вариантов товара
                                    <br />
                                    Добавьте хотя бы один вариант
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {form.formState.errors.global && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-destructive/10 text-destructive rounded-xl p-4"
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{form.formState.errors.global.message}</p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row justify-between gap-4"
              >
                <Button
                  type="submit"
                  disabled={saving}
                  className="sm:px-12 h-11 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>

                {!!existingProduct && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive h-11 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить товар
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Удаление товара
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                          Вы действительно хотите удалить этот товар? Это действие нельзя отменить.
                          <p className="mt-2 text-muted-foreground">
                            Если вы хотите временно скрыть товар, используйте опцию &quot;Скрыть
                            товар&quot; в настройках.
                          </p>
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
