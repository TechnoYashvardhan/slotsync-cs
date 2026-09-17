import React from 'react';
import {
  GraduationCap,
  Sparkles,
  Search,
  Calendar,
  CalendarDays,
  Layers,
  Database,
  FileText,
  Cpu,
  Bot,
} from 'lucide-react';

export type NavTab = 'finder' | 'timeline' | 'weekly' | 'table' | 'data';

interface NavbarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  totalLectures: number;
  freeSlotsCount: number;
  onLoadDemo: () => void;
  onExportPDF: () => void;
  onOpenAIModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onChangeTab,
  totalLectures,
  freeSlotsCount,
  onLoadDemo,
  onExportPDF,
  onOpenAIModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-2xl border-b border-slate-200/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Bespoke Logo & Department Seal - Light Mode */}
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-emerald-500 flex items-center justify-center shadow-md shadow-indigo-500/20 ring-1 ring-black/5 transform group-hover:scale-105 transition-transform duration-200">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-slate-900 font-sans">
                  SlotSync<span className="text-emerald-700 font-mono ml-1.5 text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-300">CS</span>
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                  SYS.OPERATIONAL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                Dept of Computer Science & Engineering
              </p>
            </div>
          </div>

          {/* Central Segmented Pill Navigation - Light Mode */}
          <nav className="hidden md:flex items-center p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/90 shadow-inner">
            <button
              onClick={() => onChangeTab('finder')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'finder'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              <span>Find Slots</span>
              {freeSlotsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    activeTab === 'finder'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {freeSlotsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onChangeTab('timeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Schedule Matrix</span>
            </button>

            <button
              onClick={() => onChangeTab('weekly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'weekly'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
              <span>Weekly Grid</span>
            </button>

            <button
              onClick={() => onChangeTab('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Classes</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'table' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {totalLectures}
              </span>
            </button>

            <button
              onClick={() => onChangeTab('data')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'data'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>Data Center</span>
            </button>
          </nav>

          {/* Right Action: AI Copilot, Demo Loader & PDF */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onOpenAIModal}
              title="Open Gemini AI Scheduling Copilot"
              className="relative inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 shadow-md shadow-emerald-500/20 border border-emerald-400/30 transition-all cursor-pointer active:scale-95 group overflow-hidden"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200 group-hover:rotate-12 transition-transform" />
              <span>AI Copilot</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
              </span>
            </button>

            <button
              onClick={onLoadDemo}
              title="Reset and reload built-in CS department demo dataset"
              className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load Demo</span>
            </button>

            <button
              onClick={onExportPDF}
              title="Quick download official PDF Timetable"
              className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-500" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation Tabs - Light Mode */}
        <div className="md:hidden flex items-center gap-1.5 pb-2.5 pt-1.5 border-t border-slate-200/80 overflow-x-auto no-scrollbar px-1">
          <button
            onClick={() => onChangeTab('finder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition flex-shrink-0 ${
              activeTab === 'finder'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <Search className="w-3 h-3" />
            <span>Find Slots</span>
            {freeSlotsCount > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                activeTab === 'finder' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {freeSlotsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onChangeTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition flex-shrink-0 ${
              activeTab === 'timeline'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Matrix</span>
          </button>

          <button
            onClick={() => onChangeTab('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition flex-shrink-0 ${
              activeTab === 'weekly'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <CalendarDays className="w-3 h-3" />
            <span>Weekly</span>
          </button>

          <button
            onClick={() => onChangeTab('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition flex-shrink-0 ${
              activeTab === 'table'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Classes</span>
          </button>

          <button
            onClick={() => onChangeTab('data')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition flex-shrink-0 ${
              activeTab === 'data'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 bg-white border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <Database className="w-3 h-3" />
            <span>Data</span>
          </button>
        </div>

      </div>
    </header>
  );
};
