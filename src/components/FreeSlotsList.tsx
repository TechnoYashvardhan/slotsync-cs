import React from 'react';
import { FreeSlot, ScheduleRow } from '../types/schedule';
import { getAvailableTeachers, getAvailableVenues } from '../utils/conflictChecker';
import { CheckCircle2, Clock, Calendar, Plus, MapPin, User, Sparkles, ArrowRight } from 'lucide-react';

interface FreeSlotsListProps {
  freeSlots: FreeSlot[];
  targetDate: string;
  selectedBatches: string[];
  schedule: ScheduleRow[];
  allTeachers: string[];
  allVenues: string[];
  minDurationMinutes: number;
  onBookSlot: (slot: { date: string; startMinutes: number; endMinutes: number; batch?: string }) => void;
}

export const FreeSlotsList: React.FC<FreeSlotsListProps> = ({
  freeSlots,
  targetDate,
  selectedBatches,
  schedule,
  allTeachers,
  allVenues,
  minDurationMinutes,
  onBookSlot,
}) => {
  if (freeSlots.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 text-slate-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">No Matching Free Slots Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          No common continuous time window of at least {minDurationMinutes} minutes is available on {targetDate} for the selected batches.
          Try reducing the requested duration or toggling specific batches.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Identified Free Slots ({freeSlots.length})
          </h3>
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            ≥ {minDurationMinutes} mins duration
          </span>
        </div>
        <span className="text-xs text-slate-400">
          Click any slot to reserve for an exam, guest lecture, or extra class
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {freeSlots.map((slot, index) => {
          // Check free faculty and venues for this exact slot
          const { available: freeTeachers } = getAvailableTeachers(
            schedule,
            allTeachers,
            slot.date,
            slot.startMinutes,
            slot.endMinutes
          );
          const { available: freeVenues } = getAvailableVenues(
            schedule,
            allVenues,
            slot.date,
            slot.startMinutes,
            slot.endMinutes
          );

          return (
            <div
              key={slot.id}
              className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/20 group flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Slot Number & Duration Badge */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-mono font-semibold uppercase text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Slot #{index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                    {slot.durationFormatted}
                  </span>
                </div>

                {/* Time Window Display */}
                <div className="mb-3">
                  <div className="text-lg font-mono font-extrabold text-white tracking-tight group-hover:text-emerald-300 transition">
                    {slot.formattedRange}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{slot.date}</span>
                    <span>•</span>
                    <span>{slot.applicableBatches.length > 1 ? 'All Selected Batches Free' : slot.applicableBatches[0]}</span>
                  </div>
                </div>

                {/* Free Resources Snapshot */}
                <div className="space-y-1.5 text-xs pt-3 border-t border-slate-800/80 mb-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      Free Faculty:
                    </span>
                    <span className="font-semibold text-slate-200">
                      {freeTeachers.length} available
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-400" />
                      Free Venues:
                    </span>
                    <span className="font-semibold text-slate-200">
                      {freeVenues.length} available
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
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
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-semibold text-xs transition-all border border-emerald-500/30 hover:border-emerald-400 flex items-center justify-center gap-2 group-hover:shadow-md cursor-pointer"
              >
                <span>Book This Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
