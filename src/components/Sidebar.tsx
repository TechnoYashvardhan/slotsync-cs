import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Calendar,
  CalendarDays,
  Layers,
  Database,
  Sparkles,
  Plus,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FileText,
} from 'lucide-react';

export type NavTab = 'finder' | 'timeline' | 'weekly' | 'table' | 'data';

interface SidebarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  totalLectures: number;
  freeSlotsCount: number;
  onOpenAIModal: () => void;
  onOpenBooking?: () => void;
  onExportPDF: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'finder', label: 'Find Slots', icon: Search },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'weekly', label: 'Weekly Grid', icon: CalendarDays },
  { id: 'table', label: 'Classes', icon: Layers },
  { id: 'data', label: 'Data Center', icon: Database },
];

export function Sidebar({
  activeTab,
  onChangeTab,
  totalLectures,
  freeSlotsCount,
  onOpenAIModal,
  onOpenBooking,
  onExportPDF,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Keyboard shortcut: Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <aside
      className={`hidden lg:flex fixed top-4 left-4 z-40 h-[calc(100vh-2rem)] flex-col justify-between rounded-2xl bg-zinc-900/80 backdrop-blur-2xl border border-white/[0.08] shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        collapsed ? 'w-[72px] p-2.5' : 'w-[240px] p-3.5'
      }`}
    >
      {/* Top Section */}
      <div>
        {/* Brand */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-1 py-3 mb-3`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                <Cpu className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm text-zinc-100 tracking-tight">SlotSync</span>
                <span className="ml-1 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded">CS</span>
                <span className="block text-[10px] text-zinc-500 font-mono mt-0.5">Dept of CS & Engineering</span>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="w-4.5 h-4.5 text-white" />
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors ${collapsed ? 'hidden' : ''}`}
            title="Toggle Sidebar (Ctrl+B)"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all relative group ${
                  collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {/* Animated active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveIndicator"
                    className="absolute inset-0 bg-indigo-500/15 rounded-xl border border-indigo-500/25"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  size={18}
                  className={`relative z-10 flex-shrink-0 ${
                    isActive ? 'text-indigo-400' : 'group-hover:scale-110 transition-transform'
                  }`}
                />
                {!collapsed && (
                  <span className="relative z-10 truncate flex-1 text-left">{item.label}</span>
                )}
                {!collapsed && item.id === 'finder' && freeSlotsCount > 0 && (
                  <span className="relative z-10 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    {freeSlotsCount}
                  </span>
                )}
                {!collapsed && item.id === 'table' && totalLectures > 0 && (
                  <span className="relative z-10 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                    {totalLectures}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="h-px bg-white/[0.06] my-3" />

        {/* Quick Actions */}
        <div className="space-y-1.5">
          <button
            onClick={onOpenAIModal}
            className={`w-full flex items-center gap-2.5 rounded-xl text-[13px] font-medium text-violet-400 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all ${
              collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}
            title={collapsed ? 'AI Copilot' : undefined}
          >
            <span className="relative flex-shrink-0">
              <Sparkles size={18} />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
              </span>
            </span>
            {!collapsed && <span>AI Copilot</span>}
          </button>

          {onOpenBooking && (
            <button
              onClick={onOpenBooking}
              className={`w-full flex items-center gap-2.5 rounded-xl text-[13px] font-medium text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all ${
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              }`}
              title={collapsed ? 'Book a Class' : undefined}
            >
              <Plus size={18} className="flex-shrink-0" />
              {!collapsed && <span>Book a Class</span>}
            </button>
          )}

          <button
            onClick={onExportPDF}
            className={`w-full flex items-center gap-2.5 rounded-xl text-[13px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all ${
              collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            }`}
            title={collapsed ? 'Export PDF' : undefined}
          >
            <FileText size={18} className="flex-shrink-0" />
            {!collapsed && <span>Export PDF</span>}
          </button>
        </div>
      </div>

      {/* Bottom Section */}
      <div>
        {!collapsed && (
          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-white/[0.05] text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Toggle Sidebar</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded font-mono text-[9px]">Ctrl+B</kbd>
          </div>
        )}

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
