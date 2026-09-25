import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Search,
  Calendar,
  CalendarDays,
  Layers,
  Database,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'finder' | 'timeline' | 'weekly' | 'table' | 'data';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'finder', label: 'Find', icon: Search },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'weekly', label: 'Weekly', icon: CalendarDays },
  { id: 'table', label: 'Classes', icon: Layers },
  { id: 'data', label: 'Data', icon: Database },
];

export function MobileBottomNav({ activeTab, onChangeTab }: MobileBottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-2xl border-t border-white/[0.08] px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px] transition-colors ${
                isActive ? 'text-indigo-400' : 'text-zinc-500'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute inset-0 bg-indigo-500/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <Icon size={20} className="relative z-10" />
              <span className="relative z-10 text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
