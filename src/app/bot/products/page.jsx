import * as React from 'react';
import { useProducts } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';
import { useBot } from '@/context/BotContext';
import InfiniteScroll from 'react-infinite-scroll-component';

import { Skeleton } from '@/components/ui/skeleton'; // Добавил импорт скелетонов
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@/components/ui/card';
import { ArrowDownNarrowWide, ArrowDownWideNarrow, SearchIcon, ImageIcon } from 'lucide-react';
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

const sorting = [
  { name: 'По названию', value: 'name' },
  { name: 'По стоимости', value: 'price' },
  { name: 'По кол-ву на складе', value: 'warehouse_count' },
];

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

  return (
    <BotLayout>
      <div className="w-full px-4 md:px-8">
        {/* Панель управления */}
        <div className="flex gap-4 py-4 flex-wrap justify-between">
          <div className="w-full lg:w-fit">
            <Tabs value={groupedFilter} onValueChange={setGroupedFilter}>
              <TabsList className="w-full">
                <TabsTrigger value="" className="w-full">
                  Все
                </TabsTrigger>
                <TabsTrigger value="false" className="w-full">
                  Простые
                </TabsTrigger>
                <TabsTrigger value="true" className="w-full">
                  Сгруппированные
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-fit">
            {/* <Label htmlFor="category_filter">Категории:</Label> */}
            <DropdownMenu placeholder="Категория" className="w-full">
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full truncate">
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
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="search"
              type="search"
              value={search}
              placeholder="Поиск..."
              className="pl-10"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {/* Информация о найденных товарах */}
        <div className="flex py-2 flex-col md:flex-row justify-between w-full gap-4">
          <div className="text-lg">Найдено {count} товаров</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDesc(!desc)}>
              {desc ? <ArrowDownWideNarrow /> : <ArrowDownNarrowWide />}
            </Button>
            <Select onValueChange={setOrderBy} defaultValue={orderBy}>
              <SelectTrigger className="w-44">
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
          <Button asChild>
            <Link to="add" className="btn-primary">
              Добавить товар
            </Link>
          </Button>
        </div>

        {/* Скелетоны товаров при загрузке */}
        {loading && !products.length && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 p-2 md:p-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <Card key={index} className="flex flex-col h-[500px] custom-card">
                <div className="relative h-48">
                  <Skeleton className="absolute inset-0 rounded-t-lg bg-muted" />
                </div>
                <CardContent className="flex flex-col flex-grow mt-4 space-y-2.5 px-4">
                  <Skeleton className="h-7 w-3/4 bg-muted" />
                  <Skeleton className="h-16 w-full bg-muted" />
                  <div className="space-y-2 mt-2">
                    <Skeleton className="h-5 w-2/3 bg-muted" />
                    <Skeleton className="h-5 w-3/4 bg-muted" />
                    <Skeleton className="h-5 w-1/2 bg-muted" />
                  </div>
                </CardContent>
                <CardFooter className="mt-auto pt-4 px-4 flex justify-between items-center border-t">
                  <Skeleton className="h-6 w-20 bg-muted" />
                  <Skeleton className="h-7 w-24 bg-muted" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Карточки товаров */}
        <InfiniteScroll
          dataLength={products.length}
          next={nextPage}
          hasMore={products.length < count}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 p-2 px-0 md:p-4"
          scrollThreshold={0.8}
          loader={
            <div className="col-span-full flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }
        >
          {products.map((product) => (
            <a href={`/${bot.id}/products/${product.id}`} key={product.id}>
              <Card
                className={`relative flex h-full flex-col transition-all duration-300 ease-in-out 
                    hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 
                    // ${product.frozen ? 'opacity-60' : ''} 
                    group border-border/50 hover:border-primary/50 custom-card overflow-hidden`}
              >
                {/* Метки */}
                <div className="absolute z-10 top-3 right-3 flex flex-col gap-1">
                  {product.frozen && (
                    <span className="bg-destructive/90 text-destructive-foreground text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                      Скрыт
                    </span>
                  )}
                  {product.warehouse && product.warehouse_count < 10 && (
                    <span className="bg-warning/90 text-warning-foreground text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                      Мало на складе
                    </span>
                  )}
                </div>
                {/* Изображение */}
                <div className="relative w-full h-48">
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${product.preview_image})`,
                      backgroundColor: 'rgb(243 244 246)',
                    }}
                  />
                  {!product.preview_image && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                {/* Контент */}
                <CardContent className="flex flex-col flex-grow mt-4 space-y-2.5 px-5">
                  <CardTitle className="text-lg font-semibold line-clamp-2 leading-tight text-foreground/90">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground/80 line-clamp-3">
                    {product.description || 'Описание отсутствует'}
                  </CardDescription>
                  <div className="space-y-1.5 mt-1">
                    <div className="text-sm flex items-center gap-2">
                      <span className="text-muted-foreground/70">Тип:</span>
                      <span className="font-medium">
                        {product.grouped ? 'Сгруппированный' : 'Простой'}
                      </span>
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      <span className="text-muted-foreground/70">Категория:</span>
                      <span className="font-medium">{product.category || '-'}</span>
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      <span className="text-muted-foreground/70">Склад:</span>
                      <span className="font-medium">
                        {product.warehouse ? product.warehouse_count || '0' : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
                {/* Футер */}
                <CardFooter className="mt-auto pt-4 px-5 flex justify-between items-center border-t border-border/40">
                  <div className="flex items-center gap-3">
                    <Label htmlFor={`${product.id}_frozen`} className="text-sm font-medium">
                      Скрыт
                    </Label>
                    <Switch
                      id={`${product.id}_frozen`}
                      checked={product.frozen}
                      disabled={loadingProductId === product.id}
                      onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        await updateProduct(product.id, {
                          frozen: e.target.children[0].dataset.state === 'unchecked',
                        });
                      }}
                      onCheckedChange={async (e) => {
                        await updateProduct(product.id, { frozen: e });
                      }}
                    />
                  </div>
                  <span className="text-lg font-bold text-foreground">
                    {product.price} {bot.currency}
                  </span>
                </CardFooter>
              </Card>
            </a>
          ))}
        </InfiniteScroll>
      </div>
    </BotLayout>
  );
}
