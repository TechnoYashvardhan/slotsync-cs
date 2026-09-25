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
  LayoutGrid,
  Table as TableIcon,
  BookOpen,
  Coffee,
  Info,
  SlidersHorizontal,
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
  TRANSIT_BUFFER_MINUTES,
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

export const getSubjectTheme = (subjectName: string) => {
  const s = subjectName.toLowerCase();
  if (s.includes('hardware') || s.includes('component')) {
    return {
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
      border: 'border-emerald-500/30 hover:border-emerald-500/50',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      text: 'text-emerald-300',
      accent: 'emerald',
      dot: 'bg-emerald-400',
    };
  }
  if (s.includes('automation') || s.includes('office')) {
    return {
      bg: 'bg-purple-500/10 hover:bg-purple-500/15',
      border: 'border-purple-500/30 hover:border-purple-500/50',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      text: 'text-purple-300',
      accent: 'purple',
      dot: 'bg-purple-400',
    };
  }
  if (s.includes('operating') || s.includes('system') || s.includes('os')) {
    return {
      bg: 'bg-amber-500/10 hover:bg-amber-500/15',
      border: 'border-amber-500/30 hover:border-amber-500/50',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      text: 'text-amber-300',
      accent: 'amber',
      dot: 'bg-amber-400',
    };
  }
  if (s.includes('network')) {
    return {
      bg: 'bg-sky-500/10 hover:bg-sky-500/15',
      border: 'border-sky-500/30 hover:border-sky-500/50',
      badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      text: 'text-sky-300',
      accent: 'sky',
      dot: 'bg-sky-400',
    };
  }
  if (s.includes('electronic') || s.includes('digital')) {
    return {
      bg: 'bg-cyan-500/10 hover:bg-cyan-500/15',
      border: 'border-cyan-500/30 hover:border-cyan-500/50',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      text: 'text-cyan-300',
      accent: 'cyan',
      dot: 'bg-cyan-400',
    };
  }
  if (s.includes('java') || s.includes('c++') || s.includes('python') || s.includes('data')) {
    return {
      bg: 'bg-rose-500/10 hover:bg-rose-500/15',
      border: 'border-rose-500/30 hover:border-rose-500/50',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      text: 'text-rose-300',
      accent: 'rose',
      dot: 'bg-rose-400',
    };
  }
  if (s.includes('math')) {
    return {
      bg: 'bg-blue-500/10 hover:bg-blue-500/15',
      border: 'border-blue-500/30 hover:border-blue-500/50',
      badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      text: 'text-blue-300',
      accent: 'blue',
      dot: 'bg-blue-400',
    };
  }

  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    {
      bg: 'bg-indigo-500/10 hover:bg-indigo-500/15',
      border: 'border-indigo-500/30 hover:border-indigo-500/50',
      badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      text: 'text-indigo-300',
      accent: 'indigo',
      dot: 'bg-indigo-400',
    },
    {
      bg: 'bg-teal-500/10 hover:bg-teal-500/15',
      border: 'border-teal-500/30 hover:border-teal-500/50',
      badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      text: 'text-teal-300',
      accent: 'teal',
      dot: 'bg-teal-400',
    },
    {
      bg: 'bg-fuchsia-500/10 hover:bg-fuchsia-500/15',
      border: 'border-fuchsia-500/30 hover:border-fuchsia-500/50',
      badge: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
      text: 'text-fuchsia-300',
      accent: 'fuchsia',
      dot: 'bg-fuchsia-400',
    },
  ];
  return colors[Math.abs(hash) % colors.length];
};

interface DayTimelineItem {
  type: 'class' | 'transit' | 'lunch' | 'free';
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  classRow?: ScheduleRow;
  freeLabel?: string;
}

export const WeeklyTimetableView: React.FC<WeeklyTimetableViewProps> = ({
  schedule,
  currentDate,
  allBatches,
  allVenues,
  onBookSlot,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(currentDate || '25-09-2026');
  
  // Default to the first available batch (e.g. BCA 1st Sem) rather than 'All' to avoid clutter
  const [selectedBatch, setSelectedBatch] = useState<string>(() => {
    if (allBatches.length > 0) {
      const preferred = allBatches.find((b) => b.toLowerCase().includes('bca 1')) || allBatches[0];
      return preferred;
    }
    return 'All';
  });

  const [selectedVenue, setSelectedVenue] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [mobileActiveDay, setMobileActiveDay] = useState<string>('');
  const [showFreeGaps, setShowFreeGaps] = useState<boolean>(true);

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

  // Compute stats for the selected batch
  const weekStats = useMemo(() => {
    const totalClasses = filteredSchedule.length;
    let totalMinutes = 0;
    for (const r of filteredSchedule) {
      totalMinutes += Math.max(0, r.endMinutes - r.startMinutes);
    }
    const totalHours = (totalMinutes / 60).toFixed(1);

    const activeDaysCount = new Set(filteredSchedule.map((r) => r.date)).size;
    return {
      totalClasses,
      totalHours,
      activeDaysCount,
    };
  }, [filteredSchedule]);

  // Build daily timeline events for Daily Routine Cards
  const dayRoutines = useMemo(() => {
    const map = new Map<string, DayTimelineItem[]>();

    for (const day of weekDays) {
      const dayClasses = filteredSchedule
        .filter((r) => r.date === day.date)
        .sort((a, b) => a.startMinutes - b.startMinutes);

      const items: DayTimelineItem[] = [];

      // If no classes at all on this day
      if (dayClasses.length === 0) {
        map.set(day.date, []);
        continue;
      }

      // Check for morning free gap before first class (if first class starts after 08:00 AM)
      const firstClass = dayClasses[0];
      if (firstClass.startMinutes > DEPT_START_MINUTES + 15) {
        items.push({
          type: 'free',
          startMinutes: DEPT_START_MINUTES,
          endMinutes: firstClass.startMinutes,
          durationMinutes: firstClass.startMinutes - DEPT_START_MINUTES,
          freeLabel: 'Early Morning Window',
        });
      }

      for (let i = 0; i < dayClasses.length; i++) {
        const cur = dayClasses[i];

        // Add the class item
        items.push({
          type: 'class',
          startMinutes: cur.startMinutes,
          endMinutes: cur.endMinutes,
          durationMinutes: cur.endMinutes - cur.startMinutes,
          classRow: cur,
        });

        // Check relationship with next class or lunch break
        const next = dayClasses[i + 1];

        // Did lunch break happen after this class?
        const isBeforeLunch = cur.endMinutes <= LUNCH_BREAK_START_MINUTES;
        const nextIsAfterLunch = next ? next.startMinutes >= LUNCH_BREAK_END_MINUTES : true;

        if (next) {
          const gapMinutes = next.startMinutes - cur.endMinutes;
          
          // Case 1: 5-15 min transit gap
          if (gapMinutes > 0 && gapMinutes <= 15) {
            items.push({
              type: 'transit',
              startMinutes: cur.endMinutes,
              endMinutes: next.startMinutes,
              durationMinutes: gapMinutes,
            });
          }
          // Case 2: Lunch break falls in between
          else if (isBeforeLunch && nextIsAfterLunch) {
            // Gap before lunch if > 15 mins
            if (LUNCH_BREAK_START_MINUTES - cur.endMinutes >= 20) {
              items.push({
                type: 'free',
                startMinutes: cur.endMinutes,
                endMinutes: LUNCH_BREAK_START_MINUTES,
                durationMinutes: LUNCH_BREAK_START_MINUTES - cur.endMinutes,
                freeLabel: 'Pre-Lunch Free Window',
              });
            }

            // The lunch break
            items.push({
              type: 'lunch',
              startMinutes: LUNCH_BREAK_START_MINUTES,
              endMinutes: LUNCH_BREAK_END_MINUTES,
              durationMinutes: LUNCH_BREAK_END_MINUTES - LUNCH_BREAK_START_MINUTES,
            });

            // Gap after lunch if > 15 mins
            if (next.startMinutes - LUNCH_BREAK_END_MINUTES >= 20) {
              items.push({
                type: 'free',
                startMinutes: LUNCH_BREAK_END_MINUTES,
                endMinutes: next.startMinutes,
                durationMinutes: next.startMinutes - LUNCH_BREAK_END_MINUTES,
                freeLabel: 'Post-Lunch Free Window',
              });
            }
          }
          // Case 3: Free gap between classes without lunch
          else if (gapMinutes > 15) {
            items.push({
              type: 'free',
              startMinutes: cur.endMinutes,
              endMinutes: next.startMinutes,
              durationMinutes: gapMinutes,
              freeLabel: 'Available Free Window',
            });
          }
        } else {
          // Last class of the day:
          // If ended before lunch break, insert lunch break
          if (cur.endMinutes <= LUNCH_BREAK_START_MINUTES) {
            // Gap before lunch
            if (LUNCH_BREAK_START_MINUTES - cur.endMinutes >= 20) {
              items.push({
                type: 'free',
                startMinutes: cur.endMinutes,
                endMinutes: LUNCH_BREAK_START_MINUTES,
                durationMinutes: LUNCH_BREAK_START_MINUTES - cur.endMinutes,
                freeLabel: 'Free Pre-Lunch Slot',
              });
            }
            items.push({
              type: 'lunch',
              startMinutes: LUNCH_BREAK_START_MINUTES,
              endMinutes: LUNCH_BREAK_END_MINUTES,
              durationMinutes: LUNCH_BREAK_END_MINUTES - LUNCH_BREAK_START_MINUTES,
            });
          }
        }
      }

      map.set(day.date, items);
    }

    return map;
  }, [weekDays, filteredSchedule]);

  // Map lectures by date and timetable period for Matrix Table View
  const cellLectures = useMemo(() => {
    const map = new Map<string, ScheduleRow[]>();

    for (const row of filteredSchedule) {
      for (const block of TIMETABLE_PERIODS) {
        if (block.isLunchBreak) continue;
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls Bar */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
                Weekly Timetable & Routine Studio
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium bg-zinc-800/60 text-zinc-300 border border-white/[0.05]">
                Mon – Sat
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">
              Clean academic routine, color-coded subjects, transit buffers & free booking windows
            </p>
          </div>

          {/* Right Top Actions: View Switcher & Week Navigator */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Routine Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Matrix Table</span>
              </button>
            </div>

            {/* Week Navigation Stepper */}
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 text-xs font-mono tabular-nums text-zinc-200 font-medium">
                {weekRangeDisplay}
              </span>
              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/[0.08] transition-colors cursor-pointer"
              title="Print Routine"
            >
              <Printer className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Filter & Batch Selector Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
          
          {/* Batch Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mr-1">
              <Layers className="w-4 h-4 text-indigo-400" />
              Class / Batch:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {allBatches.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBatch(b)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    selectedBatch === b
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                      : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-white/[0.05]'
                  }`}
                >
                  {b}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedBatch('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  selectedBatch === 'All'
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-white/[0.05]'
                }`}
              >
                All Batches (Master)
              </button>
            </div>
          </div>

          {/* Venue Selector & Toggle Settings */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                Venue:
              </span>
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="bg-zinc-800/70 border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer"
              >
                <option value="All">All Rooms & Labs</option>
                {allVenues.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {viewMode === 'cards' && (
              <button
                type="button"
                onClick={() => setShowFreeGaps(!showFreeGaps)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  showFreeGaps
                    ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                    : 'bg-zinc-800/40 text-zinc-500 border-white/[0.05] hover:text-zinc-300'
                }`}
                title="Toggle showing free booking windows and transit gaps"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{showFreeGaps ? 'Free Slots Visible' : 'Classes Only'}</span>
              </button>
            )}
          </div>

        </div>

        {/* Quick Summary Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.04] text-xs">
          <div className="flex flex-wrap items-center gap-4 text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <strong className="text-zinc-200">{selectedBatch === 'All' ? 'Department Master' : selectedBatch}</strong>
            </span>
            <span className="text-zinc-700">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-zinc-300 font-medium">{weekStats.totalClasses} scheduled classes</span>
            </span>
            <span className="text-zinc-700">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{weekStats.totalHours} lecture hrs / week</span>
            </span>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5 text-amber-500" />
            <span>Recess: 10:30 – 11:45 AM daily</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: DAILY ROUTINE CARDS (Recommended Clean Layout)             */}
      {/* ========================================================================= */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          
          {/* Desktop / Tablet 6-Day Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {weekDays.map((day) => {
              const timeline = dayRoutines.get(day.date) || [];
              const dayClasses = filteredSchedule.filter((r) => r.date === day.date);
              const isFreeDay = dayClasses.length === 0;

              return (
                <div
                  key={day.date}
                  className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm ${
                    day.isTarget
                      ? 'bg-zinc-900/95 border-indigo-500/40 ring-1 ring-indigo-500/20'
                      : 'bg-zinc-900/80 border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  {/* Card Header */}
                  <div className={`p-4 border-b flex items-center justify-between ${
                    day.isTarget
                      ? 'bg-indigo-600/10 border-indigo-500/20'
                      : 'bg-zinc-800/30 border-white/[0.06]'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-base font-bold tracking-tight ${
                          day.isTarget ? 'text-indigo-200' : 'text-zinc-100'
                        }`}>
                          {day.dayName}
                        </h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-white/[0.05]">
                          {day.date}
                        </span>
                      </div>
                    </div>

                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border font-mono ${
                      isFreeDay
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                    }`}>
                      {isFreeDay ? '🎉 Free Day' : `${dayClasses.length} ${dayClasses.length === 1 ? 'Class' : 'Classes'}`}
                    </span>
                  </div>

                  {/* Card Body: Timeline List */}
                  <div className="p-4 space-y-3 flex-1">
                    
                    {/* If Entire Day has no classes */}
                    {isFreeDay ? (
                      <div className="py-10 text-center flex flex-col items-center justify-center space-y-2.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">
                          ✨
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-200">
                          Free Academic Day
                        </h4>
                        <p className="text-xs text-zinc-400 max-w-[220px] leading-relaxed">
                          No scheduled lectures for <span className="text-zinc-200 font-medium">{selectedBatch === 'All' ? 'this batch' : selectedBatch}</span> on {day.dayName}s.
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            onBookSlot({
                              date: day.date,
                              startMinutes: 495, // 08:15 AM
                              endMinutes: 555,   // 09:15 AM
                              batch: selectedBatch !== 'All' ? selectedBatch : undefined,
                              batches: selectedBatch !== 'All' ? [selectedBatch] : undefined,
                              venue: selectedVenue !== 'All' ? selectedVenue : undefined,
                            })
                          }
                          className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Schedule Extra Workshop / Lab</span>
                        </button>
                      </div>
                    ) : (
                      /* Render Chronological Timeline */
                      timeline.map((item, idx) => {
                        
                        // 1. CLASS ITEM
                        if (item.type === 'class' && item.classRow) {
                          const lec = item.classRow;
                          const theme = getSubjectTheme(lec.subject);

                          return (
                            <div
                              key={lec.id || idx}
                              className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${theme.bg} ${theme.border}`}
                            >
                              {/* Time Range Pill & Duration */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${theme.badge}`}>
                                    {minutesToReadable(lec.startMinutes)} – {minutesToReadable(lec.endMinutes)}
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-zinc-400">
                                  {item.durationMinutes}m
                                </span>
                              </div>

                              {/* Full Non-truncated Subject Name */}
                              <div>
                                <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
                                  {lec.subject}
                                </h4>
                                {selectedBatch === 'All' && (
                                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 mt-1 rounded bg-zinc-800 text-zinc-300 border border-white/[0.06]">
                                    {lec.courseSem}
                                  </span>
                                )}
                              </div>

                              {/* Teacher & Venue Metadata */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-xs">
                                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                                  <User className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                  <span>{lec.teacherName}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-sky-300 font-mono text-[11px] bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                                  <MapPin className="w-3 h-3 text-sky-400 flex-shrink-0" />
                                  <span>{lec.venue}</span>
                                </span>
                              </div>
                            </div>
                          );
                        }

                        // 2. 5-MIN TRANSIT BUFFER
                        if (item.type === 'transit' && showFreeGaps) {
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-3 py-1 rounded-lg bg-zinc-800/40 text-[10px] text-zinc-400 font-mono border border-white/[0.03]"
                            >
                              <span className="flex items-center gap-1.5">
                                <span>⏱️</span>
                                <span>5 min transit gap</span>
                              </span>
                              <span>
                                {minutesToReadable(item.startMinutes)} – {minutesToReadable(item.endMinutes)}
                              </span>
                            </div>
                          );
                        }

                        // 3. DEPARTMENT LUNCH BREAK
                        if (item.type === 'lunch') {
                          return (
                            <div
                              key={idx}
                              className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-300 font-medium"
                            >
                              <div className="flex items-center gap-2">
                                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                                <span>Lunch Recess</span>
                              </div>
                              <span className="font-mono text-[11px] text-amber-400/90">
                                {minutesToReadable(item.startMinutes)} – {minutesToReadable(item.endMinutes)}
                              </span>
                            </div>
                          );
                        }

                        // 4. AVAILABLE FREE SLOT WINDOW
                        if (item.type === 'free' && showFreeGaps) {
                          return (
                            <div
                              key={idx}
                              onClick={() =>
                                onBookSlot({
                                  date: day.date,
                                  startMinutes: item.startMinutes,
                                  endMinutes: item.endMinutes,
                                  batch: selectedBatch !== 'All' ? selectedBatch : undefined,
                                  batches: selectedBatch !== 'All' ? [selectedBatch] : undefined,
                                  venue: selectedVenue !== 'All' ? selectedVenue : undefined,
                                })
                              }
                              className="p-2.5 rounded-xl border border-dashed border-zinc-700/80 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400 hover:border-sky-500/50 hover:bg-sky-500/5 hover:text-sky-300 transition-all cursor-pointer group"
                              title="Click to reserve a session in this free slot"
                            >
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400 transition-colors" />
                                <span className="font-mono text-[11px]">
                                  {item.freeLabel || 'Free Window'} ({minutesToReadable(item.startMinutes)} – {minutesToReadable(item.endMinutes)})
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                + Book
                              </span>
                            </div>
                          );
                        }

                        return null;
                      })
                    )}

                  </div>

                  {/* Card Footer */}
                  <div className="p-3 bg-zinc-950/40 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>{day.dayName.toUpperCase()}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onBookSlot({
                          date: day.date,
                          startMinutes: 495,
                          endMinutes: 555,
                          batch: selectedBatch !== 'All' ? selectedBatch : undefined,
                          batches: selectedBatch !== 'All' ? [selectedBatch] : undefined,
                          venue: selectedVenue !== 'All' ? selectedVenue : undefined,
                        })
                      }
                      className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Reserve</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: CLEAN MATRIX TABLE (For Users Who Want Spreadsheet Grid)   */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/80 backdrop-blur-xl">
          <div className="p-3.5 bg-zinc-800/40 border-b border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
            <span className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Matrix filtered for: <strong className="text-zinc-200">{selectedBatch === 'All' ? 'Department Master (All Batches)' : selectedBatch}</strong>
              </span>
            </span>
            <span className="text-zinc-500 font-mono text-[11px]">
              Click any vacant cell to instantly reserve a class
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-left min-w-[1050px]">
              
              {/* Table Header: Time Column + 6 Days */}
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-400 font-medium">
                  <th className="p-4 w-40 min-w-[160px] border-r border-zinc-800 font-medium text-xs uppercase tracking-wider text-zinc-400 bg-zinc-900 sticky left-0 z-20">
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
                          className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-lg ${
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
                          <span className="text-sm font-semibold text-zinc-200">
                            {minutesToReadable(block.start)}
                          </span>
                          <span className="text-xs text-zinc-400">
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
                            className={`p-3 border-r border-zinc-800 last:border-r-0 align-top min-h-[120px] ${
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
                                className="w-full h-full min-h-[96px] rounded-xl border border-dashed border-zinc-700/80 hover:border-emerald-500/40 hover:bg-emerald-500/10 bg-zinc-900/40 p-2 flex flex-col items-center justify-center text-zinc-500 hover:text-emerald-400 transition-all cursor-pointer group"
                                title={`Click to book slot on ${day.dayName} ${day.date} (${block.label})`}
                              >
                                <div className="w-7 h-7 rounded-full bg-zinc-800/80 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                                  <Plus className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[11px] font-medium mt-1.5 text-zinc-500 group-hover:text-emerald-400 transition-colors">
                                  Vacant Slot
                                </span>
                              </div>
                            ) : (
                              /* Occupied Lecture Cards with Color Themes */
                              <div className="space-y-2">
                                {lectures.length > 1 && (
                                  <div className="flex items-center justify-between px-2 py-1 bg-indigo-500/15 border border-indigo-500/30 rounded-lg text-[10px] font-medium text-indigo-300">
                                    <span>{lectures.length} Simultaneous Classes</span>
                                    <span className="font-mono">{minutesToReadable(block.start)}</span>
                                  </div>
                                )}

                                {lectures.map((lecture) => {
                                  const theme = getSubjectTheme(lecture.subject);
                                  const isContinuation = lecture.startMinutes < block.start;
                                  
                                  return (
                                    <div
                                      key={lecture.id}
                                      className={`p-2.5 rounded-xl border transition-all text-xs space-y-1.5 ${theme.bg} ${theme.border}`}
                                    >
                                      {/* Batch badge + Time pill */}
                                      <div className="flex items-center justify-between gap-1.5">
                                        <span className={`text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-md border whitespace-nowrap ${theme.badge}`}>
                                          {lecture.courseSem}
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-400">
                                          {lecture.time.split(' to ')[0]}
                                        </span>
                                      </div>

                                      {/* Full Subject Name */}
                                      <div className="font-semibold text-zinc-100 text-xs leading-snug break-words">
                                        {lecture.subject}
                                      </div>

                                      {/* Faculty & Venue */}
                                      <div className="flex flex-col gap-1 text-[10px] text-zinc-400 pt-1.5 border-t border-white/[0.06]">
                                        <span className="truncate flex items-center gap-1">
                                          <User className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                          <span className="truncate">{lecture.teacherName}</span>
                                        </span>
                                        <span className="truncate flex items-center gap-1 text-sky-300 font-mono">
                                          <MapPin className="w-3 h-3 text-sky-400 flex-shrink-0" />
                                          <span className="truncate">{lecture.venue}</span>
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
      )}

    </div>
  );
};
