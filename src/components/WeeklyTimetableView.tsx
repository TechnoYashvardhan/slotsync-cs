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
} from 'lucide-react';
import type { ScheduleRow } from '../types/schedule';
import {
  getAcademicWeekDates,
  addWeeksToDDMMYYYY,
  minutesToReadable,
  DEPT_START_MINUTES,
  DEPT_END_MINUTES,
  formatFriendlyDate,
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
  }) => void;
}

// 1-hour time slices from 08:00 AM to 05:00 PM
const HOURLY_BLOCKS: { start: number; end: number; label: string }[] = [];
for (let m = DEPT_START_MINUTES; m < DEPT_END_MINUTES; m += 60) {
  HOURLY_BLOCKS.push({
    start: m,
    end: m + 60,
    label: `${minutesToReadable(m)} – ${minutesToReadable(m + 60)}`,
  });
}

export const WeeklyTimetableView: React.FC<WeeklyTimetableViewProps> = ({
  schedule,
  currentDate,
  allBatches,
  allVenues,
  onBookSlot,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(currentDate || '21-09-2026');
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [selectedVenue, setSelectedVenue] = useState<string>('All');
  const [mobileActiveDay, setMobileActiveDay] = useState<string>('');

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

  // Map lectures by date and hourly block
  const cellLectures = useMemo(() => {
    const map = new Map<string, ScheduleRow[]>();

    for (const row of filteredSchedule) {
      for (const block of HOURLY_BLOCKS) {
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
      <div className="glass-panel p-6 rounded-3xl shadow-sm border border-slate-200/90 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Weekly Master Timetable
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Monday – Saturday
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Cross-day departmental class routine and available gaps matrix
            </p>
          </div>

          {/* Week Navigation Stepper */}
          <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-xl bg-white text-slate-700 hover:text-slate-900 shadow-2xs border border-slate-200/80 transition cursor-pointer hover:bg-slate-50"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-mono font-bold text-slate-800">
              {weekRangeDisplay}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-xl bg-white text-slate-700 hover:text-slate-900 shadow-2xs border border-slate-200/80 transition cursor-pointer hover:bg-slate-50"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Batch:
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSelectedBatch('All')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedBatch === 'All'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                All Batches
              </button>
              {allBatches.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBatch(b)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedBatch === b
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              Venue:
            </span>
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 shadow-sm"
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
      <div className="hidden md:block rounded-3xl shadow-sm border-2 border-slate-300 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left min-w-[1050px]">
            
            {/* Table Header: Time Column + 6 Days */}
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300 text-xs font-bold text-slate-700">
                <th className="p-3.5 w-36 min-w-[144px] border-r-2 border-slate-300 font-mono text-[11px] uppercase tracking-wider text-slate-700 bg-slate-200/80 font-black sticky left-0 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Time Window</span>
                  </div>
                </th>
                {weekDays.map((day, dayIdx) => (
                  <th
                    key={day.date}
                    className={`p-3.5 text-center border-r-2 border-slate-300 last:border-r-0 ${
                      day.isTarget
                        ? 'bg-indigo-50/80 text-indigo-950 font-black'
                        : dayIdx % 2 === 1
                        ? 'bg-slate-100/70'
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-lg ${
                          day.isTarget
                            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {day.shortDay}
                      </span>
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          day.isTarget ? 'text-indigo-900 font-extrabold' : 'text-slate-600'
                        }`}
                      >
                        {day.date}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: 9 Hourly Blocks */}
            <tbody className="text-xs">
              {HOURLY_BLOCKS.map((block) => (
                <tr key={block.start} className="border-b-2 border-slate-300 last:border-b-0 hover:bg-slate-50/30 transition">
                  
                  {/* Time Label Column (Sticky Left Anchor) */}
                  <td className="p-3.5 border-r-2 border-slate-300 bg-slate-100/90 font-mono text-xs font-black text-slate-900 whitespace-nowrap sticky left-0 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 tracking-tight font-mono">
                          {minutesToReadable(block.start)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold font-mono">
                          to {minutesToReadable(block.end)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 6 Day Columns */}
                  {weekDays.map((day, dayIdx) => {
                    const key = `${day.date}-${block.start}`;
                    const lectures = cellLectures.get(key) || [];
                    const isVacant = lectures.length === 0;

                    return (
                      <td
                        key={day.date}
                        className={`p-2.5 border-r-2 border-slate-300 last:border-r-0 align-top h-28 ${
                          day.isTarget
                            ? 'bg-indigo-50/20'
                            : dayIdx % 2 === 1
                            ? 'bg-slate-50/40'
                            : 'bg-white'
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
                              })
                            }
                            className="w-full h-full min-h-[84px] rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 p-2 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-700 transition cursor-pointer group bg-slate-50/30"
                            title={`Click to book slot on ${day.dayName} ${day.date} (${block.label})`}
                          >
                            <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors shadow-2xs">
                              <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-[10px] font-bold mt-1 text-slate-400 group-hover:text-emerald-700 transition-colors">
                              Vacant Slot
                            </span>
                            <span className="text-[9px] font-mono text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                              + Book Now
                            </span>
                          </div>
                        ) : (
                          /* Occupied Lecture Cards with Multi-Class Header */
                          <div className="space-y-2">
                            {lectures.length > 1 && (
                              <div className="flex items-center justify-between px-2 py-0.5 bg-indigo-50 border border-indigo-200/90 rounded-md text-[9px] font-bold text-indigo-900">
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                  <span>{lectures.length} Simultaneous Classes</span>
                                </span>
                                <span className="font-mono text-[9px] text-indigo-700 font-extrabold">
                                  {minutesToReadable(block.start)}
                                </span>
                              </div>
                            )}

                            {lectures.map((lecture) => (
                              <div
                                key={lecture.id}
                                className="p-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition text-[11px] space-y-1 border-l-4 border-l-indigo-600"
                              >
                                {/* Batch badge + Start time pill */}
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-extrabold whitespace-nowrap ${
                                    lecture.courseSem.includes('B.Tech')
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : lecture.courseSem.includes('MCA')
                                      ? 'bg-purple-50 text-purple-800 border-purple-300'
                                      : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                  }`}>
                                    {lecture.courseSem}
                                  </span>
                                  <span className="text-[9px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1 rounded border border-emerald-200">
                                    {lecture.time.split(' to ')[0]}
                                  </span>
                                </div>

                                {/* Full Subject Name */}
                                <div className="font-black text-slate-900 text-xs leading-snug break-words" title={lecture.subject}>
                                  {lecture.subject}
                                </div>

                                {/* Faculty & Venue */}
                                <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium pt-1 border-t border-slate-100">
                                  <span className="truncate flex items-center gap-1">
                                    <User className="w-2.5 h-2.5 text-indigo-600 flex-shrink-0" />
                                    <span className="truncate max-w-[70px]">{lecture.teacherName}</span>
                                  </span>
                                  <span className="truncate flex items-center gap-1 font-semibold text-slate-700">
                                    <MapPin className="w-2.5 h-2.5 text-sky-600 flex-shrink-0" />
                                    <span className="truncate max-w-[70px]">{lecture.venue}</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* Mobile Day-by-Day Routine View (Small Screens) */}
      <div className="block md:hidden space-y-4">
        
        {/* Day Selector Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {weekDays.map((day) => {
            const isSelected = day.date === mobileActiveDay;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setMobileActiveDay(day.date)}
                className={`flex flex-col items-center justify-center min-w-[72px] py-2.5 px-3 rounded-2xl transition cursor-pointer flex-shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-300'
                    : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  {day.shortDay}
                </span>
                <span className="text-sm font-mono font-black mt-0.5">
                  {day.date.split('-')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Hourly Feed */}
        <div className="space-y-3">
          {HOURLY_BLOCKS.map((block) => {
            const key = `${mobileActiveDay}-${block.start}`;
            const lectures = cellLectures.get(key) || [];
            const isVacant = lectures.length === 0;

            return (
              <div
                key={block.start}
                className="rounded-2xl bg-white border-2 border-slate-300 shadow-2xs space-y-2.5 overflow-hidden"
              >
                {/* Time Block Header */}
                <div className="flex items-center justify-between text-xs px-3.5 py-2.5 bg-slate-100/90 border-b-2 border-slate-200">
                  <span className="font-mono font-black text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{block.label}</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isVacant
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-black'
                        : 'bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold'
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
                <div className="p-3">
                  {isVacant ? (
                    <button
                      type="button"
                      onClick={() =>
                        onBookSlot({
                          date: mobileActiveDay,
                          startMinutes: block.start,
                          endMinutes: block.end,
                          batch: selectedBatch !== 'All' ? selectedBatch : undefined,
                        })
                      }
                      className="w-full py-3 px-3 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
                    >
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>Reserve Session in this Slot</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {lectures.map((lec) => (
                        <div
                          key={lec.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 border-l-4 border-l-indigo-600"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-extrabold text-slate-900 leading-snug">
                              {lec.subject}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                              lec.courseSem.includes('B.Tech')
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : lec.courseSem.includes('MCA')
                                ? 'bg-purple-50 text-purple-800 border-purple-300'
                                : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            }`}>
                              {lec.courseSem}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-200">
                            <span className="flex items-center gap-1 font-medium">
                              <User className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                              <span>{lec.teacherName}</span>
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <MapPin className="w-3 h-3 text-sky-600 flex-shrink-0" />
                              <span>{lec.venue}</span>
                            </span>
                          </div>
                        </div>
                      ))}
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
