import React from 'react';
import {
  Cpu,
  Sparkles,
  Plus,
  ShieldCheck,
  RefreshCw,
  FileText,
} from 'lucide-react';

interface TopBarProps {
  onOpenAIModal: () => void;
  onOpenBooking?: () => void;
  onLoadDemo: () => void;
  onExportPDF: () => void;
}

export function TopBar({ onOpenAIModal, onOpenBooking, onLoadDemo, onExportPDF }: TopBarProps) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-2xl border-b border-white/[0.08]">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-zinc-100">SlotSync</span>
              <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded">CS</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAIModal}
            className="relative p-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 transition-colors"
            title="AI Copilot"
          >
            <Sparkles size={18} />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
          </button>

          {onOpenBooking && (
            <button
              onClick={onOpenBooking}
              className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
              title="Book a Class"
            >
              <Plus size={18} />
            </button>
          )}

          <button
            onClick={onLoadDemo}
            className="p-2 rounded-lg bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-white/[0.06] transition-colors"
            title="Reset Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 text-[10px] text-zinc-500 border-t border-white/[0.04] bg-zinc-950/30">
        <span className="font-mono">08:00 AM – 05:00 PM</span>
        <span className="flex items-center gap-1 text-emerald-500/80 font-medium">
          <ShieldCheck size={10} />
          Conflict Engine Active
        </span>
      </div>
    </header>
  );
}
