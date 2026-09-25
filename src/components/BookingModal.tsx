import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import type { ScheduleRow } from '../types/schedule';
import {
  minutesToHHMM,
  minutesToReadable,
  formatTimeRangeToCSV,
  formatDuration,
  formatFriendlyDate,
  DEPT_START_MINUTES,
  DEPT_END_MINUTES,
  addWeeksToDDMMYYYY,
  getDayOfWeek,
  overlapsLunchBreak,
  LUNCH_BREAK_LABEL,
  htmlDateToDDMMYYYY,
  ddmmYYYYToHtmlDate,
} from '../utils/timeUtils';
import {
  checkBookingConflicts,
  getAvailableTeachers,
  getAvailableVenues,
} from '../utils/conflictChecker';
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Repeat,
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: string;
  initialStartMinutes: number;
  initialEndMinutes: number;
  initialBatch?: string;
  initialBatches?: string[];
  initialSubject?: string;
  initialTeacherName?: string;
  initialVenue?: string;
  initialSessionTitle?: string;
  availableBatches: string[];
  availableTeachers: string[];
  availableVenues: string[];
  availableSubjects?: string[];
  schedule: ScheduleRow[];
  onConfirmBooking: (newRows: ScheduleRow[]) => void;
}

const SESSION_TYPES = [
  'Guest Lecture',
  'Extra Class',
  'Lab Exam',
  'Seminar / Workshop',
  'Placement Drive',
  'Faculty Meeting',
] as const;

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  initialStartMinutes,
  initialEndMinutes,
  initialBatch,
  initialBatches,
  initialSubject,
  initialTeacherName,
  initialVenue,
  initialSessionTitle,
  availableBatches,
  availableTeachers,
  availableVenues,
  availableSubjects = [],
  schedule,
  onConfirmBooking,
}) => {
  const [date, setDate] = useState(initialDate);
  const [startMinutes, setStartMinutes] = useState(initialStartMinutes || 480);
  const [endMinutes, setEndMinutes] = useState(initialEndMinutes || 540);
  const [sessionTitle, setSessionTitle] = useState(initialSessionTitle || '');
  const [subject, setSubject] = useState(initialSubject || (availableSubjects.length > 0 ? availableSubjects[0] : ''));
  const [sessionType, setSessionType] = useState<typeof SESSION_TYPES[number]>('Guest Lecture');
  const [selectedBatches, setSelectedBatches] = useState<string[]>(
    initialBatches && initialBatches.length > 0
      ? initialBatches
      : initialBatch
      ? [initialBatch]
      : availableBatches.slice(0, 1)
  );
  const [teacherName, setTeacherName] = useState('');
  const [isCustomTeacher, setIsCustomTeacher] = useState(false);
  const [customTeacher, setCustomTeacher] = useState('');

  const [venue, setVenue] = useState('');
  const [isCustomVenue, setIsCustomVenue] = useState(false);
  const [customVenue, setCustomVenue] = useState('');

  const [recurrenceType, setRecurrenceType] = useState<'once' | 'weekly'>('once');
  const [repeatWeeks, setRepeatWeeks] = useState<number>(4);

  const [forceBook, setForceBook] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate);
      setStartMinutes(initialStartMinutes || 480);
      setEndMinutes(initialEndMinutes || 540);
      setSelectedBatches(
        initialBatches && initialBatches.length > 0
          ? initialBatches
          : initialBatch
          ? [initialBatch]
          : availableBatches.slice(0, 1)
      );
      setSessionTitle(initialSessionTitle || '');
      setSubject(initialSubject || (availableSubjects.length > 0 ? availableSubjects[0] : ''));
      setForceBook(false);
      setRecurrenceType('once');
      setRepeatWeeks(4);

      if (initialTeacherName) {
        if (availableTeachers.includes(initialTeacherName)) {
          setTeacherName(initialTeacherName);
          setIsCustomTeacher(false);
          setCustomTeacher('');
        } else {
          setIsCustomTeacher(true);
          setCustomTeacher(initialTeacherName);
        }
      } else {
        setIsCustomTeacher(false);
        setCustomTeacher('');
        const teachers = getAvailableTeachers(
          schedule,
          availableTeachers,
          initialDate,
          initialStartMinutes,
          initialEndMinutes
        );
        if (teachers.available.length > 0) {
          setTeacherName(teachers.available[0]);
        } else if (availableTeachers.length > 0) {
          setTeacherName(availableTeachers[0]);
        }
      }

      if (initialVenue) {
        if (availableVenues.includes(initialVenue)) {
          setVenue(initialVenue);
          setIsCustomVenue(false);
          setCustomVenue('');
        } else {
          setIsCustomVenue(true);
          setCustomVenue(initialVenue);
        }
      } else {
        setIsCustomVenue(false);
        setCustomVenue('');
        const venues = getAvailableVenues(
          schedule,
          availableVenues,
          initialDate,
          initialStartMinutes,
          initialEndMinutes
        );
        if (venues.available.length > 0) {
          setVenue(venues.available[0]);
        } else if (availableVenues.length > 0) {
          setVenue(availableVenues[0]);
        }
      }
    }
  }, [isOpen, initialDate, initialStartMinutes, initialEndMinutes, initialBatch, initialBatches, initialSubject, initialTeacherName, initialVenue, initialSessionTitle]);

  const effectiveTeacher = isCustomTeacher ? (customTeacher.trim() || 'Guest Speaker') : teacherName;
  const effectiveVenue = isCustomVenue ? (customVenue.trim() || 'Custom Venue') : venue;

  const recurringDates = useMemo(() => {
    if (recurrenceType !== 'weekly') return [date];
    const dates: string[] = [];
    for (let i = 0; i < repeatWeeks; i++) {
      dates.push(addWeeksToDDMMYYYY(date, i));
    }
    return dates;
  }, [date, recurrenceType, repeatWeeks]);

  const multiWeekConflicts = useMemo(() => {
    if (recurrenceType !== 'weekly') return [];
    const clashes: { date: string; weekNum: number; conflicts: string[] }[] = [];
    recurringDates.slice(1).forEach((recDate, idx) => {
      const res = checkBookingConflicts(schedule, {
        date: recDate,
        startMinutes,
        endMinutes,
        teacherName: effectiveTeacher,
        venue: effectiveVenue,
        courseSems: selectedBatches,
      });
      if (res.hasConflict) {
        clashes.push({
          date: recDate,
          weekNum: idx + 2,
          conflicts: res.conflicts.map((c) => c.description),
        });
      }
    });
    return clashes;
  }, [recurringDates, recurrenceType, schedule, startMinutes, endMinutes, effectiveTeacher, effectiveVenue, selectedBatches]);

  const conflictResult = useMemo(() => {
    return checkBookingConflicts(schedule, {
      date,
      startMinutes,
      endMinutes,
      teacherName: effectiveTeacher,
      venue: effectiveVenue,
      courseSems: selectedBatches,
    });
  }, [schedule, date, startMinutes, endMinutes, effectiveTeacher, effectiveVenue, selectedBatches]);

  const { available: freeTeachers, busy: busyTeachers } = useMemo(() => {
    return getAvailableTeachers(
      schedule,
      availableTeachers,
      date,
      startMinutes,
      endMinutes
    );
  }, [schedule, availableTeachers, date, startMinutes, endMinutes]);

  const { available: freeVenues, busy: busyVenues } = useMemo(() => {
    return getAvailableVenues(
      schedule,
      availableVenues,
      date,
      startMinutes,
      endMinutes
    );
  }, [schedule, availableVenues, date, startMinutes, endMinutes]);

  // Auto-switch to an available free teacher/venue if current selection is occupied at the new time
  useEffect(() => {
    if (!isOpen) return;
    if (!isCustomTeacher && freeTeachers.length > 0 && !freeTeachers.includes(teacherName)) {
      setTeacherName(freeTeachers[0]);
    }
  }, [isOpen, isCustomTeacher, freeTeachers, teacherName]);

  useEffect(() => {
    if (!isOpen) return;
    if (!isCustomVenue && freeVenues.length > 0 && !freeVenues.includes(venue)) {
      setVenue(freeVenues[0]);
    }
  }, [isOpen, isCustomVenue, freeVenues, venue]);

  const hasMultiWeekConflict = recurrenceType === 'weekly' && multiWeekConflicts.length > 0;
  const hasAnyConflict = conflictResult.hasConflict || hasMultiWeekConflict;
  const isBlocked = (hasAnyConflict && !forceBook) || overlapsLunchBreak(startMinutes, endMinutes);

  const handleToggleBatch = (b: string) => {
    if (selectedBatches.includes(b)) {
      if (selectedBatches.length > 1) {
        setSelectedBatches(selectedBatches.filter((x) => x !== b));
      }
    } else {
      setSelectedBatches([...selectedBatches, b]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCustomTeacher && !customTeacher.trim()) {
      alert('Please enter a name for the guest speaker or custom faculty.');
      return;
    }

    if (isCustomVenue && !customVenue.trim()) {
      alert('Please enter a venue or room location.');
      return;
    }

    if (overlapsLunchBreak(startMinutes, endMinutes)) {
      alert(`Cannot schedule session: overlaps mandatory Department Lunch Break (${LUNCH_BREAK_LABEL}). Please select a time before 10:30 AM or after 11:45 AM.`);
      return;
    }

    if (conflictResult.hasConflict && !forceBook) {
      alert(`Cannot schedule session: ${conflictResult.conflicts.length} conflict(s) detected. Please select an available faculty/venue or check 'Admin override'.`);
      return;
    }

    if (recurrenceType === 'weekly' && multiWeekConflicts.length > 0 && !forceBook) {
      alert('Cannot schedule recurring session: conflicts detected in future weeks. Resolve conflicts or enable admin override.');
      return;
    }

    const formattedTime = formatTimeRangeToCSV(startMinutes, endMinutes);
    const finalSessionTitle = sessionTitle.trim() || `${subject.trim() || 'Core CS'} (${sessionType})`;
    const newRows: ScheduleRow[] = [];

    recurringDates.forEach((d, wIdx) => {
      selectedBatches.forEach((batch, bIdx) => {
        newRows.push({
          id: `booking-${Date.now()}-${wIdx}-${bIdx}`,
          date: d,
          time: formattedTime,
          courseSem: batch,
          subject: subject.trim() || 'Core CS Lecture',
          teacherName: effectiveTeacher,
          venue: effectiveVenue,
          startMinutes,
          endMinutes,
          sessionType,
          sessionTitle:
            recurrenceType === 'weekly'
              ? `${finalSessionTitle} (Wk ${wIdx + 1})`
              : finalSessionTitle,
        });
      });
    });

    onConfirmBooking(newRows);

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00F5A0', '#8B5CF6', '#38BDF8', '#FF4757'],
    });

    onClose();
  };

  const safeToHtmlDate = (dStr: string): string => {
    if (!dStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return dStr;
    const parts = dStr.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      if (parts[0].length === 4) return dStr;
    }
    return dStr;
  };

  const safeToDDMMYYYY = (dStr: string): string => {
    if (!dStr) return '';
    if (/^\d{2}-\d{2}-\d{4}$/.test(dStr)) return dStr;
    const parts = dStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      if (parts[2].length === 4) return dStr;
    }
    return dStr;
  };

  const timeStepOptions = useMemo(() => {
    const list: { minutes: number; label: string }[] = [];
    const seen = new Set<number>();

    // 5-minute intervals cover every timetable period (08:15, 08:20, 09:15, 09:20, 10:20, 10:30, 11:45, 12:45, 12:50, 01:50, etc.)
    for (let m = DEPT_START_MINUTES; m <= DEPT_END_MINUTES; m += 5) {
      list.push({ minutes: m, label: minutesToReadable(m) });
      seen.add(m);
    }

    if (startMinutes !== undefined && !seen.has(startMinutes)) {
      list.push({ minutes: startMinutes, label: minutesToReadable(startMinutes) });
      seen.add(startMinutes);
    }
    if (endMinutes !== undefined && !seen.has(endMinutes)) {
      list.push({ minutes: endMinutes, label: minutesToReadable(endMinutes) });
      seen.add(endMinutes);
    }

    list.sort((a, b) => a.minutes - b.minutes);
    return list;
  }, [startMinutes, endMinutes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header - Obsidian Aurora Dark Mode */}
        <div className="px-6 py-5 bg-zinc-900/90 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Reserve Session in Slot</h3>
              <p className="text-xs text-zinc-400 font-medium">
                Automatic faculty & venue double-booking verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Auto-Filled Slot Confirmation Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span className="font-semibold text-zinc-300">
                Selected Slot:
              </span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                {minutesToReadable(startMinutes)} → {minutesToReadable(endMinutes)} ({formatDuration(endMinutes - startMinutes)})
              </span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              {formatFriendlyDate(date)} • {selectedBatches.join(', ') || 'Select batch'}
            </div>
          </div>
          
          {/* Row 1: Subject, Session Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Subject / Course <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Operating Systems / JAVA"
                list="available-subjects-list"
                className="w-full bg-zinc-800/70 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all font-medium"
              />
              {availableSubjects.length > 0 && (
                <datalist id="available-subjects-list">
                  {availableSubjects.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Topic / Details <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. Core Lecture / Lab"
                className="w-full bg-zinc-800/70 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Category</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as any)}
                className="w-full bg-zinc-800/70 border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 cursor-pointer font-semibold transition-all"
              >
                {SESSION_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-zinc-800 text-zinc-100">{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date & Time Window */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-800/50 border border-white/[0.06]">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Date
                </label>
                <span className="text-[10px] font-mono text-indigo-400">
                  {formatFriendlyDate(date)}
                </span>
              </div>
              <input
                type="date"
                value={safeToHtmlDate(date)}
                onChange={(e) => {
                  if (e.target.value) {
                    setDate(safeToDDMMYYYY(e.target.value));
                  }
                }}
                className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono font-medium text-zinc-100 focus:outline-none focus:border-indigo-500/40 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Start Time
              </label>
              <select
                value={startMinutes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStartMinutes(val);
                  if (val >= endMinutes) {
                    setEndMinutes(Math.min(DEPT_END_MINUTES, val + 60));
                  }
                }}
                className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500/40 cursor-pointer font-medium"
              >
                {timeStepOptions.filter((t) => t.minutes < DEPT_END_MINUTES).map((t) => (
                  <option key={t.minutes} value={t.minutes} className="bg-zinc-800 text-zinc-100">{t.label} ({minutesToHHMM(t.minutes)})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                End Time
              </label>
              <select
                value={endMinutes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEndMinutes(val);
                  if (val <= startMinutes) {
                    setStartMinutes(Math.max(DEPT_START_MINUTES, val - 60));
                  }
                }}
                className="w-full bg-zinc-900 border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500/40 cursor-pointer font-medium"
              >
                {timeStepOptions.filter((t) => t.minutes > startMinutes).map((t) => (
                  <option key={t.minutes} value={t.minutes} className="bg-zinc-800 text-zinc-100">{t.label} ({minutesToHHMM(t.minutes)})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lunch Break Warning Banner */}
          {overlapsLunchBreak(startMinutes, endMinutes) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-200">
                  Mandatory Department Lunch Break ({LUNCH_BREAK_LABEL}):
                </strong>
                <p className="mt-0.5 text-amber-300/90 font-normal">
                  University regulations prohibit scheduling lectures, labs, or extra classes during the lunch recess. Please adjust start or end time before 10:30 AM or after 11:45 AM.
                </p>
              </div>
            </div>
          )}

          {/* Row 2b: Reservation Recurrence (Single vs Weekly Repeat) */}
          <div className="p-3.5 rounded-2xl bg-zinc-800/40 border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                Session Recurrence
              </label>
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setRecurrenceType('once')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    recurrenceType === 'once'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  One-Time Session
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceType('weekly')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    recurrenceType === 'weekly'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Repeat Weekly
                </button>
              </div>
            </div>

            {recurrenceType === 'weekly' && (
              <div className="space-y-2 pt-2 border-t border-white/[0.06] animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-300">Repeat For:</span>
                  <div className="flex gap-1.5">
                    {[2, 4, 8, 12].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setRepeatWeeks(w)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          repeatWeeks === w
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750 border border-white/[0.06]'
                        }`}
                      >
                        {w} Weeks
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/[0.06] text-xs text-zinc-300 space-y-1">
                  <div className="font-bold text-zinc-100 flex items-center justify-between">
                    <span>Every {getDayOfWeek(date)} for {repeatWeeks} Weeks</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded-lg border border-indigo-500/25">
                      {repeatWeeks * selectedBatches.length} Sessions Total
                    </span>
                  </div>
                  <div className="text-zinc-500 font-mono text-[10px] truncate">
                    Dates: {recurringDates.join(' • ')}
                  </div>
                </div>

                {multiWeekConflicts.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Clash Detected in Future Weeks ({multiWeekConflicts.length} {multiWeekConflicts.length === 1 ? 'week has' : 'weeks have'} clashes)</span>
                    </div>
                    <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-300/80">
                      {multiWeekConflicts.map((c, i) => (
                        <li key={i}>
                          <strong>Week {c.weekNum} ({c.date}):</strong> {c.conflicts.join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 3: Target Batches Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Assigned Semester Batches (Select one or multiple for combined lecture)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableBatches.map((b) => {
                const isSelected = selectedBatches.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleToggleBatch(b)}
                    className={`px-3 py-1.5 text-xs rounded-xl transition cursor-pointer font-semibold ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500'
                        : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-white/[0.06]'
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Faculty & Venue Assignments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Faculty Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Assign Faculty Member
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomTeacher(!isCustomTeacher)}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 px-2 py-0.5 rounded-lg border border-indigo-500/25 transition"
                >
                  {isCustomTeacher ? '← Select Listed' : '+ Guest Speaker'}
                </button>
              </div>

              {isCustomTeacher ? (
                <input
                  type="text"
                  value={customTeacher}
                  onChange={(e) => setCustomTeacher(e.target.value)}
                  placeholder="e.g. Dr. Yann LeCun (Guest Speaker)"
                  className="w-full bg-zinc-800/70 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 font-medium"
                />
              ) : (
                <select
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full bg-zinc-800/70 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 cursor-pointer font-medium"
                >
                  <optgroup label={`Available Faculty (${freeTeachers.length})`}>
                    {freeTeachers.map((t) => (
                      <option key={t} value={t} className="bg-zinc-800 text-zinc-100">✓ {t}</option>
                    ))}
                  </optgroup>
                  {busyTeachers.length > 0 && (
                    <optgroup label="Occupied / Busy Faculty (Conflict)">
                      {busyTeachers.map(({ teacher, reason }) => (
                        <option key={teacher} value={teacher} className="bg-zinc-800 text-zinc-400">
                          ⚠️ {teacher} — {reason}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
            </div>

            {/* Venue Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  Assign Venue / Lab
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomVenue(!isCustomVenue)}
                  className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 px-2 py-0.5 rounded-lg border border-sky-500/25 transition"
                >
                  {isCustomVenue ? '← Select Listed' : '+ Custom Venue'}
                </button>
              </div>

              {isCustomVenue ? (
                <input
                  type="text"
                  value={customVenue}
                  onChange={(e) => setCustomVenue(e.target.value)}
                  placeholder="e.g. Auditorium Hall B / Lab 6"
                  className="w-full bg-zinc-800/70 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 font-medium"
                />
              ) : (
                <select
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-zinc-800/70 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 cursor-pointer font-medium"
                >
                  <optgroup label={`Available Venues (${freeVenues.length})`}>
                    {freeVenues.map((v) => (
                      <option key={v} value={v} className="bg-zinc-800 text-zinc-100">✓ {v}</option>
                    ))}
                  </optgroup>
                  {busyVenues.length > 0 && (
                    <optgroup label="Occupied Venues (Conflict)">
                      {busyVenues.map(({ venue, reason }) => (
                        <option key={venue} value={venue} className="bg-zinc-800 text-zinc-400">
                          ⚠️ {venue} — {reason}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
            </div>

          </div>

          {/* High-Contrast Conflict Alert Banner (Week 1 / Single Date) */}
          {conflictResult.hasConflict && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Collision Conflict Detected ({conflictResult.conflicts.length})</span>
              </div>
              <ul className="text-xs text-rose-300/80 space-y-1 pl-6 list-disc font-medium">
                {conflictResult.conflicts.map((conf, i) => (
                  <li key={i}>{conf.description}</li>
                ))}
              </ul>
              <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                <label className="flex items-center gap-2 text-[11px] text-rose-300 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={forceBook}
                    onChange={(e) => setForceBook(e.target.checked)}
                    className="rounded border-rose-500/40 text-rose-500 focus:ring-rose-500/30 bg-zinc-800"
                  />
                  <span>Admin override (Schedule despite conflict)</span>
                </label>
              </div>
            </div>
          )}

          {/* Multi-Week Recurring Conflicts Banner (Weeks 2..N) */}
          {hasMultiWeekConflict && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Future Recurring Week Conflicts ({multiWeekConflicts.length} {multiWeekConflicts.length === 1 ? 'week has' : 'weeks have'} clashes)</span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {multiWeekConflicts.map((c, i) => (
                  <div key={i} className="text-xs bg-zinc-850 p-2.5 rounded-xl border border-amber-500/20">
                    <p className="font-semibold text-amber-200">Week {c.weekNum} ({c.date}):</p>
                    <ul className="text-amber-300/80 list-disc pl-5 font-normal mt-0.5 space-y-0.5">
                      {c.conflicts.map((desc, di) => (
                        <li key={di}>{desc}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-amber-500/20">
                <label className="flex items-center gap-2 text-[11px] text-amber-300 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={forceBook}
                    onChange={(e) => setForceBook(e.target.checked)}
                    className="rounded border-amber-500/40 text-amber-500 focus:ring-amber-500/30 bg-zinc-800"
                  />
                  <span>Admin override (Schedule recurring despite future clashes)</span>
                </label>
              </div>
            </div>
          )}

          {!hasAnyConflict && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong className="text-emerald-200 font-semibold">Conflict Verified:</strong> Faculty member, venue, and assigned batches are completely free at this time{recurrenceType === 'weekly' ? ` across all ${repeatWeeks} weeks.` : '.'}
              </span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
            <div className="text-xs">
              {overlapsLunchBreak(startMinutes, endMinutes) ? (
                <span className="text-amber-300 font-semibold flex items-center gap-1.5 bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Overlaps Lunch Break ({LUNCH_BREAK_LABEL})</span>
                </span>
              ) : hasAnyConflict && !forceBook ? (
                <span className="text-rose-300 font-semibold flex items-center gap-1.5 bg-rose-500/15 px-3 py-1.5 rounded-xl border border-rose-500/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span>Conflict detected. Check override or change slot.</span>
                </span>
              ) : (
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Slot verified & ready to reserve</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-750 border border-white/[0.08] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isBlocked
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 active:scale-98'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-98'
                }`}
              >
                {isBlocked ? 'Confirm (Resolve Conflict)' : 'Confirm Reservation'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
