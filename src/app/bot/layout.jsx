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
  Megaphone,
  Settings,
  UsersRound,
  ChartNoAxesCombined,
  CalendarClock,
  ChevronsUpDown,
  BadgeCheck,
  CreditCard,
  LogOut,
  Tag,
  BriefcaseBusiness,
} from 'lucide-react';
import { UserProvider, useUser } from '@/context/UserContext';
import { BotSwitcher } from '@/app/bot/bot-switcher';
import { useBot } from '@/context/BotContext';
import { NavLink } from 'react-router-dom';
import { getBots } from '@/lib/api';
import { toast } from 'react-hot-toast';
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
    name: 'Ярлыки',
    url: (bot_id) => `/${bot_id}/tags`,
    icon: Tag,
  },
  {
    name: 'Новости и рассылки',
    url: (bot_id) => `/${bot_id}/mailings`,
    icon: Megaphone,
  },
  {
    name: 'Менеджеры',
    url: (bot_id) => `/${bot_id}/managers`,
    icon: BriefcaseBusiness,
  },
  {
    name: 'Настройки',
    url: (bot_id) => `/${bot_id}/settings`,
    icon: Settings,
  },
  // {
  //   name: 'Аналитика',
  //   url: (bot_id) => `/${bot_id}/statistic`,
  //   icon: ChartNoAxesCombined,
  //   disabled: true,
  // },
  // {
  //   name: 'Расписание',
  //   url: (bot_id) => `/${bot_id}/schedule`,
  //   icon: CalendarClock,
  //   disabled: true,
  // },
  {
    name: 'Тариф и оплата',
    url: (bot_id) => `/${bot_id}/subscription`,
    icon: CreditCard,
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
    const parsedBots = botsJson ? JSON.parse(botsJson) : null;
    if (Array.isArray(parsedBots) && parsedBots.length) {
      setBots(parsedBots);
    } else {
      (async () => {
        try {
          const data = await getBots();
          setBots(data.bots || []);
          localStorage.setItem('bots', JSON.stringify(data.bots || []));
        } catch (e) {
          // подавим тост при 401 — редирект произойдёт в apiRequest
          if (e?.status !== 401) toast.error('Не удалось загрузить список магазинов');
        }
      })();
    }
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
                    <DropdownMenuItem asChild>
                      <NavLink to={`/${bot?.id}/billing`}>
                        <CreditCard />
                        Оплата
                      </NavLink>
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
