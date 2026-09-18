import { ScheduleRow, ConflictCheckResult, ConflictDetail } from '../types/schedule';
import {
  minutesToReadable,
  overlapsLunchBreak,
  DEPT_START_MINUTES,
  DEPT_END_MINUTES,
  LUNCH_BREAK_LABEL,
} from './timeUtils';

function normalizeKey(str: string): string {
  return (str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks if two intervals [s1, e1] and [s2, e2] overlap.
 * Strictly overlapping if max(s1, s2) < min(e1, e2).
 */
export function intervalsOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return Math.max(start1, start2) < Math.min(end1, end2);
}

/**
 * Cross-verifies teacher, venue, and batch conflicts for a proposed booking.
 * Excludes an optional rowId if updating an existing entry.
 */
export function checkBookingConflicts(
  schedule: ScheduleRow[],
  proposed: {
    date: string;
    startMinutes: number;
    endMinutes: number;
    teacherName: string;
    venue: string;
    courseSems: string[];
    excludeId?: string;
  }
): ConflictCheckResult {
  const conflicts: ConflictDetail[] = [];
  const { date, startMinutes, endMinutes, teacherName, venue, courseSems, excludeId } = proposed;

  // 1. Duration Validity Check
  if (endMinutes <= startMinutes) {
    conflicts.push({
      type: 'batch',
      entity: 'Invalid Time Window',
      description: 'End time must be strictly after start time.',
    });
  } else if (endMinutes - startMinutes < 30) {
    conflicts.push({
      type: 'batch',
      entity: 'Duration Too Short',
      description: 'Minimum session duration must be at least 30 minutes.',
    });
  }

  // 2. Department Operating Hours Check (08:00 AM – 05:00 PM)
  if (startMinutes < DEPT_START_MINUTES || endMinutes > DEPT_END_MINUTES) {
    conflicts.push({
      type: 'batch',
      entity: 'Department Operating Hours',
      description: `Class window (${minutesToReadable(startMinutes)} - ${minutesToReadable(endMinutes)}) is outside operating hours (${minutesToReadable(DEPT_START_MINUTES)} to ${minutesToReadable(DEPT_END_MINUTES)}).`,
    });
  }

  // 3. Department Lunch Break Check (10:30 AM – 11:45 AM)
  if (overlapsLunchBreak(startMinutes, endMinutes)) {
    conflicts.push({
      type: 'batch',
      entity: 'Department Lunch Break',
      description: `Cannot schedule classes during mandatory Department Lunch Break (${LUNCH_BREAK_LABEL}).`,
    });
  }

  const targetDateRows = schedule.filter(
    (row) => row.date === date && (!excludeId || row.id !== excludeId)
  );

  const cleanTeacher = normalizeKey(teacherName);
  const cleanVenue = normalizeKey(venue);
  const batchSet = new Set(courseSems.map(normalizeKey));

  for (const row of targetDateRows) {
    if (intervalsOverlap(startMinutes, endMinutes, row.startMinutes, row.endMinutes)) {
      // Teacher double-booking conflict
      if (cleanTeacher && normalizeKey(row.teacherName) === cleanTeacher) {
        conflicts.push({
          type: 'teacher',
          entity: row.teacherName,
          conflictingRow: row,
          description: `Teacher ${row.teacherName} is already teaching ${row.courseSem} at ${row.venue} (${minutesToReadable(row.startMinutes)} - ${minutesToReadable(row.endMinutes)}).`,
        });
      }

      // Venue double-booking conflict
      if (cleanVenue && normalizeKey(row.venue) === cleanVenue) {
        conflicts.push({
          type: 'venue',
          entity: row.venue,
          conflictingRow: row,
          description: `Venue "${row.venue}" is already booked for ${row.courseSem} with ${row.teacherName} (${minutesToReadable(row.startMinutes)} - ${minutesToReadable(row.endMinutes)}).`,
        });
      }

      // Batch conflict
      if (batchSet.has(normalizeKey(row.courseSem))) {
        conflicts.push({
          type: 'batch',
          entity: row.courseSem,
          conflictingRow: row,
          description: `Batch ${row.courseSem} already has an occupied lecture (${minutesToReadable(row.startMinutes)} - ${minutesToReadable(row.endMinutes)}) with ${row.teacherName}.`,
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Returns whether a teacher is free during the slot on a given date.
 */
export function isTeacherFree(
  schedule: ScheduleRow[],
  teacherName: string,
  date: string,
  startMinutes: number,
  endMinutes: number,
  excludeId?: string
): boolean {
  if (!teacherName) return true;
  const clean = normalizeKey(teacherName);
  return !schedule.some(
    (row) =>
      row.date === date &&
      (!excludeId || row.id !== excludeId) &&
      normalizeKey(row.teacherName) === clean &&
      intervalsOverlap(startMinutes, endMinutes, row.startMinutes, row.endMinutes)
  );
}

/**
 * Returns whether a venue is free during the slot on a given date.
 */
export function isVenueFree(
  schedule: ScheduleRow[],
  venue: string,
  date: string,
  startMinutes: number,
  endMinutes: number,
  excludeId?: string
): boolean {
  if (!venue) return true;
  const clean = normalizeKey(venue);
  return !schedule.some(
    (row) =>
      row.date === date &&
      (!excludeId || row.id !== excludeId) &&
      normalizeKey(row.venue) === clean &&
      intervalsOverlap(startMinutes, endMinutes, row.startMinutes, row.endMinutes)
  );
}

/**
 * Filter all teachers to find those who are completely free during a slot.
 */
export function getAvailableTeachers(
  schedule: ScheduleRow[],
  allTeachers: string[],
  date: string,
  startMinutes: number,
  endMinutes: number
): { available: string[]; busy: { teacher: string; reason: string }[] } {
  const available: string[] = [];
  const busy: { teacher: string; reason: string }[] = [];

  for (const teacher of allTeachers) {
    const cleanTeacher = normalizeKey(teacher);
    const conflict = schedule.find(
      (row) =>
        row.date === date &&
        normalizeKey(row.teacherName) === cleanTeacher &&
        intervalsOverlap(startMinutes, endMinutes, row.startMinutes, row.endMinutes)
    );

    if (conflict) {
      busy.push({
        teacher,
        reason: `Teaching ${conflict.courseSem} in ${conflict.venue}`,
      });
    } else {
      available.push(teacher);
    }
  }

  return { available, busy };
}

/**
 * Filter all venues to find those that are completely free during a slot.
 */
export function getAvailableVenues(
  schedule: ScheduleRow[],
  allVenues: string[],
  date: string,
  startMinutes: number,
  endMinutes: number
): { available: string[]; busy: { venue: string; reason: string }[] } {
  const available: string[] = [];
  const busy: { venue: string; reason: string }[] = [];

  for (const venue of allVenues) {
    const cleanVenue = normalizeKey(venue);
    const conflict = schedule.find(
      (row) =>
        row.date === date &&
        normalizeKey(row.venue) === cleanVenue &&
        intervalsOverlap(startMinutes, endMinutes, row.startMinutes, row.endMinutes)
    );

    if (conflict) {
      busy.push({
        venue,
        reason: `Occupied by ${conflict.courseSem}`,
      });
    } else {
      available.push(venue);
    }
  }

  return { available, busy };
}
