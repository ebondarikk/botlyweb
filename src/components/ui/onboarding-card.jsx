import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowRight } from 'lucide-react';

export default function OnboardingCard({
  icon,
  title,
  description,
  actionText,
  onAction,
  onDismiss,
  className = '',
  variant = 'default', // "default", "success", "info"
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50/50';
      case 'info':
        return 'border-blue-200 bg-blue-50/50';
      default:
        return 'border-sidebar-primary/20 bg-sidebar-primary/5';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-sidebar-primary';
    }
  };

  return (
    <Card className={`${getVariantStyles()} ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Иконка */}
            <div className={`p-3 rounded-xl bg-white/80 ${getIconColor()}`}>{icon}</div>

            {/* Контент */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
              </div>

              {/* Кнопка действия */}
              {actionText && onAction && (
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={onAction}
                    className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-black hover:text-black flex items-center gap-2 font-medium"
                  >
                    {actionText}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDismiss}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                      Пропустить
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Кнопка закрытия */}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 p-1 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
