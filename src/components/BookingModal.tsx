import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import type { ScheduleRow } from '../types/schedule';
import {
  minutesToHHMM,
  minutesToReadable,
  formatTimeRangeToCSV,
  DEPT_START_MINUTES,
  DEPT_END_MINUTES,
  addWeeksToDDMMYYYY,
  getDayOfWeek,
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
  availableBatches: string[];
  availableTeachers: string[];
  availableVenues: string[];
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
  availableBatches,
  availableTeachers,
  availableVenues,
  schedule,
  onConfirmBooking,
}) => {
  const [date, setDate] = useState(initialDate);
  const [startMinutes, setStartMinutes] = useState(initialStartMinutes || 480);
  const [endMinutes, setEndMinutes] = useState(initialEndMinutes || 540);
  const [sessionTitle, setSessionTitle] = useState('');
  const [subject, setSubject] = useState('Advanced Computer Science');
  const [sessionType, setSessionType] = useState<typeof SESSION_TYPES[number]>('Guest Lecture');
  const [selectedBatches, setSelectedBatches] = useState<string[]>(
    initialBatch ? [initialBatch] : availableBatches.slice(0, 1)
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
      setSelectedBatches(initialBatch ? [initialBatch] : availableBatches.slice(0, 1));
      setSessionTitle('');
      setForceBook(false);
      setIsCustomTeacher(false);
      setCustomTeacher('');
      setIsCustomVenue(false);
      setCustomVenue('');
      setRecurrenceType('once');
      setRepeatWeeks(4);

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
  }, [isOpen, initialDate, initialStartMinutes, initialEndMinutes, initialBatch]);

  if (!isOpen) return null;

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

  const conflictResult = checkBookingConflicts(schedule, {
    date,
    startMinutes,
    endMinutes,
    teacherName: effectiveTeacher,
    venue: effectiveVenue,
    courseSems: selectedBatches,
  });

  const { available: freeTeachers, busy: busyTeachers } = getAvailableTeachers(
    schedule,
    availableTeachers,
    date,
    startMinutes,
    endMinutes
  );

  const { available: freeVenues, busy: busyVenues } = getAvailableVenues(
    schedule,
    availableVenues,
    date,
    startMinutes,
    endMinutes
  );

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

    if (!sessionTitle.trim()) {
      alert('Please enter a session title or topic.');
      return;
    }

    if (isCustomTeacher && !customTeacher.trim()) {
      alert('Please enter a name for the guest speaker or custom faculty.');
      return;
    }

    if (isCustomVenue && !customVenue.trim()) {
      alert('Please enter a venue or room location.');
      return;
    }

    if (conflictResult.hasConflict && !forceBook) {
      return;
    }

    const formattedTime = formatTimeRangeToCSV(startMinutes, endMinutes);
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
              ? `${sessionTitle.trim()} (Wk ${wIdx + 1})`
              : sessionTitle.trim(),
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

  const timeStepOptions: { minutes: number; label: string }[] = [];
  for (let m = DEPT_START_MINUTES; m <= DEPT_END_MINUTES; m += 30) {
    timeStepOptions.push({ minutes: m, label: minutesToReadable(m) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header - Light Mode */}
        <div className="px-7 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Reserve Session in Slot</h3>
              <p className="text-xs text-slate-500 font-medium">
                Automatic faculty & venue double-booking verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Light Mode */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          
          {/* Row 1: Subject, Session Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Subject / Course <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Distributed Systems"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                Topic / Details <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. Raft Consensus Lecture"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Category</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 cursor-pointer shadow-sm font-bold"
              >
                {SESSION_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date & Time Window */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Date
              </label>
              <input
                type="text"
                readOnly
                value={date}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 shadow-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
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
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm font-semibold"
              >
                {timeStepOptions.filter((t) => t.minutes < DEPT_END_MINUTES).map((t) => (
                  <option key={t.minutes} value={t.minutes}>{t.label} ({minutesToHHMM(t.minutes)})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
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
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm font-semibold"
              >
                {timeStepOptions.filter((t) => t.minutes > startMinutes).map((t) => (
                  <option key={t.minutes} value={t.minutes}>{t.label} ({minutesToHHMM(t.minutes)})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2b: Reservation Recurrence (Single vs Weekly Repeat) */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-indigo-600" />
                Session Recurrence
              </label>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setRecurrenceType('once')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    recurrenceType === 'once'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  One-Time Session
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceType('weekly')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    recurrenceType === 'weekly'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Repeat Weekly
                </button>
              </div>
            </div>

            {recurrenceType === 'weekly' && (
              <div className="space-y-2 pt-2 border-t border-indigo-200/60 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Repeat For:</span>
                  <div className="flex gap-1.5">
                    {[2, 4, 8, 12].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setRepeatWeeks(w)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                          repeatWeeks === w
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {w} Weeks
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-indigo-200 text-xs text-slate-700 space-y-1">
                  <div className="font-extrabold text-indigo-950 flex items-center justify-between">
                    <span>Every {getDayOfWeek(date)} for {repeatWeeks} Weeks</span>
                    <span className="text-[10px] font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                      {repeatWeeks * selectedBatches.length} Sessions Total
                    </span>
                  </div>
                  <div className="text-slate-500 font-mono text-[10px] truncate">
                    Dates: {recurringDates.join(' • ')}
                  </div>
                </div>

                {multiWeekConflicts.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>Clash Detected in Future Weeks ({multiWeekConflicts.length})</span>
                    </div>
                    <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-800">
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
            <label className="text-xs font-bold text-slate-700">
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
                    className={`px-3 py-1.5 text-xs rounded-xl transition cursor-pointer font-bold ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
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
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  Assign Faculty Member
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomTeacher(!isCustomTeacher)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium shadow-sm"
                />
              ) : (
                <select
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 cursor-pointer font-medium shadow-sm"
                >
                  <optgroup label={`Available Faculty (${freeTeachers.length})`}>
                    {freeTeachers.map((t) => (
                      <option key={t} value={t}>✓ {t}</option>
                    ))}
                  </optgroup>
                  {busyTeachers.length > 0 && (
                    <optgroup label="Occupied / Busy Faculty (Conflict)">
                      {busyTeachers.map(({ teacher, reason }) => (
                        <option key={teacher} value={teacher}>
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
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  Assign Venue / Lab
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomVenue(!isCustomVenue)}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-lg transition"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 font-medium shadow-sm"
                />
              ) : (
                <select
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 cursor-pointer font-medium shadow-sm"
                >
                  <optgroup label={`Available Venues (${freeVenues.length})`}>
                    {freeVenues.map((v) => (
                      <option key={v} value={v}>✓ {v}</option>
                    ))}
                  </optgroup>
                  {busyVenues.length > 0 && (
                    <optgroup label="Occupied Venues (Conflict)">
                      {busyVenues.map(({ venue, reason }) => (
                        <option key={venue} value={venue}>
                          ⚠️ {venue} — {reason}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
            </div>

          </div>

          {/* High-Contrast Conflict Alert Banner - Light Mode */}
          {conflictResult.hasConflict && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Collision Conflict Detected ({conflictResult.conflicts.length})</span>
              </div>
              <ul className="text-xs text-rose-700 space-y-1 pl-6 list-disc font-medium">
                {conflictResult.conflicts.map((conf, i) => (
                  <li key={i}>{conf.description}</li>
                ))}
              </ul>
              <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                <label className="flex items-center gap-2 text-[11px] text-rose-800 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={forceBook}
                    onChange={(e) => setForceBook(e.target.checked)}
                    className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Admin override (Schedule despite conflict)</span>
                </label>
              </div>
            </div>
          )}

          {!conflictResult.hasConflict && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center gap-2.5 text-xs text-emerald-900 shadow-sm font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Conflict Verified:</strong> Faculty member, venue, and assigned batches are completely free at this time.
              </span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={conflictResult.hasConflict && !forceBook}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md cursor-pointer ${
                conflictResult.hasConflict && !forceBook
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95'
              }`}
            >
              Confirm Reservation
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
