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
      
      {/* 1. Timeline Controls Header - Light Mode */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm" />
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Department Schedule Matrix (08:00 AM – 05:00 PM)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Side-by-side semester comparison. Occupied classes in coral, available slots in emerald.
            </p>
          </div>

          {/* Quick Date Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 flex items-center gap-1.5 font-bold">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Target Date:
            </span>
            <select
              value={date}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 hover:border-emerald-400 text-xs rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Batch Chips Selector inside Timeline */}
        <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-700 mr-1 flex items-center gap-1.5 font-bold">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Batch Tracks:
          </span>
          {allBatches.map((b) => {
            const active = batches.includes(b);
            return (
              <button
                key={b}
                type="button"
                onClick={() => onToggleBatch(b)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-slate-300'}`} />
                <span>{b}</span>
              </button>
            );
          })}
        </div>

        {/* High-Contrast Legend - Light Mode */}
        <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-slate-600 border-t border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md bg-rose-100 border border-rose-400 shadow-sm" />
            <span className="text-rose-800 font-bold">Occupied Class (Coral)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-400 shadow-sm" />
            <span className="text-emerald-800 font-bold">Available Free Slot (Emerald)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-400 shadow-sm" />
            <span className="text-amber-900 font-bold">Lunch Break ({LUNCH_BREAK_LABEL})</span>
          </div>
          {batches.length > 1 && (
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-r from-sky-500 to-emerald-500 shadow-sm ring-1 ring-emerald-400" />
              <span>Multi-Batch Common Slot (All Batches Free)</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Swipe Hint */}
      <div className="md:hidden flex items-center justify-between px-3.5 py-2 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-[11px] font-medium text-indigo-900 shadow-2xs">
        <span className="flex items-center gap-1.5">
          <span className="text-indigo-600 font-bold">⇄</span>
          <span>Swipe horizontally to inspect full timeline (08:00 AM – 05:00 PM)</span>
        </span>
      </div>

      {/* 2. Visual Gantt Timeline Container - Light Mode */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm overflow-x-auto bg-white border border-slate-200/90">
        <div className="min-w-[920px] relative">
          
          {/* Time Ruler */}
          <div className="grid grid-cols-12 gap-0 border-b border-slate-200 pb-3 mb-4">
            <div className="col-span-2 text-xs font-black text-slate-500 uppercase tracking-wider pl-1">
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
                    <span className="text-[11px] font-mono font-bold text-slate-700">
                      {hr.label}
                    </span>
                    <div className="w-px h-2 bg-slate-300 mt-1" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Lines */}
          <div className="absolute top-12 bottom-0 left-[16.666%] right-0 pointer-events-none flex">
            {HOURS.slice(0, -1).map((_, i) => (
              <div key={i} className="flex-1 border-r border-slate-100 relative">
                <div className="absolute left-1/2 top-0 bottom-0 border-r border-slate-50" />
              </div>
            ))}
          </div>

          {/* Department Lunch Break Background Recess Column */}
          <div
            style={{
              left: `calc(16.666% + (100% - 16.666%) * ${((LUNCH_BREAK_START_MINUTES - DEPT_START_MINUTES) / TOTAL_OPERATING_MINUTES)})`,
              width: `calc((100% - 16.666%) * ${((LUNCH_BREAK_END_MINUTES - LUNCH_BREAK_START_MINUTES) / TOTAL_OPERATING_MINUTES)})`,
            }}
            className="absolute top-12 bottom-0 bg-amber-500/5 border-x border-dashed border-amber-300/40 pointer-events-none z-0"
          />

          {/* Master Common Free Slots Track (When > 1 batch selected) - Light Mode */}
          {batches.length > 1 && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-300/80 shadow-sm">
              <div className="grid grid-cols-12 gap-0 items-center">
                <div className="col-span-2 pr-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>COMMON SLOTS</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    All {batches.length} batches available
                  </div>
                </div>

                <div className="col-span-10 relative h-14 bg-slate-100/80 rounded-xl overflow-hidden border border-slate-200">
                  {/* Department Lunch Break Recess Strip */}
                  <div
                    style={{
                      left: `${getPercent(LUNCH_BREAK_START_MINUTES)}%`,
                      width: `${getWidthPercent(LUNCH_BREAK_START_MINUTES, LUNCH_BREAK_END_MINUTES)}%`,
                    }}
                    className="absolute top-1 bottom-1 bg-amber-100/90 border border-dashed border-amber-400/90 rounded-xl flex items-center justify-center gap-1.5 text-amber-900 pointer-events-none select-none z-10 shadow-2xs"
                    title={`Mandatory Department Lunch Break (${LUNCH_BREAK_LABEL})`}
                  >
                    <Utensils className="w-3 h-3 text-amber-700 flex-shrink-0" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-wide text-amber-950">
                      Lunch Break
                    </span>
                  </div>

                  {commonFreeSlots.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 font-medium">
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
                              endMinutes: slot.endMinutes,
                              batches: batches,
                            })
                          }
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`Click to book joint slot: ${slot.formattedRange}`}
                          className="absolute top-1 bottom-1 bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white rounded-xl p-2 flex flex-col justify-center items-center shadow-md shadow-emerald-500/20 border border-white/60 transition cursor-pointer hover:z-20 group"
                        >
                          <div className="text-xs font-black leading-none flex items-center gap-1">
                            <span>{slot.startTime} – {slot.endTime}</span>
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-white/90 mt-0.5">
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

          {/* Individual Batch Tracks - Light Mode */}
          <div className="space-y-4">
            {batches.map((batch) => {
              const data = batchData[batch] || { occupied: [], freeSlots: [] };
              const { occupied, freeSlots } = data;

              return (
                <div
                  key={batch}
                  className="grid grid-cols-12 gap-0 items-center p-3 rounded-2xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/80 transition-colors"
                >
                  {/* Left Track Title */}
                  <div className="col-span-2 pr-4">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {batch}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                      <span className="text-rose-700 font-semibold">{occupied.length} classes</span>
                      {' • '}
                      <span className="text-emerald-700 font-semibold">{freeSlots.length} free</span>
                    </div>
                  </div>

                  {/* Track Bar */}
                  <div className="col-span-10 relative h-15 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-inner">
                    
                    {/* Lunch Break Strip */}
                    <div
                      style={{
                        left: `${getPercent(LUNCH_BREAK_START_MINUTES)}%`,
                        width: `${getWidthPercent(LUNCH_BREAK_START_MINUTES, LUNCH_BREAK_END_MINUTES)}%`,
                      }}
                      className="absolute top-1.5 bottom-1.5 bg-amber-50/90 border border-dashed border-amber-300 rounded-xl flex items-center justify-center gap-1 text-amber-900 pointer-events-none select-none z-10"
                      title={`Mandatory Department Lunch Break (${LUNCH_BREAK_LABEL})`}
                    >
                      <Utensils className="w-2.5 h-2.5 text-amber-700 flex-shrink-0" />
                      <span className="text-[9px] font-mono font-black text-amber-900 uppercase tracking-wide">
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
                              endMinutes: slot.endMinutes,
                              batch,
                              batches: [batch],
                            })
                          }
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`Click to book free slot: ${slot.formattedRange}`}
                          className={`absolute top-1.5 bottom-1.5 rounded-xl flex flex-col justify-center items-center px-2 transition-all group cursor-pointer border ${
                            meets
                              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-400 text-emerald-900 hover:border-emerald-500 hover:z-10 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="text-[11px] font-black truncate flex items-center gap-1">
                            <span>Free {slot.durationFormatted}</span>
                            <Plus className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-[10px] font-mono text-emerald-800 truncate font-semibold">
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
                          className="absolute top-1 bottom-1 bg-rose-50 hover:bg-rose-100/90 border border-rose-300 rounded-xl p-2 flex flex-col justify-center overflow-hidden shadow-sm transition cursor-pointer hover:z-20"
                        >
                          <div className="text-[11px] font-black text-slate-900 truncate leading-tight">
                            {row.subject || row.teacherName}
                          </div>
                          <div className="text-[10px] text-rose-800 truncate flex items-center gap-1 mt-0.5 font-medium">
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

      {/* Popover on Hovering Occupied Blocks - Light Mode */}
      {hoveredRow && tooltipPos && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: tooltipPos.y < 180 ? `${tooltipPos.y + 35}px` : `${tooltipPos.y - 10}px`,
            transform: tooltipPos.y < 180 ? 'translate(-50%, 0%)' : 'translate(-50%, -100%)',
          }}
          className="z-50 bg-white/95 border border-rose-300 p-4 rounded-2xl shadow-xl text-xs space-y-1.5 w-64 backdrop-blur-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-100 text-slate-800"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-bold text-rose-700">
            <span>Occupied Lecture</span>
            <span className="font-mono text-slate-500">{hoveredRow.date}</span>
          </div>
          <div><span className="text-slate-500">Subject:</span> <strong className="text-slate-900 font-bold">{hoveredRow.subject || 'CS Lecture'}</strong></div>
          <div><span className="text-slate-500">Batch:</span> <strong className="text-slate-900">{hoveredRow.courseSem}</strong></div>
          <div><span className="text-slate-500">Faculty:</span> <strong className="text-slate-900">{hoveredRow.teacherName}</strong></div>
          <div><span className="text-slate-500">Venue:</span> <span className="text-indigo-700 font-semibold">{hoveredRow.venue}</span></div>
          <div><span className="text-slate-500">Time:</span> <span className="font-mono text-emerald-700 font-bold">{hoveredRow.time}</span></div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            Duration: {formatDuration(hoveredRow.endMinutes - hoveredRow.startMinutes)}
          </div>
        </div>
      )}

    </div>
  );
};
