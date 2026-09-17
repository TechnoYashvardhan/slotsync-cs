import React from 'react';
import {
  Calendar,
  Clock,
  Users,
  CheckSquare,
  Square,
  Sparkles,
  MapPin,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { htmlDateToDDMMYYYY, ddmmYYYYToHtmlDate } from '../utils/timeUtils';

interface ControlsBarProps {
  availableDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availableBatches: string[];
  selectedBatches: string[];
  onToggleBatch: (batch: string) => void;
  onSelectAllBatches: () => void;
  onClearBatches: () => void;
  selectedDuration: number; // in minutes
  onSelectDuration: (minutes: number) => void;
  availableTeachers: string[];
  selectedTeacher: string;
  onSelectTeacher: (teacher: string) => void;
  availableVenues: string[];
  selectedVenue: string;
  onSelectVenue: (venue: string) => void;
  onResetFilters: () => void;
}

const DURATION_OPTIONS = [
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1 Hour', minutes: 60 },
  { label: '1.5 Hours', minutes: 90 },
  { label: '2 Hours', minutes: 120 },
  { label: '3 Hours', minutes: 180 },
];

export const ControlsBar: React.FC<ControlsBarProps> = ({
  availableDates,
  selectedDate,
  onSelectDate,
  availableBatches,
  selectedBatches,
  onToggleBatch,
  onSelectAllBatches,
  onClearBatches,
  selectedDuration,
  onSelectDuration,
  availableTeachers,
  selectedTeacher,
  onSelectTeacher,
  availableVenues,
  selectedVenue,
  onSelectVenue,
  onResetFilters,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 1. Target Date Selector */}
        <div className="lg:col-span-3 space-y-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            1. Target Date
          </label>
          
          <div className="space-y-2">
            {/* Quick dropdown for dates in dataset */}
            <select
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-medium cursor-pointer"
            >
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {date} {availableDates[0] === date ? '(Active)' : ''}
                </option>
              ))}
              {availableDates.length === 0 && (
                <option value="">No dates in schedule</option>
              )}
            </select>

            {/* Manual Date Picker input */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Or pick date:</span>
              <input
                type="date"
                value={ddmmYYYYToHtmlDate(selectedDate)}
                onChange={(e) => {
                  const ddmmyyyy = htmlDateToDDMMYYYY(e.target.value);
                  if (ddmmyyyy) onSelectDate(ddmmyyyy);
                }}
                className="bg-slate-800/80 border border-slate-700/80 text-xs rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Requested Session Duration */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              2. Session Duration
            </label>
            <span className="text-xs font-mono font-medium text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
              Min: {selectedDuration} mins
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = selectedDuration === opt.minutes;
              return (
                <button
                  key={opt.minutes}
                  type="button"
                  onClick={() => onSelectDuration(opt.minutes)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/50 ring-1 ring-indigo-400'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/70 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Optional Faculty & Venue Filter */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Slot Filters (Optional)
            </label>
            {(selectedTeacher || selectedVenue) && (
              <button
                onClick={onResetFilters}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Filter by Teacher */}
            <div className="relative">
              <select
                value={selectedTeacher}
                onChange={(e) => onSelectTeacher(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-500 cursor-pointer truncate"
              >
                <option value="">Any Faculty</option>
                {availableTeachers.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Filter by Venue */}
            <div className="relative">
              <select
                value={selectedVenue}
                onChange={(e) => onSelectVenue(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-500 cursor-pointer truncate"
              >
                <option value="">Any Venue / Lab</option>
                {availableVenues.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* Target CourseSem Multi-Select Section */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              3. Target Course / Semester (Multi-Select)
            </label>
            <span className="text-[11px] text-slate-400">
              ({selectedBatches.length} of {availableBatches.length} selected)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onSelectAllBatches}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              Select All
            </button>
            <button
              type="button"
              onClick={onClearBatches}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 text-slate-400" />
              Clear
            </button>
          </div>
        </div>

        {/* Batch Chips */}
        <div className="flex flex-wrap gap-2">
          {availableBatches.map((batch) => {
            const isSelected = selectedBatches.includes(batch);
            return (
              <button
                key={batch}
                type="button"
                onClick={() => onToggleBatch(batch)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isSelected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <span>{batch}</span>
              </button>
            );
          })}
        </div>

        {/* Multi-batch informational notice */}
        {selectedBatches.length > 1 && (
          <div className="mt-3 px-3.5 py-2 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between text-xs text-indigo-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <strong>Multi-Batch Mode Active:</strong> SlotSync CS engine is computing common intersection free slots where <strong>all {selectedBatches.length} selected batches</strong> are concurrently free.
            </span>
            <span className="text-[11px] text-indigo-400 hidden md:inline">Perfect for joint seminars & common exams</span>
          </div>
        )}
      </div>

    </div>
  );
};
