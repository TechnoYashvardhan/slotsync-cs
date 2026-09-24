import React, { useState, useEffect, useMemo } from 'react';
import type { ScheduleRow } from './types/schedule';
import { DEFAULT_MOCK_CSV, KNOWN_TEACHERS, KNOWN_VENUES } from './data/mockData';
import { parseScheduleCSV, generateSampleCSVString } from './utils/csvParser';
import {
  findFreeSlots,
  getBatchBreakdown,
  getDistinctDates,
  getDistinctBatches,
  getDistinctTeachers,
  getDistinctVenues,
} from './utils/scheduleEngine';
import { exportScheduleToCSV, exportScheduleToPDF } from './utils/exportUtils';
import { Navbar, NavTab } from './components/Navbar';
import { SlotFinderView } from './components/SlotFinderView';
import { TimelineVisualizer } from './components/TimelineVisualizer';
import { WeeklyTimetableView } from './components/WeeklyTimetableView';
import { ScheduleTable } from './components/ScheduleTable';
import { DataManagementView } from './components/DataManagementView';
import { BookingModal } from './components/BookingModal';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';

export function App() {
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [targetDate, setTargetDate] = useState<string>('25-09-2026');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [requestedDuration, setRequestedDuration] = useState<number>(60);
  const [activeTab, setActiveTab] = useState<NavTab>('finder');

  // AI Assistant Modal
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);

  // Booking Modal
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [bookingContext, setBookingContext] = useState<{
    date: string;
    startMinutes: number;
    endMinutes: number;
    batch?: string;
    batches?: string[];
    subject?: string;
    teacherName?: string;
    venue?: string;
    sessionTitle?: string;
  } | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const STORAGE_SCHEDULE_KEY = 'slotsync_cs_schedule_data_v2';

  // 1. Initial Mount: restore from localStorage or fallback to mock CS schedule
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SCHEDULE_KEY);
      if (saved) {
        const parsedSaved = JSON.parse(saved);
        if (Array.isArray(parsedSaved) && parsedSaved.length > 0) {
          setSchedule(parsedSaved);
          const dates = getDistinctDates(parsedSaved);
          const batches = getDistinctBatches(parsedSaved);
          if (dates.length > 0) setTargetDate(dates[0]);
          if (batches.length > 1) {
            setSelectedBatches([batches[0], batches[1]]);
          } else if (batches.length > 0) {
            setSelectedBatches([batches[0]]);
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Could not restore schedule from localStorage:', e);
    }

    const parsed = parseScheduleCSV(DEFAULT_MOCK_CSV);
    if (parsed.rows.length > 0) {
      setSchedule(parsed.rows);
      const dates = getDistinctDates(parsed.rows);
      const batches = getDistinctBatches(parsed.rows);
      if (dates.length > 0) setTargetDate(dates[0]);
      if (batches.length > 1) {
        setSelectedBatches([batches[0], batches[1]]);
      } else if (batches.length > 0) {
        setSelectedBatches([batches[0]]);
      }
    }
  }, []);

  // Persist schedule changes to localStorage
  useEffect(() => {
    if (schedule.length > 0) {
      try {
        localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(schedule));
      } catch (e) {
        console.warn('Could not persist schedule to localStorage:', e);
      }
    }
  }, [schedule]);

  // 2. Extracted Distinct Lists
  const availableDates = useMemo(() => getDistinctDates(schedule), [schedule]);
  const availableBatches = useMemo(() => getDistinctBatches(schedule), [schedule]);
  const availableTeachers = useMemo(() => {
    const fromSchedule = getDistinctTeachers(schedule);
    return Array.from(new Set([...fromSchedule, ...KNOWN_TEACHERS])).sort();
  }, [schedule]);
  const availableVenues = useMemo(() => {
    const fromSchedule = getDistinctVenues(schedule);
    return Array.from(new Set([...fromSchedule, ...KNOWN_VENUES])).sort();
  }, [schedule]);

  // Keep targetDate initialized if empty
  useEffect(() => {
    if (!targetDate && availableDates.length > 0) {
      setTargetDate(availableDates[0]);
    }
  }, [availableDates, targetDate]);

  // 3. Batches Selection Handlers
  const handleToggleBatch = (batch: string) => {
    if (selectedBatches.includes(batch)) {
      if (selectedBatches.length > 1) {
        setSelectedBatches(selectedBatches.filter((b) => b !== batch));
      } else {
        showToast('At least one batch must remain selected.');
      }
    } else {
      setSelectedBatches([...selectedBatches, batch]);
    }
  };

  const handleSelectAllBatches = () => {
    setSelectedBatches([...availableBatches]);
  };

  // 4. Inversion Engine Computations
  const commonFreeSlots = useMemo(() => {
    return findFreeSlots(schedule, targetDate, selectedBatches, requestedDuration);
  }, [schedule, targetDate, selectedBatches, requestedDuration]);

  const batchData = useMemo(() => {
    return getBatchBreakdown(schedule, targetDate, selectedBatches, requestedDuration);
  }, [schedule, targetDate, selectedBatches, requestedDuration]);

  // 5. Actions
  const handleLoadDemo = () => {
    const parsed = parseScheduleCSV(DEFAULT_MOCK_CSV);
    setSchedule(parsed.rows);
    try {
      localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(parsed.rows));
    } catch (e) {
      // ignore
    }
    const dates = getDistinctDates(parsed.rows);
    const batches = getDistinctBatches(parsed.rows);
    if (dates.length > 0) setTargetDate(dates[0]);
    if (batches.length > 1) {
      setSelectedBatches([batches[0], batches[1]]);
    }
    showToast(`Loaded ${parsed.rows.length} demo CS timetable entries across multiple batches.`);
  };

  const handleImportSchedule = (newRows: ScheduleRow[]) => {
    setSchedule(newRows);
    try {
      localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(newRows));
    } catch (e) {
      // ignore
    }
    const dates = getDistinctDates(newRows);
    const batches = getDistinctBatches(newRows);
    if (dates.length > 0) setTargetDate(dates[0]);
    if (batches.length > 0) setSelectedBatches([batches[0]]);
    setActiveTab('finder');
    showToast(`Successfully imported ${newRows.length} schedule rows.`);
  };

  const handleOpenBooking = (slot: {
    date: string;
    startMinutes: number;
    endMinutes: number;
    batch?: string;
    batches?: string[];
    subject?: string;
    teacherName?: string;
    venue?: string;
    sessionTitle?: string;
  }) => {
    setBookingContext(slot);
    setIsBookingOpen(true);
  };

  const handleQuickBook = () => {
    handleOpenBooking({
      date: targetDate || (availableDates.length > 0 ? availableDates[0] : '25-09-2026'),
      startMinutes: 480,
      endMinutes: 540,
      batches: selectedBatches.length > 0 ? selectedBatches : undefined,
    });
  };

  const handleConfirmBooking = (newRows: ScheduleRow[]) => {
    setSchedule((prev) => {
      const updated = [...prev, ...newRows];
      try {
        localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
    if (newRows.length > 0 && newRows[0].date) {
      setTargetDate(newRows[0].date);
    }
    const distinctBatches = Array.from(new Set(newRows.map((r) => r.courseSem))).join(', ');
    showToast(`Successfully booked ${newRows.length} session(s) for ${distinctBatches}!`);
  };

  const handleDeleteRow = (id: string) => {
    setSchedule((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
    showToast('Class removed from schedule.');
  };

  const handleExportCSV = () => {
    exportScheduleToCSV(schedule);
    showToast('Exported schedule to CSV (5 Columns format).');
  };

  const handleExportPDF = () => {
    exportScheduleToPDF(schedule, targetDate, selectedBatches, commonFreeSlots);
    showToast('Generated executive Department Timetable PDF.');
  };

  const handleDownloadTemplate = () => {
    const csvContent = generateSampleCSVString();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SlotSync_CS_Template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded standard CSV template.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white tech-grid-bg">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom-5 border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modern Top Tabbed Navbar */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        totalLectures={schedule.length}
        freeSlotsCount={commonFreeSlots.length}
        onLoadDemo={handleLoadDemo}
        onExportPDF={handleExportPDF}
        onOpenAIModal={() => setIsAIOpen(true)}
        onOpenBooking={handleQuickBook}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tab 1: Find Free Slots */}
        {activeTab === 'finder' && (
          <SlotFinderView
            availableDates={availableDates}
            selectedDate={targetDate}
            onSelectDate={setTargetDate}
            availableBatches={availableBatches}
            selectedBatches={selectedBatches}
            onToggleBatch={handleToggleBatch}
            onSelectAllBatches={handleSelectAllBatches}
            selectedDuration={requestedDuration}
            onSelectDuration={setRequestedDuration}
            freeSlots={commonFreeSlots}
            schedule={schedule}
            allTeachers={availableTeachers}
            allVenues={availableVenues}
            onBookSlot={handleOpenBooking}
            onNavigateToTimeline={() => setActiveTab('timeline')}
          />
        )}

        {/* Tab 2: Visual Timeline (Gantt) */}
        {activeTab === 'timeline' && (
          <TimelineVisualizer
            date={targetDate}
            availableDates={availableDates}
            onSelectDate={setTargetDate}
            batches={selectedBatches}
            allBatches={availableBatches}
            onToggleBatch={handleToggleBatch}
            batchData={batchData}
            commonFreeSlots={commonFreeSlots}
            minDurationMinutes={requestedDuration}
            onBookSlot={handleOpenBooking}
          />
        )}

        {/* Tab 3: Weekly Master Timetable */}
        {activeTab === 'weekly' && (
          <WeeklyTimetableView
            schedule={schedule}
            currentDate={targetDate}
            allBatches={availableBatches}
            allVenues={availableVenues}
            onBookSlot={handleOpenBooking}
          />
        )}

        {/* Tab 4: Full Class Directory Table */}
        {activeTab === 'table' && (
          <ScheduleTable
            schedule={schedule}
            selectedDate={targetDate}
            onDeleteRow={handleDeleteRow}
            onOpenBooking={handleQuickBook}
          />
        )}

        {/* Tab 5: Data Management & Export */}
        {activeTab === 'data' && (
          <DataManagementView
            schedule={schedule}
            totalBatches={availableBatches.length}
            totalTeachers={availableTeachers.length}
            totalVenues={availableVenues.length}
            distinctDates={availableDates}
            onLoadDemo={handleLoadDemo}
            onImportSchedule={handleImportSchedule}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            onDownloadTemplate={handleDownloadTemplate}
          />
        )}

      </main>

      {/* Reservation & Booking Modal (Single & Recurring Weekly) */}
      {isBookingOpen && (
        <ErrorBoundary>
          <BookingModal
            isOpen={isBookingOpen}
            onClose={() => {
              setIsBookingOpen(false);
              setBookingContext(null);
            }}
            initialDate={bookingContext?.date || targetDate}
            initialStartMinutes={bookingContext?.startMinutes || 480}
            initialEndMinutes={bookingContext?.endMinutes || 540}
            initialBatch={bookingContext?.batch}
            initialBatches={bookingContext?.batches}
            initialSubject={bookingContext?.subject}
            initialTeacherName={bookingContext?.teacherName}
            initialVenue={bookingContext?.venue}
            initialSessionTitle={bookingContext?.sessionTitle}
            availableBatches={availableBatches}
            availableTeachers={availableTeachers}
            availableVenues={availableVenues}
            schedule={schedule}
            onConfirmBooking={handleConfirmBooking}
          />
        </ErrorBoundary>
      )}

      {/* Gemini AI Timetable Copilot Modal */}
      <GeminiAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        targetDate={targetDate}
        selectedBatches={selectedBatches}
        allBatches={availableBatches}
        allTeachers={availableTeachers}
        allVenues={availableVenues}
        schedule={schedule}
        freeSlots={commonFreeSlots}
        onBookSlot={(slot) => {
          handleOpenBooking(slot);
        }}
      />

      {/* Clean Bespoke Footer - Light Mode */}
      <footer className="border-t border-slate-200/90 bg-white/80 backdrop-blur-md py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">SlotSync CS</span>
            <span>•</span>
            <span className="text-slate-600 font-medium">Department of Computer Science & Engineering</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span>Operating Range: 08:00 AM – 05:00 PM</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Conflict Verification Engine Active
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
