import React, { useState, useEffect, useMemo } from 'react';
import type { ScheduleRow } from './types/schedule';
import { DEFAULT_MOCK_CSV } from './data/mockData';
import { parseScheduleCSV, generateSampleCSVString } from './utils/csvParser';
import {
  findFreeSlots,
  getBatchBreakdown,
  getDistinctDates,
  getDistinctBatches,
  getDistinctTeachers,
  getDistinctVenues,
  getDistinctSubjects,
} from './utils/scheduleEngine';
import { exportScheduleToCSV, exportScheduleToPDF } from './utils/exportUtils';
import { AuroraBackground } from './components/AuroraBackground';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AnimatedViewWrapper } from './components/AnimatedViewWrapper';
import { DashboardView } from './components/DashboardView';
import { SlotFinderView } from './components/SlotFinderView';
import { TimelineVisualizer } from './components/TimelineVisualizer';
import { WeeklyTimetableView } from './components/WeeklyTimetableView';
import { ScheduleTable } from './components/ScheduleTable';
import { DataManagementView } from './components/DataManagementView';
import { BookingModal } from './components/BookingModal';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function App() {
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [targetDate, setTargetDate] = useState<string>('25-09-2026');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [requestedDuration, setRequestedDuration] = useState<number>(60);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

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

  // Theme State: 'dark' (Obsidian Aurora) or 'light' (Cool Frost)
  const STORAGE_THEME_KEY = 'slotsync_theme_preference';
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  });

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_THEME_KEY, next);
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light', 'theme-light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light', 'theme-light');
    }
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const STORAGE_SCHEDULE_KEY = 'slotsync_cs_schedule_data_v7';

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
  const availableTeachers = useMemo(() => getDistinctTeachers(schedule), [schedule]);
  const availableVenues = useMemo(() => getDistinctVenues(schedule), [schedule]);
  const availableSubjects = useMemo(() => getDistinctSubjects(schedule), [schedule]);

  useEffect(() => {
    if (!targetDate && availableDates.length > 0) {
      setTargetDate(availableDates[0]);
    }
  }, [availableDates, targetDate]);

  // 3. Batches Selection
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

  // 4. Inversion Engine
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
    } catch (e) { /* ignore */ }
    const dates = getDistinctDates(parsed.rows);
    const batches = getDistinctBatches(parsed.rows);
    if (dates.length > 0) setTargetDate(dates[0]);
    if (batches.length > 1) {
      setSelectedBatches([batches[0], batches[1]]);
    }
    showToast(`Loaded ${parsed.rows.length} demo CS timetable entries.`);
  };

  const handleImportSchedule = (newRows: ScheduleRow[]) => {
    setSchedule(newRows);
    try {
      localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(newRows));
    } catch (e) { /* ignore */ }
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
      endMinutes: 480 + requestedDuration,
      batches: selectedBatches.length > 0 ? selectedBatches : undefined,
    });
  };

  const handleConfirmBooking = (newRows: ScheduleRow[]) => {
    setSchedule((prev) => {
      const updated = [...prev, ...newRows];
      try {
        localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(updated));
      } catch (e) { /* ignore */ }
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
      } catch (e) { /* ignore */ }
      return updated;
    });
    showToast('Class removed from schedule.');
  };

  const handleUpdateRow = (updatedRow: ScheduleRow) => {
    setSchedule((prev) => {
      const updated = prev.map((r) => (r.id === updatedRow.id ? updatedRow : r));
      try {
        localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(updated));
      } catch (e) { /* ignore */ }
      return updated;
    });
    showToast(`Updated "${updatedRow.subject}" (${updatedRow.time}) for ${updatedRow.courseSem}.`);
  };

  const handleAddRow = (newRow: ScheduleRow) => {
    setSchedule((prev) => {
      const updated = [newRow, ...prev];
      try {
        localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(updated));
      } catch (e) { /* ignore */ }
      return updated;
    });
    if (newRow.date) setTargetDate(newRow.date);
    showToast(`Added "${newRow.subject}" for ${newRow.courseSem} to timetable!`);
  };

  const handleExportCSV = () => {
    exportScheduleToCSV(schedule);
    showToast('Exported schedule to CSV.');
  };

  const handleExportPDF = () => {
    exportScheduleToPDF(schedule, targetDate, selectedBatches, commonFreeSlots);
    showToast('Generated Department Timetable PDF.');
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
    showToast('Downloaded CSV template.');
  };

  return (
    <AuroraBackground theme={theme}>
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 bg-zinc-800/95 backdrop-blur-xl text-zinc-100 px-5 py-3.5 rounded-xl shadow-2xl font-medium text-xs flex items-center gap-2.5 border border-white/[0.1]"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        totalLectures={schedule.length}
        freeSlotsCount={commonFreeSlots.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenAIModal={() => setIsAIOpen(true)}
        onOpenBooking={handleQuickBook}
        onExportPDF={handleExportPDF}
      />

      {/* Mobile Top Bar */}
      <TopBar
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenAIModal={() => setIsAIOpen(true)}
        onOpenBooking={handleQuickBook}
        onLoadDemo={handleLoadDemo}
        onExportPDF={handleExportPDF}
      />

      {/* Main Content Area */}
      <main className="lg:pl-[252px] min-h-screen pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <AnimatedViewWrapper viewKey={activeTab}>
            {activeTab === 'dashboard' && (
              <DashboardView
                schedule={schedule}
                allBatches={availableBatches}
                allTeachers={availableTeachers}
                allVenues={availableVenues}
                availableDates={availableDates}
                commonFreeSlotsCount={commonFreeSlots.length}
                onNavigate={setActiveTab}
                onOpenAIModal={() => setIsAIOpen(true)}
                onOpenBooking={() =>
                  handleOpenBooking({
                    date: targetDate,
                    startMinutes: 495,
                    endMinutes: 555,
                    batch: availableBatches[0],
                  })
                }
                onExportPDF={handleExportPDF}
              />
            )}

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
                schedule={schedule}
                allTeachers={availableTeachers}
                allVenues={availableVenues}
                onBookSlot={handleOpenBooking}
              />
            )}

            {activeTab === 'weekly' && (
              <WeeklyTimetableView
                schedule={schedule}
                currentDate={targetDate}
                allBatches={availableBatches}
                allVenues={availableVenues}
                onBookSlot={handleOpenBooking}
              />
            )}

            {activeTab === 'table' && (
              <ScheduleTable
                schedule={schedule}
                selectedDate={targetDate}
                onDeleteRow={handleDeleteRow}
                onUpdateRow={handleUpdateRow}
                onOpenBooking={handleQuickBook}
              />
            )}

            {activeTab === 'data' && (
              <DataManagementView
                schedule={schedule}
                totalBatches={availableBatches.length}
                totalTeachers={availableTeachers.length}
                totalVenues={availableVenues.length}
                distinctDates={availableDates}
                availableBatches={availableBatches}
                availableTeachers={availableTeachers}
                availableVenues={availableVenues}
                availableSubjects={availableSubjects}
                onLoadDemo={handleLoadDemo}
                onImportSchedule={handleImportSchedule}
                onUpdateRow={handleUpdateRow}
                onAddRow={handleAddRow}
                onDeleteRow={handleDeleteRow}
                onExportCSV={handleExportCSV}
                onExportPDF={handleExportPDF}
                onDownloadTemplate={handleDownloadTemplate}
              />
            )}
          </AnimatedViewWrapper>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/[0.05] py-5 text-center text-xs text-zinc-600 mt-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-400">SlotSync CS</span>
              <span className="text-zinc-700">•</span>
              <span className="text-zinc-500 font-medium">Dept of Computer Science & Engineering</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-500 font-medium">
              <span className="font-mono text-[10px]">08:00 AM – 05:00 PM</span>
              <span className="text-zinc-700">•</span>
              <span className="text-emerald-500/80 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Conflict Engine Active
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Booking Modal */}
      {isBookingOpen && (
        <ErrorBoundary>
          <BookingModal
            key={`booking-${isBookingOpen}-${bookingContext?.date}-${bookingContext?.startMinutes}-${bookingContext?.endMinutes}-${bookingContext?.batch || ''}`}
            isOpen={isBookingOpen}
            onClose={() => {
              setIsBookingOpen(false);
              setBookingContext(null);
            }}
            initialDate={bookingContext?.date || targetDate}
            initialStartMinutes={bookingContext?.startMinutes !== undefined ? bookingContext.startMinutes : 480}
            initialEndMinutes={bookingContext?.endMinutes !== undefined ? bookingContext.endMinutes : (480 + requestedDuration)}
            initialBatch={bookingContext?.batch}
            initialBatches={bookingContext?.batches}
            initialSubject={bookingContext?.subject}
            initialTeacherName={bookingContext?.teacherName}
            initialVenue={bookingContext?.venue}
            initialSessionTitle={bookingContext?.sessionTitle}
            availableBatches={availableBatches}
            availableTeachers={availableTeachers}
            availableVenues={availableVenues}
            availableSubjects={availableSubjects}
            schedule={schedule}
            onConfirmBooking={handleConfirmBooking}
          />
        </ErrorBoundary>
      )}

      {/* AI Copilot Modal */}
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
    </AuroraBackground>
  );
}

export default App;
