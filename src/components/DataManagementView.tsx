import React, { useRef, useState } from 'react';
import { ScheduleRow } from '../types/schedule';
import { parseScheduleCSV, CSVParseResult } from '../utils/csvParser';
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
  onLoadDemo: () => void;
  onImportSchedule: (rows: ScheduleRow[]) => void;
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
  onLoadDemo,
  onImportSchedule,
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
      
      {/* 1. Metric Overview Cards with Top Neon Accents - Light Mode */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Total Lectures */}
        <div className="glass-panel rounded-3xl p-5 space-y-1 relative overflow-hidden group bg-white border border-slate-200/90 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
          <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            Total Lectures
          </span>
          <div className="text-3xl font-mono font-black text-slate-900">{schedule.length}</div>
          <span className="text-[11px] text-slate-400 font-medium">In active dataset</span>
        </div>

        {/* Active Batches */}
        <div className="glass-panel rounded-3xl p-5 space-y-1 relative overflow-hidden group bg-white border border-slate-200/90 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            Active Batches
          </span>
          <div className="text-3xl font-mono font-black text-slate-900">{totalBatches}</div>
          <span className="text-[11px] text-slate-400 font-medium">From schedule CSV</span>
        </div>

        {/* Dates Covered */}
        <div className="glass-panel rounded-3xl p-5 space-y-1 relative overflow-hidden group bg-white border border-slate-200/90 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
          <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            Dates Covered
          </span>
          <div className="text-3xl font-mono font-black text-slate-900">{distinctDates.length}</div>
          <span className="text-[11px] text-slate-400 font-medium">Configured dates</span>
        </div>

        {/* Rooms & Labs */}
        <div className="glass-panel rounded-3xl p-5 space-y-1 relative overflow-hidden group bg-white border border-slate-200/90 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            Venues & Labs
          </span>
          <div className="text-3xl font-mono font-black text-slate-900">{totalVenues}</div>
          <span className="text-[11px] text-slate-400 font-medium">Under department</span>
        </div>

      </div>

      {/* 2. Upload & Demo Data Terminal - Light Mode */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 bg-white border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-sm" />
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Data Management & Ingestion
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Supports CSV timetables with 5 or 6 columns: <span className="font-mono text-slate-800 font-semibold">Date, Time, CourseSem, Subject, Teacher Name, Venue</span>.
            </p>
          </div>

          {/* Quick Demo Data Button */}
          <button
            type="button"
            onClick={onLoadDemo}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
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
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
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
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 text-indigo-600 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Choose CSV file or drag & drop here
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Expected headers: <span className="font-mono text-emerald-700 font-semibold">Date, Time, CourseSem, Subject, Teacher Name, Venue</span>
          </p>
        </div>

        {/* CSV Verification Feedback */}
        {parseResult && (
          <div className="space-y-4 pt-2">
            {parseResult.errors.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Validation Warning: {parseResult.errors.length} formatting issues found</span>
                </div>
                <ul className="text-xs text-rose-700 space-y-1 pl-5 list-disc max-h-40 overflow-y-auto">
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
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Parsed <strong>{parseResult.rows.length} valid rows</strong> successfully!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-sm"
                >
                  Apply to Schedule
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 3. Export Cards - Light Mode */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Export CSV */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 flex flex-col justify-between group bg-white border border-slate-200/90 hover:border-emerald-400 shadow-sm hover:shadow-card-hover transition-colors">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Export Dataset (CSV)</h4>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Downloads the updated schedule in strict CSV format with any newly reserved sessions included.
            </p>
          </div>
          <button
            onClick={onExportCSV}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 hover:border-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Export PDF */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 flex flex-col justify-between group bg-white border border-slate-200/90 hover:border-rose-400 shadow-sm hover:shadow-card-hover transition-colors">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Department Timetable (PDF)</h4>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Generates an executive landscape PDF report with official department banner and conflict verified seal.
            </p>
          </div>
          <button
            onClick={onExportPDF}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 hover:border-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Generate PDF</span>
          </button>
        </div>

        {/* Download CSV Template */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 flex flex-col justify-between group bg-white border border-slate-200/90 hover:border-indigo-400 shadow-sm hover:shadow-card-hover transition-colors">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-3 shadow-sm">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black text-slate-900">Empty CSV Template</h4>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
              Download a ready-to-use CSV template pre-filled with the required column headers.
            </p>
          </div>
          <button
            onClick={onDownloadTemplate}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 hover:border-indigo-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Download Template</span>
          </button>
        </div>

      </div>

    </div>
  );
};
