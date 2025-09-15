/**
 * Типы для системы доставки
 */

/**
 * Точка на карте
 */
export const Point = {
  lat: Number,
  lng: Number,
};

/**
 * Центр зоны (для городов)
 */
export const ZoneCenter = {
  lat: Number,
  lng: Number,
};

/**
 * Зона доставки
 */
export const Zone = {
  id: String,
  name: String,
  is_active: Boolean,
  type: String, // 'city', 'district', 'polygon'
  polygon: Array(Point), // [{lat, lng}, {lat, lng}, ...] - для полигонов
  center: ZoneCenter, // для городов
  radius: Number, // для городов (в км)
};

/**
 * Настройки доставки
 */
export const DeliverySettings = {
  is_active: Boolean,
  zones: Array(Zone),
};

/**
 * Пример структуры данных зоны города
 */
export const exampleCityZone = {
  id: 'zone_city_123',
  name: 'Минск (радиус 25 км)',
  is_active: true,
  type: 'city',
  center: { lat: 53.9023, lng: 27.5619 },
  radius: 25,
  polygon: [], // Автоматически генерируется
};

/**
 * Пример структуры данных зоны района
 */
export const exampleDistrictZone = {
  id: 'zone_district_123',
  name: 'Центральный район',
  is_active: true,
  type: 'district',
  polygon: [], // Пустой для районов
};

/**
 * Пример структуры данных зоны полигона
 */
export const examplePolygonZone = {
  id: 'zone_polygon_123',
  name: 'Полигон 1',
  is_active: true,
  type: 'polygon',
  polygon: [
    { lat: 53.9023, lng: 27.5619 }, // Минск, центр
    { lat: 53.9123, lng: 27.5719 }, // Северо-восток
    { lat: 53.8923, lng: 27.5519 }, // Юго-запад
    { lat: 53.9023, lng: 27.5619 }, // Замыкаем полигон
  ],
};

/**
 * Пример настроек доставки
 */
export const exampleDeliverySettings = {
  is_active: true,
  zones: [exampleCityZone, exampleDistrictZone, examplePolygonZone],
};
