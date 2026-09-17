export interface RawCSVRow {
  Date: string;
  Time: string;
  CourseSem: string;
  Subject?: string;
  'Teacher Name': string;
  Venue: string;
}

export interface ScheduleRow {
  id: string;
  date: string; // DD-MM-YYYY
  time: string; // HH:MM AM to HH:MM PM (with colon)
  courseSem: string;
  subject: string; // Course Subject name (e.g. Data Structures, Operating Systems)
  teacherName: string;
  venue: string;
  startMinutes: number; // minutes from midnight (08:00 AM = 480)
  endMinutes: number;   // minutes from midnight (05:00 PM = 1020)
  sessionType?: string;
  sessionTitle?: string;
}

export interface TimeInterval {
  startMinutes: number;
  endMinutes: number;
}

export interface FreeSlot {
  id: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  startTime: string; // e.g., "11:00 AM" (with colon)
  endTime: string;   // e.g., "01:00 PM" (with colon)
  formattedRange: string; // "11:00 AM to 01:00 PM"
  durationMinutes: number;
  durationFormatted: string; // e.g. "2h 00m" or "1 hr"
  applicableBatches: string[];
}

export interface BookingFormData {
  subject: string;
  sessionTitle: string;
  sessionType: 'Guest Lecture' | 'Extra Class' | 'Lab Exam' | 'Seminar / Workshop' | 'Placement Drive' | 'Faculty Meeting';
  date: string;
  startTime: string; // HH:MM AM
  endTime: string;   // HH:MM PM
  courseSems: string[];
  teacherName: string;
  venue: string;
}

export interface ConflictDetail {
  type: 'teacher' | 'venue' | 'batch';
  entity: string;
  conflictingRow: ScheduleRow;
  description: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: ConflictDetail[];
}

export interface FilterState {
  targetDate: string; // DD-MM-YYYY
  targetBatches: string[];
  requestedDurationMinutes: number; // e.g. 60, 90, 120
  filterTeacher?: string;
  filterVenue?: string;
}

export interface ValidationIssue {
  rowNumber: number;
  field: string;
  message: string;
  rawValue?: string;
}
