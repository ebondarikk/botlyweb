'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProducts, updateProduct } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useProducts(
  botId,
  { initialPage = 1, initialLimit = 10, initialOrderBy = '', initialDesc = false } = {},
) {
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [orderBy, _setOrderBy] = useState(initialOrderBy);
  const [desc, _setDesc] = useState(initialDesc);
  const [search, _setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [categoriesFilter, _setCategoriesFilter] = useState([]);
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [groupedFilter, setGroupedFilter] = useState('');

  const pagesCount = Math.ceil(count / limit);

  const setOrderBy = (value) => {
    setPage(1);
    _setOrderBy(value);
  };
  const setDesc = (value) => {
    setPage(1);
    _setDesc(value);
  };
  const setSearch = (value) => {
    setPage(1);
    _setSearch(value);
  };

  const setCategoriesFilter = (value) => {
    setPage(1);
    _setCategoriesFilter(value);
  };

  // eslint-disable-next-line no-underscore-dangle
  const _updateProduct = useCallback(
    async (productId, ...params) => {
      if (loadingProductId) {
        toast.error('Дождитесь обновления предыдущего товара');
        return;
      }
      setLoadingProductId(productId);
      try {
        const response = await updateProduct(botId, productId, ...params);
        setProducts(
          products.map((product) => {
            if (product.id == productId) {
              return response;
            }
            return product;
          }),
        );
      } catch (err) {
        console.log(err);
      } finally {
        setLoadingProductId(null);
      }
    },
    [loadingProductId, products],
  );

  const loadProducts = useCallback(async () => {
    if (!botId) return;
    setLoading(true);
    try {
      const sortParam = orderBy ? `${desc ? '-' : ''}${orderBy}` : '';
      const categoriesParam = categoriesFilter.join(',');
      const response = await getProducts(
        botId,
        page,
        limit,
        sortParam,
        search,
        categoriesParam,
        groupedFilter,
      );

      if (page === initialPage) {
        setProducts(response.products);
      } else {
        setProducts((prevProducts) => [...prevProducts, ...response.products]);
      }
      setCount(response.count);
    } catch (err) {
      toast.error(`Ошибка загрузки вариантов: ${err?.message}` || err);
    } finally {
      setLoading(false);
    }
  }, [botId, page, limit, orderBy, desc, search, categoriesFilter, groupedFilter, initialPage]);

  // Логика загрузки. Если один из параметров (page, limit, orderBy, desc, search) меняется —
  // просто делаем запрос.
  useEffect(() => {
    if (!botId) return;
    loadProducts();
  }, [botId, page, limit, orderBy, desc, search, categoriesFilter, groupedFilter]);

  const nextPage = () => {
    if (page < pagesCount) {
      setPage((prev) => prev + 1);
    }
  };

  const previousPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  return {
    products,
    count,
    page,
    limit,
    pagesCount,
    categoriesFilter,
    loading,
    orderBy,
    desc,
    search,
    groupedFilter,
    loadingProductId,
    nextPage,
    previousPage,
    setPage,
    setLimit,
    setOrderBy,
    setDesc,
    setSearch,
    setCategoriesFilter,
    setGroupedFilter,
    updateProduct: _updateProduct,
  };
}

export default useProducts;
