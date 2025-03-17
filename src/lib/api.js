import { toast } from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Функция-обёртка для API-запросов.
 *
 * Добавляет базовый домен, автоматически передаёт access_token (если есть)
 * и обрабатывает ошибки:
 * - 401: удаляет токен и перенаправляет на страницу логина,
 * - 400-499: выводит toast с предупреждением и текстом ошибки,
 * - 500+: выводит toast "ошибка сервера".
 *
 * @param {string} url - URL запроса (без базового домена).
 * @param {object} options - Опции для fetch.
 * @returns {Promise<any>} - Результат запроса (JSON).
 */
async function apiRequest(url, options = {}) {
  const fullUrl = `${BASE_URL}${url}`;

  // Добавляем заголовок авторизации, если access_token найден
  const token = localStorage.getItem('access_token');
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  let response;
  try {
    response = await fetch(fullUrl, options);
  } catch (error) {
    // toast.error('Ошибка сети');
    throw error;
  }

  if (!response.ok) {
    let errorMessage = '';
    try {
      const errorData = await response.json();
      // Попытаемся получить текст ошибки из ответа
      errorMessage = errorData?.detail || errorData?.error || 'Ошибка запроса';
    } catch (e) {
      errorMessage = 'Ошибка запроса';
    }

    if (response.status === 401) {
      toast.error('Неавторизованный запрос. Пожалуйста, войдите заново.');
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    } else if (response.status >= 400 && response.status < 500) {
      // toast.error(errorMessage);
    } else if (response.status >= 500) {
      toast.error('Ошибка сервера');
    }

    const error = new Error(`HTTP error! status: ${response.status} - ${errorMessage}`);
    error.status = response.status;
    error.statusText = response.statusText;
    error.url = response.url;
    error.timestamp = new Date().toISOString();
    error.details = {
      errorMessage,
      headers: Object.fromEntries(response.headers.entries()),
      method: response.type,
    };
    throw error;
  }

  if (response.status === 204) {
    return true;
  }

  return response.json();
}

/**
 * Telegram Auth
 *
 * OpenAPI: POST /auth/telegram
 * Схема запроса: TelegramAuth
 * Схема ответа: LoginResponse
 *
 * @param {object} telegramAuthData - Объект авторизации Telegram.
 */
export async function telegramAuth(telegramAuthData) {
  return apiRequest('/auth/telegram', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(telegramAuthData),
  });
}

/**
 * Получение списка ботов.
 *
 * OpenAPI: GET /bots/
 * Схема ответа: BotListResponse
 *
 * @returns {Promise<object>} - Объект с массивом ботов.
 */
export async function getBots() {
  return apiRequest('/bots/', {
    method: 'GET',
  });
}

/**
 * Получение детальной информации о боте.
 *
 * OpenAPI: GET /bots/{bot_id}
 * Схема ответа: BotResponse
 *
 * @param {number} botId - Идентификатор бота.
 */
export async function getBotDetail(botId) {
  return apiRequest(`/bots/${botId}`, {
    method: 'GET',
  });
}

/**
 * Обновление данных бота.
 *
 * OpenAPI: PUT /bots/{bot_id}
 * Схема запроса: BotUpdate
 * Схема ответа: BotResponse
 *
 * @param {number} botId - Идентификатор бота.
 * @param {object} botUpdateData - Данные для обновления.
 */
export async function updateBot(botId, botUpdateData) {
  return apiRequest(`/bots/${botId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(botUpdateData),
  });
}

export async function getProducts(botId, page, limit, order_by, search, categories, grouped) {
  const params = {
    page,
    limit,
    order_by,
    search,
    categories,
  };

  if (grouped !== '') {
    params.grouped = grouped;
  }

  const queryParams = new URLSearchParams(params).toString();

  return apiRequest(`/bots/${botId}/products/?${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function getMailings(botId, page, limit, order_by, search, published) {
  const params = {
    order_by,
    search,
    page,
    limit,
  };

  if (published !== '') {
    params.published = published.toString();
  }

  console.log(params);
  console.log(published);

  const queryParams = new URLSearchParams(params).toString();

  return apiRequest(`/bots/${botId}/mailings/?${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function getMailing(botId, mailingId) {
  return apiRequest(`/bots/${botId}/mailings/${mailingId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function createMailing(botId, mailing) {
  return apiRequest(`/bots/${botId}/mailings/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mailing),
  });
}

export async function updateMailing(botId, mailingId, mailing) {
  return apiRequest(`/bots/${botId}/mailings/${mailingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mailing),
  });
}

export async function publishMailing(botId, mailingId) {
  return apiRequest(`/bots/${botId}/mailings/${mailingId}/publish`, {
    method: 'POST',
  });
}

export async function getCategories(botId, page, limit, order_by, search) {
  const queryParams = new URLSearchParams({
    order_by,
    search,
    page,
    limit,
  }).toString();

  return apiRequest(`/bots/${botId}/categories/?${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function updateCategories(botId, data) {
  return apiRequest(`/bots/${botId}/categories/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ categories: data }),
  });
}

export async function deleteCategory(botId, categoryId) {
  return apiRequest(`/bots/${botId}/categories/${categoryId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function createCategory(botId, ...params) {
  return apiRequest(`/bots/${botId}/categories/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(...params),
  });
}

export async function updateCategory(botId, categoryId, ...params) {
  return apiRequest(`/bots/${botId}/categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(...params),
  });
}

export async function updateProduct(botId, productId, ...params) {
  return apiRequest(`/bots/${botId}/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(...params),
  });
}

export async function createProduct(botId, ...params) {
  return apiRequest(`/bots/${botId}/products/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(...params),
  });
}

export async function loadProduct(botId, productId) {
  return apiRequest(`/bots/${botId}/products/${productId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function loadCategory(botId, categoryId) {
  return apiRequest(`/bots/${botId}/categories/${categoryId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'applications/json',
    },
  });
}

export async function deleteProduct(botId, productId) {
  return apiRequest(`/bots/${botId}/products/${productId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest('/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function getUsers(
  botId,
  page,
  limit,
  // order_by,
  search,
  blocked,
) {
  const params = {
    page,
    limit,
    // order_by,
    search,
  };

  if (blocked !== '') {
    params.blocked = blocked;
  }

  const queryParams = new URLSearchParams(params).toString();

  return apiRequest(`/bots/${botId}/users/?${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function updateUser(botId, userId, ...params) {
  return apiRequest(`/bots/${botId}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(...params),
  });
}

export async function uploadImage(formData) {
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  const data = await response.json();
  return data.url;
}
