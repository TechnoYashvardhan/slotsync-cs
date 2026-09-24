import Papa from 'papaparse';
import { ScheduleRow, ValidationIssue } from '../types/schedule';
import { isValidDateDDMMYYYY, parseTimeRange, minutesToReadable, overlapsLunchBreak, LUNCH_BREAK_LABEL } from './timeUtils';
import { DEFAULT_MOCK_CSV } from '../data/mockData';

export interface CSVParseResult {
  rows: ScheduleRow[];
  errors: ValidationIssue[];
  totalParsed: number;
}

const REQUIRED_HEADERS = ['Date', 'Time', 'CourseSem', 'Teacher Name', 'Venue'];

export function parseScheduleCSV(csvText: string): CSVParseResult {
  const parseResult = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  const errors: ValidationIssue[] = [];
  const rows: ScheduleRow[] = [];

  // Check header existence
  const headers = parseResult.meta.fields || [];
  const missingHeaders = REQUIRED_HEADERS.filter(
    (req) => !headers.some((h) => h.toLowerCase() === req.toLowerCase())
  );

  if (missingHeaders.length > 0) {
    errors.push({
      rowNumber: 0,
      field: 'Header',
      message: `Missing required column headers: ${missingHeaders.join(', ')}. Expected: Date, Time, CourseSem, Teacher Name, Venue (Subject optional)`,
    });
    return { rows: [], errors, totalParsed: 0 };
  }

  // Find actual key mappings (case-insensitive)
  const headerMap: Record<string, string> = {};
  for (const req of REQUIRED_HEADERS) {
    const found = headers.find((h) => h.toLowerCase() === req.toLowerCase());
    if (found) headerMap[req] = found;
  }

  // Check for optional Subject header
  const subjectHeader = headers.find((h) =>
    ['subject', 'course', 'course title', 'paper'].includes(h.toLowerCase())
  );

  parseResult.data.forEach((rawRow, index) => {
    const rowNum = index + 2; // Row 1 is header
    const dateVal = (rawRow[headerMap['Date']] || '').trim();
    const timeVal = (rawRow[headerMap['Time']] || '').trim();
    const courseSemVal = (rawRow[headerMap['CourseSem']] || '').trim().replace(/\s+/g, ' ');
    const subjectVal = (subjectHeader ? (rawRow[subjectHeader] || '').trim() : 'Core CS Lecture').replace(/\s+/g, ' ');
    const teacherVal = (rawRow[headerMap['Teacher Name']] || '').trim().replace(/\s+/g, ' ');
    const venueVal = (rawRow[headerMap['Venue']] || '').trim().replace(/\s+/g, ' ');

    let rowHasError = false;

    // Validate Date
    if (!dateVal) {
      errors.push({ rowNumber: rowNum, field: 'Date', message: 'Date is required.' });
      rowHasError = true;
    } else if (!isValidDateDDMMYYYY(dateVal)) {
      errors.push({
        rowNumber: rowNum,
        field: 'Date',
        message: `Invalid Date format "${dateVal}". Must be DD-MM-YYYY (e.g., 22-09-2026).`,
        rawValue: dateVal,
      });
      rowHasError = true;
    }

    // Validate CourseSem Batch
    if (!courseSemVal) {
      errors.push({ rowNumber: rowNum, field: 'CourseSem', message: 'Course/Semester batch is required.' });
      rowHasError = true;
    }

    // Validate Time
    if (!timeVal) {
      errors.push({ rowNumber: rowNum, field: 'Time', message: 'Time range is required.' });
      rowHasError = true;
    } else {
      const parsedTime = parseTimeRange(timeVal);
      if (!parsedTime) {
        errors.push({
          rowNumber: rowNum,
          field: 'Time',
          message: `Invalid Time format "${timeVal}". Must be "HH:MM AM to HH:MM PM" (e.g., 08:00 AM to 09:30 AM).`,
          rawValue: timeVal,
        });
        rowHasError = true;
      } else if (overlapsLunchBreak(parsedTime.startMinutes, parsedTime.endMinutes)) {
        errors.push({
          rowNumber: rowNum,
          field: 'Time',
          message: `Time range "${timeVal}" overlaps mandatory Department Lunch Break (${LUNCH_BREAK_LABEL}). No classes can be scheduled during lunch break.`,
          rawValue: timeVal,
        });
        rowHasError = true;
      } else if (!rowHasError) {
        // Normalize time string with colons
        const normalizedTime = `${minutesToReadable(parsedTime.startMinutes)} to ${minutesToReadable(parsedTime.endMinutes)}`;

        rows.push({
          id: `row-${rowNum}-${dateVal}-${courseSemVal}-${parsedTime.startMinutes}`,
          date: dateVal,
          time: normalizedTime,
          courseSem: courseSemVal,
          subject: subjectVal || 'Computer Science Lecture',
          teacherName: teacherVal || 'TBD',
          venue: venueVal || 'TBD',
          startMinutes: parsedTime.startMinutes,
          endMinutes: parsedTime.endMinutes,
        });
      }
    }
  });

  return {
    rows,
    errors,
    totalParsed: parseResult.data.length,
  };
}

export function generateSampleCSVString(): string {
  return DEFAULT_MOCK_CSV;
}
