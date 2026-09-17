import { ScheduleRow, ConflictCheckResult, ConflictDetail } from '../types/schedule';
import { minutesToReadable } from './timeUtils';

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

  const targetDateRows = schedule.filter(
    (row) => row.date === date && (!excludeId || row.id !== excludeId)
  );

  const cleanTeacher = teacherName.trim().toLowerCase();
  const cleanVenue = venue.trim().toLowerCase();
  const batchSet = new Set(courseSems.map((b) => b.trim().toLowerCase()));

  for (const row of targetDateRows) {
    if (intervalsOverlap(startMinutes, endMinutes, row.startMinutes, row.endMinutes)) {
      // 1. Teacher double-booking conflict
      if (cleanTeacher && row.teacherName.trim().toLowerCase() === cleanTeacher) {
        conflicts.push({
          type: 'teacher',
          entity: row.teacherName,
          conflictingRow: row,
          description: `Teacher ${row.teacherName} is already teaching ${row.courseSem} at ${row.venue} (${minutesToReadable(row.startMinutes)} - ${minutesToReadable(row.endMinutes)}).`,
        });
      }

      // 2. Venue double-booking conflict
      if (cleanVenue && row.venue.trim().toLowerCase() === cleanVenue) {
        conflicts.push({
          type: 'venue',
          entity: row.venue,
          conflictingRow: row,
          description: `Venue "${row.venue}" is already booked for ${row.courseSem} with ${row.teacherName} (${minutesToReadable(row.startMinutes)} - ${minutesToReadable(row.endMinutes)}).`,
        });
      }

      // 3. Batch conflict
      if (batchSet.has(row.courseSem.trim().toLowerCase())) {
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
  const clean = teacherName.trim().toLowerCase();
  return !schedule.some(
    (row) =>
      row.date === date &&
      (!excludeId || row.id !== excludeId) &&
      row.teacherName.trim().toLowerCase() === clean &&
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
  const clean = venue.trim().toLowerCase();
  return !schedule.some(
    (row) =>
      row.date === date &&
      (!excludeId || row.id !== excludeId) &&
      row.venue.trim().toLowerCase() === clean &&
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
    const conflict = schedule.find(
      (row) =>
        row.date === date &&
        row.teacherName.trim().toLowerCase() === teacher.trim().toLowerCase() &&
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
    const conflict = schedule.find(
      (row) =>
        row.date === date &&
        row.venue.trim().toLowerCase() === venue.trim().toLowerCase() &&
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
