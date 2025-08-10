import { motion } from 'framer-motion';
import { Bot, CheckCircle2, Rocket } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import React, { useEffect, useMemo, useState } from 'react';
import { useBot } from '@/context/BotContext';
import { getGoals } from '@/lib/api';
import { Link } from 'react-router-dom';

function Header({ activeTab }) {
  const { bot } = useBot();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completeGoals, setCompleteGoals] = useState(null);
  const [hasDiscount, setHasDiscount] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadGoals() {
      if (!bot?.id) return;
      try {
        setLoading(true);
        const data = await getGoals(bot.id);
        if (!ignore) {
          setGoals(data?.goals || []);
          setCompleteGoals(data?.complete_goals ?? null);
          setHasDiscount(Boolean(data?.has_discount));
        }
      } catch (e) {
        // no-op
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadGoals();
    return () => {
      ignore = true;
    };
  }, [bot?.id]);

  const filteredGoals = useMemo(() => goals || [], [goals]);

  const progress = useMemo(() => {
    const total = filteredGoals.length || 0;
    const done = filteredGoals.filter((g) => g.completed).length;
    return { total, done, left: Math.max(total - done, 0) };
  }, [filteredGoals]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-sidebar px-6',
        'backdrop-blur supports-[backdrop-filter]:bg-background/60',
      )}
    >
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="hidden md:block h-4 w-[1px] bg-border/50" />
        <div className="flex items-center gap-1 text-muted-foreground">
          {/* <Bot className="w-4 h-4" /> */}
          {/* <span className="text-sm font-medium">Botly</span> */}
          {/* <ChevronRight className="w-4 h-4" /> */}
          <motion.div
            key={activeTab?.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            {activeTab?.icon && <activeTab.icon className="w-4 h-4 mr-1.5 text-primary" />}
            <h1 className="text-foreground text-lg font-medium">{activeTab?.name}</h1>
          </motion.div>
        </div>
      </div>

      {/* Чеклист целей в шапке */}
      <div className="ml-auto flex items-center">
        {!loading && filteredGoals?.length > 0 && !completeGoals && !hasDiscount && (
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
              <Rocket className="w-4 h-4" />
              <span>Осталось {progress.left} {progress.left === 1 ? 'шаг' : progress.left < 5 ? 'шага' : 'шагов'}</span>
            </div>
            <div className="flex items-center gap-2">
              {filteredGoals.slice(0, 3).map((g) => {
                const to =
                  g.id === 'add_products'
                    ? `/${bot?.id}/products`
                    : g.id === 'add_categories'
                    ? `/${bot?.id}/categories`
                    : g.id === 'setup_delivery'
                    ? `/${bot?.id}/settings`
                    : `/${bot?.id}`;

                const completedClasses = 'border-primary/40 bg-primary/10 text-primary';
                const pendingClasses = 'border-border bg-background/80 text-muted-foreground';

                return (
                  <Link
                    key={g.id}
                    to={to}
                    className={`px-2.5 py-1 rounded-md border transition-colors hover:bg-muted/60 ${
                      g.completed ? completedClasses : pendingClasses
                    }`}
                    title={g.title}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {g.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {g.id === 'add_products' && (
                        <span className="whitespace-nowrap">Товары {Math.min(g.current || 0, g.target || 3)}/{g.target || 3}</span>
                      )}
                      {g.id === 'add_categories' && (
                        <span className="whitespace-nowrap">Категории {Math.min(g.current || 0, g.target || 2)}/{g.target || 2}</span>
                      )}
                      {g.id === 'setup_delivery' && (
                        <span className="truncate max-w-[140px]">Доставка</span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.header>
  );
}

export default Header;
