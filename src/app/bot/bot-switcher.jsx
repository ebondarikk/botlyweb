import { ChevronsUpDown, Plus, AlertTriangle, Ban } from 'lucide-react';
import React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const getStatusIndicator = (status) => {
  switch (status) {
    case 'active':
      return { color: 'text-green-500', tooltip: 'Активен' };
    case 'failed_attempt':
      return { color: 'text-yellow-500', tooltip: 'Проблема с оплатой', icon: AlertTriangle };
    case 'blocked':
      return { color: 'text-red-500', tooltip: 'Заблокирован', icon: Ban };
    default:
      return { color: 'text-gray-500', tooltip: 'Неизвестно' };
  }
};

function StatusIcon({ status }) {
  const statusInfo = getStatusIndicator(status);
  if (!statusInfo.icon) return null;
  const Icon = statusInfo.icon;
  return <Icon className={`w-4 h-4 shrink-0 ${statusInfo.color}`} />;
}

export function BotSwitcher({ bots, activeBot, setActiveBot, loading }) {
  const { isMobile } = useSidebar();

  return loading ? (
    <Skeleton className="w-full h-12 bg-gray-300 my-1" />
  ) : (
    <SidebarMenu className="z-99">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-gray-200 text-gray-500">
                  {activeBot?.fullname.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeBot?.fullname}</span>
                <span className="truncate text-xs">@{activeBot?.username}</span>
              </div>
              {activeBot?.status !== 'active' && (
                <div className="mr-2">
                  <StatusIcon status={activeBot?.status} />
                </div>
              )}
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Магазины
            </DropdownMenuLabel>
            {bots?.map((bot) => (
              <DropdownMenuItem
                key={bot?.fullname}
                onClick={() => setActiveBot(bot)}
                className="gap-3 p-3"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-gray-200 text-gray-500">
                    {bot?.fullname.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{bot?.fullname}</span>
                  <span className="truncate text-xs">@{bot?.username}</span>
                </div>
                {bot?.status !== 'active' && <StatusIcon status={bot?.status} />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2 no-pointer-events">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-foreground ">
                <Link to="/add">Добавить магазин</Link>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default BotSwitcher;
