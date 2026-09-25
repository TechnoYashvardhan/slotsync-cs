import React, { useState } from 'react';
import { ScheduleRow, FreeSlot } from '../types/schedule';
import {
  DEPT_START_MINUTES,
  DEPT_END_MINUTES,
  TOTAL_OPERATING_MINUTES,
  formatDuration,
  LUNCH_BREAK_START_MINUTES,
  LUNCH_BREAK_END_MINUTES,
  LUNCH_BREAK_LABEL,
} from '../utils/timeUtils';
import {
  Calendar,
  Clock,
  Plus,
  Sparkles,
  Layers,
  Utensils,
} from 'lucide-react';

interface TimelineVisualizerProps {
  date: string;
  availableDates: string[];
  onSelectDate: (date: string) => void;
  batches: string[];
  allBatches: string[];
  onToggleBatch: (batch: string) => void;
  batchData: Record<string, { occupied: ScheduleRow[]; freeSlots: FreeSlot[] }>;
  commonFreeSlots: FreeSlot[];
  minDurationMinutes: number;
  onBookSlot: (slot: { date: string; startMinutes: number; endMinutes: number; batch?: string; batches?: string[] }) => void;
}

const HOURS = [
  { min: 480, label: '08:00 AM' },
  { min: 540, label: '09:00 AM' },
  { min: 600, label: '10:00 AM' },
  { min: 660, label: '11:00 AM' },
  { min: 720, label: '12:00 PM' },
  { min: 780, label: '01:00 PM' },
  { min: 840, label: '02:00 PM' },
  { min: 900, label: '03:00 PM' },
  { min: 960, label: '04:00 PM' },
  { min: 1020, label: '05:00 PM' },
];

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({
  date,
  availableDates,
  onSelectDate,
  batches,
  allBatches,
  onToggleBatch,
  batchData,
  commonFreeSlots,
  minDurationMinutes,
  onBookSlot,
}) => {
  const [hoveredRow, setHoveredRow] = useState<ScheduleRow | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const getPercent = (minutes: number) => {
    const clamped = Math.max(DEPT_START_MINUTES, Math.min(DEPT_END_MINUTES, minutes));
    return ((clamped - DEPT_START_MINUTES) / TOTAL_OPERATING_MINUTES) * 100;
  };

  const getWidthPercent = (start: number, end: number) => {
    const startClamped = Math.max(DEPT_START_MINUTES, Math.min(DEPT_END_MINUTES, start));
    const endClamped = Math.max(DEPT_START_MINUTES, Math.min(DEPT_END_MINUTES, end));
    return Math.max(1.8, ((endClamped - startClamped) / TOTAL_OPERATING_MINUTES) * 100);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Timeline Controls Header - Dark Mode */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
                <Clock className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
                  Department Schedule Matrix
                </h2>
                <p className="text-xs text-zinc-500 mt-1 font-medium">
                  Side-by-side semester comparison (08:00 AM – 05:00 PM). Occupied classes in rose, available slots in emerald.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Date Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-bold">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Target Date:
            </span>
            <select
              value={date}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-zinc-800/60 border border-white/[0.08] rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all appearance-none cursor-pointer font-mono font-bold"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Batch Chips Selector inside Timeline */}
        <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-300 mr-1 flex items-center gap-1.5 font-semibold">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Batch Tracks:
          </span>
          {allBatches.map((b) => {
            const active = batches.includes(b);
            return (
              <button
                key={b}
                type="button"
                onClick={() => onToggleBatch(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 border ${
                  active
                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-white/[0.05]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-indigo-400' : 'bg-zinc-500'}`} />
                <span>{b}</span>
              </button>
            );
          })}
        </div>

        {/* High-Contrast Legend - Dark Mode */}
        <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-zinc-400 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md bg-rose-500/15 border border-rose-500/30 shadow-sm" />
            <span className="text-rose-400 font-bold">Occupied Class (Rose)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 shadow-sm" />
            <span className="text-emerald-400 font-bold">Available Free Slot (Emerald)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md bg-amber-500/15 border border-amber-500/30 shadow-sm" />
            <span className="text-amber-400 font-bold">Lunch Break ({LUNCH_BREAK_LABEL})</span>
          </div>
          {batches.length > 1 && (
            <div className="flex items-center gap-2 text-zinc-300 font-bold">
              <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 shadow-sm ring-1 ring-emerald-500/30" />
              <span>Multi-Batch Common Slot (All Batches Free)</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Swipe Hint */}
      <div className="md:hidden flex items-center justify-between px-3.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-medium text-indigo-300 shadow-sm">
        <span className="flex items-center gap-1.5">
          <span className="text-indigo-400 font-bold">⇄</span>
          <span>Swipe horizontally to inspect full timeline (08:00 AM – 05:00 PM)</span>
        </span>
      </div>

      {/* 2. Visual Gantt Timeline Container - Dark Mode */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 overflow-x-auto">
        <div className="min-w-[920px] relative">
          
          {/* Time Ruler */}
          <div className="grid grid-cols-12 gap-0 border-b border-white/[0.08] pb-3 mb-4">
            <div className="col-span-2 text-xs font-bold text-zinc-500 uppercase tracking-wider pl-1">
              Semester Track
            </div>
            <div className="col-span-10 relative h-7">
              {HOURS.map((hr, idx) => {
                const pct = ((hr.min - DEPT_START_MINUTES) / TOTAL_OPERATING_MINUTES) * 100;
                return (
                  <div
                    key={hr.min}
                    style={{ left: `${pct}%` }}
                    className={`absolute top-0 -translate-x-1/2 flex flex-col items-center ${
                      idx === 0 ? 'translate-x-0' : idx === HOURS.length - 1 ? '-translate-x-full' : ''
                    }`}
                  >
                    <span className="font-mono text-[10px] tabular-nums text-zinc-500 font-medium">
                      {hr.label}
                    </span>
                    <div className="w-px h-2 bg-white/[0.1] mt-1" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Lines */}
          <div className="absolute top-12 bottom-0 left-[16.666%] right-0 pointer-events-none flex">
            {HOURS.slice(0, -1).map((_, i) => (
              <div key={i} className="flex-1 border-r border-white/[0.04] relative">
                <div className="absolute left-1/2 top-0 bottom-0 border-r border-white/[0.02]" />
              </div>
            ))}
          </div>

          {/* Department Lunch Break Background Recess Column */}
          <div
            style={{
              left: `calc(16.666% + (100% - 16.666%) * ${((LUNCH_BREAK_START_MINUTES - DEPT_START_MINUTES) / TOTAL_OPERATING_MINUTES)})`,
              width: `calc((100% - 16.666%) * ${((LUNCH_BREAK_END_MINUTES - LUNCH_BREAK_START_MINUTES) / TOTAL_OPERATING_MINUTES)})`,
            }}
            className="absolute top-12 bottom-0 bg-amber-500/5 border-x border-dashed border-amber-500/20 pointer-events-none z-0"
          />

          {/* Master Common Free Slots Track (When > 1 batch selected) - Dark Mode */}
          {batches.length > 1 && (
            <div className="mb-5 p-3.5 rounded-2xl bg-zinc-800/40 border border-white/[0.08] shadow-sm">
              <div className="grid grid-cols-12 gap-0 items-center">
                <div className="col-span-2 pr-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>COMMON SLOTS</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-medium">
                    All {batches.length} batches available
                  </div>
                </div>

                <div className="col-span-10 relative h-14 bg-zinc-900/50 rounded-xl overflow-hidden border border-white/[0.08]">
                  {/* Department Lunch Break Recess Strip */}
                  <div
                    style={{
                      left: `${getPercent(LUNCH_BREAK_START_MINUTES)}%`,
                      width: `${getWidthPercent(LUNCH_BREAK_START_MINUTES, LUNCH_BREAK_END_MINUTES)}%`,
                    }}
                    className="absolute top-1 bottom-1 bg-amber-500/10 border border-dashed border-amber-500/30 rounded-xl flex items-center justify-center gap-1.5 text-amber-400 pointer-events-none select-none z-10"
                    title={`Mandatory Department Lunch Break (${LUNCH_BREAK_LABEL})`}
                  >
                    <Utensils className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-amber-400">
                      Lunch Break
                    </span>
                  </div>

                  {commonFreeSlots.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-medium">
                      No common free slots found for ≥ {minDurationMinutes} mins across all {batches.length} batches
                    </div>
                  ) : (
                    commonFreeSlots.map((slot) => {
                      const left = getPercent(slot.startMinutes);
                      const width = getWidthPercent(slot.startMinutes, slot.endMinutes);
                      return (
                        <button
                          key={slot.id}
                          onClick={() =>
                            onBookSlot({
                              date,
                              startMinutes: slot.startMinutes,
                              endMinutes: Math.min(
                                slot.endMinutes,
                                slot.startMinutes + (minDurationMinutes >= 30 ? minDurationMinutes : 60)
                              ),
                              batches: batches,
                            })
                          }
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`Click to book joint slot: ${slot.formattedRange}`}
                          className="absolute top-1 bottom-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-xl p-2 flex flex-col justify-center items-center shadow-md border border-white/[0.15] transition cursor-pointer hover:z-20 group"
                        >
                          <div className="text-[10px] font-mono tabular-nums font-black leading-none flex items-center gap-1">
                            <span>{slot.startTime} – {slot.endTime}</span>
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/90 mt-0.5">
                            {slot.durationFormatted} Free
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Individual Batch Tracks - Dark Mode */}
          <div className="space-y-4">
            {batches.map((batch) => {
              const data = batchData[batch] || { occupied: [], freeSlots: [] };
              const { occupied, freeSlots } = data;

              return (
                <div
                  key={batch}
                  className="grid grid-cols-12 gap-0 items-center p-3 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/[0.05] transition-colors"
                >
                  {/* Left Track Title */}
                  <div className="col-span-2 pr-4">
                    <div className="text-sm font-semibold text-zinc-300 truncate">
                      {batch}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                      <span className="text-rose-400 font-semibold">{occupied.length} classes</span>
                      {' • '}
                      <span className="text-emerald-400 font-semibold">{freeSlots.length} free</span>
                    </div>
                  </div>

                  {/* Track Bar */}
                  <div className="col-span-10 relative h-15 bg-zinc-900/60 rounded-xl border border-white/[0.08] overflow-hidden">
                    
                    {/* Lunch Break Strip */}
                    <div
                      style={{
                        left: `${getPercent(LUNCH_BREAK_START_MINUTES)}%`,
                        width: `${getWidthPercent(LUNCH_BREAK_START_MINUTES, LUNCH_BREAK_END_MINUTES)}%`,
                      }}
                      className="absolute top-1.5 bottom-1.5 bg-amber-500/10 border border-dashed border-amber-500/20 rounded-xl flex items-center justify-center gap-1 text-amber-400 pointer-events-none select-none z-10"
                      title={`Mandatory Department Lunch Break (${LUNCH_BREAK_LABEL})`}
                    >
                      <Utensils className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                      <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wide">
                        Lunch Recess
                      </span>
                    </div>

                    {/* Free Slots (Emerald) */}
                    {freeSlots.map((slot) => {
                      const left = getPercent(slot.startMinutes);
                      const width = getWidthPercent(slot.startMinutes, slot.endMinutes);
                      const meets = slot.durationMinutes >= minDurationMinutes;

                      return (
                        <button
                          key={slot.id}
                          onClick={() =>
                            onBookSlot({
                              date,
                              startMinutes: slot.startMinutes,
                              endMinutes: Math.min(
                                slot.endMinutes,
                                slot.startMinutes + (minDurationMinutes >= 30 ? minDurationMinutes : 60)
                              ),
                              batch,
                              batches: [batch],
                            })
                          }
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`Click to book free slot: ${slot.formattedRange}`}
                          className={`absolute top-1.5 bottom-1.5 rounded-xl flex flex-col justify-center items-center px-2 transition-all group cursor-pointer border ${
                            meets
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-500/50 hover:z-10'
                              : 'bg-zinc-800/50 border-white/[0.05] text-zinc-500 opacity-60 cursor-not-allowed'
                          }`}
                          disabled={!meets}
                        >
                          <div className="text-[11px] font-semibold truncate flex items-center gap-1">
                            <span>Free {slot.durationFormatted}</span>
                            <Plus className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="font-mono tabular-nums text-[10px] text-emerald-400/80 truncate mt-0.5">
                            {slot.startTime}–{slot.endTime}
                          </span>
                        </button>
                      );
                    })}

                    {/* Occupied Slots (Coral / Rose) */}
                    {occupied.map((row) => {
                      const left = getPercent(row.startMinutes);
                      const width = getWidthPercent(row.startMinutes, row.endMinutes);

                      return (
                        <div
                          key={row.id}
                          onMouseEnter={(e) => {
                            setHoveredRow(row);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                          }}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          className="absolute top-1 bottom-1 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl p-2 flex flex-col justify-center overflow-hidden transition cursor-pointer hover:z-20 text-rose-300"
                        >
                          <div className="text-[11px] font-semibold truncate leading-tight">
                            {row.subject || row.teacherName}
                          </div>
                          <div className="text-[10px] text-rose-400 truncate flex items-center gap-1 mt-0.5 font-medium">
                            <span className="truncate">{row.teacherName}</span>
                            <span>•</span>
                            <span className="truncate">{row.venue}</span>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Popover on Hovering Occupied Blocks - Dark Mode */}
      {hoveredRow && tooltipPos && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: tooltipPos.y < 180 ? `${tooltipPos.y + 35}px` : `${tooltipPos.y - 10}px`,
            transform: tooltipPos.y < 180 ? 'translate(-50%, 0%)' : 'translate(-50%, -100%)',
          }}
          className="z-50 bg-zinc-800/95 backdrop-blur-xl border border-white/[0.1] p-4 rounded-xl shadow-2xl text-xs space-y-1.5 w-64 pointer-events-none animate-in fade-in zoom-in-95 duration-100 text-zinc-300"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 font-bold text-rose-400">
            <span>Occupied Lecture</span>
            <span className="font-mono text-zinc-400 tabular-nums">{hoveredRow.date}</span>
          </div>
          <div><span className="text-zinc-500">Subject:</span> <strong className="text-zinc-100 font-bold ml-1">{hoveredRow.subject || 'CS Lecture'}</strong></div>
          <div><span className="text-zinc-500">Batch:</span> <strong className="text-zinc-100 ml-1">{hoveredRow.courseSem}</strong></div>
          <div><span className="text-zinc-500">Faculty:</span> <strong className="text-zinc-100 ml-1">{hoveredRow.teacherName}</strong></div>
          <div><span className="text-zinc-500">Venue:</span> <span className="text-indigo-400 font-semibold ml-1">{hoveredRow.venue}</span></div>
          <div><span className="text-zinc-500">Time:</span> <span className="font-mono tabular-nums text-emerald-400 font-bold ml-1">{hoveredRow.time}</span></div>
          <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/[0.08] mt-1 font-mono">
            Duration: {formatDuration(hoveredRow.endMinutes - hoveredRow.startMinutes)}
          </div>
        </div>
      )}

    </div>
  );
};
