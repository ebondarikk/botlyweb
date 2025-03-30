import { Crown, Package, Rocket, Zap, Users, Newspaper } from 'lucide-react';

export const TARIFF_THEMES = {
  default: {
    icon: Package,
    sort: 0,
    colors: {
      light: 'bg-zinc-100 text-zinc-500',
      medium: 'bg-zinc-600',
      border: 'border-zinc-200 hover:border-zinc-300',
      shadow: 'shadow-zinc-200/50',
      iconBg: 'bg-zinc-100',
      iconColor: 'text-zinc-600',
      badge: 'bg-zinc-600 text-white',
      button: 'bg-zinc-600 hover:bg-zinc-700 text-white',
      buttonSecondary: 'bg-zinc-100 text-zinc-700',
    },
  },
  0: {
    icon: Package,
    sort: 0,
    colors: {
      light: 'bg-zinc-100 text-zinc-500',
      medium: 'bg-zinc-600',
      border: 'border-zinc-200 hover:border-zinc-300',
      shadow: 'shadow-zinc-200/50',
      iconBg: 'bg-zinc-100',
      iconColor: 'text-zinc-600',
      badge: 'bg-zinc-600 text-white',
      button: 'bg-zinc-600 hover:bg-zinc-700 text-white',
      buttonSecondary: 'bg-zinc-100 text-zinc-700',
    },
  },
  1: {
    icon: Zap,
    sort: 1,
    colors: {
      light: 'bg-blue-50 text-blue-500',
      medium: 'bg-blue-500',
      border: 'border-blue-100 hover:border-blue-200',
      shadow: 'shadow-blue-200/50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      badge: 'bg-blue-500 text-white',
      button: 'bg-blue-500 hover:bg-blue-600 text-white',
      buttonSecondary: 'bg-blue-50 text-blue-700',
    },
  },
  2: {
    icon: Rocket,
    sort: 2,
    colors: {
      light: 'bg-purple-50 text-purple-500',
      medium: 'bg-purple-500',
      border: 'border-purple-100 hover:border-purple-200',
      shadow: 'shadow-purple-200/50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      badge: 'bg-purple-500 text-white',
      button: 'bg-purple-500 hover:bg-purple-600 text-white',
      buttonSecondary: 'bg-purple-50 text-purple-700',
    },
  },
  3: {
    icon: Crown,
    sort: 3,
    colors: {
      light: 'bg-amber-50 text-amber-500',
      medium: 'bg-amber-500',
      border: 'border-amber-100 hover:border-amber-200',
      shadow: 'shadow-amber-200/50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      badge: 'bg-amber-500 text-white',
      button:
        'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
      buttonSecondary: 'bg-amber-50 text-amber-700',
    },
  },
};

export const LIMIT_ICONS = {
  Positions: Package,
  Categories: Package,
  Managers: Users,
  News: Newspaper,
};
