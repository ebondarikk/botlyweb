import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function DisconnectIntegrationDialog({ 
  open, 
  onOpenChange, 
  integrationName,
  onConfirm,
  loading = false
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Отключение интеграции
          </DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите отключить интеграцию с {integrationName}? 
            После отключения синхронизация данных прекратится.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? 'Отключение...' : 'Отключить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

