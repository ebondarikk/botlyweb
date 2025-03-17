'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUser } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useUsers(
  botId,
  {
    initialPage = 1,
    initialLimit = 10,
    // initialOrderBy = "",
    // initialDesc = false,
  } = {},
) {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  //   const [orderBy, _setOrderBy] = useState(initialOrderBy);
  //   const [desc, _setDesc] = useState(initialDesc);
  const [search, _setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  //   const [categoriesFilter, _setCategoriesFilter] = useState([]);
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [blockedFilter, setBlockedFilter] = useState('');

  const pagesCount = Math.ceil(count / limit);

  //   const setOrderBy = (value) => {
  //     setPage(1);
  //     _setOrderBy(value);
  //   };
  //   const setDesc = (value) => {
  //     setPage(1);
  //     _setDesc(value);
  //   };
  const setSearch = (value) => {
    setPage(1);
    _setSearch(value);
  };

  // eslint-disable-next-line no-underscore-dangle
  const _updateUser = useCallback(
    async (userId, ...params) => {
      if (loadingUserId) {
        toast.error('Дождитесь обновления предыдущего клиента');
        return;
      }
      setLoadingUserId(userId);
      try {
        const response = await updateUser(botId, userId, ...params);
        setUsers(
          users.map((user) => {
            if (user.id == userId) {
              return response;
            }
            return user;
          }),
        );
      } catch (err) {
        console.log(err);
      } finally {
        setLoadingUserId(null);
      }
    },
    [loadingUserId, users],
  );

  const loadUsers = useCallback(async () => {
    if (!botId) return;
    setLoading(true);
    try {
      //   const sortParam = orderBy ? `${desc ? "-" : ""}${orderBy}` : "";
      //   const categoriesParam = categoriesFilter.join(",");
      const response = await getUsers(botId, page, limit, search, blockedFilter);

      setUsers(page === initialPage ? response.users : [...users, ...response.users]);
      setCount(response.count);
    } catch (err) {
      toast.error(`Не удалось загрузить клиентов: ${err?.message}` || err);
    } finally {
      setLoading(false);
    }
  }, [botId, page, limit, search, blockedFilter]);

  useEffect(() => {
    if (!botId) return;
    loadUsers();
  }, [botId, page, limit, search, blockedFilter]);

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
    users,
    count,
    page,
    limit,
    pagesCount,
    blockedFilter,
    loading,
    // orderBy,
    // desc,
    search,
    loadingUserId,
    nextPage,
    previousPage,
    setPage,
    setLimit,
    // setOrderBy,
    // setDesc,
    setSearch,
    // setCategoriesFilter,
    setBlockedFilter,
    updateUser: _updateUser,
  };
}

export default useUsers;
