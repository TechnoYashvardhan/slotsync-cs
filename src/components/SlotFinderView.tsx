import React, { useRef } from 'react';
import { FreeSlot, ScheduleRow } from '../types/schedule';
import { getAvailableTeachers, getAvailableVenues } from '../utils/conflictChecker';
import { htmlDateToDDMMYYYY, ddmmYYYYToHtmlDate, minutesToReadable } from '../utils/timeUtils';
import {
  Calendar,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  User,
  MapPin,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Sliders,
} from 'lucide-react';

interface SlotFinderViewProps {
  availableDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availableBatches: string[];
  selectedBatches: string[];
  onToggleBatch: (batch: string) => void;
  onSelectAllBatches: () => void;
  selectedDuration: number;
  onSelectDuration: (duration: number) => void;
  freeSlots: FreeSlot[];
  schedule: ScheduleRow[];
  allTeachers: string[];
  allVenues: string[];
  onBookSlot: (slot: { date: string; startMinutes: number; endMinutes: number; batch?: string }) => void;
  onNavigateToTimeline: () => void;
}

const DURATION_PRESETS = [
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1 Hour', minutes: 60 },
  { label: '1.5 Hours', minutes: 90 },
  { label: '2 Hours', minutes: 120 },
  { label: '3 Hours', minutes: 180 },
];

export const SlotFinderView: React.FC<SlotFinderViewProps> = ({
  availableDates,
  selectedDate,
  onSelectDate,
  availableBatches,
  selectedBatches,
  onToggleBatch,
  onSelectAllBatches,
  selectedDuration,
  onSelectDuration,
  freeSlots,
  schedule,
  allTeachers,
  allVenues,
  onBookSlot,
  onNavigateToTimeline,
}) => {
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  const handleClearBatches = () => {
    if (availableBatches.length > 0) {
      onToggleBatch(selectedBatches[0]); // keeps at least one
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Bespoke Filter Terminal - Light Mode */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Ambient Top Glows */}
        <div className="absolute -top-20 left-1/4 w-80 h-28 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -top-20 right-1/4 w-80 h-28 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/90 pb-5 relative">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Slot Inversion Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Select date, semester batches, and desired duration. Operating range: <span className="text-slate-800 font-mono font-bold">08:00 AM – 05:00 PM</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-extrabold px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{freeSlots.length} Available Slot{freeSlots.length === 1 ? '' : 's'}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
          
          {/* Step 1: Target Date */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                1. Target Date
              </label>
              <button
                type="button"
                onClick={() => hiddenDateInputRef.current?.showPicker?.() || hiddenDateInputRef.current?.click()}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold cursor-pointer"
              >
                <span>Calendar Picker</span>
              </button>
            </div>

            {/* Selected Date Card with Integrated Picker Trigger */}
            <div className="space-y-2">
              <div
                onClick={() => hiddenDateInputRef.current?.showPicker?.() || hiddenDateInputRef.current?.click()}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-emerald-400 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer transition shadow-sm group"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-mono font-bold text-slate-900">{selectedDate}</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-800 transition-colors">
                  Change ▾
                </span>
                {/* Hidden native input */}
                <input
                  ref={hiddenDateInputRef}
                  type="date"
                  value={ddmmYYYYToHtmlDate(selectedDate)}
                  onChange={(e) => {
                    const converted = htmlDateToDDMMYYYY(e.target.value);
                    if (converted) onSelectDate(converted);
                  }}
                  className="sr-only"
                />
              </div>

              {/* Quick Preset Dates from Schedule */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono mr-1 font-bold">In Schedule:</span>
                {availableDates.map((d) => {
                  const isActive = selectedDate === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onSelectDate(d)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white font-bold shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 2: Minimum Duration */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                2. Required Duration
              </label>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Min: {selectedDuration}m
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {DURATION_PRESETS.map((p) => {
                const active = selectedDuration === p.minutes;
                return (
                  <button
                    key={p.minutes}
                    type="button"
                    onClick={() => onSelectDuration(p.minutes)}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-600 scale-[1.02]'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Target Batches (No ugly scrollbar, clean wrap) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" />
                3. Semesters ({selectedBatches.length})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSelectAllBatches}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                {selectedBatches.length > 1 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => onToggleBatch(selectedBatches[0])}
                      className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Single Batch
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Clean wrapping chips with ZERO vertical scrollbar */}
            <div className="flex flex-wrap gap-2">
              {availableBatches.map((batch) => {
                const isSelected = selectedBatches.includes(batch);
                return (
                  <button
                    key={batch}
                    type="button"
                    onClick={() => onToggleBatch(batch)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-600 shadow-sm' : 'bg-slate-300'}`} />
                    <span>{batch}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Multi-Batch Status Banner - Light Mode */}
        {selectedBatches.length > 1 && (
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 flex items-center justify-between text-xs text-indigo-950 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <span>
                <strong>Multi-Batch Coordination Active:</strong> Inverting schedule to identify slots where <strong>all {selectedBatches.length} batches</strong> are simultaneously free.
              </span>
            </div>
            <button
              onClick={onNavigateToTimeline}
              className="text-indigo-700 hover:text-indigo-900 font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View Timeline</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

      {/* 2. Free Slots Cards Section - Light Mode */}
      <div>
        <div className="flex items-center justify-between mb-5 px-1">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Identified Conflict-Free Windows ({freeSlots.length})
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Target Date: <strong className="text-slate-900 font-mono">{selectedDate}</strong> • Minimum duration: <strong className="text-emerald-700 font-mono">≥ {selectedDuration} mins</strong>
            </p>
          </div>

          <button
            onClick={onNavigateToTimeline}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 bg-white border border-slate-200 hover:border-indigo-400 px-3.5 py-2 rounded-2xl transition cursor-pointer shadow-sm"
          >
            <span>Timeline Comparison</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
          </button>
        </div>

        {freeSlots.length === 0 ? (
          <div className="glass-panel border-dashed border-slate-300 rounded-3xl p-14 text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-amber-600">
              <Clock className="w-7 h-7 text-amber-500" />
            </div>
            <h4 className="text-base font-bold text-slate-900">No Matching Continuous Free Slots</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              No continuous window of at least {selectedDuration} minutes is open on {selectedDate} across the selected batches.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => onSelectDuration(30)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-emerald-700 border border-slate-200 cursor-pointer transition"
              >
                Try 30m Duration
              </button>
              <button
                type="button"
                onClick={onNavigateToTimeline}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-indigo-700 border border-slate-200 cursor-pointer transition"
              >
                Open Timeline
              </button>
            </div>
          </div>
        ) : (
          /* RESPONSIVE BALANCED GRID: Fills row evenly when 1, 2, or 3+ cards */
          <div className={`grid grid-cols-1 md:grid-cols-2 ${freeSlots.length >= 3 ? 'xl:grid-cols-3' : ''} gap-6`}>
            {freeSlots.map((slot, idx) => {
              const { available: freeFaculty } = getAvailableTeachers(
                schedule,
                allTeachers,
                slot.date,
                slot.startMinutes,
                slot.endMinutes
              );
              const { available: freeRooms } = getAvailableVenues(
                schedule,
                allVenues,
                slot.date,
                slot.startMinutes,
                slot.endMinutes
              );

              return (
                <div
                  key={slot.id}
                  className="glass-panel-interactive rounded-3xl p-6 sm:p-7 flex flex-col justify-between group relative overflow-hidden bg-white border border-slate-200/90 shadow-sm hover:shadow-card-hover"
                >
                  {/* Subtle top corner emerald glow */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg">
                        WINDOW #{idx + 1}
                      </span>
                      <span className="text-xs font-mono font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
                        {slot.durationFormatted} Free
                      </span>
                    </div>

                    {/* Highly readable time window format with colons and arrow */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 text-2xl font-mono font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                        <span>{minutesToReadable(slot.startMinutes)}</span>
                        <span className="text-slate-400 font-sans font-light text-lg">→</span>
                        <span>{minutesToReadable(slot.endMinutes)}</span>
                      </div>
                      
                      <div className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                          {slot.formattedRange}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {slot.applicableBatches.length > 1
                            ? `All ${slot.applicableBatches.length} batches free`
                            : slot.applicableBatches[0]}
                        </span>
                      </div>
                    </div>

                    {/* Available Resources Counters */}
                    <div className="space-y-2 py-3.5 border-t border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                          Faculty Available:
                        </span>
                        <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                          {freeFaculty.length} available
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-sky-600" />
                          Labs / Halls Free:
                        </span>
                        <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                          {freeRooms.length} available
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Reservation CTA Button */}
                  <button
                    type="button"
                    onClick={() =>
                      onBookSlot({
                        date: slot.date,
                        startMinutes: slot.startMinutes,
                        endMinutes: slot.endMinutes,
                        batch: slot.applicableBatches.length === 1 ? slot.applicableBatches[0] : undefined,
                      })
                    }
                    className="mt-5 w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Reserve Session in Slot</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
