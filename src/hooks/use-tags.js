import { useState, useEffect, useCallback } from 'react';
import { getTags, updateTags } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useTags(
  botId,
  { initialOrderBy = '', initialDesc = false, initialPage = 1, limit } = {},
) {
  const [tags, setTags] = useState([]);
  const [count, setCount] = useState(0);
  const [orderBy, _setOrderBy] = useState(initialOrderBy);
  const [page, setPage] = useState(initialPage);
  const [desc, _setDesc] = useState(initialDesc);
  const [search, _setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const pagesCount = Math.ceil(count / limit);

  const setOrderBy = (value) => {
    _setOrderBy(value);
  };
  const setDesc = (value) => {
    _setDesc(value);
  };
  const setSearch = (value) => {
    _setSearch(value);
  };

  const loadTags = useCallback(async () => {
    if (!botId) return;
    setLoading(true);
    try {
      const sortParam = orderBy ? `${desc ? '-' : ''}${orderBy}` : '';
      const response = await getTags(botId, page, limit, sortParam, search);
      setTags(response.tags);
      setCount(response.count);
    } catch (err) {
      toast.error(`Ошибка загрузки тегов: ${err?.message}` || err);
    } finally {
      setLoading(false);
    }
  }, [botId, orderBy, desc, search, page, limit]);

  useEffect(() => {
    if (!botId) return;
    loadTags();
  }, [botId, orderBy, desc, search, page, limit, loadTags]);

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

  const reorderTags = async (data) => {
    setLoading(true);
    try {
      const response = await updateTags(botId, data);
      setTags(response.tags);
    } catch (err) {
      toast.error(`Ошибка обновления тегов: ${err?.message}` || err);
    } finally {
      setLoading(false);
    }
  };

  return {
    tags,
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
    reorderTags,
  };
}

export default useTags;
