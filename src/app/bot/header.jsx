import React, { useEffect, useState } from 'react';
import { Events } from 'react-scroll';
import './Header.css';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

function Header({ activeTab }) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScrollBegin = () => {
      setIsSticky(true);
    };
    const handleScrollEnd = () => {
      setIsSticky(false);
    };

    Events.scrollEvent.register('begin', handleScrollBegin);
    Events.scrollEvent.register('end', handleScrollEnd);

    // return () => {
    //   console.log("unregister");
    //   Events.scrollEvent.remove("begin", handleScrollBegin);
    //   Events.scrollEvent.remove("end", handleScrollEnd);
    // };
  }, []);
  return (
    <header className="sticky-header flex h-16 shrink-0 items-center gap-4 custom-card rounded-t-none px-4">
      {/* <div className="flex items-center gap-4 min-w-[240px] border-r border-white/5 -mr-2"> */}
      <SidebarTrigger />
      {/* <h1 className="brand-logo">Botly</h1> */}
      {/* </div> */}
      <div className="flex items-center gap-4">
        <span className="truncate font-medium text-[15px]">{activeTab?.name}</span>
      </div>
    </header>
  );
}

export default Header;
