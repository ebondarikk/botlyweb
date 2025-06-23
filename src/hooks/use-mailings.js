import { useState, useEffect, useCallback } from 'react';
import { getMailings, getMailing, createMailing, updateMailing } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useMailings(
  botId,
  { initialOrderBy = '', initialDesc = false, initialPage = 1, limit } = {},
) {
  const [mailings, setMailings] = useState([]);
  const [count, setCount] = useState(0);
  const [orderBy, _setOrderBy] = useState(initialOrderBy);
  const [page, setPage] = useState(initialPage);
  const [desc, _setDesc] = useState(initialDesc);
  const [search, _setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishedFilter, setPublishedFilter] = useState('');

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

  const loadMailings = useCallback(async () => {
    if (!botId) return;
    setLoading(true);
    try {
      const sortParam = orderBy ? `${desc ? '-' : ''}${orderBy}` : '';
      const response = await getMailings(botId, page, limit, sortParam, search, publishedFilter);

      setMailings(response.mailings);
      setCount(response.count);
    } catch (err) {
      toast.error(`Ошибка загрузки новостей: ${err?.message}` || err);
    } finally {
      setLoading(false);
    }
  }, [botId, orderBy, desc, search, page, limit, publishedFilter]);

  useEffect(() => {
    if (!botId) return;
    loadMailings();
  }, [botId, orderBy, desc, search, page, limit, loadMailings]);

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
    mailings,
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
    loadMailings,
    publishedFilter,
    setPublishedFilter,
  };
}

export default useMailings;
