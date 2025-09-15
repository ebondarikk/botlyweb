import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { GOOGLE_MAPS_CONFIG } from '@/lib/config';

export default function GoogleMapsTest() {
  const { isLoaded, loadError } = useJsApiLoader({
    ...GOOGLE_MAPS_CONFIG,
    version: 'weekly',
  });

  if (loadError) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-red-800 font-medium mb-2">Ошибка загрузки Google Maps</h3>
        <p className="text-red-700 text-sm">
          Проверьте настройку API ключа в файле .env
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
        <h3 className="text-blue-800 font-medium mb-2">Загрузка Google Maps...</h3>
        <p className="text-blue-700 text-sm">Пожалуйста, подождите</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-green-200 rounded-lg bg-green-50">
      <h3 className="text-green-800 font-medium mb-2">Google Maps загружен успешно!</h3>
      <p className="text-green-700 text-sm mb-4">API ключ настроен корректно</p>
      
      <div className="border rounded-lg overflow-hidden h-[400px]">
        <GoogleMap
          mapContainerClassName="w-full h-full"
          center={{ lat: 55.7558, lng: 37.6176 }}
          zoom={10}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          <Marker position={{ lat: 55.7558, lng: 37.6176 }} />
        </GoogleMap>
      </div>
    </div>
  );
}
