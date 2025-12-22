import { toast } from 'react-hot-toast';

// const BASE_URL = import.meta.env.VITE_API_URL;
const BASE_URL = 'https://botly-api-gp6tqxclnq-ew.a.run.app';

/**
 * Функция-обёртка для API-запросов.
 *
 * Добавляет базовый домен, автоматически передаёт access_token (если есть)
 * и обрабатывает ошибки:
 * - 401: удаляет токен и перенаправляет на страницу логина,л
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
 * @param {boolean} webApp - Флаг, указывающий, что запрос отправлен из Web App.
 */
export async function telegramAuth(telegramAuthData, webApp = false) {
  const url = webApp ? '/auth/telegram/web-app' : '/auth/telegram';
  return apiRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(telegramAuthData),
  });
}

/**
 * Обновление данных текущего пользователя
 *
 * OpenAPI: PUT /auth/me
 * Схема запроса: { email?: string }
 * Схема ответа: TelegramAuth
 *
 * @param {object} data - Данные для обновления (например, { email })
 */
export async function updateMe(data) {
  return apiRequest('/auth/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * Получение данных текущего пользователя
 *
 * OpenAPI: GET /auth/me
 * Схема ответа: TelegramAuth
 */
export async function getMe() {
  return apiRequest('/auth/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
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

export async function validateBotToken(token) {
  return apiRequest('/bots/validate', {
    method: 'POST',
    body: JSON.stringify({ token }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function createBot(botData) {
  return apiRequest('/bots/', {
    method: 'POST',
    body: JSON.stringify(botData),
    headers: {
      'Content-Type': 'application/json',
    },
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

export async function getGoals(botId) {
  return apiRequest(`/bots/${botId}/goals/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Получение аналитических данных дашборда бота с фильтром по периоду.
 *
 * OpenAPI: GET /bots/{bot_id}/dashboard
 * Схема ответа: DashboardResponse
 *
 * @param {number} botId - Идентификатор бота.
 * @param {string} period - Период фильтрации (today, current_week, current_month, three_months, year, all_time).
 */
export async function getDashboard(botId, period = 'current_month') {
  return apiRequest(`/bots/${botId}/dashboard?period=${period}`, {
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

export async function getManagers(botId, search, is_active) {
  const params = {
    search,
  };

  if (is_active !== '') {
    params.is_active = is_active;
  }

  const queryParams = new URLSearchParams(params).toString();

  return apiRequest(`/bots/${botId}/managers/?${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function loadManager(botId, managerId) {
  return apiRequest(`/bots/${botId}/managers/${managerId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function createManager(botId, managerData) {
  return apiRequest(`/bots/${botId}/managers/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(managerData),
  });
}

export async function deleteManager(botId, managerId) {
  return apiRequest(`/bots/${botId}/managers/${managerId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function updateManager(botId, managerId, managerData) {
  return apiRequest(`/bots/${botId}/managers/${managerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(managerData),
  });
}

export async function checkManagerUsername(botId, username) {
  return apiRequest(`/bots/${botId}/managers/check-username`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
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

export async function getTags(botId) {
  return apiRequest(`/bots/${botId}/tags/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function createTag(botId, tag) {
  return apiRequest(`/bots/${botId}/tags/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tag),
  });
}

export async function updateTag(botId, tagId, tag) {
  return apiRequest(`/bots/${botId}/tags/${tagId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tag),
  });
}

export async function deleteTag(botId, tagId) {
  return apiRequest(`/bots/${botId}/tags/${tagId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function loadTag(botId, tagId) {
  return apiRequest(`/bots/${botId}/tags/${tagId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
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

export async function getDeliverySettings(botId) {
  return apiRequest(`/bots/${botId}/settings/delivery`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function updateDeliverySettings(botId, settings) {
  return apiRequest(`/bots/${botId}/settings/delivery`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
}

export async function getTariffs() {
  return apiRequest('/tariffs/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function getSubscription(botId) {
  return apiRequest(`/bots/${botId}/subscriptions/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function updateSubscriptionEmail(botId, email) {
  return apiRequest(`/bots/${botId}/subscriptions/email`, {
    method: 'PUT',
    body: JSON.stringify({ email }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function updateSubscription(botId, tariffId, options) {
  return apiRequest(`/bots/${botId}/subscriptions/`, {
    method: 'POST',
    body: JSON.stringify({ tariff_id: tariffId, ...(options || {}) }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function cancelSubscription(botId) {
  return apiRequest(`/bots/${botId}/subscriptions/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export const getPaymentMethods = async (botId) => {
  return apiRequest(`/bots/${botId}/settings/payment-methods`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const updatePaymentMethod = async (botId, methodId, data) => {
  return apiRequest(`/bots/${botId}/settings/payment-methods/${methodId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

export const createPaymentMethod = async (botId, data) => {
  return apiRequest(`/bots/${botId}/settings/payment-methods/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

export const updatePaymentMethods = async (botId, methods) => {
  return apiRequest(`/bots/${botId}/settings/payment-methods`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ payment_methods: methods }),
  });
};

export async function updateTags(botId, data) {
  return apiRequest(`/bots/${botId}/tags/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tags: data }),
  });
}

export async function getIntegrations(botId) {
  return apiRequest(`/bots/${botId}/integrations/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function connectQuickResto(botId, data) {
  return apiRequest(`/bots/${botId}/integrations/quickresto/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function disconnectQuickResto(botId) {
  return apiRequest(`/bots/${botId}/integrations/quickresto/disconnect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Получение заказов с пагинацией и фильтром периода
 *
 * @param {number} botId - Идентификатор бота
 * @param {number} page - Номер страницы (начиная с 1)
 * @param {number} limit - Количество заказов на странице
 * @param {string} period - Период фильтрации (today, current_week, current_month, three_months, year, all_time)
 */
export async function getOrders(botId, page = 1, limit = 10, period = 'current_month') {
  const params = {
    page,
    limit,
    period,
  };

  const queryParams = new URLSearchParams(params).toString();

  return apiRequest(`/bots/${botId}/orders?${queryParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
