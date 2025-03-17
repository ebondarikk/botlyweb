import { useState, useEffect, useCallback } from 'react';
import { getCategories, updateCategories } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useCategories(
  botId,
  { initialOrderBy = '', initialDesc = false, initialPage = 1, limit } = {},
) {
  const [categories, setCategories] = useState([]);
  const [count, setCount] = useState(0);
  const [orderBy, _setOrderBy] = useState(initialOrderBy);
  const [page, setPage] = useState(initialPage);
  const [desc, _setDesc] = useState(initialDesc);
  const [search, _setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const pagesCount = Math.ceil(count / limit);

  const setOrderBy = (value) => {
    // setPage(1);
    _setOrderBy(value);
  };
  const setDesc = (value) => {
    // setPage(1);
    _setDesc(value);
  };
  const setSearch = (value) => {
    // setPage(1);
    _setSearch(value);
  };

  const loadCategories = useCallback(async () => {
    if (!botId) return;
    setLoading(true);
    try {
      const sortParam = orderBy ? `${desc ? '-' : ''}${orderBy}` : '';
      const response = await getCategories(botId, page, limit, sortParam, search);

      setCategories(response.categories);
      setCount(response.count);
    } catch (err) {
      toast.error(`Ошибка загрузки категорий: ${err?.message}` || err);
    } finally {
      setLoading(false);
    }
  }, [botId, orderBy, desc, search, page, limit]);

  useEffect(() => {
    if (!botId) return;
    loadCategories();
  }, [botId, orderBy, desc, search, page, limit, loadCategories]);

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

  const reorderCategories = async (data) => {
    setLoading(true);
    try {
      const response = await updateCategories(botId, data);
      setCategories(response.categories);
    } catch (err) {
      toast.error(`Ошибка обновления категорий: ${err?.message}` || err);
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    count,
    loading,
    orderBy,
    desc,
    search,
    setOrderBy,
    setDesc,
    setSearch,
    nextPage,
    previousPage,
    reorderCategories,
  };
}

export default useCategories;
