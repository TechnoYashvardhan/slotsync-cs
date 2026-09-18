import Papa from 'papaparse';
import { ScheduleRow, ValidationIssue } from '../types/schedule';
import { isValidDateDDMMYYYY, parseTimeRange, minutesToReadable, overlapsLunchBreak, LUNCH_BREAK_LABEL } from './timeUtils';

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
    const courseSemVal = (rawRow[headerMap['CourseSem']] || '').trim();
    const subjectVal = subjectHeader ? (rawRow[subjectHeader] || '').trim() : 'Core CS Lecture';
    const teacherVal = (rawRow[headerMap['Teacher Name']] || '').trim();
    const venueVal = (rawRow[headerMap['Venue']] || '').trim();

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
  return `Date,Time,CourseSem,Subject,Teacher Name,Venue
21-09-2026,08:30 AM to 10:00 AM,BCA 1st Sem,Programming in C,Dr. Alan Turing,Classroom 301
21-09-2026,11:45 AM to 01:15 PM,BCA 3rd Sem,Data Structures & Algorithms,Prof. Ada Lovelace,Lab 2 (Data Structures)
21-09-2026,01:30 PM to 03:00 PM,MCA 1st Sem,Advanced Operating Systems,Dr. Barbara Liskov,Seminar Hall A
21-09-2026,03:15 PM to 04:45 PM,B.Tech CS 3rd Sem,Computer Organization,Prof. Donald Knuth,Classroom 302
21-09-2026,09:00 AM to 10:30 AM,B.Tech CS 5th Sem,Artificial Intelligence & ML,Prof. Ada Lovelace,Seminar Hall A
22-09-2026,08:00 AM to 09:30 AM,BCA 1st Sem,Programming in C,Dr. Alan Turing,Classroom 301
22-09-2026,11:45 AM to 01:15 PM,BCA 1st Sem,Computer Architecture & Hardware,Prof. Grace Hopper,Lab 1 (Programming)
22-09-2026,01:30 PM to 03:00 PM,BCA 1st Sem,Discrete Mathematics,Dr. John von Neumann,Classroom 301
22-09-2026,08:30 AM to 10:00 AM,BCA 3rd Sem,Data Structures & Algorithms,Prof. Ada Lovelace,Classroom 303
22-09-2026,11:45 AM to 01:15 PM,BCA 3rd Sem,Object-Oriented Programming (Java),Dr. Claude Shannon,Lab 2 (Data Structures)
22-09-2026,09:00 AM to 10:30 AM,MCA 1st Sem,Advanced Operating Systems,Dr. Barbara Liskov,Seminar Hall A
22-09-2026,11:45 AM to 01:15 PM,MCA 1st Sem,Distributed Systems & Cloud,Prof. Linus Torvalds,Lab 3 (Systems & OS)
22-09-2026,08:00 AM to 10:00 AM,B.Tech CS 3rd Sem,Design & Analysis of Algorithms,Dr. Edsger Dijkstra,Lab 4 (Networks)
22-09-2026,11:45 AM to 01:15 PM,B.Tech CS 3rd Sem,Computer Organization,Prof. Donald Knuth,Classroom 302
22-09-2026,08:30 AM to 10:00 AM,B.Tech CS 5th Sem,Theory of Computation & Automata,Dr. John von Neumann,Classroom 304
22-09-2026,11:45 AM to 01:15 PM,B.Tech CS 5th Sem,Artificial Intelligence & ML,Prof. Ada Lovelace,Seminar Hall A`;
}
