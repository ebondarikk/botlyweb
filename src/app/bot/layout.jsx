import React, { useCallback, useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarFooter,
  SidebarRail,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  ShoppingCart,
  Folder,
  Send,
  Truck,
  UsersRound,
  ChartNoAxesCombined,
  CalendarClock,
  ChevronsUpDown,
  BadgeCheck,
  CreditCard,
  LogOut,
  BriefcaseBusiness,
} from 'lucide-react';
import { UserProvider, useUser } from '@/context/UserContext';
import { BotSwitcher } from '@/app/bot/bot-switcher';
import { useBot } from '@/context/BotContext';
import { NavLink } from 'react-router-dom';
import Header from './header';

const items = [
  { name: 'Дашборд', url: (bot_id) => `/${bot_id}`, icon: LayoutDashboard },
  {
    name: 'Товары',
    url: (bot_id) => `/${bot_id}/products`,
    icon: ShoppingCart,
  },
  {
    name: 'Клиенты',
    url: (bot_id) => `/${bot_id}/users`,
    icon: UsersRound,
  },
  {
    name: 'Категории',
    url: (bot_id) => `/${bot_id}/categories`,
    icon: Folder,
  },
  {
    name: 'Рассылки',
    url: (bot_id) => `/${bot_id}/mailings`,
    icon: Send,
  },
  {
    name: 'Менеджеры',
    url: (bot_id) => `/${bot_id}/managers`,
    icon: BriefcaseBusiness,
  },
  {
    name: 'Доставка',
    url: (bot_id) => `/${bot_id}/delivery`,
    icon: Truck,
    disabled: true,
  },
  {
    name: 'Аналитика',
    url: (bot_id) => `/${bot_id}/statistic`,
    icon: ChartNoAxesCombined,
    disabled: true,
  },
  {
    name: 'Расписание',
    url: (bot_id) => `/${bot_id}/schedule`,
    icon: CalendarClock,
    disabled: true,
  },
];

export default function BotLayout({ children }) {
  return (
    <UserProvider>
      <SidebarProvider>
        <BotLayoutContent>{children}</BotLayoutContent>
      </SidebarProvider>
    </UserProvider>
  );
}

function BotLayoutContent({ children }) {
  const [bots, setBots] = useState(null);
  const { bot, setBot, loading } = useBot();
  const { isMobile } = useSidebar();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState();

  useEffect(() => {
    const botsJson = localStorage.getItem('bots');

    const parsedBots = JSON.parse(botsJson);

    setBots(parsedBots);
  }, []);

  useEffect(() => {
    items.forEach((item) => {
      if (window.location.pathname.includes(item.url(bot?.id))) {
        setActiveTab(item);
      }
    });
  }, [bot]);

  const onLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    window.location.href = '/';
  }, []);

  return (
    <>
      <Sidebar collapsible="icon" className="">
        <SidebarHeader className="z-99">
          <BotSwitcher bots={bots} activeBot={bot} setActiveBot={setBot} loading={loading} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarMenu className="">
              {items.map((item) => (
                <SidebarMenuItem
                  key={item.name}
                  className={`leading-6  h-10 p-0 ${item.disabled && 'opacity-50 pointer-events-none'}`}
                >
                  <NavLink to={item.url(bot?.id)} end={item.url(bot?.id) === `/${bot?.id}`}>
                    {({ isActive }) => (
                      <SidebarMenuButton asChild isActive={isActive} className="h-10">
                        <div>
                          <item.icon />
                          <span>{`${item.name}${item.disabled ? ' (Скоро)' : ''}`}</span>
                        </div>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.photo_url} alt={user.first_name} />
                      <AvatarFallback className="rounded-lg">
                        {user.first_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.first_name}
                        {user.last_name && ` ${user.last_name}`}
                      </span>
                      {user.username && <span className="truncate text-xs">@{user.username}</span>}
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side={isMobile ? 'bottom' : 'right'}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user.photo_url} alt={user.first_name} />
                        <AvatarFallback className="rounded-lg">
                          {user.first_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {user.first_name}
                          {user.last_name && ` ${user.last_name}`}
                        </span>
                        {user.username && (
                          <span className="truncate text-xs">@{user.username}</span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem disabled>
                      <BadgeCheck />
                      Аккаунт (скоро)
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <CreditCard />
                      Оплата (скоро)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onLogout}>
                      <LogOut />
                      Выход
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <Header activeTab={activeTab} />
        <div className="flex flex-1 flex-col gap-4 p-2 md:p-4">
          {/* <div className="min-h-[100vh] flex-1 md:min-h-min p-4 shadow-lg rounded-2xl custom-card bg-opacity-50"> */}
          {/* <div className="min-h-[100vh] flex-1 md:min-h-min p-4"> */}
          {children}
          {/* </div> */}
        </div>
      </SidebarInset>
    </>
  );
}
