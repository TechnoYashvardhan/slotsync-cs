import React, { useState, useEffect, useMemo } from 'react';
import { ScheduleRow } from '../types/schedule';
import { parseScheduleCSV } from '../utils/csvParser';
import { scheduleToCSVString } from '../utils/exportUtils';
import {
  parseTimeRange,
  formatTimeRangeToCSV,
  isValidDateDDMMYYYY,
  minutesToReadable,
  formatFriendlyDate,
} from '../utils/timeUtils';
import {
  FileSpreadsheet,
  Code,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Copy,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Layers,
  Calendar,
  Clock,
  User,
  MapPin,
  BookOpen,
} from 'lucide-react';

interface RealTimeDataEditorProps {
  schedule: ScheduleRow[];
  onUpdateRow: (row: ScheduleRow) => void;
  onAddRow: (row: ScheduleRow) => void;
  onDeleteRow: (id: string) => void;
  onBatchUpdate: (rows: ScheduleRow[]) => void;
  availableBatches: string[];
  availableTeachers: string[];
  availableVenues: string[];
  availableSubjects: string[];
  distinctDates: string[];
}

export const RealTimeDataEditor: React.FC<RealTimeDataEditorProps> = ({
  schedule,
  onUpdateRow,
  onAddRow,
  onDeleteRow,
  onBatchUpdate,
  availableBatches,
  availableTeachers,
  availableVenues,
  availableSubjects,
  distinctDates,
}) => {
  const [editorMode, setEditorMode] = useState<'grid' | 'raw'>('grid');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  // Inline editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    date: string;
    time: string;
    courseSem: string;
    subject: string;
    teacherName: string;
    venue: string;
  }>({
    date: '',
    time: '',
    courseSem: '',
    subject: '',
    teacherName: '',
    venue: '',
  });

  // New Row Form state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRow, setNewRow] = useState<{
    date: string;
    time: string;
    courseSem: string;
    subject: string;
    teacherName: string;
    venue: string;
  }>({
    date: distinctDates[0] || '25-09-2026',
    time: '8:15 AM - 9:15 AM',
    courseSem: availableBatches[0] || 'BCA 1st Sem',
    subject: availableSubjects[0] || 'Computer Hardware & Components',
    teacherName: availableTeachers[0] || 'Mr. Bhupendra Mandal',
    venue: availableVenues[0] || 'BCA LAB',
  });

  // Raw CSV Mode State
  const [rawCSVText, setRawCSVText] = useState('');
  const [rawParseError, setRawParseError] = useState<string | null>(null);
  const [rawSuccessMsg, setRawSuccessMsg] = useState<string | null>(null);
  const [copiedCSV, setCopiedCSV] = useState(false);

  // Sync raw CSV text whenever schedule changes or mode switches to 'raw'
  useEffect(() => {
    if (editorMode === 'raw') {
      setRawCSVText(scheduleToCSVString(schedule));
      setRawParseError(null);
    }
  }, [editorMode, schedule]);

  // Filtered rows for Grid view
  const filteredRows = useMemo(() => {
    return schedule.filter((row) => {
      const matchBatch = selectedBatchFilter === 'all' || row.courseSem === selectedBatchFilter;
      const matchDate = selectedDateFilter === 'all' || row.date === selectedDateFilter;
      const q = searchTerm.trim().toLowerCase();
      const matchQuery =
        !q ||
        row.teacherName.toLowerCase().includes(q) ||
        row.venue.toLowerCase().includes(q) ||
        row.subject.toLowerCase().includes(q) ||
        row.courseSem.toLowerCase().includes(q) ||
        row.date.toLowerCase().includes(q) ||
        row.time.toLowerCase().includes(q);

      return matchBatch && matchDate && matchQuery;
    });
  }, [schedule, selectedBatchFilter, selectedDateFilter, searchTerm]);

  // Handle start editing
  const handleStartEdit = (row: ScheduleRow) => {
    setEditingRowId(row.id);
    setEditForm({
      date: row.date,
      time: row.time,
      courseSem: row.courseSem,
      subject: row.subject || '',
      teacherName: row.teacherName,
      venue: row.venue,
    });
  };

  // Handle save edit
  const handleSaveEdit = (rowId: string) => {
    if (!editForm.date || !editForm.time || !editForm.courseSem || !editForm.teacherName || !editForm.venue) {
      alert('All fields except Topic Details are required.');
      return;
    }

    const parsedTime = parseTimeRange(editForm.time);
    if (!parsedTime) {
      alert(`Invalid Time format "${editForm.time}". Please use format like "8:15 AM - 9:15 AM".`);
      return;
    }

    const updatedRow: ScheduleRow = {
      id: rowId,
      date: editForm.date.trim(),
      time: formatTimeRangeToCSV(parsedTime.startMinutes, parsedTime.endMinutes),
      courseSem: editForm.courseSem.trim(),
      subject: editForm.subject.trim() || 'Computer Science Lecture',
      teacherName: editForm.teacherName.trim(),
      venue: editForm.venue.trim(),
      startMinutes: parsedTime.startMinutes,
      endMinutes: parsedTime.endMinutes,
    };

    onUpdateRow(updatedRow);
    setEditingRowId(null);
  };

  // Handle Quick Add
  const handleCreateNewRow = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRow.date || !newRow.time || !newRow.courseSem || !newRow.teacherName || !newRow.venue) {
      alert('Please fill all required fields.');
      return;
    }

    const parsedTime = parseTimeRange(newRow.time);
    if (!parsedTime) {
      alert(`Invalid Time format "${newRow.time}". Example: "8:15 AM - 9:15 AM".`);
      return;
    }

    const created: ScheduleRow = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: newRow.date.trim(),
      time: formatTimeRangeToCSV(parsedTime.startMinutes, parsedTime.endMinutes),
      courseSem: newRow.courseSem.trim(),
      subject: newRow.subject.trim() || 'Core Lecture',
      teacherName: newRow.teacherName.trim(),
      venue: newRow.venue.trim(),
      startMinutes: parsedTime.startMinutes,
      endMinutes: parsedTime.endMinutes,
    };

    onAddRow(created);
    setIsAddOpen(false);
  };

  // Duplicate an existing class
  const handleDuplicateRow = (row: ScheduleRow) => {
    const clone: ScheduleRow = {
      ...row,
      id: `clone-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    onAddRow(clone);
  };

  // Apply Raw CSV changes
  const handleApplyRawCSV = () => {
    setRawParseError(null);
    setRawSuccessMsg(null);

    if (!rawCSVText.trim()) {
      setRawParseError('CSV content cannot be completely empty.');
      return;
    }

    const result = parseScheduleCSV(rawCSVText);
    if (result.errors.length > 0) {
      setRawParseError(
        `Failed to parse CSV: ${result.errors[0].message} (Row ${result.errors[0].rowNumber || 'Header'})`
      );
      return;
    }

    if (result.rows.length === 0) {
      setRawParseError('No valid data rows found in the CSV text.');
      return;
    }

    onBatchUpdate(result.rows);
    setRawSuccessMsg(`Successfully synchronized ${result.rows.length} rows directly into system in real time!`);
    setTimeout(() => setRawSuccessMsg(null), 4000);
  };

  const handleCopyRawCSV = () => {
    navigator.clipboard.writeText(rawCSVText);
    setCopiedCSV(true);
    setTimeout(() => setCopiedCSV(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 space-y-6">
      
      {/* Header and Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <span>Real-Time Timetable & CSV Editor</span>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                Live Sync
              </span>
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Directly add, modify, or delete classes without re-uploading files. Changes take effect across all views instantly.
          </p>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950/80 border border-white/[0.08] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setEditorMode('grid')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              editorMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <FileSpreadsheet size={14} />
            <span>Visual Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setEditorMode('raw')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              editorMode === 'raw'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Code size={14} />
            <span>Raw CSV Code</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODE 1: INTERACTIVE GRID SPREADSHEET EDITOR
         ───────────────────────────────────────────────────────────── */}
      {editorMode === 'grid' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Search, Filters, Add Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              
              {/* Search Box */}
              <div className="relative min-w-[200px] flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search faculty, room, subject..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-800/80 border border-white/[0.08] rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                />
              </div>

              {/* Batch Filter */}
              <select
                value={selectedBatchFilter}
                onChange={(e) => setSelectedBatchFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-zinc-800/80 border border-white/[0.08] rounded-xl text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all">All Batches ({availableBatches.length})</option>
                {availableBatches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              {/* Date Filter */}
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-zinc-800/80 border border-white/[0.08] rounded-xl text-zinc-200 focus:outline-none cursor-pointer font-mono"
              >
                <option value="all">All Dates ({distinctDates.length})</option>
                {distinctDates.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Counter */}
              <span className="text-[11px] font-mono text-zinc-500 pl-1">
                Showing {filteredRows.length} of {schedule.length}
              </span>
            </div>

            {/* Add Class Button */}
            <button
              type="button"
              onClick={() => setIsAddOpen(!isAddOpen)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer self-start lg:self-auto active:scale-98 shadow-sm"
            >
              <Plus size={15} />
              <span>{isAddOpen ? 'Close New Class Form' : '+ Add New Class'}</span>
            </button>
          </div>

          {/* Quick Add Form Drawer */}
          {isAddOpen && (
            <form
              onSubmit={handleCreateNewRow}
              className="p-4 rounded-xl bg-zinc-850 border border-emerald-500/30 space-y-3 animate-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 border-b border-white/[0.06] pb-2">
                <span className="flex items-center gap-1.5">
                  <Plus size={14} />
                  Add Direct Class Entry
                </span>
                <span className="text-[11px] font-normal text-zinc-400">
                  Instantly appends to timetable without touching CSV files
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
                {/* Date */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 mb-1 block">Date (DD-MM-YYYY)</label>
                  <input
                    type="text"
                    required
                    value={newRow.date}
                    onChange={(e) => setNewRow({ ...newRow, date: e.target.value })}
                    placeholder="25-09-2026"
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Time Range */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 mb-1 block">Time Range</label>
                  <input
                    type="text"
                    required
                    value={newRow.time}
                    onChange={(e) => setNewRow({ ...newRow, time: e.target.value })}
                    placeholder="8:15 AM - 9:15 AM"
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Batch */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 mb-1 block">Batch</label>
                  <input
                    type="text"
                    required
                    value={newRow.courseSem}
                    onChange={(e) => setNewRow({ ...newRow, courseSem: e.target.value })}
                    list="batch-autocomplete-list"
                    placeholder="BCA 1st Sem"
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <datalist id="batch-autocomplete-list">
                    {availableBatches.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 mb-1 block">Subject</label>
                  <input
                    type="text"
                    required
                    value={newRow.subject}
                    onChange={(e) => setNewRow({ ...newRow, subject: e.target.value })}
                    list="subject-autocomplete-list"
                    placeholder="e.g. Operating Systems"
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <datalist id="subject-autocomplete-list">
                    {availableSubjects.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                {/* Teacher */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 mb-1 block">Faculty Member</label>
                  <input
                    type="text"
                    required
                    value={newRow.teacherName}
                    onChange={(e) => setNewRow({ ...newRow, teacherName: e.target.value })}
                    list="teacher-autocomplete-list"
                    placeholder="Faculty Name"
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <datalist id="teacher-autocomplete-list">
                    {availableTeachers.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                {/* Venue */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 mb-1 block">Venue / Lab</label>
                  <input
                    type="text"
                    required
                    value={newRow.venue}
                    onChange={(e) => setNewRow({ ...newRow, venue: e.target.value })}
                    list="venue-autocomplete-list"
                    placeholder="BCA LAB / Room"
                    className="w-full bg-zinc-900 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <datalist id="venue-autocomplete-list">
                    {availableVenues.map((v) => (
                      <option key={v} value={v} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  Save & Add to Timetable
                </button>
              </div>
            </form>
          )}

          {/* Interactive Editable Table */}
          <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-zinc-950/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-800/60 text-zinc-400 border-b border-white/[0.08] uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-10">#</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Time Range</th>
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Faculty</th>
                  <th className="py-2.5 px-3">Venue</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500">
                      No classes match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => {
                    const isEditing = editingRowId === row.id;

                    if (isEditing) {
                      return (
                        <tr key={row.id} className="bg-indigo-950/30 border-y border-indigo-500/30">
                          <td className="py-2 px-3 font-mono text-zinc-500">{idx + 1}</td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={editForm.date}
                              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              className="w-full bg-zinc-900 border border-white/[0.1] rounded px-2 py-1 text-zinc-100 font-mono text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={editForm.time}
                              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                              className="w-full bg-zinc-900 border border-white/[0.1] rounded px-2 py-1 text-zinc-100 font-mono text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={editForm.courseSem}
                              onChange={(e) => setEditForm({ ...editForm, courseSem: e.target.value })}
                              list="batch-autocomplete-list"
                              className="w-full bg-zinc-900 border border-white/[0.1] rounded px-2 py-1 text-zinc-100 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={editForm.subject}
                              onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                              list="subject-autocomplete-list"
                              className="w-full bg-zinc-900 border border-white/[0.1] rounded px-2 py-1 text-zinc-100 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={editForm.teacherName}
                              onChange={(e) => setEditForm({ ...editForm, teacherName: e.target.value })}
                              list="teacher-autocomplete-list"
                              className="w-full bg-zinc-900 border border-white/[0.1] rounded px-2 py-1 text-zinc-100 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={editForm.venue}
                              onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                              list="venue-autocomplete-list"
                              className="w-full bg-zinc-900 border border-white/[0.1] rounded px-2 py-1 text-zinc-100 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(row.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white mr-1 cursor-pointer transition"
                              title="Save Changes"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRowId(null)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 cursor-pointer transition"
                              title="Cancel"
                            >
                              <X size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={row.id} className="hover:bg-zinc-850/60 transition-colors group">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-medium text-zinc-300 whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-emerald-400 whitespace-nowrap">
                          {row.time}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded font-medium text-[11px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                            {row.courseSem}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-zinc-200">
                          {row.subject}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-300">
                          {row.teacherName}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[11px] border border-white/[0.05]">
                            {row.venue}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(row)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition cursor-pointer"
                            title="Edit Class"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateRow(row)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition cursor-pointer"
                            title="Duplicate Class"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove "${row.subject}" (${row.time}) for ${row.courseSem}?`)) {
                                onDeleteRow(row.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete Class"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODE 2: RAW CSV CODE EDITOR WITH LIVE VALIDATION
         ───────────────────────────────────────────────────────────── */}
      {editorMode === 'raw' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Code size={14} className="text-indigo-400" />
              <span>Directly edit or paste CSV text below. Format: <strong className="text-zinc-200">Date,Time,CourseSem,Subject,Teacher Name,Venue</strong></span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRawCSV}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs flex items-center gap-1 cursor-pointer transition"
              >
                {copiedCSV ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedCSV ? 'Copied!' : 'Copy CSV'}</span>
              </button>
              <button
                type="button"
                onClick={() => setRawCSVText(scheduleToCSVString(schedule))}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs flex items-center gap-1 cursor-pointer transition"
                title="Discard unapplied text edits"
              >
                <RefreshCw size={12} />
                <span>Revert to System</span>
              </button>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            value={rawCSVText}
            onChange={(e) => setRawCSVText(e.target.value)}
            rows={14}
            className="w-full bg-zinc-950 font-mono text-xs text-emerald-400/90 p-4 rounded-xl border border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 leading-relaxed shadow-inner"
            placeholder="Date,Time,CourseSem,Subject,Teacher Name,Venue&#10;21-09-2026,8:15 AM - 9:15 AM,BCA 1st Sem,Computer Hardware & Components,Mr. Bhupendra Mandal,BCA LAB"
          />

          {/* Feedback & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs">
              {rawParseError && (
                <div className="text-rose-400 flex items-center gap-1.5 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                  <AlertCircle size={14} />
                  <span>{rawParseError}</span>
                </div>
              )}
              {rawSuccessMsg && (
                <div className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 size={14} />
                  <span>{rawSuccessMsg}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleApplyRawCSV}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-98 flex items-center justify-center gap-2 self-end sm:self-auto"
            >
              <Check size={14} />
              <span>Validate & Apply CSV to System</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
