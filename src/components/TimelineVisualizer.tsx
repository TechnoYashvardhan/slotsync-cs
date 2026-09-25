import React, { useState, useMemo } from 'react';
import { ScheduleRow, FreeSlot } from '../types/schedule';
import {
  DEPT_START_MINUTES,
  DEPT_END_MINUTES,
  TOTAL_OPERATING_MINUTES,
  formatDuration,
  minutesToReadable,
  LUNCH_BREAK_START_MINUTES,
  LUNCH_BREAK_END_MINUTES,
  LUNCH_BREAK_LABEL,
  TRANSIT_BUFFER_MINUTES,
  overlapsLunchBreak,
  parseSingleTimeToMinutes,
} from '../utils/timeUtils';
import {
  Calendar,
  Clock,
  Plus,
  Sparkles,
  Layers,
  Utensils,
  User,
  MapPin,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Activity,
  Flame,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { getSubjectTheme } from './WeeklyTimetableView';

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
  schedule?: ScheduleRow[];
  allTeachers?: string[];
  allVenues?: string[];
  onBookSlot: (slot: {
    date: string;
    startMinutes: number;
    endMinutes: number;
    batch?: string;
    batches?: string[];
    teacher?: string;
    venue?: string;
  }) => void;
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
  schedule = [],
  allTeachers = [],
  allVenues = [],
  onBookSlot,
}) => {
  // Track Dimension: 'batches' | 'faculty' | 'venues'
  const [trackDimension, setTrackDimension] = useState<'batches' | 'faculty' | 'venues'>('batches');
  
  // Interactive Tooltip State
  const [hoveredRow, setHoveredRow] = useState<ScheduleRow | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Live "What-If" Conflict Simulator State
  const [showSimulator, setShowSimulator] = useState<boolean>(true);
  const [simStart, setSimStart] = useState<string>('09:20 AM');
  const [simEnd, setSimEnd] = useState<string>('10:20 AM');
  const [simBatch, setSimBatch] = useState<string>(allBatches[0] || 'BCA 1st Sem');
  const [simTeacher, setSimTeacher] = useState<string>(allTeachers[0] || '');
  const [simVenue, setSimVenue] = useState<string>(allVenues[0] || '');

  // Live "Who is Free Right Now?" Radar Time Inspector
  const [radarTimeMinutes, setRadarTimeMinutes] = useState<number>(555); // 09:15 AM
  const [showRadar, setShowRadar] = useState<boolean>(false);

  // Filters for Faculty & Venues
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(allTeachers);
  const [selectedVenues, setSelectedVenues] = useState<string[]>(allVenues);

  // All schedule rows on this target date
  const daySchedule = useMemo(() => {
    return schedule.filter((r) => r.date === date);
  }, [schedule, date]);

  // Compute Faculty Load Data (occupied classes & free gaps for each teacher)
  const facultyData = useMemo(() => {
    const map: Record<string, { occupied: ScheduleRow[]; freeSlots: FreeSlot[] }> = {};
    for (const t of allTeachers) {
      const occupied = daySchedule
        .filter((r) => r.teacherName === t)
        .sort((a, b) => a.startMinutes - b.startMinutes);

      // Compute free slots for this teacher
      const freeSlots: FreeSlot[] = [];
      let curPointer = DEPT_START_MINUTES;

      for (const occ of occupied) {
        if (occ.startMinutes > curPointer) {
          const gapStart = curPointer;
          const gapEnd = occ.startMinutes;
          // Exclude lunch break
          if (gapEnd <= LUNCH_BREAK_START_MINUTES || gapStart >= LUNCH_BREAK_END_MINUTES) {
            if (gapEnd - gapStart >= 30) {
              freeSlots.push({
                id: `t-${t}-${gapStart}-${gapEnd}`,
                date,
                startMinutes: gapStart,
                endMinutes: gapEnd,
                startTime: minutesToReadable(gapStart),
                endTime: minutesToReadable(gapEnd),
                durationMinutes: gapEnd - gapStart,
                durationFormatted: formatDuration(gapEnd - gapStart),
                formattedRange: `${minutesToReadable(gapStart)} – ${minutesToReadable(gapEnd)}`,
                applicableBatches: [],
              });
            }
          }
        }
        curPointer = Math.max(curPointer, occ.endMinutes);
      }

      if (curPointer < DEPT_END_MINUTES) {
        if (DEPT_END_MINUTES - curPointer >= 30) {
          freeSlots.push({
            id: `t-${t}-${curPointer}-${DEPT_END_MINUTES}`,
            date,
            startMinutes: curPointer,
            endMinutes: DEPT_END_MINUTES,
            startTime: minutesToReadable(curPointer),
            endTime: minutesToReadable(DEPT_END_MINUTES),
            durationMinutes: DEPT_END_MINUTES - curPointer,
            durationFormatted: formatDuration(DEPT_END_MINUTES - curPointer),
            formattedRange: `${minutesToReadable(curPointer)} – ${minutesToReadable(DEPT_END_MINUTES)}`,
            applicableBatches: [],
          });
        }
      }

      map[t] = { occupied, freeSlots };
    }
    return map;
  }, [allTeachers, daySchedule, date]);

  // Compute Venue Occupancy Data (occupied classes & free gaps for each room/lab)
  const venueData = useMemo(() => {
    const map: Record<string, { occupied: ScheduleRow[]; freeSlots: FreeSlot[] }> = {};
    for (const v of allVenues) {
      const occupied = daySchedule
        .filter((r) => r.venue === v)
        .sort((a, b) => a.startMinutes - b.startMinutes);

      const freeSlots: FreeSlot[] = [];
      let curPointer = DEPT_START_MINUTES;

      for (const occ of occupied) {
        if (occ.startMinutes > curPointer) {
          const gapStart = curPointer;
          const gapEnd = occ.startMinutes;
          if (gapEnd <= LUNCH_BREAK_START_MINUTES || gapStart >= LUNCH_BREAK_END_MINUTES) {
            if (gapEnd - gapStart >= 30) {
              freeSlots.push({
                id: `v-${v}-${gapStart}-${gapEnd}`,
                date,
                startMinutes: gapStart,
                endMinutes: gapEnd,
                startTime: minutesToReadable(gapStart),
                endTime: minutesToReadable(gapEnd),
                durationMinutes: gapEnd - gapStart,
                durationFormatted: formatDuration(gapEnd - gapStart),
                formattedRange: `${minutesToReadable(gapStart)} – ${minutesToReadable(gapEnd)}`,
                applicableBatches: [],
              });
            }
          }
        }
        curPointer = Math.max(curPointer, occ.endMinutes);
      }

      if (curPointer < DEPT_END_MINUTES) {
        if (DEPT_END_MINUTES - curPointer >= 30) {
          freeSlots.push({
            id: `v-${v}-${curPointer}-${DEPT_END_MINUTES}`,
            date,
            startMinutes: curPointer,
            endMinutes: DEPT_END_MINUTES,
            startTime: minutesToReadable(curPointer),
            endTime: minutesToReadable(DEPT_END_MINUTES),
            durationMinutes: DEPT_END_MINUTES - curPointer,
            durationFormatted: formatDuration(DEPT_END_MINUTES - curPointer),
            formattedRange: `${minutesToReadable(curPointer)} – ${minutesToReadable(DEPT_END_MINUTES)}`,
            applicableBatches: [],
          });
        }
      }

      map[v] = { occupied, freeSlots };
    }
    return map;
  }, [allVenues, daySchedule, date]);

  // Compute Department Rush-Hour & Peak Load Heatmap
  const departmentLoadHeatmap = useMemo(() => {
    const intervals = [
      { start: 480, end: 555, label: '08:00 – 09:15 AM' },
      { start: 555, end: 630, label: '09:15 – 10:30 AM' },
      { start: 630, end: 705, label: '10:30 – 11:45 AM (Recess)', isLunch: true },
      { start: 705, end: 795, label: '11:45 – 01:15 PM' },
      { start: 795, end: 870, label: '01:15 – 02:30 PM' },
      { start: 870, end: 945, label: '02:30 – 03:45 PM' },
      { start: 945, end: 1020, label: '03:45 – 05:00 PM' },
    ];

    const maxRooms = Math.max(1, allVenues.length);

    return intervals.map((int) => {
      if (int.isLunch) {
        return {
          ...int,
          activeClasses: 0,
          loadPct: 0,
          statusText: 'Department Recess',
          statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      }

      const activeClasses = daySchedule.filter(
        (r) => int.start < r.endMinutes && int.end > r.startMinutes
      ).length;

      const loadPct = Math.min(100, Math.round((activeClasses / maxRooms) * 100));
      let statusText = 'Low Activity';
      let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

      if (loadPct >= 70) {
        statusText = '🔥 Peak Load';
        statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      } else if (loadPct >= 40) {
        statusText = '⚡ Moderate Load';
        statusColor = 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      }

      return {
        ...int,
        activeClasses,
        loadPct,
        statusText,
        statusColor,
      };
    });
  }, [daySchedule, allVenues]);

  // Real-time "What-If" Conflict Scanner
  const simEvaluation = useMemo(() => {
    const sMin = parseSingleTimeToMinutes(simStart);
    const eMin = parseSingleTimeToMinutes(simEnd);

    if (sMin === null || eMin === null || eMin <= sMin) {
      return {
        valid: false,
        errorMsg: 'Please specify a valid start and end time (e.g. 09:20 AM to 10:20 AM)',
        clashes: [],
        suggestions: [],
      };
    }

    const clashes: { type: string; title: string; detail: string }[] = [];
    const suggestions: { title: string; action: () => void }[] = [];

    // 1. Check Lunch Break
    if (overlapsLunchBreak(sMin, eMin)) {
      clashes.push({
        type: 'lunch',
        title: 'Department Lunch Recess Conflict',
        detail: `Session overlaps with mandatory recess (${LUNCH_BREAK_LABEL}).`,
      });
    }

    // 2. Check Batch Clashes (with 5-min buffer)
    if (simBatch) {
      const batchClasses = daySchedule.filter((r) => r.courseSem === simBatch);
      for (const bc of batchClasses) {
        if (sMin < bc.endMinutes + TRANSIT_BUFFER_MINUTES && eMin + TRANSIT_BUFFER_MINUTES > bc.startMinutes) {
          clashes.push({
            type: 'batch',
            title: `Batch Conflict for ${simBatch}`,
            detail: `Already scheduled for "${bc.subject}" (${bc.time}) with ${bc.teacherName} in ${bc.venue}.`,
          });
        }
      }
    }

    // 3. Check Teacher Clashes
    if (simTeacher) {
      const teacherClasses = daySchedule.filter((r) => r.teacherName === simTeacher);
      for (const tc of teacherClasses) {
        if (sMin < tc.endMinutes + TRANSIT_BUFFER_MINUTES && eMin + TRANSIT_BUFFER_MINUTES > tc.startMinutes) {
          clashes.push({
            type: 'teacher',
            title: `Faculty Conflict for ${simTeacher}`,
            detail: `Already teaching ${tc.courseSem} ("${tc.subject}") during ${tc.time} in ${tc.venue}.`,
          });
        }
      }
    }

    // 4. Check Venue Clashes
    if (simVenue) {
      const venueClasses = daySchedule.filter((r) => r.venue === simVenue);
      for (const vc of venueClasses) {
        if (sMin < vc.endMinutes && eMin > vc.startMinutes) {
          clashes.push({
            type: 'venue',
            title: `Venue Conflict for ${simVenue}`,
            detail: `Already occupied by ${vc.courseSem} for "${vc.subject}" (${vc.time}).`,
          });
        }
      }
    }

    // 5. Compute Smart Suggestions if clashes exist
    if (clashes.length > 0) {
      // Find available alternative labs
      const freeLabs = allVenues.filter((v) => {
        if (v === simVenue) return false;
        const vClasses = daySchedule.filter((r) => r.venue === v);
        return !vClasses.some((r) => sMin < r.endMinutes && eMin > r.startMinutes);
      });

      if (freeLabs.length > 0) {
        suggestions.push({
          title: `Switch to available venue: ${freeLabs[0]}`,
          action: () => setSimVenue(freeLabs[0]),
        });
      }

      // Suggest alternative time slot (e.g. 11:45 AM)
      if (sMin < 705) {
        suggestions.push({
          title: 'Shift to Post-Lunch Slot (11:45 AM – 12:45 PM)',
          action: () => {
            setSimStart('11:45 AM');
            setSimEnd('12:45 PM');
          },
        });
      }
    }

    return {
      valid: true,
      startMinutes: sMin,
      endMinutes: eMin,
      duration: eMin - sMin,
      hasClashes: clashes.length > 0,
      clashes,
      suggestions,
    };
  }, [simStart, simEnd, simBatch, simTeacher, simVenue, daySchedule, allVenues]);

  // Compute Live "Who is Free Right Now?" Status at radarTimeMinutes
  const radarStatus = useMemo(() => {
    const isLunch = radarTimeMinutes >= LUNCH_BREAK_START_MINUTES && radarTimeMinutes < LUNCH_BREAK_END_MINUTES;

    const busyTeachers: { teacher: string; subject: string; batch: string; venue: string }[] = [];
    const freeTeachers: string[] = [];

    allTeachers.forEach((t) => {
      const activeClass = daySchedule.find(
        (r) => r.teacherName === t && radarTimeMinutes >= r.startMinutes && radarTimeMinutes < r.endMinutes
      );
      if (activeClass) {
        busyTeachers.push({
          teacher: t,
          subject: activeClass.subject,
          batch: activeClass.courseSem,
          venue: activeClass.venue,
        });
      } else {
        freeTeachers.push(t);
      }
    });

    const busyVenues: { venue: string; batch: string; subject: string }[] = [];
    const freeVenues: string[] = [];

    allVenues.forEach((v) => {
      const activeClass = daySchedule.find(
        (r) => r.venue === v && radarTimeMinutes >= r.startMinutes && radarTimeMinutes < r.endMinutes
      );
      if (activeClass) {
        busyVenues.push({
          venue: v,
          batch: activeClass.courseSem,
          subject: activeClass.subject,
        });
      } else {
        freeVenues.push(v);
      }
    });

    const busyBatches: { batch: string; subject: string; teacher: string; venue: string }[] = [];
    const freeBatches: string[] = [];

    allBatches.forEach((b) => {
      const activeClass = daySchedule.find(
        (r) => r.courseSem === b && radarTimeMinutes >= r.startMinutes && radarTimeMinutes < r.endMinutes
      );
      if (activeClass) {
        busyBatches.push({
          batch: b,
          subject: activeClass.subject,
          teacher: activeClass.teacherName,
          venue: activeClass.venue,
        });
      } else {
        freeBatches.push(b);
      }
    });

    return {
      isLunch,
      freeTeachers,
      busyTeachers,
      freeVenues,
      busyVenues,
      freeBatches,
      busyBatches,
    };
  }, [radarTimeMinutes, daySchedule, allTeachers, allVenues, allBatches]);

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
      
      {/* 1. Header & Multi-Dimension Controls */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 space-y-5 shadow-sm">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
                Department Schedule & Master Control Matrix
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium bg-zinc-800/60 text-zinc-300 border border-white/[0.05]">
                08:00 AM – 05:00 PM
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">
              Live Gantt tracker, faculty workload comparison, lab occupancy & real-time conflict simulation
            </p>
          </div>

          {/* Quick Date Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-white/[0.08]">
              <Calendar className="w-4 h-4 text-indigo-400 ml-1.5" />
              <span className="text-xs font-semibold text-zinc-400">Target Date:</span>
              <select
                value={date}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-zinc-850 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowRadar(!showRadar)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showRadar
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/30 shadow-md shadow-sky-500/10'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border-white/[0.08]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Who is Free Radar</span>
            </button>
          </div>

        </div>

        {/* Dimension Switcher Pills: Batches vs Faculty vs Venues */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08]">
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 mr-1">Matrix Dimension:</span>
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setTrackDimension('batches')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  trackDimension === 'batches'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Semester Batches</span>
              </button>
              <button
                type="button"
                onClick={() => setTrackDimension('faculty')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  trackDimension === 'faculty'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Faculty Workload</span>
              </button>
              <button
                type="button"
                onClick={() => setTrackDimension('venues')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  trackDimension === 'venues'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Labs & Rooms</span>
              </button>
            </div>
          </div>

          {/* High-Contrast Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span>Available Free Slot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span>Recess</span>
            </div>
            {trackDimension === 'batches' && batches.length > 1 && (
              <div className="flex items-center gap-1.5 text-indigo-300">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Joint Common Window</span>
              </div>
            )}
          </div>

        </div>

        {/* Dimension Sub-filter Track Selectors */}
        {trackDimension === 'batches' && (
          <div className="pt-3 border-t border-white/[0.04] flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400 mr-1 flex items-center gap-1.5 font-semibold">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Active Batch Tracks:
            </span>
            {allBatches.map((b) => {
              const active = batches.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => onToggleBatch(b)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                    active
                      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-white/[0.05]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-indigo-400' : 'bg-zinc-500'}`} />
                  <span>{b}</span>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* 2. Department Rush-Hour / Peak Load Heatmap Strip */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Department Rush-Hour & Capacity Heatmap</span>
          </span>
          <span className="text-zinc-500 font-mono text-[11px]">
            Real-time concurrent classes on {date}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {departmentLoadHeatmap.map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${item.statusColor}`}
            >
              <div>
                <div className="text-[10px] font-mono text-zinc-400">{item.label}</div>
                <div className="text-xs font-bold mt-1">{item.statusText}</div>
              </div>
              <div className="text-[11px] font-mono font-medium mt-2 flex items-center justify-between">
                <span>{item.activeClasses} classes</span>
                <span>{item.loadPct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Live "Who is Free Right Now?" Radar Inspector (When Toggled) */}
      {showRadar && (
        <div className="rounded-2xl bg-zinc-900/90 border border-sky-500/30 p-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-zinc-100">
                Live Department Radar: Who is Free Right Now?
              </h3>
            </div>
            
            {/* Scrubber buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-zinc-400 mr-1">Inspect Time:</span>
              {[
                { label: '08:15 AM', min: 495 },
                { label: '09:20 AM', min: 560 },
                { label: '10:30 AM (Recess)', min: 630 },
                { label: '11:45 AM', min: 705 },
                { label: '01:15 PM', min: 795 },
                { label: '02:30 PM', min: 870 },
              ].map((slot) => (
                <button
                  key={slot.min}
                  type="button"
                  onClick={() => setRadarTimeMinutes(slot.min)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    radarTimeMinutes === slot.min
                      ? 'bg-sky-500 text-white font-bold shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/[0.05]'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Column Radar Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* Faculty Radar */}
            <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between font-semibold text-zinc-200">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Faculty Availability</span>
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">
                  {radarStatus.freeTeachers.length} Available
                </span>
              </div>
              <div className="space-y-1 pt-1">
                {radarStatus.freeTeachers.map((t) => (
                  <div key={t} className="flex items-center justify-between text-zinc-300 py-1 border-b border-white/[0.02]">
                    <span>{t}</span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">Free</span>
                  </div>
                ))}
                {radarStatus.busyTeachers.map((b) => (
                  <div key={b.teacher} className="flex items-center justify-between text-zinc-400 py-1 border-b border-white/[0.02]">
                    <span className="truncate max-w-[120px]">{b.teacher}</span>
                    <span className="text-[10px] text-rose-400 font-mono truncate max-w-[120px]">{b.batch} • {b.venue}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Venues Radar */}
            <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between font-semibold text-zinc-200">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>Labs & Rooms</span>
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">
                  {radarStatus.freeVenues.length} Vacant
                </span>
              </div>
              <div className="space-y-1 pt-1">
                {radarStatus.freeVenues.map((v) => (
                  <div key={v} className="flex items-center justify-between text-zinc-300 py-1 border-b border-white/[0.02]">
                    <span>{v}</span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">Vacant</span>
                  </div>
                ))}
                {radarStatus.busyVenues.map((b) => (
                  <div key={b.venue} className="flex items-center justify-between text-zinc-400 py-1 border-b border-white/[0.02]">
                    <span className="truncate max-w-[120px]">{b.venue}</span>
                    <span className="text-[10px] text-rose-400 font-mono truncate max-w-[120px]">{b.batch}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Batches Radar */}
            <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between font-semibold text-zinc-200">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Batches Schedule</span>
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">
                  {radarStatus.freeBatches.length} Free
                </span>
              </div>
              <div className="space-y-1 pt-1">
                {radarStatus.freeBatches.map((b) => (
                  <div key={b} className="flex items-center justify-between text-zinc-300 py-1 border-b border-white/[0.02]">
                    <span>{b}</span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">Free Slot</span>
                  </div>
                ))}
                {radarStatus.busyBatches.map((b) => (
                  <div key={b.batch} className="flex items-center justify-between text-zinc-400 py-1 border-b border-white/[0.02]">
                    <span className="truncate max-w-[120px]">{b.batch}</span>
                    <span className="text-[10px] text-rose-400 font-mono truncate max-w-[120px]">{b.subject}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. Visual Gantt Timeline Container */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 overflow-x-auto shadow-sm">
        <div className="min-w-[960px] relative">
          
          {/* Time Ruler */}
          <div className="grid grid-cols-12 gap-0 border-b border-white/[0.08] pb-3 mb-4">
            <div className="col-span-2 text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">
              {trackDimension === 'batches' ? 'Semester Track' : trackDimension === 'faculty' ? 'Faculty Member' : 'Venue / Lab'}
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
                    <span className="font-mono text-[10px] tabular-nums text-zinc-400 font-medium">
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

          {/* Department Lunch Break Strip */}
          <div
            style={{
              left: `calc(16.666% + (100% - 16.666%) * ${((LUNCH_BREAK_START_MINUTES - DEPT_START_MINUTES) / TOTAL_OPERATING_MINUTES)})`,
              width: `calc((100% - 16.666%) * ${((LUNCH_BREAK_END_MINUTES - LUNCH_BREAK_START_MINUTES) / TOTAL_OPERATING_MINUTES)})`,
            }}
            className="absolute top-12 bottom-0 bg-amber-500/5 border-x border-dashed border-amber-500/20 pointer-events-none z-0"
          />

          {/* Master Common Free Slots Track (When Batches Mode & > 1 batch selected) */}
          {trackDimension === 'batches' && batches.length > 1 && (
            <div className="mb-5 p-3.5 rounded-2xl bg-zinc-800/40 border border-white/[0.08] shadow-sm">
              <div className="grid grid-cols-12 gap-0 items-center">
                <div className="col-span-2 pr-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>COMMON SLOTS</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-medium">
                    All {batches.length} batches free
                  </div>
                </div>

                <div className="col-span-10 relative h-14 bg-zinc-900/50 rounded-xl overflow-hidden border border-white/[0.08]">
                  {/* Lunch Recess Strip */}
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
                      Lunch Recess
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

          {/* Render Tracks according to Dimension */}
          <div className="space-y-4">
            
            {/* DIMENSION 1: BATCH TRACKS */}
            {trackDimension === 'batches' && (
              batches.map((batch) => {
                const data = batchData[batch] || { occupied: [], freeSlots: [] };
                const { occupied, freeSlots } = data;

                return (
                  <div
                    key={batch}
                    className="grid grid-cols-12 gap-0 items-center p-3 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/[0.05] transition-colors"
                  >
                    <div className="col-span-2 pr-4">
                      <div className="text-sm font-semibold text-zinc-200 truncate">
                        {batch}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                        <span className="text-rose-400 font-semibold">{occupied.length} classes</span>
                        {' • '}
                        <span className="text-emerald-400 font-semibold">{freeSlots.length} free</span>
                      </div>
                    </div>

                    <div className="col-span-10 relative h-15 bg-zinc-900/60 rounded-xl border border-white/[0.08] overflow-hidden">
                      {/* Lunch Recess */}
                      <div
                        style={{
                          left: `${getPercent(LUNCH_BREAK_START_MINUTES)}%`,
                          width: `${getWidthPercent(LUNCH_BREAK_START_MINUTES, LUNCH_BREAK_END_MINUTES)}%`,
                        }}
                        className="absolute top-1.5 bottom-1.5 bg-amber-500/10 border border-dashed border-amber-500/20 rounded-xl flex items-center justify-center gap-1 text-amber-400 pointer-events-none select-none z-10"
                      >
                        <Utensils className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                        <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wide">
                          Recess
                        </span>
                      </div>

                      {/* Free Slots */}
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

                      {/* Occupied Classes */}
                      {occupied.map((row) => {
                        const left = getPercent(row.startMinutes);
                        const width = getWidthPercent(row.startMinutes, row.endMinutes);
                        const theme = getSubjectTheme(row.subject);

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
                            className={`absolute top-1.5 bottom-1.5 rounded-xl p-2 flex flex-col justify-center overflow-hidden transition cursor-pointer hover:z-20 border ${theme.bg} ${theme.border} ${theme.text}`}
                          >
                            <div className="text-[11px] font-bold truncate leading-tight text-zinc-100">
                              {row.subject}
                            </div>
                            <div className="text-[10px] text-zinc-300 truncate flex items-center gap-1 mt-0.5 font-medium">
                              <span>{row.teacherName}</span>
                              <span>•</span>
                              <span className="text-sky-300 font-mono">{row.venue}</span>
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  </div>
                );
              })
            )}

            {/* DIMENSION 2: FACULTY TRACKS */}
            {trackDimension === 'faculty' && (
              allTeachers.map((teacher) => {
                const data = facultyData[teacher] || { occupied: [], freeSlots: [] };
                const { occupied, freeSlots } = data;

                return (
                  <div
                    key={teacher}
                    className="grid grid-cols-12 gap-0 items-center p-3 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/[0.05] transition-colors"
                  >
                    <div className="col-span-2 pr-4">
                      <div className="text-sm font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span className="truncate">{teacher}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                        <span className="text-rose-400 font-semibold">{occupied.length} sessions</span>
                        {' • '}
                        <span className="text-emerald-400 font-semibold">{freeSlots.length} free</span>
                      </div>
                    </div>

                    <div className="col-span-10 relative h-15 bg-zinc-900/60 rounded-xl border border-white/[0.08] overflow-hidden">
                      {/* Recess */}
                      <div
                        style={{
                          left: `${getPercent(LUNCH_BREAK_START_MINUTES)}%`,
                          width: `${getWidthPercent(LUNCH_BREAK_START_MINUTES, LUNCH_BREAK_END_MINUTES)}%`,
                        }}
                        className="absolute top-1.5 bottom-1.5 bg-amber-500/10 border border-dashed border-amber-500/20 rounded-xl flex items-center justify-center gap-1 text-amber-400 pointer-events-none select-none z-10"
                      >
                        <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wide">
                          Lunch Break
                        </span>
                      </div>

                      {/* Free Gaps */}
                      {freeSlots.map((slot) => {
                        const left = getPercent(slot.startMinutes);
                        const width = getWidthPercent(slot.startMinutes, slot.endMinutes);

                        return (
                          <div
                            key={slot.id}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`Available for assignments/duty: ${slot.formattedRange}`}
                            className="absolute top-1.5 bottom-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl flex flex-col justify-center items-center px-2"
                          >
                            <span className="text-[10px] font-medium font-mono text-emerald-400">Available</span>
                            <span className="text-[9px] font-mono text-emerald-500/80">{slot.startTime}–{slot.endTime}</span>
                          </div>
                        );
                      })}

                      {/* Occupied Classes */}
                      {occupied.map((row) => {
                        const left = getPercent(row.startMinutes);
                        const width = getWidthPercent(row.startMinutes, row.endMinutes);
                        const theme = getSubjectTheme(row.subject);

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
                            className={`absolute top-1.5 bottom-1.5 rounded-xl p-2 flex flex-col justify-center overflow-hidden transition cursor-pointer hover:z-20 border ${theme.bg} ${theme.border}`}
                          >
                            <div className="text-[11px] font-bold truncate text-zinc-100">
                              {row.subject}
                            </div>
                            <div className="text-[10px] text-zinc-300 truncate flex items-center gap-1 mt-0.5">
                              <span className="font-semibold text-indigo-300">{row.courseSem}</span>
                              <span>•</span>
                              <span className="text-sky-300 font-mono">{row.venue}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

            {/* DIMENSION 3: VENUES / LABS TRACKS */}
            {trackDimension === 'venues' && (
              allVenues.map((venue) => {
                const data = venueData[venue] || { occupied: [], freeSlots: [] };
                const { occupied, freeSlots } = data;

                return (
                  <div
                    key={venue}
                    className="grid grid-cols-12 gap-0 items-center p-3 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/[0.05] transition-colors"
                  >
                    <div className="col-span-2 pr-4">
                      <div className="text-sm font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                        <span className="truncate">{venue}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                        <span className="text-rose-400 font-semibold">{occupied.length} sessions</span>
                        {' • '}
                        <span className="text-emerald-400 font-semibold">{freeSlots.length} open</span>
                      </div>
                    </div>

                    <div className="col-span-10 relative h-15 bg-zinc-900/60 rounded-xl border border-white/[0.08] overflow-hidden">
                      {/* Recess */}
                      <div
                        style={{
                          left: `${getPercent(LUNCH_BREAK_START_MINUTES)}%`,
                          width: `${getWidthPercent(LUNCH_BREAK_START_MINUTES, LUNCH_BREAK_END_MINUTES)}%`,
                        }}
                        className="absolute top-1.5 bottom-1.5 bg-amber-500/10 border border-dashed border-amber-500/20 rounded-xl flex items-center justify-center gap-1 text-amber-400 pointer-events-none select-none z-10"
                      >
                        <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wide">
                          Recess
                        </span>
                      </div>

                      {/* Vacant Gaps */}
                      {freeSlots.map((slot) => {
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
                                venue,
                              })
                            }
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`Click to book this vacant lab: ${slot.formattedRange}`}
                            className="absolute top-1.5 bottom-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl flex flex-col justify-center items-center px-2 cursor-pointer transition-all group hover:z-10"
                          >
                            <div className="text-[11px] font-semibold flex items-center gap-1">
                              <span>Vacant {slot.durationFormatted}</span>
                              <Plus className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-[9px] font-mono text-emerald-400/80">{slot.startTime}–{slot.endTime}</span>
                          </button>
                        );
                      })}

                      {/* Occupied Classes */}
                      {occupied.map((row) => {
                        const left = getPercent(row.startMinutes);
                        const width = getWidthPercent(row.startMinutes, row.endMinutes);
                        const theme = getSubjectTheme(row.subject);

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
                            className={`absolute top-1.5 bottom-1.5 rounded-xl p-2 flex flex-col justify-center overflow-hidden transition cursor-pointer hover:z-20 border ${theme.bg} ${theme.border}`}
                          >
                            <div className="text-[11px] font-bold truncate text-zinc-100">
                              {row.subject}
                            </div>
                            <div className="text-[10px] text-zinc-300 truncate flex items-center gap-1 mt-0.5">
                              <span className="font-semibold text-indigo-300">{row.courseSem}</span>
                              <span>•</span>
                              <span>{row.teacherName}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}

          </div>

        </div>
      </div>

      {/* 5. Live "What-If" Conflict Simulator & Smart Resolver Drawer */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-sm">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Live "What-If" Schedule Simulator & Conflict Resolver</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Instant 3-Way Scanner
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Test any time window, batch, teacher, and room to check for clashing sessions before booking
              </p>
            </div>
          </div>
        </div>

        {/* Simulator Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Start Time</label>
            <input
              type="text"
              value={simStart}
              onChange={(e) => setSimStart(e.target.value)}
              placeholder="09:20 AM"
              className="w-full bg-zinc-800/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">End Time</label>
            <input
              type="text"
              value={simEnd}
              onChange={(e) => setSimEnd(e.target.value)}
              placeholder="10:20 AM"
              className="w-full bg-zinc-800/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Batch</label>
            <select
              value={simBatch}
              onChange={(e) => setSimBatch(e.target.value)}
              className="w-full bg-zinc-800/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              {allBatches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Faculty</label>
            <select
              value={simTeacher}
              onChange={(e) => setSimTeacher(e.target.value)}
              className="w-full bg-zinc-800/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              {allTeachers.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">Venue</label>
            <select
              value={simVenue}
              onChange={(e) => setSimVenue(e.target.value)}
              className="w-full bg-zinc-800/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              {allVenues.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Live Evaluation Banner */}
        {simEvaluation.valid && (
          <div className="pt-2">
            {!simEvaluation.hasClashes ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">
                      All Clear! 0 Clashes Detected across Batch, Faculty & Venue
                    </h4>
                    <p className="text-[11px] text-emerald-400/80 mt-0.5">
                      The proposed window ({simStart} – {simEnd} on {date}) has no teacher double-booking, room overlap, or lunch break conflict.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onBookSlot({
                      date,
                      startMinutes: simEvaluation.startMinutes!,
                      endMinutes: simEvaluation.endMinutes!,
                      batch: simBatch,
                      batches: [simBatch],
                      teacher: simTeacher,
                      venue: simVenue,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Instant Reserve This Slot</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Schedule Conflict Detected ({simEvaluation.clashes.length} Clash{simEvaluation.clashes.length > 1 ? 'es' : ''})</span>
                </div>

                <div className="space-y-1.5 pl-6">
                  {simEvaluation.clashes.map((c, i) => (
                    <div key={i} className="text-xs text-rose-300 flex items-start gap-2">
                      <span className="font-semibold text-rose-400">• {c.title}:</span>
                      <span className="text-zinc-300">{c.detail}</span>
                    </div>
                  ))}
                </div>

                {/* Smart Resolver Suggestions */}
                {simEvaluation.suggestions.length > 0 && (
                  <div className="pt-2 border-t border-rose-500/20 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Smart Resolver Fixes:</span>
                    </span>
                    {simEvaluation.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={sug.action}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/[0.1] text-xs font-medium transition-all cursor-pointer flex items-center gap-1 hover:border-indigo-500/40"
                      >
                        <span>{sug.title}</span>
                        <ArrowRight className="w-3 h-3 text-indigo-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Popover on Hovering Occupied Blocks */}
      {hoveredRow && tooltipPos && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: tooltipPos.y < 180 ? `${tooltipPos.y + 35}px` : `${tooltipPos.y - 10}px`,
            transform: tooltipPos.y < 180 ? 'translate(-50%, 0%)' : 'translate(-50%, -100%)',
          }}
          className="z-50 bg-zinc-900/95 backdrop-blur-xl border border-white/[0.1] p-4 rounded-xl shadow-2xl text-xs space-y-1.5 w-64 pointer-events-none animate-in fade-in zoom-in-95 duration-100 text-zinc-300"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 font-bold text-rose-400">
            <span>Occupied Lecture</span>
            <span className="font-mono text-zinc-400 tabular-nums">{hoveredRow.date}</span>
          </div>
          <div><span className="text-zinc-500">Subject:</span> <strong className="text-zinc-100 font-bold ml-1">{hoveredRow.subject || 'CS Lecture'}</strong></div>
          <div><span className="text-zinc-500">Batch:</span> <strong className="text-zinc-100 ml-1">{hoveredRow.courseSem}</strong></div>
          <div><span className="text-zinc-500">Faculty:</span> <strong className="text-zinc-100 ml-1">{hoveredRow.teacherName}</strong></div>
          <div><span className="text-zinc-500">Venue:</span> <span className="text-sky-300 font-semibold ml-1">{hoveredRow.venue}</span></div>
          <div><span className="text-zinc-500">Time:</span> <span className="font-mono tabular-nums text-emerald-400 font-bold ml-1">{hoveredRow.time}</span></div>
          <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/[0.08] mt-1 font-mono">
            Duration: {formatDuration(hoveredRow.endMinutes - hoveredRow.startMinutes)}
          </div>
        </div>
      )}

    </div>
  );
};
