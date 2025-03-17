import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
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

import { ArrowLeft } from 'lucide-react';

import ImageUpload from '@/components/image-upload';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '@/hooks/use-product';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProduct, createProduct, deleteProduct } from '@/lib/api';
import { useCategories } from '@/hooks/use-categories';
import BotLayout from '@/app/bot/layout';
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

export default function ProductFormPage() {
  const params = useParams();
  const navigate = useNavigate();

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
      form.reset(getDefaultValues(existingProduct));
    }
  }, [existingProduct, form]);

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
      console.log(error);
      toast.error('Ошибка обновления');
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
      <div className="w-full">
        <Card className="custom-card border-none shadow-none">
          <CardHeader className="flex flex-row items-center gap-4 px-8 pt-6 pb-8">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted/80"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-2xl font-semibold">
              {existingProduct ? 'Редактировать товар' : 'Добавить товар'}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-8">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}

            {!loading && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Левая колонка */}
                    <div className="space-y-8">
                      <div className="bg-card rounded-xl space-y-8">
                        {/* 1. Изображение */}
                        <FormField
                          control={form.control}
                          name="image"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold mb-4 block">
                                Изображение товара
                              </FormLabel>
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
                      </div>

                      <div className="bg-card rounded-xl space-y-8">
                        {/* 2. Название */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold mb-3 block">
                                Название
                              </FormLabel>
                              <FormControl>
                                <Input className="h-11" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* 3. Цена */}
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold mb-3 block">
                                Цена
                              </FormLabel>
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

                        {/* 4. Категория */}
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold mb-3 block">
                                Категория
                              </FormLabel>
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

                        {/* 5. Описание */}
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold mb-3 block">
                                Описание
                              </FormLabel>
                              <FormControl>
                                <Textarea className="min-h-[160px] resize-y" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Правая колонка */}
                    <div className="space-y-8">
                      <div className="bg-card rounded-xl space-y-8">
                        {/* Тип продукта */}
                        <FormField
                          control={form.control}
                          name="grouped"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold mb-3 block">
                                Тип товара
                              </FormLabel>
                              <Tabs
                                value={field.value ? 'grouped' : 'simple'}
                                onValueChange={handleTabsChange}
                              >
                                <TabsList className="w-full">
                                  <TabsTrigger value="simple" className="w-1/2">
                                    Простой
                                  </TabsTrigger>
                                  <TabsTrigger value="grouped" className="w-1/2">
                                    Сгруппированный
                                  </TabsTrigger>
                                </TabsList>
                              </Tabs>
                            </FormItem>
                          )}
                        />

                        {/* Настройки товара */}
                        <div className="space-y-6">
                          <h3 className="text-base font-semibold">Настройки товара</h3>

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
                                  <div className="flex items-center space-x-3">
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      disabled={form.watch('grouped')}
                                      id="product-warehouse"
                                    />
                                    <FormLabel
                                      htmlFor="product-warehouse"
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      Учитывать склад
                                    </FormLabel>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {form.watch('warehouse') && (
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
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Варианты товара (если сгруппированный) */}
                      {form.watch('grouped') && (
                        <div className="bg-card rounded-xl space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold">Варианты товара</h3>
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
                            >
                              Добавить вариант
                            </Button>
                          </div>

                          {fields.length > 0 ? (
                            <div className="grid gap-6">
                              {fields.map((fieldItem, idx) => (
                                <div
                                  key={fieldItem.id}
                                  className="bg-muted/40 rounded-xl p-6 space-y-6"
                                >
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Вариант #{idx + 1}</h4>
                                    {form.watch('subproducts')?.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                        onClick={() => remove(idx)}
                                      >
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
                                          <div className="flex items-center space-x-3">
                                            <Switch
                                              checked={field.value}
                                              onCheckedChange={field.onChange}
                                              id={`sub-warehouse-${idx}`}
                                            />
                                            <FormLabel
                                              htmlFor={`sub-warehouse-${idx}`}
                                              className="text-sm font-medium cursor-pointer"
                                            >
                                              Учитывать склад
                                            </FormLabel>
                                          </div>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    {form.getValues(`subproducts.${idx}.warehouse`) && (
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
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-8 bg-muted/40 rounded-xl">
                              Нет вариантов товара. Добавьте хотя бы один вариант.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {form.formState.errors.global && (
                    <div className="bg-destructive/10 text-destructive text-sm rounded-xl p-4">
                      {form.formState.errors.global.message}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
                    <Button type="submit" disabled={saving} className="sm:px-12 h-11">
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </Button>

                    {!!existingProduct && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10 h-11"
                          >
                            Удалить товар
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Удаление товара</DialogTitle>
                            <DialogDescription className="pt-2">
                              Вы действительно хотите удалить этот товар? Это действие нельзя
                              отменить.
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
                            >
                              {deleting ? 'Удаление...' : 'Удалить'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </BotLayout>
  );
}
