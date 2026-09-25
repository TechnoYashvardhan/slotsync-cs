import React, { useRef, useState } from 'react';
import { ScheduleRow } from '../types/schedule';
import { parseScheduleCSV, CSVParseResult } from '../utils/csvParser';
import { RealTimeDataEditor } from './RealTimeDataEditor';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Calendar,
  Users,
  Building2,
} from 'lucide-react';

interface DataManagementViewProps {
  schedule: ScheduleRow[];
  totalBatches: number;
  totalTeachers: number;
  totalVenues: number;
  distinctDates: string[];
  availableBatches?: string[];
  availableTeachers?: string[];
  availableVenues?: string[];
  availableSubjects?: string[];
  onLoadDemo: () => void;
  onImportSchedule: (rows: ScheduleRow[]) => void;
  onUpdateRow?: (row: ScheduleRow) => void;
  onAddRow?: (row: ScheduleRow) => void;
  onDeleteRow?: (id: string) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onDownloadTemplate: () => void;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  schedule,
  totalBatches,
  totalTeachers,
  totalVenues,
  distinctDates,
  availableBatches = [],
  availableTeachers = [],
  availableVenues = [],
  availableSubjects = [],
  onLoadDemo,
  onImportSchedule,
  onUpdateRow,
  onAddRow,
  onDeleteRow,
  onExportCSV,
  onExportPDF,
  onDownloadTemplate,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseScheduleCSV(text);
      setParseResult(result);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApplyImport = () => {
    if (parseResult && parseResult.rows.length > 0) {
      onImportSchedule(parseResult.rows);
      setParseResult(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      
      {/* 1. Metric Overview Cards with Top Neon Accents */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Total Lectures */}
        <div className="bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <span className="text-zinc-500 text-xs font-semibold flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            Total Lectures
          </span>
          <div className="text-2xl font-mono tabular-nums font-bold text-zinc-100">{schedule.length}</div>
          <span className="text-[11px] text-zinc-500 font-medium">In active dataset</span>
        </div>

        {/* Active Batches */}
        <div className="bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <span className="text-zinc-500 text-xs font-semibold flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" />
            Active Batches
          </span>
          <div className="text-2xl font-mono tabular-nums font-bold text-zinc-100">{totalBatches}</div>
          <span className="text-[11px] text-zinc-500 font-medium">From schedule CSV</span>
        </div>

        {/* Dates Covered */}
        <div className="bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500" />
          <span className="text-zinc-500 text-xs font-semibold flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-violet-400" />
            Dates Covered
          </span>
          <div className="text-2xl font-mono tabular-nums font-bold text-zinc-100">{distinctDates.length}</div>
          <span className="text-[11px] text-zinc-500 font-medium">Configured dates</span>
        </div>

        {/* Rooms & Labs */}
        <div className="bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <span className="text-zinc-500 text-xs font-semibold flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-amber-400" />
            Venues & Labs
          </span>
          <div className="text-2xl font-mono tabular-nums font-bold text-zinc-100">{totalVenues}</div>
          <span className="text-[11px] text-zinc-500 font-medium">Under department</span>
        </div>

      </div>

      {/* 2. Real-Time Interactive CSV / Timetable Editor */}
      <RealTimeDataEditor
        schedule={schedule}
        onUpdateRow={onUpdateRow || (() => {})}
        onAddRow={onAddRow || (() => {})}
        onDeleteRow={onDeleteRow || (() => {})}
        onBatchUpdate={onImportSchedule}
        availableBatches={availableBatches}
        availableTeachers={availableTeachers}
        availableVenues={availableVenues}
        availableSubjects={availableSubjects}
        distinctDates={distinctDates}
      />

      {/* 3. Upload & Demo Data Terminal */}
      <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
              <h3 className="text-lg font-semibold text-zinc-100">
                Data Management & Ingestion
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              Supports CSV timetables with 5 or 6 columns: <span className="font-mono text-zinc-400">Date, Time, CourseSem, Subject, Teacher Name, Venue</span>.
            </p>
          </div>

          {/* Quick Demo Data Button */}
          <button
            type="button"
            onClick={onLoadDemo}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Reset to CSV Timetable ({schedule.length} Rows)</span>
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-emerald-500/50 bg-emerald-500/10'
              : 'border-zinc-700 bg-zinc-800/40 hover:border-indigo-500/40 hover:bg-zinc-800/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-xl bg-zinc-800/80 border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-zinc-500 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-medium text-zinc-400">
            Choose CSV file or drag & drop here
          </h4>
          <p className="text-xs text-zinc-600 mt-1">
            Expected headers: <span className="font-mono">Date, Time, CourseSem, Subject, Teacher Name, Venue</span>
          </p>
        </div>

        {/* CSV Verification Feedback */}
        {parseResult && (
          <div className="space-y-4 pt-2">
            {parseResult.errors.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Validation Warning: {parseResult.errors.length} formatting issues found</span>
                </div>
                <ul className="text-xs space-y-1 pl-5 list-disc max-h-40 overflow-y-auto opacity-80">
                  {parseResult.errors.map((err, i) => (
                    <li key={i}>
                      {err.rowNumber > 0 ? `Row ${err.rowNumber}: ` : ''}
                      <strong>{err.field}</strong> — {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {parseResult.rows.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Parsed <strong>{parseResult.rows.length} valid rows</strong> successfully!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm cursor-pointer transition-colors active:scale-[0.98] whitespace-nowrap"
                >
                  Apply to Schedule
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 3. Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Export CSV */}
        <div className="bg-zinc-900/80 border border-white/[0.08] hover:border-emerald-500/30 backdrop-blur-xl rounded-2xl p-5 space-y-4 flex flex-col justify-between group transition-all duration-300">
          <div>
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-white/[0.08] flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">Export Dataset (CSV)</h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Downloads the updated schedule in strict CSV format with any newly reserved sessions included.
            </p>
          </div>
          <button
            onClick={onExportCSV}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer group-hover:text-zinc-100"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Export PDF */}
        <div className="bg-zinc-900/80 border border-white/[0.08] hover:border-rose-500/30 backdrop-blur-xl rounded-2xl p-5 space-y-4 flex flex-col justify-between group transition-all duration-300">
          <div>
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-white/[0.08] flex items-center justify-center text-rose-400 mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">Department Timetable (PDF)</h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Generates an executive landscape PDF report with official department banner and conflict verified seal.
            </p>
          </div>
          <button
            onClick={onExportPDF}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer group-hover:text-zinc-100"
          >
            <Download className="w-4 h-4 text-rose-400" />
            <span>Generate PDF</span>
          </button>
        </div>

        {/* Download CSV Template */}
        <div className="bg-zinc-900/80 border border-white/[0.08] hover:border-indigo-500/30 backdrop-blur-xl rounded-2xl p-5 space-y-4 flex flex-col justify-between group transition-all duration-300">
          <div>
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-white/[0.08] flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">Empty CSV Template</h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Download a ready-to-use CSV template pre-filled with the required column headers.
            </p>
          </div>
          <button
            onClick={onDownloadTemplate}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer group-hover:text-zinc-100"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Download Template</span>
          </button>
        </div>

      </div>

    </div>
  );
};
