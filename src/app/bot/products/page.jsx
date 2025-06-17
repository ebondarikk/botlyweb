import * as React from 'react';
import { useProducts } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
import { useBot } from '@/context/BotContext';
import InfiniteScroll from 'react-infinite-scroll-component';
import { motion, AnimatePresence } from 'framer-motion';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@/components/ui/card';
import {
  ArrowDownNarrowWide,
  ArrowDownWideNarrow,
  SearchIcon,
  ImageIcon,
  Package,
  Filter,
  Plus,
  Layers,
  Tag,
  Box,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectItem,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import BotLayout from '@/app/bot/layout';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const sorting = [
  { name: 'По названию', value: 'name', icon: Package },
  { name: 'По стоимости', value: 'price', icon: Package },
  { name: 'По кол-ву на складе', value: 'warehouse_count', icon: Package },
];

function getContrastTextColor(bgColor) {
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
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000' : '#fff';
}

export default function ProductList() {
  const { bot } = useBot();
  const {
    products,
    count,
    loading,
    loadingProductId,
    groupedFilter,
    orderBy,
    desc,
    search,
    categoriesFilter,
    nextPage,
    setOrderBy,
    setDesc,
    setSearch,
    setGroupedFilter,
    setCategoriesFilter,
    updateProduct,
  } = useProducts(bot?.id, {
    initialPage: 1,
    initialLimit: 12,
    initialOrderBy: 'name',
    initialDesc: false,
  });

  const { categories } = useCategories(bot?.id);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
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
    <BotLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full px-4 md:px-8"
      >
        {/* Панель управления */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-4 py-6 flex-wrap justify-between"
        >
          <div className="w-full lg:w-fit">
            <Tabs value={groupedFilter} onValueChange={setGroupedFilter} className="w-full">
              <TabsList className="w-full bg-muted/50 p-1">
                <TabsTrigger
                  value=""
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Все
                </TabsTrigger>
                <TabsTrigger
                  value="false"
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Простые
                </TabsTrigger>
                <TabsTrigger
                  value="true"
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Сгруппированные
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-fit">
            <DropdownMenu placeholder="Категория" className="w-full">
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <Filter className="w-4 h-4" />
                  {categoriesFilter.length ? categoriesFilter.join(', ') : 'Все категории'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Выберите категории</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category.id}
                    checked={categoriesFilter.includes(category.name)}
                    onCheckedChange={(value) =>
                      setCategoriesFilter(
                        value
                          ? [...categoriesFilter, category.name]
                          : categoriesFilter.filter((c) => c !== category.name),
                      )
                    }
                  >
                    {category.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="relative w-full lg:w-64">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              id="search"
              type="search"
              value={search}
              placeholder="Поиск..."
              className="pl-10 bg-muted/50 border-none"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </motion.div>

        {/* Информация о найденных товарах */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, delay: 0.3 }}
          className="flex py-4 flex-col md:flex-row justify-between w-full gap-4 items-center"
        >
          <div className="text-lg font-medium">
            {loading ? <Skeleton className="h-6 w-48 bg-muted/50" /> : `Найдено ${count} товаров`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDesc(!desc)}
              className="bg-muted/50 border-none hover:bg-muted"
            >
              {desc ? (
                <ArrowDownWideNarrow className="w-4 h-4" />
              ) : (
                <ArrowDownNarrowWide className="w-4 h-4" />
              )}
            </Button>
            <Select onValueChange={setOrderBy} defaultValue={orderBy}>
              <SelectTrigger className="w-44 bg-muted/50 border-none">
                <SelectValue value={orderBy} placeholder="Сортировать по" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Сортировка</SelectLabel>
                  {sorting.map((sort) => (
                    <SelectItem key={sort.value} value={sort.value}>
                      {sort.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    asChild
                    className={`transition-all duration-200 ${
                      bot?.products_limit !== null && bot?.products_limit <= 0
                        ? 'bg-muted cursor-not-allowed opacity-60'
                        : 'bg-primary hover:bg-primary/90'
                    }`}
                    disabled={bot?.products_limit !== null && bot?.products_limit <= 0}
                  >
                    <Link
                      to={bot?.products_limit !== null && bot?.products_limit <= 0 ? '#' : 'add'}
                      className="flex items-center gap-2"
                      onClick={(e) => {
                        if (bot?.products_limit !== null && bot?.products_limit <= 0) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Добавить товар
                    </Link>
                  </Button>
                </div>
              </TooltipTrigger>
              {bot?.products_limit !== null && bot?.products_limit <= 0 && (
                <TooltipContent>
                  <p>
                    Лимит товаров исчерпан. Для добавления новых товаров необходимо повысить тариф.
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        {/* Скелетоны товаров при загрузке */}
        {loading && !products.length && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 p-2 md:p-4"
          >
            {Array.from({ length: 12 }).map((_, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="flex flex-col h-[460px] custom-card">
                  <div className="relative h-56">
                    <Skeleton className="absolute inset-0 rounded-t-lg bg-muted/50" />
                  </div>
                  <CardContent className="flex flex-col flex-grow mt-2 space-y-1.5 px-4">
                    <Skeleton className="h-7 w-3/4 bg-muted/50" />
                    <Skeleton className="h-16 w-full bg-muted/50" />
                    <div className="space-y-2 mt-2">
                      <Skeleton className="h-5 w-2/3 bg-muted/50" />
                      <Skeleton className="h-5 w-3/4 bg-muted/50" />
                      <Skeleton className="h-5 w-1/2 bg-muted/50" />
                    </div>
                  </CardContent>
                  <CardFooter className="mt-auto pt-2 px-4 flex justify-between items-center border-t border-border/10">
                    <Skeleton className="h-6 w-20 bg-muted/50" />
                    <Skeleton className="h-7 w-24 bg-muted/50" />
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Карточки товаров */}
        <InfiniteScroll
          dataLength={products.length}
          next={nextPage}
          hasMore={products.length < count}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 p-2 px-0 md:p-4"
          scrollThreshold={0.6}
          loader={
            <div className="col-span-full flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }
        >
          <AnimatePresence>
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ y: -3 }}
              >
                <Link to={`/${bot.id}/products/${product.id}`}>
                  <Card
                    className={`relative flex h-full flex-col transition-all duration-300 ease-in-out 
                      group border-border/50 hover:border-primary/50 custom-card overflow-hidden
                      backdrop-blur-sm bg-card/95
                      ${product.frozen ? 'opacity-80 hover:opacity-100' : ''}`}
                  >
                    {/* Метки */}
                    <div className="absolute z-10 top-2 right-2 flex flex-col gap-1">
                      <AnimatePresence>
                        {product.frozen && (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-1.5 bg-destructive/90 text-destructive-foreground text-xs px-2.5 py-1.5 rounded-full font-medium shadow-sm"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Скрыт</span>
                          </motion.div>
                        )}
                        {product.warehouse && product.warehouse_count < 10 && (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-1.5 bg-warning/90 text-warning-foreground text-xs px-2.5 py-1.5 rounded-full font-medium shadow-sm"
                          >
                            <Box className="w-3.5 h-3.5" />
                            <span>Мало на складе</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Изображение */}
                    <motion.div
                      className="relative w-full h-[200px] overflow-hidden group flex-shrink-0"
                      whileHover="hover"
                    >
                      <motion.div
                        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                        style={{
                          backgroundImage: `url(${product.preview_image})`,
                          backgroundColor: 'rgb(243 244 246)',
                        }}
                        variants={{
                          hover: {
                            scale: 1.1,
                            transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                          },
                        }}
                      />
                      {!product.preview_image && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                          <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                        </div>
                      )}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0"
                        variants={{
                          hover: {
                            opacity: 1,
                            transition: { duration: 0.3 },
                          },
                        }}
                      />
                    </motion.div>

                    {/* Контент */}
                    <CardContent className="flex flex-col flex-grow space-y-1.5 px-4">
                      <div>
                        <CardTitle className="text-lg font-semibold line-clamp-2 py-4 leading-tight text-foreground/90 group-hover:text-primary transition-colors">
                          {product.name}
                        </CardTitle>
                        {/* Метки товара сразу под названием */}
                        {Array.isArray(product.tags) && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 mb-2">
                            {product.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="px-2 py-1 rounded-md text-xs font-medium shadow-sm border border-border"
                                style={{
                                  background: tag.color,
                                  color: getContrastTextColor(tag.color),
                                  maxWidth: '120px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={tag.name}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <CardDescription className="text-sm text-muted-foreground/80 line-clamp-3 mt-2">
                          {product.description || 'Описание отсутствует'}
                        </CardDescription>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/5 text-primary">
                            <Layers className="w-4 h-4" />
                            <span className="font-medium">
                              {product.grouped ? 'Сгруппированный' : 'Простой'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground/80">
                              {product.category || 'Без категории'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted">
                            <Box className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground/80">
                              {product.warehouse
                                ? `${product.warehouse_count || '0'} шт.`
                                : 'Нет на складе'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    {/* Футер */}
                    <CardFooter className="flex-shrink-0 pt-2 px-4 flex justify-between items-center border-t border-border/10">
                      <div className="flex items-center gap-3">
                        <Label
                          htmlFor={`${product.id}_frozen`}
                          className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                        >
                          {product.frozen ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-muted-foreground">
                            {product.frozen ? 'Скрыт' : 'Виден'}
                          </span>
                        </Label>
                        <Switch
                          id={`${product.id}_frozen`}
                          checked={product.frozen}
                          disabled={loadingProductId === product.id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            await updateProduct(product.id, { frozen: !product.frozen });
                          }}
                          // onCheckedChange={async (checked) => {
                          //   console.log(checked);
                          //   await updateProduct(product.id, { frozen: checked });
                          // }}
                        />
                      </div>
                      <motion.div
                        className="flex items-baseline gap-1"
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="text-2xl font-bold text-foreground">{product.price}</span>
                        <span className="text-sm text-muted-foreground font-medium">
                          {bot.currency}
                        </span>
                      </motion.div>
                    </CardFooter>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </InfiniteScroll>
      </motion.div>
    </BotLayout>
  );
}
