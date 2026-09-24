import {
  ScheduleRow,
  TimeInterval,
  FreeSlot,
} from '../types/schedule';
import {
  DEPT_START_MINUTES,
  DEPT_END_MINUTES,
  LUNCH_BREAK_START_MINUTES,
  LUNCH_BREAK_END_MINUTES,
  minutesToHHMM,
  minutesToReadable,
  formatTimeRangeToCSV,
  formatDuration,
} from './timeUtils';

/**
 * Merges a list of overlapping or adjacent intervals within [startLimit, endLimit].
 */
export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];

  // Sort by start time, then by end time
  const sorted = [...intervals].sort((a, b) => a.startMinutes - b.startMinutes);
  const merged: TimeInterval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = merged[merged.length - 1];

    if (current.startMinutes <= prev.endMinutes) {
      // Overlapping or adjacent
      prev.endMinutes = Math.max(prev.endMinutes, current.endMinutes);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

/**
 * Inverts an array of occupied intervals within [DEPT_START_MINUTES, DEPT_END_MINUTES]
 * to find the free intervals.
 */
export function invertOccupiedBlocks(
  occupied: TimeInterval[],
  windowStart: number = DEPT_START_MINUTES,
  windowEnd: number = DEPT_END_MINUTES
): TimeInterval[] {
  // Clamp occupied intervals within window
  const clampedOccupied: TimeInterval[] = [];
  for (const block of occupied) {
    const start = Math.max(windowStart, block.startMinutes);
    const end = Math.min(windowEnd, block.endMinutes);
    if (end > start) {
      clampedOccupied.push({ startMinutes: start, endMinutes: end });
    }
  }

  const merged = mergeIntervals(clampedOccupied);
  const freeIntervals: TimeInterval[] = [];

  let currentPointer = windowStart;

  for (const occ of merged) {
    if (occ.startMinutes > currentPointer) {
      freeIntervals.push({
        startMinutes: currentPointer,
        endMinutes: occ.startMinutes,
      });
    }
    currentPointer = Math.max(currentPointer, occ.endMinutes);
  }

  if (currentPointer < windowEnd) {
    freeIntervals.push({
      startMinutes: currentPointer,
      endMinutes: windowEnd,
    });
  }

  return freeIntervals;
}

/**
 * Find available free slots for a single or multiple batches on a target date.
 * If multiple batches are provided, this computes the JOINT common free slots
 * where ALL selected batches are simultaneously free.
 */
export function findFreeSlots(
  schedule: ScheduleRow[],
  targetDate: string,
  selectedBatches: string[],
  minDurationMinutes: number = 60
): FreeSlot[] {
  if (!targetDate || selectedBatches.length === 0) {
    return [];
  }

  // Filter schedule rows matching date and ANY of the selected batches
  const batchSet = new Set(selectedBatches);
  const relevantRows = schedule.filter(
    (row) => row.date === targetDate && batchSet.has(row.courseSem)
  );

  // Extract occupied time intervals across these batches
  const occupiedIntervals: TimeInterval[] = relevantRows.map((row) => ({
    startMinutes: row.startMinutes,
    endMinutes: row.endMinutes,
  }));

  // Mandatory Department Lunch Break (10:30 AM – 11:45 AM)
  occupiedIntervals.push({
    startMinutes: LUNCH_BREAK_START_MINUTES,
    endMinutes: LUNCH_BREAK_END_MINUTES,
  });

  // Invert the occupied blocks
  const freeIntervals = invertOccupiedBlocks(occupiedIntervals);

  // Filter intervals that satisfy minDurationMinutes and convert to FreeSlot objects
  const freeSlots: FreeSlot[] = freeIntervals
    .filter((interval) => interval.endMinutes - interval.startMinutes >= minDurationMinutes)
    .map((interval, index) => {
      const duration = interval.endMinutes - interval.startMinutes;
      return {
        id: `free-${targetDate}-${interval.startMinutes}-${interval.endMinutes}-${index}`,
        date: targetDate,
        startMinutes: interval.startMinutes,
        endMinutes: interval.endMinutes,
        startTime: minutesToReadable(interval.startMinutes),
        endTime: minutesToReadable(interval.endMinutes),
        formattedRange: formatTimeRangeToCSV(interval.startMinutes, interval.endMinutes),
        durationMinutes: duration,
        durationFormatted: formatDuration(duration),
        applicableBatches: selectedBatches,
      };
    });

  return freeSlots;
}

/**
 * Calculate per-batch schedule and free slots breakdown.
 * Useful for side-by-side Gantt view.
 */
export function getBatchBreakdown(
  schedule: ScheduleRow[],
  targetDate: string,
  batches: string[],
  minDurationMinutes: number = 0
): Record<string, { occupied: ScheduleRow[]; freeSlots: FreeSlot[] }> {
  const result: Record<string, { occupied: ScheduleRow[]; freeSlots: FreeSlot[] }> = {};

  for (const batch of batches) {
    const occupied = schedule
      .filter((row) => row.date === targetDate && row.courseSem === batch)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    const occupiedIntervals = occupied.map((r) => ({
      startMinutes: r.startMinutes,
      endMinutes: r.endMinutes,
    }));

    // Mandatory Department Lunch Break (10:30 AM – 11:45 AM)
    occupiedIntervals.push({
      startMinutes: LUNCH_BREAK_START_MINUTES,
      endMinutes: LUNCH_BREAK_END_MINUTES,
    });

    const freeIntervals = invertOccupiedBlocks(occupiedIntervals);
    const freeSlots: FreeSlot[] = freeIntervals
      .filter((interval) => interval.endMinutes - interval.startMinutes >= minDurationMinutes)
      .map((interval, index) => {
        const duration = interval.endMinutes - interval.startMinutes;
        return {
          id: `batch-${batch}-${interval.startMinutes}-${interval.endMinutes}-${index}`,
          date: targetDate,
          startMinutes: interval.startMinutes,
          endMinutes: interval.endMinutes,
          startTime: minutesToReadable(interval.startMinutes),
          endTime: minutesToReadable(interval.endMinutes),
          formattedRange: formatTimeRangeToCSV(interval.startMinutes, interval.endMinutes),
          durationMinutes: duration,
          durationFormatted: formatDuration(duration),
          applicableBatches: [batch],
        };
      });

    result[batch] = { occupied, freeSlots };
  }

  return result;
}

/**
 * Extract distinct values for filters
 */
export function getDistinctDates(schedule: ScheduleRow[]): string[] {
  const dates = Array.from(new Set(schedule.map((r) => r.date)));
  // Sort dates (DD-MM-YYYY)
  return dates.sort((a, b) => {
    const [d1, m1, y1] = a.split('-').map(Number);
    const [d2, m2, y2] = b.split('-').map(Number);
    const date1 = new Date(y1, m1 - 1, d1).getTime();
    const date2 = new Date(y2, m2 - 1, d2).getTime();
    return date1 - date2;
  });
}

export function getDistinctBatches(schedule: ScheduleRow[]): string[] {
  return Array.from(new Set(schedule.map((r) => r.courseSem))).sort();
}

export function getDistinctTeachers(schedule: ScheduleRow[]): string[] {
  return Array.from(new Set(schedule.map((r) => r.teacherName))).filter(Boolean).sort();
}

export function getDistinctVenues(schedule: ScheduleRow[]): string[] {
  return Array.from(new Set(schedule.map((r) => r.venue))).filter(Boolean).sort();
}

export function getDistinctSubjects(schedule: ScheduleRow[]): string[] {
  return Array.from(new Set(schedule.map((r) => r.subject))).filter(Boolean).sort();
}
