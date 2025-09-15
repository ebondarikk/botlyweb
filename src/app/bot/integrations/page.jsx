import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BotLayout from '@/app/bot/layout';
import { useIntegrations } from '@/hooks/use-integrations';
import { useBot } from '@/context/BotContext';
import QuickRestoConnectDialog from './QuickRestoConnectDialog';
import DisconnectIntegrationDialog from './DisconnectIntegrationDialog';
import { connectQuickResto, disconnectQuickResto } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
  Zap, 
  CheckCircle, 
  Clock,
  ExternalLink,
  RefreshCw,
  Unlink
} from 'lucide-react';

export default function IntegrationsPage() {
  const { bot } = useBot();
  const { integrations, loading, error, refreshIntegrations } = useIntegrations(bot?.id);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  // Статические данные для интеграций (описания, логотипы, функции)
  const integrationDetails = {
    quickresto: {
      name: 'Quick Resto',
      description: 'Интеграция с системой автоматизации ресторанов для синхронизации меню и заказов',
      logo: '/quickresto.png',
      color: 'blue',
      features: ['Синхронизация меню', 'Автоматические заказы', 'Управление столами']
    },
    rkeeper: {
      name: 'R-Keeper',
      description: 'Интеграция с системой автоматизации ресторанов R-Keeper для синхронизации данных',
      logo: '/rkeeper.png',
      color: 'green',
      features: ['Синхронизация меню', 'Обработка заказов', 'Учет продаж']
    },
    frontpad: {
      name: 'Frontpad',
      description: 'Интеграция с системой автоматизации торговли Frontpad для синхронизации товаров',
      logo: '/frontpad.png',
      color: 'purple',
      features: ['Синхронизация товаров', 'Обновление цен', 'Учет остатков']
    }
  };

  const getStatusBadge = (status, connected) => {
    if (status === 'available' && connected) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Подключено</Badge>;
    }
    
    switch (status) {
      case 'available':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Доступно</Badge>;
      case 'coming_soon':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Скоро</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  const getStatusIcon = (status, connected) => {
    if (status === 'available' && connected) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    
    switch (status) {
      case 'available':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'coming_soon':
        return <Clock className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleConnectClick = (integration) => {
    setSelectedIntegration(integration);
    setConnectDialogOpen(true);
  };

  const handleConnectionSuccess = () => {
    refreshIntegrations();
  };

  const handleDisconnectClick = (integration) => {
    setSelectedIntegration(integration);
    setDisconnectDialogOpen(true);
  };

  const handleDisconnectConfirm = async () => {
    if (!selectedIntegration) return;

    setDisconnectLoading(true);
    
    try {
      if (selectedIntegration.id === 'quickresto') {
        await disconnectQuickResto(bot?.id);
        toast.success('QuickResto успешно отключен!');
        refreshIntegrations();
        setDisconnectDialogOpen(false);
      }
    } catch (error) {
      const errorMessage = error?.message || 'Ошибка отключения интеграции';
      toast.error(errorMessage);
    } finally {
      setDisconnectLoading(false);
    }
  };

  return (
    <BotLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full px-4 md:px-8"
      >
        {/* Заголовок страницы */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-4 py-6 flex-wrap justify-between items-start"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Интеграции</h1>
            <p className="text-muted-foreground text-lg">
              Подключите системы автоматизации ресторанов и торговли для синхронизации данных
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={refreshIntegrations} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Автоматизация процессов</span>
            </div>
          </div>
        </motion.div>

        {/* Сетка интеграций */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
        >
          {loading ? (
            // Загрузка
            Array.from({ length: 3 }).map((_, index) => (
              <motion.div
                key={`loading-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
                          <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 mb-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-4 w-full bg-muted rounded animate-pulse"></div>
                      ))}
                    </div>
                    <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : error ? (
            // Ошибка
            <div className="col-span-full text-center py-12">
              <div className="text-muted-foreground mb-4">
                <p className="text-lg mb-2">Ошибка загрузки интеграций</p>
                <p className="text-sm mb-4">{error}</p>
                <Button onClick={refreshIntegrations} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Попробовать снова
                </Button>
              </div>
            </div>
          ) : integrations.length === 0 ? (
            // Пустое состояние
            <div className="col-span-full text-center py-12">
              <div className="text-muted-foreground">
                <p className="text-lg">Интеграции не найдены</p>
                <p className="text-sm">Попробуйте обновить страницу</p>
              </div>
            </div>
          ) : (
            // Список интеграций
            integrations.map((integration, index) => {
              const details = integrationDetails[integration.id];
              if (!details) return null;
              
              return (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-200 border-border/50">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white border border-border/20">
                            <img 
                              src={details.logo} 
                              alt={`${details.name} logo`}
                              className="w-full h-full object-contain p-2"
                            />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{details.name}</CardTitle>
                            {getStatusBadge(integration.status, integration.connected)}
                          </div>
                        </div>
                        {getStatusIcon(integration.status, integration.connected)}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <CardDescription className="text-base text-muted-foreground mb-4">
                        {details.description}
                      </CardDescription>
                      
                      <div className="space-y-2 mb-6">
                        {details.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            {feature}
                          </div>
                        ))}
                      </div>

                      <Button 
                        className={`w-full ${
                          integration.status === 'available' && integration.connected
                            ? 'border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600'
                            : ''
                        }`}
                        variant={integration.status === 'available' && integration.connected ? 'outline' : 'default'}
                        disabled={integration.status !== 'available'}
                        onClick={() => {
                          if (integration.status === 'available') {
                            if (integration.connected) {
                              handleDisconnectClick(integration);
                            } else {
                              handleConnectClick(integration);
                            }
                          }
                        }}
                      >
                        {integration.status === 'available' ? (
                          <>
                            {integration.connected ? (
                              <>
                                <Unlink className="w-4 h-4 mr-2" />
                                Отключить
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Подключить
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-2" />
                            Скоро
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Дополнительная информация */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-muted/30 rounded-xl p-6 border border-border/50"
        >
          <h3 className="text-lg font-semibold mb-3 text-foreground">О интеграциях</h3>
          <p className="text-muted-foreground mb-4">
            Интеграции с системами автоматизации ресторанов и торговли позволяют автоматически синхронизировать меню, 
            цены, остатки и заказы. Это экономит время и снижает вероятность ошибок при ручном вводе информации.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Автоматическая синхронизация</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Безопасное подключение</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Техническая поддержка</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Диалог подключения QuickResto */}
      {selectedIntegration && (
        <QuickRestoConnectDialog
          open={connectDialogOpen}
          onOpenChange={setConnectDialogOpen}
          botId={bot?.id}
          onSuccess={handleConnectionSuccess}
        />
      )}

      {/* Диалог отключения интеграции */}
      {selectedIntegration && (
        <DisconnectIntegrationDialog
          open={disconnectDialogOpen}
          onOpenChange={setDisconnectDialogOpen}
          integrationName={integrationDetails[selectedIntegration.id]?.name}
          onConfirm={handleDisconnectConfirm}
          loading={disconnectLoading}
        />
      )}
    </BotLayout>
  );
}
