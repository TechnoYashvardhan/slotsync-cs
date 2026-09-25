import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Plus,
  Filter,
  Layers,
  Sparkles,
  Printer,
  CheckCircle2,
  Utensils,
} from 'lucide-react';
import type { ScheduleRow } from '../types/schedule';
import {
  getAcademicWeekDates,
  addWeeksToDDMMYYYY,
  minutesToReadable,
  DEPT_START_MINUTES,
  DEPT_END_MINUTES,
  formatFriendlyDate,
  LUNCH_BREAK_START_MINUTES,
  LUNCH_BREAK_END_MINUTES,
  LUNCH_BREAK_LABEL,
} from '../utils/timeUtils';

interface WeeklyTimetableViewProps {
  schedule: ScheduleRow[];
  currentDate: string;
  allBatches: string[];
  allVenues: string[];
  onBookSlot: (slot: {
    date: string;
    startMinutes: number;
    endMinutes: number;
    batch?: string;
    batches?: string[];
    venue?: string;
  }) => void;
}

export interface TimetablePeriod {
  start: number;
  end: number;
  label: string;
  name: string;
  isLunchBreak?: boolean;
}

// Department academic timetable periods including mandatory lunch recess
export const TIMETABLE_PERIODS: TimetablePeriod[] = [
  { start: 480, end: 555, label: '08:00 AM – 09:15 AM', name: 'Period 1' },
  { start: 555, end: 630, label: '09:15 AM – 10:30 AM', name: 'Period 2' },
  {
    start: LUNCH_BREAK_START_MINUTES,
    end: LUNCH_BREAK_END_MINUTES,
    label: LUNCH_BREAK_LABEL,
    name: 'Lunch Recess',
    isLunchBreak: true,
  },
  { start: 705, end: 795, label: '11:45 AM – 01:15 PM', name: 'Period 3' },
  { start: 795, end: 870, label: '01:15 PM – 02:30 PM', name: 'Period 4' },
  { start: 870, end: 945, label: '02:30 PM – 03:45 PM', name: 'Period 5' },
  { start: 945, end: 1020, label: '03:45 PM – 05:00 PM', name: 'Period 6' },
];

export const WeeklyTimetableView: React.FC<WeeklyTimetableViewProps> = ({
  schedule,
  currentDate,
  allBatches,
  allVenues,
  onBookSlot,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(currentDate || '25-09-2026');
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [selectedVenue, setSelectedVenue] = useState<string>('All');
  const [mobileActiveDay, setMobileActiveDay] = useState<string>('');

  useEffect(() => {
    if (currentDate) {
      setSelectedDate(currentDate);
    }
  }, [currentDate]);

  // Academic week (Mon-Sat) for current selectedDate
  const weekDays = useMemo(() => {
    return getAcademicWeekDates(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!mobileActiveDay && weekDays.length > 0) {
      setMobileActiveDay(weekDays[0].date);
    } else if (weekDays.length > 0 && !weekDays.some((w) => w.date === mobileActiveDay)) {
      setMobileActiveDay(weekDays[0].date);
    }
  }, [weekDays, mobileActiveDay]);

  const handlePrevWeek = () => {
    setSelectedDate((prev) => addWeeksToDDMMYYYY(prev, -1));
  };

  const handleNextWeek = () => {
    setSelectedDate((prev) => addWeeksToDDMMYYYY(prev, 1));
  };

  // Filter schedule for this entire week and criteria
  const weekDatesSet = useMemo(() => new Set(weekDays.map((d) => d.date)), [weekDays]);

  const filteredSchedule = useMemo(() => {
    return schedule.filter((row) => {
      if (!weekDatesSet.has(row.date)) return false;
      if (selectedBatch !== 'All' && row.courseSem !== selectedBatch) return false;
      if (selectedVenue !== 'All' && row.venue !== selectedVenue) return false;
      return true;
    });
  }, [schedule, weekDatesSet, selectedBatch, selectedVenue]);

  // Map lectures by date and timetable period
  const cellLectures = useMemo(() => {
    const map = new Map<string, ScheduleRow[]>();

    for (const row of filteredSchedule) {
      for (const block of TIMETABLE_PERIODS) {
        if (block.isLunchBreak) continue;
        // Overlap condition: block.start < row.endMinutes && block.end > row.startMinutes
        if (block.start < row.endMinutes && block.end > row.startMinutes) {
          const key = `${row.date}-${block.start}`;
          const list = map.get(key) || [];
          if (!list.some((r) => r.id === row.id)) {
            list.push(row);
          }
          map.set(key, list);
        }
      }
    }

    return map;
  }, [filteredSchedule]);

  const weekRangeDisplay = useMemo(() => {
    if (weekDays.length === 0) return '';
    const first = weekDays[0];
    const last = weekDays[weekDays.length - 1];
    return `${formatFriendlyDate(first.date)}  →  ${formatFriendlyDate(last.date)}`;
  }, [weekDays]);

  return (
    <div className="space-y-6">
      
      {/* Header & Controls Bar */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
                Weekly Master Timetable
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium bg-zinc-800/60 text-zinc-300 border border-white/[0.05]">
                Monday – Saturday
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium">
              Cross-day departmental class routine and available gaps matrix
            </p>
          </div>

          {/* Week Navigation Stepper */}
          <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-white/[0.04]">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/[0.06] transition-colors cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-mono tabular-nums text-zinc-200">
              {weekRangeDisplay}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/[0.06] transition-colors cursor-pointer"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              Batch:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedBatch('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedBatch === 'All'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-white/[0.05]'
                }`}
              >
                All Batches
              </button>
              {allBatches.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBatch(b)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedBatch === b
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-white/[0.05]'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-sky-400" />
              Venue:
            </span>
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="bg-zinc-800/60 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all appearance-none cursor-pointer"
            >
              <option value="All">All Rooms & Labs</option>
              {allVenues.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Master Weekly Grid Table (Desktop / Tablet) */}
      <div className="hidden md:block rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/80 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left min-w-[1050px]">
            
            {/* Table Header: Time Column + 6 Days */}
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-400 font-medium">
                <th className="p-4 w-36 min-w-[144px] border-r border-zinc-800 font-medium text-xs uppercase tracking-wider text-zinc-400 bg-zinc-900 sticky left-0 z-20">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Time Window</span>
                  </div>
                </th>
                {weekDays.map((day, dayIdx) => (
                  <th
                    key={day.date}
                    className={`p-4 text-center border-r border-zinc-800 last:border-r-0 ${
                      day.isTarget
                        ? 'bg-indigo-600/10'
                        : dayIdx % 2 === 1
                        ? 'bg-zinc-800/30'
                        : 'bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={`text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-lg ${
                          day.isTarget
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-800/80 text-zinc-300'
                        }`}
                      >
                        {day.shortDay}
                      </span>
                      <span
                        className={`text-xs font-mono tabular-nums ${
                          day.isTarget ? 'text-indigo-400 font-semibold' : 'text-zinc-500'
                        }`}
                      >
                        {day.date}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: Timetable Periods */}
            <tbody className="text-sm">
              {TIMETABLE_PERIODS.map((block) => (
                <tr
                  key={block.start}
                  className={`border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800/30 transition-colors ${
                    block.isLunchBreak ? 'bg-amber-500/5' : ''
                  }`}
                >
                  
                  {/* Time Label Column (Sticky Left Anchor) */}
                  <td
                    className={`p-4 border-r border-zinc-800 ${
                      block.isLunchBreak
                        ? 'bg-zinc-900/90 border-y border-y-amber-500/20'
                        : 'bg-zinc-900/90'
                    } font-mono tabular-nums text-sm text-zinc-200 whitespace-nowrap sticky left-0 z-10`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          block.isLunchBreak ? 'bg-amber-500' : 'bg-indigo-500'
                        } flex-shrink-0`}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm text-zinc-200">
                          {minutesToReadable(block.start)}
                        </span>
                        <span className="text-xs text-zinc-500">
                          to {minutesToReadable(block.end)}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wide font-semibold mt-0.5 ${
                            block.isLunchBreak ? 'text-amber-500' : 'text-indigo-400'
                          }`}
                        >
                          {block.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* If Lunch Break, render unified Department Lunch Recess row */}
                  {block.isLunchBreak ? (
                    <td
                      colSpan={6}
                      className="p-4 bg-amber-500/10 border-y border-amber-500/20 text-center select-none"
                    >
                      <div className="flex items-center justify-center gap-3 text-amber-400">
                        <div className="p-2 bg-amber-500/15 rounded-xl border border-amber-500/30">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold uppercase tracking-wider">
                            Department Lunch Break
                          </span>
                          <span className="text-xs font-mono tabular-nums bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30">
                            10:30 AM – 11:45 AM
                          </span>
                        </div>
                        <span className="text-xs text-amber-500/70 hidden lg:inline ml-2">
                          — Mandatory Department Recess • No Classes Scheduled
                        </span>
                      </div>
                    </td>
                  ) : (
                    /* 6 Day Columns */
                    weekDays.map((day, dayIdx) => {
                      const key = `${day.date}-${block.start}`;
                      const lectures = cellLectures.get(key) || [];
                      const isVacant = lectures.length === 0;

                      return (
                        <td
                          key={day.date}
                          className={`p-3 border-r border-zinc-800 last:border-r-0 align-top h-32 ${
                            day.isTarget
                              ? 'bg-indigo-500/5'
                              : dayIdx % 2 === 1
                              ? 'bg-zinc-800/10'
                              : 'bg-transparent'
                          }`}
                        >
                          {isVacant ? (
                            /* Empty Vacant Slot with High-Contrast Dashed Border */
                            <div
                              onClick={() =>
                                onBookSlot({
                                  date: day.date,
                                  startMinutes: block.start,
                                  endMinutes: block.end,
                                  batch: selectedBatch !== 'All' ? selectedBatch : undefined,
                                  batches: selectedBatch !== 'All' ? [selectedBatch] : undefined,
                                  venue: selectedVenue !== 'All' ? selectedVenue : undefined,
                                })
                              }
                              className="w-full h-full min-h-[96px] rounded-xl border border-dashed border-zinc-700 hover:border-emerald-500/40 hover:bg-emerald-500/10 bg-zinc-900/40 p-2 flex flex-col items-center justify-center text-zinc-600 hover:text-emerald-400 transition-all cursor-pointer group"
                              title={`Click to book slot on ${day.dayName} ${day.date} (${block.label})`}
                            >
                              <div className="w-8 h-8 rounded-full bg-zinc-800/80 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                                <Plus className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:scale-110 transition-transform" />
                              </div>
                              <span className="text-xs font-medium mt-2 text-zinc-600 group-hover:text-emerald-400/80 transition-colors">
                                Vacant Slot
                              </span>
                              <span className="text-[10px] font-mono text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                + Book Now
                              </span>
                            </div>
                          ) : (
                            /* Occupied Lecture Cards with Multi-Class Header */
                            <div className="space-y-2.5">
                              {lectures.length > 1 && (
                                <div className="flex items-center justify-between px-2.5 py-1.5 bg-indigo-500/15 border border-indigo-500/30 rounded-lg text-[10px] font-medium text-indigo-300">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    <span>{lectures.length} Simultaneous Classes</span>
                                  </span>
                                  <span className="font-mono text-indigo-400">
                                    {minutesToReadable(block.start)}
                                  </span>
                                </div>
                              )}

                              {lectures.map((lecture) => {
                                const isContinuation = lecture.startMinutes < block.start;
                                return (
                                  <div
                                    key={lecture.id}
                                    className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                                      isContinuation
                                        ? 'bg-zinc-800/50 border-zinc-700/50 border-l-4 border-l-zinc-600 opacity-80'
                                        : 'bg-zinc-800/80 border-zinc-700 hover:border-indigo-500/50 border-l-4 border-l-indigo-500'
                                    }`}
                                  >
                                    {isContinuation && (
                                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-700">
                                        <span>↳ Ongoing Session</span>
                                        <span className="font-mono tabular-nums">({lecture.time})</span>
                                      </div>
                                    )}

                                    {/* Batch badge + Start time pill */}
                                    <div className="flex items-center justify-between gap-2">
                                      <span className={`text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-lg border whitespace-nowrap ${
                                        lecture.courseSem.includes('B.Tech') || lecture.courseSem.includes('BCA')
                                          ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                                          : lecture.courseSem.includes('MCA')
                                          ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                      }`}>
                                        {lecture.courseSem}
                                      </span>
                                      <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-lg border ${
                                        isContinuation
                                          ? 'text-zinc-400 bg-zinc-800 border-zinc-700'
                                          : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                                      }`}>
                                        {isContinuation ? `Started ${minutesToReadable(lecture.startMinutes)}` : lecture.time.split(' to ')[0]}
                                      </span>
                                    </div>

                                    {/* Full Subject Name */}
                                    <div className="font-medium text-zinc-200 text-sm leading-snug break-words" title={lecture.subject}>
                                      {lecture.subject}
                                    </div>

                                    {/* Faculty & Venue */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-zinc-400 pt-2 border-t border-zinc-700/50">
                                      <span className="truncate flex items-center gap-1.5">
                                        <User className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                        <span className="truncate max-w-[80px]">{lecture.teacherName}</span>
                                      </span>
                                      <span className="truncate flex items-center gap-1.5 text-zinc-300">
                                        <MapPin className="w-3 h-3 text-sky-400 flex-shrink-0" />
                                        <span className="truncate max-w-[80px]">{lecture.venue}</span>
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })
                  )}

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* Mobile Day-by-Day Routine View (Small Screens) */}
      <div className="block md:hidden space-y-5">
        
        {/* Day Selector Tabs Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
          {weekDays.map((day) => {
            const isSelected = day.date === mobileActiveDay;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setMobileActiveDay(day.date)}
                className={`flex flex-col items-center justify-center min-w-[72px] py-3 px-4 rounded-xl transition-colors cursor-pointer flex-shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800/60 text-zinc-400 border border-white/[0.05] hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <span className="text-xs font-medium uppercase tracking-wider">
                  {day.shortDay}
                </span>
                <span className="text-sm font-mono tabular-nums mt-1">
                  {day.date.split('-')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Timetable Feed */}
        <div className="space-y-4">
          {TIMETABLE_PERIODS.map((block) => {
            if (block.isLunchBreak) {
              return (
                <div
                  key={block.start}
                  className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                        Department Lunch Break
                      </div>
                      <div className="text-xs font-mono tabular-nums text-amber-500/80 mt-1">
                        10:30 AM – 11:45 AM (75 Minutes)
                      </div>
                    </div>
                  </div>
                  <span className="text-xs uppercase font-mono px-3 py-1.5 bg-amber-500/15 text-amber-400 rounded-lg border border-amber-500/30 hidden sm:block">
                    Recess
                  </span>
                </div>
              );
            }

            const key = `${mobileActiveDay}-${block.start}`;
            const lectures = cellLectures.get(key) || [];
            const isVacant = lectures.length === 0;

            return (
              <div
                key={block.start}
                className="rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl overflow-hidden"
              >
                {/* Time Block Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm p-4 bg-zinc-800/40 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      {block.name}
                    </span>
                    <span className="font-mono text-zinc-200 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span>{block.label}</span>
                    </span>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      isVacant
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    {isVacant
                      ? 'Vacant Slot'
                      : lectures.length === 1
                      ? '1 Scheduled Class'
                      : `${lectures.length} Simultaneous Classes`}
                  </span>
                </div>

                {/* Content: Either Vacant CTA or Class Cards */}
                <div className="p-4">
                  {isVacant ? (
                    <button
                      type="button"
                      onClick={() =>
                        onBookSlot({
                          date: mobileActiveDay,
                          startMinutes: block.start,
                          endMinutes: block.end,
                          batch: selectedBatch !== 'All' ? selectedBatch : undefined,
                          batches: selectedBatch !== 'All' ? [selectedBatch] : undefined,
                          venue: selectedVenue !== 'All' ? selectedVenue : undefined,
                        })
                      }
                      className="w-full py-4 px-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-800/40 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-zinc-400 hover:text-emerald-400 text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Reserve Session in this Slot</span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {lectures.map((lec) => {
                        const isContinuation = lec.startMinutes < block.start;
                        return (
                          <div
                            key={lec.id}
                            className={`p-4 rounded-xl border text-sm space-y-3 ${
                              isContinuation
                                ? 'bg-zinc-800/50 border-zinc-700/50 border-l-4 border-l-zinc-600 opacity-80'
                                : 'bg-zinc-800/80 border-zinc-700 border-l-4 border-l-indigo-500'
                            }`}
                          >
                            {isContinuation && (
                              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700 w-fit">
                                <span>↳ Ongoing Session</span>
                                <span className="font-mono tabular-nums">({lec.time})</span>
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-medium text-zinc-100 leading-snug">
                                {lec.subject}
                              </span>
                              <span className={`text-[11px] font-mono tabular-nums px-2.5 py-1 rounded-lg border whitespace-nowrap ${
                                lec.courseSem.includes('B.Tech') || lec.courseSem.includes('BCA')
                                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                                  : lec.courseSem.includes('MCA')
                                  ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                              }`}>
                                {lec.courseSem}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 pt-3 border-t border-zinc-700/50">
                              <span className="flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                <span>{lec.teacherName}</span>
                              </span>
                              <span className="flex items-center gap-2 text-zinc-300">
                                <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
                                <span>{lec.venue}</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
