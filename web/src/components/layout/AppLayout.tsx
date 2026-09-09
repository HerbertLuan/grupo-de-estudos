import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { DesktopSidebar } from './DesktopSidebar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col lg:flex-row">
      <DesktopSidebar />
      
      <main className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden pb-20 lg:pb-0">
        <Outlet />
      </main>
      
      <BottomNavigation />
    </div>
  );
}
