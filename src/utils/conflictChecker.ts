import { ScheduleRow, ConflictCheckResult, ConflictDetail } from '../types/schedule';
import {
  minutesToReadable,
  overlapsLunchBreak,
  DEPT_START_MINUTES,
  DEPT_END_MINUTES,
  LUNCH_BREAK_LABEL,
  TRANSIT_BUFFER_MINUTES,
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
 * Checks if two intervals have an insufficient transit buffer (less than 5 min gap).
 */
export function hasTransitConflict(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
  bufferMinutes: number = TRANSIT_BUFFER_MINUTES
): { hasConflict: boolean; gap?: number; isBefore?: boolean } {
  // If intervals overlap, it's a direct overlap
  if (intervalsOverlap(start1, end1, start2, end2)) {
    return { hasConflict: true, gap: 0 };
  }

  // Interval 1 starts right after Interval 2 ends
  if (start1 >= end2 && start1 < end2 + bufferMinutes) {
    return { hasConflict: true, gap: start1 - end2, isBefore: false };
  }

  // Interval 1 ends right before Interval 2 starts
  if (end1 <= start2 && end1 > start2 - bufferMinutes) {
    return { hasConflict: true, gap: start2 - end1, isBefore: true };
  }

  return { hasConflict: false };
}

/**
 * Cross-verifies teacher, venue, and batch conflicts for a proposed booking.
 * Enforces mandatory 5-minute transit buffer between classes.
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
    const isDirectOverlap = intervalsOverlap(startMinutes, endMinutes, row.startMinutes, row.endMinutes);
    const transitCheck = hasTransitConflict(startMinutes, endMinutes, row.startMinutes, row.endMinutes);

    // Teacher check
    if (cleanTeacher && normalizeKey(row.teacherName) === cleanTeacher) {
      if (isDirectOverlap) {
        conflicts.push({
          type: 'teacher',
          entity: row.teacherName,
          conflictingRow: row,
          description: `Teacher ${row.teacherName} is already teaching ${row.courseSem} at ${row.venue} (${minutesToReadable(row.startMinutes)} - ${minutesToReadable(row.endMinutes)}).`,
        });
      } else if (transitCheck.hasConflict) {
        conflicts.push({
          type: 'teacher',
          entity: row.teacherName,
          conflictingRow: row,
          description: `Insufficient transit buffer for teacher ${row.teacherName}: ${transitCheck.isBefore ? 'next' : 'previous'} session at ${minutesToReadable(transitCheck.isBefore ? row.startMinutes : row.endMinutes)} leaves only ${transitCheck.gap}m gap (${TRANSIT_BUFFER_MINUTES}m required to reach classroom).`,
        });
      }
    }

    // Venue check
    if (cleanVenue && normalizeKey(row.venue) === cleanVenue) {
      if (isDirectOverlap) {
        conflicts.push({
          type: 'venue',
          entity: row.venue,
          conflictingRow: row,
          description: `Venue "${row.venue}" is already booked for ${row.courseSem} with ${row.teacherName} (${minutesToReadable(row.startMinutes)} - ${minutesToReadable(row.endMinutes)}).`,
        });
      } else if (transitCheck.hasConflict) {
        conflicts.push({
          type: 'venue',
          entity: row.venue,
          conflictingRow: row,
          description: `Insufficient venue buffer for "${row.venue}": ${transitCheck.isBefore ? 'next' : 'previous'} booking at ${minutesToReadable(transitCheck.isBefore ? row.startMinutes : row.endMinutes)} leaves only ${transitCheck.gap}m gap (${TRANSIT_BUFFER_MINUTES}m required for room handover).`,
        });
      }
    }

    // Batch check
    if (batchSet.has(normalizeKey(row.courseSem))) {
      if (isDirectOverlap) {
        conflicts.push({
          type: 'batch',
          entity: row.courseSem,
          conflictingRow: row,
          description: `Batch ${row.courseSem} already has an occupied lecture (${minutesToReadable(row.startMinutes)} - ${minutesToReadable(row.endMinutes)}) with ${row.teacherName}.`,
        });
      } else if (transitCheck.hasConflict) {
        conflicts.push({
          type: 'batch',
          entity: row.courseSem,
          conflictingRow: row,
          description: `Insufficient transit buffer for batch ${row.courseSem}: ${transitCheck.isBefore ? 'next' : 'previous'} class at ${minutesToReadable(transitCheck.isBefore ? row.startMinutes : row.endMinutes)} leaves only ${transitCheck.gap}m gap (${TRANSIT_BUFFER_MINUTES}m required to walk to classroom).`,
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
 * Returns whether a teacher is free during the slot on a given date (including transit buffer).
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
  return !schedule.some((row) => {
    if (row.date !== date || (excludeId && row.id === excludeId)) return false;
    if (normalizeKey(row.teacherName) !== clean) return false;
    return hasTransitConflict(startMinutes, endMinutes, row.startMinutes, row.endMinutes).hasConflict;
  });
}

/**
 * Returns whether a venue is free during the slot on a given date (including transit buffer).
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
  return !schedule.some((row) => {
    if (row.date !== date || (excludeId && row.id === excludeId)) return false;
    if (normalizeKey(row.venue) !== clean) return false;
    return hasTransitConflict(startMinutes, endMinutes, row.startMinutes, row.endMinutes).hasConflict;
  });
}

/**
 * Filter all teachers to find those who are completely free during a slot (with transit buffer).
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
    const conflict = schedule.find((row) => {
      if (row.date !== date || normalizeKey(row.teacherName) !== cleanTeacher) return false;
      return hasTransitConflict(startMinutes, endMinutes, row.startMinutes, row.endMinutes).hasConflict;
    });

    if (conflict) {
      const isDirect = intervalsOverlap(startMinutes, endMinutes, conflict.startMinutes, conflict.endMinutes);
      busy.push({
        teacher,
        reason: isDirect
          ? `Teaching ${conflict.courseSem} in ${conflict.venue}`
          : `Transit buffer needed (${minutesToReadable(conflict.startMinutes)} - ${minutesToReadable(conflict.endMinutes)})`,
      });
    } else {
      available.push(teacher);
    }
  }

  return { available, busy };
}

/**
 * Filter all venues to find those that are completely free during a slot (with transit buffer).
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
    const conflict = schedule.find((row) => {
      if (row.date !== date || normalizeKey(row.venue) !== cleanVenue) return false;
      return hasTransitConflict(startMinutes, endMinutes, row.startMinutes, row.endMinutes).hasConflict;
    });

    if (conflict) {
      const isDirect = intervalsOverlap(startMinutes, endMinutes, conflict.startMinutes, conflict.endMinutes);
      busy.push({
        venue,
        reason: isDirect
          ? `Occupied by ${conflict.courseSem}`
          : `Room buffer needed (${minutesToReadable(conflict.startMinutes)} - ${minutesToReadable(conflict.endMinutes)})`,
      });
    } else {
      available.push(venue);
    }
  }

  return { available, busy };
}
