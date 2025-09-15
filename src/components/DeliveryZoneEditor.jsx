import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, Marker } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Plus, MapPin, Building, Edit3, Search, RotateCcw, XCircle } from 'lucide-react';
import { GOOGLE_MAPS_CONFIG } from '@/lib/config';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const defaultCenter = { lat: 53.9023, lng: 27.5619 }; // Минск
const defaultZoom = 10;
const libraries = ['places'];

/** =================== helpers =================== */

/** GeoJSON -> Array of polygons, each polygon is array of rings, each ring is array of {lat,lng} */
function geojsonToPolygons(geojson) {
  const toRing = (ring) => ring.map(([lng, lat]) => ({ lat, lng }));
  if (!geojson) return [];
  if (geojson.type === 'Polygon') {
    const rings = geojson.coordinates.map(toRing);
    return [rings];
  }
  if (geojson.type === 'MultiPolygon') {
    return geojson.coordinates.map((poly) => poly.map(toRing));
  }
  return [];
}

/** Fit bounds for multiple polygons with holes. */
function fitBoundsForPolygons(map, polygons) {
  if (!map || !polygons || !polygons.length) return;
  const bounds = new window.google.maps.LatLngBounds();
  polygons.forEach((rings) => {
    rings.forEach((ring) => {
      ring.forEach((pt) => bounds.extend(pt));
    });
  });
  if (!bounds.isEmpty()) map.fitBounds(bounds, 32);
}

/** Безопасный bbox в порядке left,top,right,bottom (для Nominatim viewbox) */
function buildSafeBBox(lat, lng, delta) {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const left = clamp(lng - delta, -180, 180);
  const right = clamp(lng + delta, -180, 180);
  const top = clamp(lat + delta, -85, 85);
  const bottom = clamp(lat - delta, -85, 85);
  const L = Math.min(left, right);
  const R = Math.max(left, right);
  const T = Math.max(top, bottom);
  const B = Math.min(top, bottom);
  return { L, T, R, B };
}

/** Локализуем отображаемое имя на русский по данным Nominatim */
function getLocalizedName(place, nominatimData) {
  if (nominatimData?.display_name) {
    const displayName = nominatimData.display_name;
    const parts = displayName.split(',');
    if (parts.length > 0) {
      const firstPart = parts[0].trim();
      if (/[а-яё]/i.test(firstPart)) return firstPart;
    }
    for (const part of parts) {
      const p = part.trim();
      if (/[а-яё]/i.test(p)) return p;
    }
    return displayName;
  }
  return place?.name || 'Неизвестное место';
}

/**
 * Ищем границы только через Nominatim (reverse + search) — без Overpass
 * Возвращает: { polygons: Array<Array<Array<LatLng>>> , nominatimData: object|null }
 * Можно передать идентифицирующий email (политика Nominatim) через NOMINATIM_EMAIL.
 */
async function fetchBoundaryPolygonsByPoint({
  lat,
  lng,
  type,
  name,
  email,
}) {
  const safeName = (name || '').trim();
  const emailParam = email ? `&email=${encodeURIComponent(email)}` : '';

  // 1) reverse — вдруг сразу boundary
  try {
    const reverseUrl =
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}` +
      `&format=jsonv2&polygon_geojson=1&zoom=${type === 'city' ? 10 : 14}&addressdetails=1&extratags=1&accept-language=ru${emailParam}`;
    const revResp = await fetch(reverseUrl, { headers: { Accept: 'application/json' } });
    if (revResp.ok) {
      const rev = await revResp.json();
      if (rev?.geojson && (rev.class === 'boundary' || rev.extratags?.boundary === 'administrative')) {
        const polygons = geojsonToPolygons(rev.geojson);
        if (polygons.length) return { polygons, nominatimData: rev };
      }
    }
  } catch {
    /* ignore */
  }

  // 2) search в bbox (q обязательно не пустой)
  const delta = type === 'city' ? 0.4 : 0.2;
  const { L, T, R, B } = buildSafeBBox(lat, lng, delta);
  const qRaw =
    safeName || (type === 'city' ? 'город административная граница' : 'район административная граница');
  const q = encodeURIComponent(qRaw);
  const searchUrl =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&polygon_geojson=1` +
    `&bounded=1&viewbox=${L},${T},${R},${B}` +
    `&extratags=1&addressdetails=1&limit=50&countrycodes=by,ru&accept-language=ru${emailParam}&q=${q}`;

  try {
    const sResp = await fetch(searchUrl, { headers: { Accept: 'application/json' } });
    if (sResp.ok) {
      const results = await sResp.json();

      const isCity = (r) =>
        (r.class === 'boundary' && r.type === 'administrative' && ['6', '7', '8'].includes(r.extratags?.admin_level)) ||
        (r.class === 'place' && ['city', 'town', 'municipality'].includes((r.type || '').toLowerCase()));

      const isDistrict = (r) =>
        (r.class === 'boundary' && r.type === 'administrative' && parseInt(r.extratags?.admin_level) >= 8) ||
        (r.class === 'place' &&
          ['suburb', 'neighbourhood', 'quarter', 'borough', 'city_district'].includes((r.type || '').toLowerCase()));

      const filtered = (results || []).filter((r) => (type === 'city' ? isCity(r) : isDistrict(r)));
      const base = filtered.length ? filtered : results || [];

      const scored = base
        .map((r) => {
          const dLat = (parseFloat(r.lat) || 0) - lat;
          const dLng = (parseFloat(r.lon) || 0) - lng;
          const dist2 = dLat * dLat + dLng * dLng;
          const relScore = r.osm_type === 'relation' ? 0 : 0.5;
          const nameScore =
            safeName && r.display_name?.toLowerCase().includes(safeName.toLowerCase()) ? 0 : 0.5;
          const lvl = r.extratags?.admin_level || '';
          const levelScore = type === 'city' ? (['6', '7', '8'].includes(lvl) ? 0 : 0.5) : (parseInt(lvl) >= 8 ? 0 : 0.5);
          return { r, score: dist2 + relScore + nameScore + levelScore };
        })
        .sort((a, b) => a.score - b.score);

      for (const { r } of scored) {
        const polygons = geojsonToPolygons(r.geojson);
        if (polygons.length) return { polygons, nominatimData: r };
      }
    }
  } catch {
    /* ignore */
  }

  return { polygons: [], nominatimData: null };
}

/** =================== component =================== */



const Zone = {
  id: '',
  name: '',
  is_active: false,
  type: 'city' | 'district' | 'polygon',
  /** polygons: array of multipolygons; multipolygon = array of rings; ring = array of LatLng */
  polygons: [],
  // Дополнительные поля для зон доставки
  delivery_cost: null, // Стоимость доставки
  free_delivery: false, // Бесплатная доставка
  min_order_amount: null, // Минимальный заказ
};

export default function DeliveryZoneEditor({
  zones,
  onZonesChange,
  nominatimEmail,
  currency,
  // опционально: для соответствия политике Nominatim
}) {
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const selectedZone = useMemo(() => (zones || []).find((z) => z.id === selectedZoneId) || null, [zones, selectedZoneId]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tempPolygonPoints, setTempPolygonPoints] = useState([]);
  const [zoneType, setZoneType] = useState('city'); // city, district, polygon
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [tempPolygons, setTempPolygons] = useState([]);
  const [isLoadingPolygon, setIsLoadingPolygon] = useState(false);
  const [nominatimResult, setNominatimResult] = useState(null);

  const mapRef = useRef(null);
  const searchInputWrapRef = useRef(null);
  const autocompleteService = useRef(null);
  const placeService = useRef(null);

  // дебаунс таймер для поиска
  const searchTimerRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    ...GOOGLE_MAPS_CONFIG, // важно: language: 'ru', region: 'RU'|'BY'
    version: 'weekly',
    libraries,
  });

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    if (window.google) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      placeService.current = new window.google.maps.places.PlacesService(map);
      
      // Автоматически масштабируем карту под все существующие зоны
      if (zones && zones.length > 0) {
        const allPolygons = zones.flatMap(zone => zone.polygons || []);
        if (allPolygons.length > 0) {
          fitBoundsForPolygons(map, allPolygons);
        }
      }
    }
  }, [zones]);

  /** ========= поиск с дебаунсом и bias по текущему виду карты ========= */
  const runPlacesAutocomplete = useCallback(
    (query) => {
      if (!query.trim() || !autocompleteService.current) return;

      let bounds;
      if (mapRef.current) bounds = mapRef.current.getBounds() || undefined;

      // для "city" ограничиваем до городов; для "district" даём общий, но с bias в текущие bounds
      const request = {
        input: query,
        types: zoneType === 'city' ? ['(cities)'] : [],
        language: 'ru',
        componentRestrictions: { country: ['by', 'ru'] },
        bounds,
      };

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSearchResults(predictions);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      });
    },
    [zoneType],
  );

  const searchPlacesDebounced = useCallback(
    (query) => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
      // @ts-ignore: TS не знает про number в браузерном setTimeout
      searchTimerRef.current = window.setTimeout(() => runPlacesAutocomplete(query), 300);
    },
    [runPlacesAutocomplete],
  );

  const handleSearchInputChange = useCallback(
    (e) => {
      const query = e.target.value;
      setSearchQuery(query);
      if (query.trim()) {
        searchPlacesDebounced(query);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    },
    [searchPlacesDebounced],
  );

  const handleTempPolygonPartClick = useCallback((index) => {
    setTempPolygons((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handlePlaceSelect = useCallback(
    async (placeId) => {
      if (!placeService.current) return;

      const request = {
        placeId,
        fields: ['name', 'formatted_address', 'geometry', 'types'],
        language: 'ru',
      };

      placeService.current.getDetails(request, async (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) return;

        setSelectedPlace(place);
        setShowSearchResults(false);
        setNominatimResult(null);

        if (!place.geometry || !place.geometry.location) return;

        const newCenter = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setMapCenter(newCenter);
        const newZoom = zoneType === 'city' ? 11 : 14;
        setMapZoom(newZoom);

        if (mapRef.current) {
          mapRef.current.panTo(newCenter);
          mapRef.current.setZoom(newZoom);
        }

        setIsLoadingPolygon(true);
        try {
          const { polygons, nominatimData } = await fetchBoundaryPolygonsByPoint({
            lat: newCenter.lat,
            lng: newCenter.lng,
            type: zoneType,
            name: place?.name || place?.formatted_address || '',
            email: nominatimEmail,
          });

          setTempPolygons(polygons || []);
          setNominatimResult(nominatimData || null);

          const localizedName = getLocalizedName(place, nominatimData);
          setSearchQuery(localizedName);

          if (polygons?.length && mapRef.current) {
            fitBoundsForPolygons(mapRef.current, polygons);
          }
        } catch (e) {
          console.error(e);
          setTempPolygons([]);
          setNominatimResult(null);
          setSearchQuery(place?.name || place?.formatted_address || '');
        } finally {
          setIsLoadingPolygon(false);
        }
      });
    },
    [zoneType, nominatimEmail],
  );

  const handleMapClick = useCallback(
    (event) => {
      if (!isDrawing || zoneType !== 'polygon' || !event.latLng) return;
      const newPoint = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      setTempPolygonPoints((prev) => [...prev, newPoint]);
    },
    [isDrawing, zoneType],
  );

  // Рисование полигона
  const startDrawingZone = useCallback(() => {
    setIsDrawing(true);
    setTempPolygonPoints([]);
    setSelectedZoneId(null);
  }, []);
  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setTempPolygonPoints([]);
  }, []);
  const undoLastPoint = useCallback(() => {
    setTempPolygonPoints((prev) => prev.slice(0, -1));
  }, []);
  const clearAllPoints = useCallback(() => {
    setTempPolygonPoints([]);
  }, []);

  // Создание зон город/район
  const createCityOrDistrictZone = useCallback(
    (type) => {
      if (!selectedPlace || !tempPolygons.length) return;
      const localizedName = getLocalizedName(selectedPlace, nominatimResult);
      const newZone = {
        id: `zone_${Date.now()}`,
        name: localizedName,
        is_active: true,
        type,
        polygons: tempPolygons,
        delivery_cost: null,
        free_delivery: null,
        min_order_amount: null,
      };
      const next = [...(zones || []), newZone];
      onZonesChange(next);
      setSelectedZoneId(newZone.id);
      setSelectedPlace(null);
      setSearchQuery('');
      setTempPolygons([]);
      setNominatimResult(null);
    },
    [nominatimResult, onZonesChange, selectedPlace, tempPolygons, zones],
  );

  // Завершить рисование полигона
  const finishDrawingZone = useCallback(() => {
    if (tempPolygonPoints.length < 3) {
      alert('Для создания зоны нужно минимум 3 точки');
      return;
    }
    const newZone = {
      id: `zone_${Date.now()}`,
      name: `Полигон ${(zones || []).filter((z) => z.type === 'polygon').length + 1}`,
      is_active: true,
      type: 'polygon',
      polygons: [[tempPolygonPoints]],
              delivery_cost: null,
        free_delivery: null,
        min_order_amount: null,
    };
    const next = [...(zones || []), newZone];
    onZonesChange(next);
    setSelectedZoneId(newZone.id);
    setIsDrawing(false);
    setTempPolygonPoints([]);
  }, [onZonesChange, tempPolygonPoints, zones]);

  const updateZone = useCallback(
    (zoneId, updates) => {
      const updatedZones = (zones || []).map((zone) => (zone.id === zoneId ? { ...zone, ...updates } : zone));
      onZonesChange(updatedZones);
      // пересинхроним выбранную зону по id
      setSelectedZoneId(zoneId);
    },
    [onZonesChange, zones],
  );

  const deleteZone = useCallback(
    (zoneId) => {
      const updatedZones = (zones || []).filter((zone) => zone.id !== zoneId);
      onZonesChange(updatedZones);
      if (selectedZoneId === zoneId) setSelectedZoneId(null);
    },
    [onZonesChange, selectedZoneId, zones],
  );

  const handlePolygonClick = useCallback((zoneId) => setSelectedZoneId(zoneId), []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputWrapRef.current && !searchInputWrapRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Автоматически масштабируем карту при изменении зон
  useEffect(() => {
    if (mapRef.current && zones && zones.length > 0) {
      const allPolygons = zones.flatMap(zone => zone.polygons || []);
      if (allPolygons.length > 0) {
        // Небольшая задержка для корректного рендеринга
        setTimeout(() => {
          fitBoundsForPolygons(mapRef.current, allPolygons);
        }, 100);
      }
    }
  }, [zones]);

  if (loadError) return <div className="text-red-500">Ошибка загрузки Google Maps</div>;
  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
        </div>
        
        <div className="flex justify-center">
          <Skeleton className="h-10 w-80 rounded-full" />
        </div>
        
        <div className="flex justify-center gap-2">
          <Skeleton className="h-9 w-32" />
        </div>
        
        <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
          <Skeleton className="h-5 w-24 mb-2" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden shadow-sm">
          <Skeleton className="w-full h-[600px]" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }, (_, idx) => (
              <Skeleton key={`zone-skeleton-${idx}`} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
              {/* заголовок */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Зоны доставки</h3>
        </div>

        {/* переключатель типов зон */}
        <div className="flex justify-center">
          <Tabs
            value={zoneType}
            onValueChange={(v) => {
              const vt = v;
              setZoneType(vt);
              setTempPolygons([]);
              setSelectedPlace(null);
              setSearchQuery('');
              setNominatimResult(null);
              setIsDrawing(false);
              setTempPolygonPoints([]);
            }}
          >
            <TabsList className="grid w-auto grid-cols-3">
              <TabsTrigger value="city" className="flex items-center gap-2 px-4">
                <Building className="w-4 h-4" />
                Город
              </TabsTrigger>
              <TabsTrigger value="district" className="flex items-center gap-2 px-4">
                <MapPin className="w-4 h-4" />
                Район
              </TabsTrigger>
              <TabsTrigger value="polygon" className="flex items-center gap-2 px-4">
                <Edit3 className="w-4 h-4" />
                Полигон
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* кнопки действий */}
        <div className="flex justify-center gap-2">
          {zoneType === 'city' && (
            <Button
              onClick={() => createCityOrDistrictZone('city')}
              variant="default"
              size="sm"
              disabled={!selectedPlace || !tempPolygons.length}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить город
            </Button>
          )}

          {zoneType === 'district' && (
            <Button
              onClick={() => createCityOrDistrictZone('district')}
              variant="default"
              size="sm"
              disabled={!selectedPlace || !tempPolygons.length}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить район
            </Button>
          )}

          {zoneType === 'polygon' && (
            <>
              {isDrawing ? (
                <>
                  <Button onClick={finishDrawingZone} variant="default" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Завершить зону
                  </Button>
                  <Button onClick={undoLastPoint} variant="outline" size="sm" disabled={tempPolygonPoints.length === 0}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Отменить точку
                  </Button>
                  <Button onClick={clearAllPoints} variant="outline" size="sm" disabled={tempPolygonPoints.length === 0}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Очистить
                  </Button>
                  <Button onClick={cancelDrawing} variant="ghost" size="sm">
                    Отмена
                  </Button>
                </>
              ) : (
                <Button onClick={startDrawingZone} variant="default" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Рисовать полигон
                </Button>
              )}
            </>
          )}
        </div>

      {(zoneType === 'city' || zoneType === 'district') && (
        <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
          <div ref={searchInputWrapRef}>
            <Label htmlFor="place-search" className="text-sm font-medium">
              {zoneType === 'city' ? 'Поиск города' : 'Поиск района'}
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="place-search"
                placeholder={zoneType === 'city' ? 'Введите название города' : 'Введите название района'}
                className="pl-10 pr-10"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
              />

              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-card custom-card text-card-foreground border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((p) => (
                    <div
                      key={p.place_id}
                      className="px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                      onClick={() => handlePlaceSelect(p.place_id)}
                    >
                      <div className="font-medium text-foreground">
                        {p.structured_formatting?.main_text || p.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.structured_formatting?.secondary_text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedPlace && (
              <div className="mt-2 p-2 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  {getLocalizedName(selectedPlace, nominatimResult)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Google: {selectedPlace.name} | {selectedPlace.formatted_address}
                </p>
                {isLoadingPolygon && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Определяю границы зоны…
                  </div>
                )}
                
                {!isLoadingPolygon && !!tempPolygons.length && (
                  <div className="mt-2 text-xs text-green-600">
                    Границы найдены: {tempPolygons.length} полигон(а). Если определены лишние зоны (например, аэропорт), кликните по ней, чтобы исключить.
                    {nominatimResult?.display_name && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        <strong>OSM:</strong> {nominatimResult.display_name}
                      </div>
                    )}
                  </div>
                )}
                {!isLoadingPolygon && !tempPolygons.length && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-yellow-600">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Не удалось найти корректные границы
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {zoneType === 'polygon' && isDrawing && (
        <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
          <h4 className="font-medium mb-2">Создание полигона</h4>
          <p className="text-sm text-muted-foreground">Кликайте по карте для добавления точек зоны. Минимум 3 точки.</p>
          <p className="text-sm text-muted-foreground mt-2">Точек: {tempPolygonPoints.length}</p>
        </div>
      )}

      {/* КАРТА */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <GoogleMap
          mapContainerClassName="w-full h-[600px]"
          center={mapCenter}
          zoom={mapZoom}
          onLoad={onMapLoad}
          onClick={handleMapClick}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          {/* Существующие зоны */}
          {(zones || []).map((zone) => (
            <React.Fragment key={zone.id}>
              {(zone.polygons || []).map((rings, idx) => {
                const isSelected = selectedZoneId === zone.id;
                return (
                  <Polygon
                    key={`${zone.id}_${idx}`}
                    paths={rings}
                    options={{
                      fillColor: isSelected 
                        ? '#3b82f6' 
                        : (zone.is_active ? '#10b981' : '#6b7280'),
                      fillOpacity: isSelected ? 0.4 : 0.3,
                      strokeColor: isSelected 
                        ? '#2563eb' 
                        : (zone.is_active ? '#059669' : '#374151'),
                      strokeWeight: isSelected ? 3 : 2,
                      zIndex: isSelected ? 10 : 1,
                    }}
                    onClick={() => handlePolygonClick(zone.id)}
                  />
                );
              })}
            </React.Fragment>
          ))}

          {/* Временный полигон(ы) для города/района */}
          {!!tempPolygons.length &&
            tempPolygons.map((rings, idx) => (
              <Polygon
                key={`temp_${idx}`}
                paths={rings}
                options={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.15,
                  strokeColor: '#2563eb',
                  strokeWeight: 2,
                  clickable: true,
                  zIndex: 2,
                }}
                onClick={() => handleTempPolygonPartClick(idx)}
              />
            ))}

          {/* Рисуем пользовательский временный полигон */}
          {isDrawing && !!tempPolygonPoints.length && (
            <>
              <Polygon
                paths={tempPolygonPoints}
                options={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.2,
                  strokeColor: '#2563eb',
                  strokeWeight: 2,
                  zIndex: 3,
                }}
              />
              {tempPolygonPoints.map((point, index) => (
                <Marker
                  key={index}
                  position={point}
                  icon={{
                    url:
                      'data:image/svg+xml;charset=UTF-8,' +
                      encodeURIComponent(`
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="11" cy="11" r="9" fill="#3b82f6" stroke="white" stroke-width="2"/>
                          <text x="11" y="15" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${index + 1}</text>
                        </svg>
                      `),
                    scaledSize: new window.google.maps.Size(22, 22),
                  }}
                />
              ))}
            </>
          )}
        </GoogleMap>
      </div>

      {/* Правая колонка - редактирование выбранной зоны */}
      {selectedZone && (
        <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm custom-card">
          <h4 className="font-medium mb-3">Редактирование зоны</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="zone-name" className="text-sm font-medium">
                Название зоны
              </Label>
              <Input
                id="zone-name"
                value={selectedZone.name}
                onChange={(e) => updateZone(selectedZone.id, { name: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="zone-active" className="text-sm font-medium">
                Активна
              </Label>
              <Switch
                id="zone-active"
                checked={selectedZone.is_active}
                onCheckedChange={(checked) => updateZone(selectedZone.id, { is_active: checked })}
              />
            </div>

            <div>
              <Label htmlFor="zone-delivery-cost" className="text-sm font-medium">
                Стоимость доставки (руб.)
              </Label>
              <Input
                id="zone-delivery-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={selectedZone.delivery_cost || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseFloat(e.target.value);
                  updateZone(selectedZone.id, { delivery_cost: value });
                }}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Оставьте это поле пустым, чтобы доставка была бесплатной
              </p>
            </div>

            <div>
              <Label htmlFor="zone-free-delivery" className="text-sm font-medium">
                Бесплатная доставка от (руб.)
              </Label>
              <Input
                id="zone-free-delivery"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={selectedZone.free_delivery || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseFloat(e.target.value);
                  updateZone(selectedZone.id, { free_delivery: value });
                }}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Укажите сумму заказа, при которой доставка станет бесплатной. Оставьте это поле пустым, чтобы доставка всегда была платной.
              </p>
            </div>

            <div>
              <Label htmlFor="zone-min-order" className="text-sm font-medium">
                Минимальный заказ (руб.)
              </Label>
              <Input
                id="zone-min-order"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={selectedZone.min_order_amount || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseFloat(e.target.value);
                  updateZone(selectedZone.id, { min_order_amount: value });
                }}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Оставьте это поле пустым, чтобы доставка всегда была доступна
              </p>
            </div>

            <Button onClick={() => deleteZone(selectedZone.id)} variant="destructive" size="sm" className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить зону
            </Button>
          </div>
        </div>
      )}

      {/* Список зон снизу */}
      <div className="space-y-2">
        <h4 className="font-medium">Список зон</h4>
        {!zones || zones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Зоны не созданы</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors bg-card text-card-foreground shadow-sm hover:shadow-md ${
                  selectedZoneId === zone.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedZoneId(zone.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {zone.type === 'city' && <Building className="w-4 h-4 text-blue-600" />}
                    {zone.type === 'district' && <MapPin className="w-4 h-4 text-green-600" />}
                    {zone.type === 'polygon' && <Edit3 className="w-4 h-4 text-purple-600" />}
                    <span className="font-medium">{zone.name}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${zone.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {zone.type === 'city' && 'Город'}
                    {zone.type === 'district' && 'Район'}
                    {zone.type === 'polygon' && 'Полигон'} 
                  </span>
                </div>
                
                {/* Информация о доставке */}
                <div className="mt-2 space-y-1">
                  {zone.delivery_cost ? (
                    <div className="text-xs text-muted-foreground">
                      Доставка: {zone.delivery_cost} {currency}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Стоимость доставки не указана</div>
                  )}
                  
                  {zone.free_delivery ? (
                    <div className="text-xs text-green-600 font-medium">
                      Бесплатно от {zone.free_delivery} {currency}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Бесплатная доставка не указана</div>
                  )}
                  
                  {zone.min_order_amount ? (
                    <div className="text-xs text-muted-foreground">
                      Мин. заказ: {zone.min_order_amount} {currency}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Минимальный заказ не указан</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}