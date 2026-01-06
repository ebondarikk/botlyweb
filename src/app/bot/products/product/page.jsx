import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
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
  Info,
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
import ComponentsMultiSelect from '@/components/ComponentsMultiSelect';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '@/hooks/use-product';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProduct, createProduct, deleteProduct, getComponents, createComponent, getOptionGroupsShort } from '@/lib/api';
import { useCategories } from '@/hooks/use-categories';
import BotLayout from '@/app/bot/layout';
import { useBot } from '@/context/BotContext';
import { useTags } from '@/hooks/use-tags';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProductSchema } from './schema';

function getContrastTextColor(bgColor) {
  // Определяет, использовать ли белый или черный текст на фоне bgColor
  if (!bgColor) return '#000';
  let c = bgColor.replace('#', '');
  if (c.length === 3)
    c = c
      .split('')
      .map((x) => x + x)
      .join('');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  // Яркость по формуле WCAG
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000' : '#fff';
}

function TagChip({ tag, onRemove, dragOverlay }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tag.id,
  });
  const textColor = getContrastTextColor(tag.color);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging || dragOverlay ? 999 : undefined,
    opacity: isDragging || dragOverlay ? 0.85 : 1,
    cursor: dragOverlay ? 'grabbing' : 'grab',
    minWidth: '120px',
    height: '2.25rem',
    boxShadow: isDragging || dragOverlay ? '0 4px 16px 0 rgba(0,0,0,0.10)' : undefined,
    background: tag.color,
    pointerEvents: dragOverlay ? 'none' : undefined,
    paddingLeft: '12px',
    paddingRight: '12px',
    paddingTop: '4px',
    paddingBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '9999px',
    border: '1px solid var(--border)',
    color: textColor,
    fontWeight: 500,
    justifyContent: 'space-between',
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="shadow-sm transition select-none"
      {...attributes}
      {...listeners}
    >
      <span className="font-medium text-sm flex-1 truncate" style={{ color: textColor }}>
        {tag.name}
      </span>
      <button
        type="button"
        className="ml-2 text-lg"
        style={{ color: textColor }}
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
}

function getDefaultValues(product) {
  if (!product) {
    return {
      name: '',
      image: '',
      preview_image: '',
      price: '0.00',
      discount_price: '',
      description: '',
      category: '',
      grouped: false,
      frozen: false,
      warehouse: false,
      warehouse_count: 0,
      subproducts: [],
      components: [],
      option_groups: [],
    };
  }
  return {
    name: product.name || '',
    image: product.image || '',
    preview_image: product.preview_image || '',
    price: product.price || '0.00',
    discount_price: product.discount_price || '',
    description: product.description || '',
    category: product.category?.name || '',
    grouped: typeof product.grouped !== 'undefined' ? product.grouped : false,
    frozen: product.frozen || false,
    warehouse: product.warehouse || false,
    warehouse_count: product.warehouse_count || 0,
    subproducts:
      product.subproducts?.map((sub) => ({
        name: sub.name || '',
        frozen: sub.frozen || false,
        price: sub.price || product.price || '0.00',
        discount_price: sub.discount_price || '',
        warehouse: sub.warehouse || false,
        warehouse_count: sub.warehouse_count || 0,
      })) || [],
    components:
      product.components?.map((comp) => ({
        id: comp.id, // ID связи товар-компонент (для существующих)
        component_id: comp.component?.id || comp.component_id, // ID самого компонента
        index: comp.index || 0,
        is_removable: comp.is_removable !== undefined ? comp.is_removable : true,
        name: comp.component?.name || comp.name || '',
      })) || [],
    option_groups: product.option_groups?.map(group => group.id) || [],
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
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const {
    tags: allTags,
    loading: tagsLoading,
    refetch: refetchTags,
  } = useTags(tagsLoaded ? params.bot_id : null);

  // Состояние для компонентов
  const [availableComponents, setAvailableComponents] = useState([]);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [componentsLoaded, setComponentsLoaded] = useState(false);

  // Состояние для групп опций
  const [selectedOptionGroups, setSelectedOptionGroups] = useState([]);
  const [availableOptionGroups, setAvailableOptionGroups] = useState([]);
  const [optionGroupsLoading, setOptionGroupsLoading] = useState(false);
  const [optionGroupsLoaded, setOptionGroupsLoaded] = useState(false);

  // Создаем дополненный список категорий без мутации оригинального массива
  const categoriesWithEmpty = React.useMemo(() => {
    return [{ id: 'null', name: '-', value: '' }, ...categories];
  }, [categories]);

  const {
    product: existingProduct,
    setProduct: setExistingProduct,
    loading,
  } = useProduct(params.bot_id, params.product_id);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [activeDragTag, setActiveDragTag] = useState(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const [showMainDiscount, setShowMainDiscount] = useState(false);
  const [showSubDiscounts, setShowSubDiscounts] = useState({});

  const form = useForm({
    defaultValues: getDefaultValues(null), // Всегда начинаем с пустых значений
    resolver: zodResolver(ProductSchema),
    mode: 'all',
    reValidateMode: 'onChange',
  });

  const subproducts = useWatch({ control: form.control, name: 'subproducts' }) || [];
  const subPrices = subproducts.map((sub) => parseFloat(sub.price));
  const subDiscountValues = subproducts.map((sub) => parseFloat(sub.discount_price));

  // Единый useEffect для инициализации формы
  useEffect(() => {
    // Проверяем, что у нас есть все нужные данные
    if (!existingProduct || categoriesWithEmpty.length === 0 || formInitialized) {
      return;
    }

    // Получаем данные товара
    const productValues = getDefaultValues(existingProduct);
    // Корректируем категорию сразу в productValues
    const originalCategory = existingProduct.category;
    if (originalCategory && originalCategory.name) {
      // Ищем категорию в списке по ID или имени
      const foundCategory = categoriesWithEmpty.find((cat) => {
        return cat.id === originalCategory.id || cat.name === originalCategory.name;
      });

      if (foundCategory) {
        const valueToSet =
          foundCategory.value &&
          foundCategory.value !== 'undefined' &&
          foundCategory.value !== 'null'
            ? foundCategory.value
            : foundCategory.name;
        productValues.category = valueToSet;
      } else {
        productValues.category = '';
      }
    }

    // Заполняем форму сразу с правильной категорией
    form.reset(productValues);

    // Проверяем что установилось и принудительно устанавливаем категорию еще раз
    setTimeout(() => {
      const formCategory = form.getValues('category');
      if (productValues.category && formCategory !== productValues.category) {
        form.setValue('category', productValues.category, { shouldDirty: true });
      }
    }, 100);

    // Показываем поле скидки, если у товара уже есть скидка
    if (existingProduct.discount_price) {
      setShowMainDiscount(true);
    }

    // Показываем поля скидок для подтоваров, если они есть
    if (existingProduct.subproducts) {
      const subDiscounts = {};
      existingProduct.subproducts.forEach((sub, index) => {
        if (sub.discount_price) {
          subDiscounts[index] = true;
        }
      });
      setShowSubDiscounts(subDiscounts);
    }

    setFormInitialized(true);
  }, [existingProduct, categoriesWithEmpty, form, formInitialized]);

  // Сбрасываем состояние инициализации при смене товара или загрузке категорий
  useEffect(() => {
    setFormInitialized(false);
  }, [params.product_id, categories.length]);

  // useEffect для price
  useEffect(() => {
    const isGrouped = form.watch('grouped');
    if (isGrouped && subPrices.length > 0) {
      const prices = subPrices.filter((val) => !Number.isNaN(val) && val > 0);
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        form.setValue('price', minPrice.toFixed(2));
      }
    }
    // eslint-disable-next-line
  }, [form.watch('grouped'), ...subPrices]);

  // useEffect для discount_price
  useEffect(() => {
    const isGrouped = form.watch('grouped');
    if (isGrouped && subDiscountValues.length > 0) {
      const discounts = subDiscountValues.filter((val) => !Number.isNaN(val) && val > 0);
      if (discounts.length > 0) {
        const minDiscount = Math.min(...discounts);
        form.setValue('discount_price', minDiscount.toFixed(2));
      } else {
        form.setValue('discount_price', '');
      }
    }
    // eslint-disable-next-line
  }, [form.watch('grouped'), ...subDiscountValues]);

  useEffect(() => {
    if (existingProduct && Array.isArray(existingProduct.tags)) {
      // Если tags — массив объектов (с id, name, color), используем их напрямую
      if (existingProduct.tags.length > 0 && typeof existingProduct.tags[0] === 'object') {
        setSelectedTags(existingProduct.tags);
      } else {
        // Если tags — массив id
        setSelectedTags(
          existingProduct.tags.map((id) => allTags.find((t) => t.id === id)).filter(Boolean),
        );
      }
    }
  }, [existingProduct, allTags]);

  useEffect(() => {
    if (existingProduct && Array.isArray(existingProduct.option_groups)) {
      // Если option_groups — массив объектов, используем их напрямую
      if (existingProduct.option_groups.length > 0 && typeof existingProduct.option_groups[0] === 'object') {
        setSelectedOptionGroups(existingProduct.option_groups);
      } else {
        // Если option_groups — массив id
        setSelectedOptionGroups(
          existingProduct.option_groups.map((id) => availableOptionGroups.find((g) => g.id === id)).filter(Boolean),
        );
      }
    }
  }, [existingProduct, availableOptionGroups]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'subproducts',
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Drag and drop сортировка выбранных меток
  const handleTagDragStart = (event) => {
    const { active } = event;
    const tag = selectedTags.find((t) => t.id === active.id);
    setActiveDragTag(tag || null);
  };
  const handleTagDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragTag(null);
    if (!over || active.id === over.id) return;
    const oldIndex = selectedTags.findIndex((t) => t.id === active.id);
    const newIndex = selectedTags.findIndex((t) => t.id === over.id);
    setSelectedTags(arrayMove(selectedTags, oldIndex, newIndex));
  };
  const handleTagDragCancel = () => setActiveDragTag(null);

  // Добавление/удаление метки
  const handleTagToggle = (tag) => {
    if (selectedTags.some((t) => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter((t) => t.id !== tag.id));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const tags = selectedTags.map((t) => t.id);
      
      // Находим category_id по имени категории
      let category_id = null;
      if (data.category && data.category !== '') {
        const foundCategory = categories.find((cat) => {
          const catSelectValue = cat.value && cat.value !== 'undefined' && cat.value !== 'null' ? cat.value : cat.name;
          return catSelectValue === data.category;
        });
        category_id = foundCategory ? foundCategory.id : null;
      }
      
      // Подготавливаем компоненты для отправки
      const components = (data.components || []).map((comp, index) => {
        const componentData = {
          component_id: comp.component_id,
          index: index,
          is_removable: comp.is_removable,
        };
        
        // Если это существующий компонент (есть ID связи), добавляем его
        if (comp.id) {
          componentData.id = comp.id;
        }
        
        return componentData;
      });
      
      // Подготавливаем группы опций для отправки
      const option_groups = selectedOptionGroups.map((g) => g.id);
      
      const productData = {
        ...data,
        category_id,
        tags,
        components,
        option_groups,
      };
      
      // Удаляем поле category, так как теперь используем category_id
      delete productData.category;
      
      if (existingProduct) {
        const updatedProduct = await updateProduct(params.bot_id, existingProduct.id, productData);
        setExistingProduct(updatedProduct);
        toast.success('Данные обновлены');
      } else {
        const product = await createProduct(params.bot_id, productData);
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
        price: form.getValues('price') || '0.00',
        discount_price: '',
      });
    }
  };

  // Для select
  const handleSelectOpen = () => {
    if (!tagsLoaded) {
      setTagsLoaded(true);
      if (typeof refetchTags === 'function') refetchTags();
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

  // Загрузка групп опций
  const loadOptionGroups = async () => {
    if (optionGroupsLoaded) return;
    
    setOptionGroupsLoading(true);
    try {
      const response = await getOptionGroupsShort(params.bot_id);
      setAvailableOptionGroups(response.option_groups || []);
      setOptionGroupsLoaded(true);
    } catch (error) {
      console.error('Ошибка загрузки групп опций:', error);
      toast.error('Ошибка загрузки групп опций');
    } finally {
      setOptionGroupsLoading(false);
    }
  };

  // Добавление/удаление группы опций
  const handleOptionGroupToggle = (group) => {
    if (selectedOptionGroups.some((g) => g.id === group.id)) {
      setSelectedOptionGroups(selectedOptionGroups.filter((g) => g.id !== group.id));
    } else {
      setSelectedOptionGroups([...selectedOptionGroups, group]);
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
            onClick={() => navigate(`/${params.bot_id}/products`)}
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
                          render={({ field }) => {
                            const isGrouped = form.watch('grouped');

                            // Вычисляем минимальную цену подтоваров (ТОЛЬКО обычную цену)
                            const minSubPrice =
                              subproducts.length > 0
                                ? Math.min(...subproducts.map((sub) => parseFloat(sub.price) || 0))
                                : 0;

                            // Для сгруппированных товаров показываем минимальную обычную цену
                            const displayValue = isGrouped ? minSubPrice.toFixed(2) : field.value;

                            return (
                              <FormItem>
                                <div className="flex flex-row gap-4 w-full">
                                  <div className="w-full sm:w-32">
                                    <FormLabel className="text-sm mb-1">Цена</FormLabel>
                                  </div>
                                  <div className="w-full sm:w-32">
                                    <FormLabel className="text-sm mb-1">Цена со скидкой</FormLabel>
                                  </div>
                                </div>
                                <div className="flex flex-row gap-4 w-full">
                                  <div className="w-full sm:w-32">
                                    <FormControl>
                                      <Input
                                        className="h-11 w-full"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={displayValue}
                                        onChange={field.onChange}
                                        disabled={isGrouped}
                                        placeholder={isGrouped ? 'Автоматически' : '0.00'}
                                      />
                                    </FormControl>
                                  </div>
                                  <div className="w-full sm:w-32">
                                    <FormField
                                      control={form.control}
                                      name="discount_price"
                                      render={({ field: discountField }) => {
                                        const isProductGrouped = form.watch('grouped');

                                        return (
                                          <FormItem>
                                            <FormControl>
                                              <Input
                                                className="h-11 w-full"
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={discountField.value || ''}
                                                onChange={(e) => {
                                                  if (!isProductGrouped) {
                                                    discountField.onChange(e.target.value);
                                                  }
                                                }}
                                                disabled={isProductGrouped}
                                                placeholder={
                                                  isProductGrouped ? 'Автоматически' : '0.00'
                                                }
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        );
                                      }}
                                    />
                                  </div>
                                </div>
                              </FormItem>
                            );
                          }}
                        />

                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Категория</FormLabel>
                              <Select
                                value={field.value || ''}
                                onValueChange={(val) => {
                                  field.onChange(val === '-' ? '' : val);
                                }}
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Выберите категорию" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categoriesWithEmpty.map((cat) => {
                                    // Правильно определяем значение для Select
                                    const selectValue =
                                      cat.value && cat.value !== 'undefined' && cat.value !== 'null'
                                        ? cat.value
                                        : cat.name;
                                    return (
                                      <SelectItem key={cat.id} value={selectValue}>
                                        {cat.name}
                                      </SelectItem>
                                    );
                                  })}
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

                        <FormField
                          control={form.control}
                          name="tags"
                          render={() => {
                            const tagOptions = allTags.filter(
                              (t) => !selectedTags.some((st) => st.id === t.id),
                            );
                            let selectContent;
                            if (tagsLoading) {
                              selectContent = (
                                <div className="px-4 py-2 text-muted-foreground">Загрузка...</div>
                              );
                            } else if (tagOptions.length === 0) {
                              selectContent = (
                                <div className="px-4 py-2 text-muted-foreground">
                                  Нет доступных меток
                                </div>
                              );
                            } else {
                              selectContent = tagOptions.map((tag) => (
                                <SelectItem key={tag.id} value={tag.id}>
                                  <span
                                    className="inline-block w-4 h-4 rounded-full mr-2 align-middle"
                                    style={{ backgroundColor: tag.color }}
                                  />
                                  <span className="align-middle">{tag.name}</span>
                                </SelectItem>
                              ));
                            }
                            return (
                              <FormItem>
                                <div className="flex items-center gap-2 mb-1">
                                  <FormLabel>Метки</FormLabel>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex items-center cursor-pointer text-muted-foreground">
                                          <Info className="w-4 h-4" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-xs text-sm">
                                        Выделите товар цветной меткой (Акция, Скидка, Популярный
                                        товар и так далее).
                                        <br />
                                        Метки можно менять местами, перетаскивая их.
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragStart={handleTagDragStart}
                                    onDragEnd={handleTagDragEnd}
                                    onDragCancel={handleTagDragCancel}
                                  >
                                    <SortableContext
                                      items={selectedTags.map((t) => t.id)}
                                      strategy={rectSortingStrategy}
                                    >
                                      <div className="flex flex-wrap gap-2 mb-2">
                                        {selectedTags.map((tag) => (
                                          <TagChip
                                            key={tag.id}
                                            tag={tag}
                                            onRemove={() => handleTagToggle(tag)}
                                          />
                                        ))}
                                      </div>
                                    </SortableContext>
                                    <DragOverlay>
                                      {activeDragTag ? (
                                        <TagChip tag={activeDragTag} dragOverlay />
                                      ) : null}
                                    </DragOverlay>
                                  </DndContext>
                                  <Select
                                    onOpenChange={handleSelectOpen}
                                    onValueChange={(val) => {
                                      const tag = allTags.find((t) => t.id === val);
                                      if (tag) handleTagToggle(tag);
                                    }}
                                    disabled={selectedTags.length >= 5}
                                  >
                                    <SelectTrigger
                                      className="w-full h-11"
                                      disabled={selectedTags.length >= 5}
                                    >
                                      <SelectValue
                                        placeholder={
                                          tagsLoading ? 'Загрузка...' : 'Выберите метки'
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>{selectContent}</SelectContent>
                                  </Select>
                                  {selectedTags.length >= 5 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Можно выбрать не более 5 меток
                                    </div>
                                  )}
                                </div>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />

                        <FormField
                          control={form.control}
                          name="components"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-2 mb-1">
                                <FormLabel>Компоненты</FormLabel>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center cursor-pointer text-muted-foreground">
                                        <Info className="w-4 h-4" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-xs text-sm">
                                      Добавьте компоненты к товару (например, соусы, добавки).
                                      <br />
                                      Можно настроить, является ли компонент удаляемым при заказе.
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <ComponentsMultiSelect
                                value={field.value || []}
                                onChange={field.onChange}
                                availableComponents={availableComponents}
                                onCreateComponent={handleCreateComponent}
                                loading={componentsLoading}
                                onOpen={loadComponents}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="option_groups"
                          render={() => {
                            const optionGroupOptions = availableOptionGroups.filter(
                              (g) => !selectedOptionGroups.some((sg) => sg.id === g.id),
                            );
                            let selectContent;
                            if (optionGroupsLoading) {
                              selectContent = (
                                <div className="px-4 py-2 text-muted-foreground">Загрузка...</div>
                              );
                            } else if (optionGroupOptions.length === 0) {
                              selectContent = (
                                <div className="px-4 py-2 text-muted-foreground">
                                  Нет доступных групп опций
                                </div>
                              );
                            } else {
                              selectContent = optionGroupOptions.map((group) => (
                                <SelectItem key={group.id} value={group.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span className="align-middle">{group.name || 'Без названия'}</span>
                                    {!group.is_active && (
                                      <Badge variant="secondary" className="text-xs">
                                        Неактивна
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ));
                            }
                            return (
                              <FormItem>
                                <div className="flex items-center gap-2 mb-1">
                                  <FormLabel>Группы опций</FormLabel>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex items-center cursor-pointer text-muted-foreground">
                                          <Info className="w-4 h-4" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="max-w-xs text-sm">
                                        Привяжите группы опций к товару для предложения дополнений
                                        (соусы, добавки и т.д.).
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedOptionGroups.map((group) => (
                                      <div
                                        key={group.id}
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-md text-sm font-medium"
                                      >
                                        <span className="truncate">{group.name || 'Без названия'}</span>
                                        <button
                                          type="button"
                                          className="text-primary/70 hover:text-primary"
                                          onClick={() => handleOptionGroupToggle(group)}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <Select
                                    onOpenChange={(open) => {
                                      if (open && !optionGroupsLoaded) {
                                        loadOptionGroups();
                                      }
                                    }}
                                    onValueChange={(val) => {
                                      const group = availableOptionGroups.find((g) => g.id === parseInt(val));
                                      if (group) handleOptionGroupToggle(group);
                                    }}
                                  >
                                    <SelectTrigger className="w-full h-11">
                                      <SelectValue
                                        placeholder={
                                          optionGroupsLoading ? 'Загрузка...' : 'Выберите группы опций'
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>{selectContent}</SelectContent>
                                  </Select>
                                </div>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
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
                                    price: '0.00',
                                    discount_price: '',
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
                                            onClick={() => {
                                              remove(idx);
                                              // Очищаем состояние скидки для удаленного подтовара
                                              setShowSubDiscounts((prev) => {
                                                const newState = { ...prev };
                                                delete newState[idx];
                                                // Сдвигаем индексы для подтоваров после удаленного
                                                Object.keys(newState).forEach((key) => {
                                                  const keyNum = parseInt(key, 10);
                                                  if (keyNum > idx) {
                                                    newState[keyNum - 1] = newState[keyNum];
                                                    delete newState[keyNum];
                                                  }
                                                });
                                                return newState;
                                              });
                                            }}
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

                                      <FormField
                                        control={form.control}
                                        name={`subproducts.${idx}.price`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <div className="flex flex-row gap-4 w-full">
                                              <div className="w-full sm:w-32">
                                                <FormLabel className="text-sm mb-1">Цена</FormLabel>
                                              </div>
                                              <div className="w-full sm:w-32">
                                                <FormLabel className="text-sm mb-1">
                                                  Цена со скидкой
                                                </FormLabel>
                                              </div>
                                            </div>
                                            <div className="flex flex-row gap-4 w-full">
                                              <div className="w-full sm:w-32">
                                                <FormControl>
                                                  <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    className="h-11 w-full"
                                                    {...field}
                                                  />
                                                </FormControl>
                                              </div>
                                              <div className="w-full sm:w-32">
                                                <FormField
                                                  control={form.control}
                                                  name={`subproducts.${idx}.discount_price`}
                                                  render={({ field: subDiscountField }) => (
                                                    <FormItem>
                                                      <FormControl>
                                                        <Input
                                                          type="number"
                                                          step="0.01"
                                                          min="0.01"
                                                          className="h-11 w-full"
                                                          value={subDiscountField.value || ''}
                                                          onChange={(e) => {
                                                            subDiscountField.onChange(
                                                              e.target.value,
                                                            );
                                                          }}
                                                          placeholder="0.00"
                                                        />
                                                      </FormControl>
                                                      <FormMessage />
                                                    </FormItem>
                                                  )}
                                                />
                                              </div>
                                            </div>
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
