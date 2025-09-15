import React from 'react';
import { MapPin, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DeliveryZoneList({ zones, onEditZone, onDeleteZone }) {
  if (!zones || zones.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Зоны доставки не настроены</p>
        <p className="text-sm">Создайте зоны для настройки доставки</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {zones.map((zone) => (
        <div
          key={zone.id}
          className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${zone.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
            <div>
              <h4 className="font-medium">{zone.name}</h4>
              <p className="text-sm text-muted-foreground">
                {zone.polygon.length} точек
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={zone.is_active ? 'default' : 'secondary'}>
              {zone.is_active ? 'Активна' : 'Неактивна'}
            </Badge>
            
            <button
              onClick={() => onEditZone(zone)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onDeleteZone(zone.id)}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
