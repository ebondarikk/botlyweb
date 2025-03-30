import React from 'react';
import { motion } from 'framer-motion';
import { Bot, ChevronRight } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

function Header({ activeTab }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 px-6',
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
    </motion.header>
  );
}

export default Header;
