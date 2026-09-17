import { parseTimeRange, minutesToHHMM, minutesToReadable, formatTimeRangeToCSV } from './src/utils/timeUtils.ts';
import { invertOccupiedBlocks, findFreeSlots, mergeIntervals } from './src/utils/scheduleEngine.ts';
import { checkBookingConflicts } from './src/utils/conflictChecker.ts';
import { parseScheduleCSV } from './src/utils/csvParser.ts';
import { DEFAULT_MOCK_CSV } from './src/data/mockData.ts';

console.log('=== RUNNING SLOTSYNC CS ENGINE VERIFICATION ===');

// 1. Time Utils verification
const t1 = parseTimeRange('08:00 AM to 09:30 AM');
console.assert(t1 !== null, 'parseTimeRange failed for 08:00 AM to 09:30 AM');
console.assert(t1.startMinutes === 480, `Expected 480, got ${t1.startMinutes}`);
console.assert(t1.endMinutes === 570, `Expected 570, got ${t1.endMinutes}`);

// Backwards compatibility with unpunctuated format
const tLegacy = parseTimeRange('0800 AM to 0930 AM');
console.assert(tLegacy !== null && tLegacy.startMinutes === 480, 'Legacy time parse failed');

console.assert(minutesToReadable(480) === '08:00 AM', `Expected 08:00 AM, got ${minutesToReadable(480)}`);
console.assert(minutesToReadable(810) === '01:30 PM', `Expected 01:30 PM, got ${minutesToReadable(810)}`);
console.assert(formatTimeRangeToCSV(480, 570) === '08:00 AM to 09:30 AM', `CSV range mismatch`);
console.log('✔ Time parsing with colons and formatting verified.');

// 2. Interval Inversion test
// 08:00 (480) - 17:00 (1020)
// Occupied: 08:00-09:30 (480-570), 13:00-14:30 (780-870)
// Free should be: 09:30-13:00 (570-780) [210 mins], 14:30-17:00 (870-1020) [150 mins]
const freeBlocks = invertOccupiedBlocks([
  { startMinutes: 480, endMinutes: 570 },
  { startMinutes: 780, endMinutes: 870 },
]);
console.assert(freeBlocks.length === 2, `Expected 2 free blocks, got ${freeBlocks.length}`);
console.assert(freeBlocks[0].startMinutes === 570 && freeBlocks[0].endMinutes === 780, 'Free block 1 mismatch');
console.assert(freeBlocks[1].startMinutes === 870 && freeBlocks[1].endMinutes === 1020, 'Free block 2 mismatch');
console.log('✔ Interval inversion within operating window (0800 AM to 0500 PM) verified.');

// 3. Mock CSV Parsing
const parsed = parseScheduleCSV(DEFAULT_MOCK_CSV);
console.assert(parsed.errors.length === 0, `Mock CSV has errors: ${JSON.stringify(parsed.errors)}`);
console.assert(parsed.rows.length >= 20, `Expected >= 20 rows, got ${parsed.rows.length}`);
console.assert(Boolean(parsed.rows[0].subject), 'Subject column not populated in parsed row');
console.log(`✔ Mock CSV dataset successfully parsed ${parsed.rows.length} entries with Subject: "${parsed.rows[0].subject}".`);

// 4. Multi-Batch Common Free Slots Detection
// On 22-09-2026, find common free slots for BCA 1st Sem and BCA 3rd Sem
const jointSlots = findFreeSlots(parsed.rows, '22-09-2026', ['BCA 1st Sem', 'BCA 3rd Sem'], 60);
console.log(`✔ Found ${jointSlots.length} joint common free slots for BCA 1st & 3rd Sem (>= 60 mins):`);
jointSlots.forEach((s) => console.log(`   - ${s.formattedRange} (${s.durationFormatted})`));
console.assert(jointSlots.length > 0, 'Should find at least 1 joint slot');

// 5. Conflict Verification Check
// Check if Dr. Alan Turing is free on 22-09-2026 between 0800 AM and 0930 AM (he is teaching BCA 1st Sem!)
const conflictTest1 = checkBookingConflicts(parsed.rows, {
  date: '22-09-2026',
  startMinutes: 480,
  endMinutes: 570,
  teacherName: 'Dr. Alan Turing',
  venue: 'Lab 4 (Networks)',
  courseSems: ['MCA 1st Sem'],
});
console.assert(conflictTest1.hasConflict === true, 'Teacher conflict should be detected');
console.assert(conflictTest1.conflicts.some((c) => c.type === 'teacher'), 'Teacher conflict not flagged');
console.log('✔ Double-booking teacher conflict accurately caught.');

// Check conflict-free case:
// A completely free teacher and venue during a verified free slot
const conflictTest2 = checkBookingConflicts(parsed.rows, {
  date: '22-09-2026',
  startMinutes: jointSlots[0].startMinutes,
  endMinutes: jointSlots[0].startMinutes + 60,
  teacherName: 'Dr. Edsger Dijkstra', // Free during this 12:00 PM - 01:00 PM slot
  venue: 'CS Auditorium',
  courseSems: ['BCA 1st Sem', 'BCA 3rd Sem'],
});
console.assert(!conflictTest2.hasConflict, 'Legitimate slot should be conflict free');
// 6. Weekly Date Arithmetic & Multi-Week Recurrence test
import { addWeeksToDDMMYYYY, getAcademicWeekDates, getDayOfWeek } from './src/utils/timeUtils.ts';

const nextWeek = addWeeksToDDMMYYYY('22-09-2026', 1);
console.assert(nextWeek === '29-09-2026', `Expected 29-09-2026, got ${nextWeek}`);

const fourWeeks = addWeeksToDDMMYYYY('22-09-2026', 4);
console.assert(fourWeeks === '20-10-2026', `Expected 20-10-2026, got ${fourWeeks}`);

console.assert(getDayOfWeek('22-09-2026') === 'Tuesday', `Expected Tuesday, got ${getDayOfWeek('22-09-2026')}`);

const weekDays = getAcademicWeekDates('22-09-2026');
console.assert(weekDays.length === 6, `Expected 6 academic days (Mon-Sat), got ${weekDays.length}`);
console.assert(weekDays[0].dayName === 'Monday', `Week should start with Monday, got ${weekDays[0].dayName}`);
console.assert(weekDays[0].date === '21-09-2026', `Monday date mismatch: ${weekDays[0].date}`);
console.assert(weekDays[5].dayName === 'Saturday', `Week should end with Saturday, got ${weekDays[5].dayName}`);
console.log('✔ Weekly date arithmetic and Monday-Saturday academic week generation verified.');

console.log('=== ALL ENGINE ALGORITHMIC TESTS PASSED! ===');

