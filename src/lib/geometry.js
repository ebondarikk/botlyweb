/**
 * Утилиты для работы с геометрией зон доставки
 */

/**
 * Проверяет, находится ли точка внутри полигона
 * Использует алгоритм ray casting
 */
export function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Вычисляет площадь полигона в квадратных метрах
 * Использует формулу площади Гаусса
 */
export function calculatePolygonArea(polygon) {
  if (polygon.length < 3) return 0;

  let area = 0;
  const earthRadius = 6371000; // радиус Земли в метрах

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const [lat1, lng1] = polygon[i];
    const [lat2, lng2] = polygon[j];

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    area += earthRadius * earthRadius * c;
  }

  return Math.abs(area) / 2;
}

/**
 * Проверяет валидность полигона
 */
export function isValidPolygon(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) {
    return false;
  }

  // Проверяем, что все точки - это массивы с двумя числами
  for (const point of polygon) {
    if (!Array.isArray(point) || point.length !== 2) {
      return false;
    }

    const [lat, lng] = point;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return false;
    }

    // Проверяем диапазон координат
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }
  }

  return true;
}

/**
 * Нормализует координаты полигона
 */
export function normalizePolygon(polygon) {
  if (!isValidPolygon(polygon)) {
    return null;
  }

  return polygon.map(([lat, lng]) => [Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
}

/**
 * Создает прямоугольную зону вокруг центральной точки
 */
export function createRectangularZone(centerLat, centerLng, widthKm, heightKm) {
  const latDelta = widthKm / 111.32; // 1 градус широты ≈ 111.32 км
  const lngDelta = heightKm / (111.32 * Math.cos((centerLat * Math.PI) / 180));

  return [
    [centerLat - latDelta / 2, centerLng - lngDelta / 2],
    [centerLat + latDelta / 2, centerLng - lngDelta / 2],
    [centerLat + latDelta / 2, centerLng + lngDelta / 2],
    [centerLat - latDelta / 2, centerLng + lngDelta / 2],
    [centerLat - latDelta / 2, centerLng - lngDelta / 2], // замыкаем
  ];
}
