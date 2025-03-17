import React, { useState, useEffect, useCallback } from 'react';
import { loadProduct } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useProduct(botId, productId) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const getProduct = useCallback(
    async (productId) => {
      setLoading(true);
      try {
        const response = await loadProduct(botId, productId);
        setProduct(response);
      } catch (err) {
        toast.error(`Не удалось загрузить товар: ${err?.message}` || err);
      } finally {
        setLoading(false);
      }
    },
    [botId],
  );

  useEffect(() => {
    if (!botId || !productId) return;
    getProduct(productId);
  }, [botId, productId, getProduct]);

  return {
    product,
    setProduct,
    loading,
  };
}

export default useProduct;
