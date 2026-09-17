import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScheduleRow, FreeSlot } from '../types/schedule';
import { minutesToReadable } from './timeUtils';

/**
 * Export current schedule rows to a formatted CSV including Subject.
 */
export function exportScheduleToCSV(schedule: ScheduleRow[], filename?: string): void {
  // Sort rows chronologically by date and startMinutes
  const sorted = [...schedule].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startMinutes - b.startMinutes;
  });

  const exportData = sorted.map((row) => ({
    Date: row.date,
    Time: row.time,
    CourseSem: row.courseSem,
    Subject: row.subject || 'Computer Science Lecture',
    'Teacher Name': row.teacherName,
    Venue: row.venue,
  }));

  const csvContent = Papa.unparse(exportData, {
    quotes: false,
    header: true,
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `SlotSync_CS_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export identified free slots to CSV.
 */
export function exportFreeSlotsToCSV(freeSlots: FreeSlot[], targetDate: string): void {
  const exportData = freeSlots.map((slot, index) => ({
    'Slot #': index + 1,
    Date: slot.date,
    'Time Range': slot.formattedRange,
    'Start Time': slot.startTime,
    'End Time': slot.endTime,
    'Duration (Minutes)': slot.durationMinutes,
    'Duration': slot.durationFormatted,
    'Applicable Batches': slot.applicableBatches.join('; '),
  }));

  const csvContent = Papa.unparse(exportData, { quotes: true, header: true });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SlotSync_CS_FreeSlots_${targetDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an executive departmental timetable and slot allocation PDF.
 */
export function exportScheduleToPDF(
  schedule: ScheduleRow[],
  targetDate: string,
  selectedBatches: string[],
  freeSlots: FreeSlot[] = []
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  let relevantRows = schedule.filter((r) => r.date === targetDate);
  if (selectedBatches.length > 0) {
    const bSet = new Set(selectedBatches);
    relevantRows = relevantRows.filter((r) => bSet.has(r.courseSem));
  }

  relevantRows.sort((a, b) => a.startMinutes - b.startMinutes);

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const accentColor: [number, number, number] = [16, 185, 129]; // Emerald-500
  const headerBg: [number, number, number] = [30, 41, 59]; // Slate-800

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING', 14, 11);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('SlotSync CS — Automated Class Schedule & Free-Slot Allocation Report', 14, 18);

  // Status Badge
  doc.setFillColor(...accentColor);
  doc.roundedRect(230, 6, 53, 12, 2, 2, 'F');
  doc.setTextColor(6, 8, 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CONFLICT VERIFIED', 234, 13.5);

  // 2. Metadata Section
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Schedule Date: `, 14, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(`${targetDate}`, 44, 32);

  doc.setFont('helvetica', 'bold');
  doc.text(`Selected Batches: `, 14, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(
    selectedBatches.length > 0 ? selectedBatches.join(', ') : 'All Batches',
    48,
    38
  );

  doc.setFont('helvetica', 'bold');
  doc.text(`Operating Window: `, 170, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(`08:00 AM – 05:00 PM (9 Hours)`, 205, 32);

  doc.setFont('helvetica', 'bold');
  doc.text(`Generated: `, 170, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleString(), 193, 38);

  // 3. Main Schedule Table with Subject Column
  const tableData = relevantRows.map((row, idx) => [
    (idx + 1).toString(),
    row.time,
    row.courseSem,
    row.subject || 'CS Lecture',
    row.sessionTitle || 'Regular Lecture',
    row.teacherName,
    row.venue,
    `${formatDuration(row.endMinutes - row.startMinutes)}`,
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Time Window', 'Course / Batch', 'Subject', 'Session Title / Topic', 'Faculty In-Charge', 'Venue / Hall', 'Duration']],
    body: tableData.length > 0 ? tableData : [['-', 'No scheduled lectures found for this criteria', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: headerBg,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // 4. Free Slots Section
  // @ts-expect-error autoTable adds lastAutoTable to doc
  const currentY = (doc.lastAutoTable?.finalY || 120) + 8;

  if (freeSlots.length > 0) {
    let freeStartY = currentY;
    if (freeStartY > 150) {
      doc.addPage();
      freeStartY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 171, 107);
    doc.text(`Available Conflict-Free Slots (${freeSlots.length} Identified):`, 14, freeStartY);

    const freeSlotsTableData = freeSlots.map((slot, i) => [
      `Slot ${i + 1}`,
      slot.formattedRange,
      slot.durationFormatted,
      slot.applicableBatches.join(', '),
      'Available for Extra Classes / Guest Lectures / Examinations',
    ]);

    autoTable(doc, {
      startY: freeStartY + 4,
      head: [['Slot ID', 'Available Time Interval', 'Duration', 'Free For Batches', 'Recommended Usage']],
      body: freeSlotsTableData,
      theme: 'plain',
      headStyles: {
        fillColor: [220, 252, 231],
        textColor: [6, 78, 59],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [15, 23, 42],
      },
      margin: { left: 14, right: 14 },
    });
  }

  // 5. Department Footer & Signature Block
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SlotSync CS Engine • Computer Science Department Timetable Automation • Page ${i} of ${pageCount}`,
      14,
      202
    );

    doc.text('Head of Department / Timetable In-Charge Signature: _______________________', 160, 202);
  }

  doc.save(`SlotSync_CS_Timetable_${targetDate}.pdf`);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
