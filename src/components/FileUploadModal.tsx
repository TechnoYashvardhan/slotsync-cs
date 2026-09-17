import React, { useState, useRef } from 'react';
import { parseScheduleCSV, CSVParseResult, generateSampleCSVString } from '../utils/csvParser';
import { ScheduleRow, ValidationIssue } from '../types/schedule';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck,
} from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (rows: ScheduleRow[]) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseScheduleCSV(text);
      setParseResult(result);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setIsProcessing(false);
      alert('Error reading file. Please ensure it is a valid text/CSV file.');
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
  };

  const handleConfirmImport = () => {
    if (parseResult && parseResult.rows.length > 0) {
      onImportSuccess(parseResult.rows);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Department CSV Schedule</h3>
              <p className="text-xs text-slate-500 font-medium">
                Requires exact 5 or 6 columns: Date, Time, CourseSem, Subject, Teacher Name, Venue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50/60'
                : 'border-slate-300 hover:border-indigo-500 bg-slate-50/60'
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
            <UploadCloud className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">
              Click to select or drag & drop CSV file here
            </p>
            <p className="text-xs text-slate-500 mt-1">
              File must contain columns: Date, Time, CourseSem, Subject, Teacher Name, Venue
            </p>
          </div>

          {/* Template Info & Download */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="text-slate-600 font-medium">
              Need the exact column template for your department timetable?
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold transition cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Validation & Parsing Feedback */}
          {parseResult && (
            <div className="space-y-3">
              {/* Error Alerts */}
              {parseResult.errors.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2 max-h-48 overflow-y-auto">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>Formatting Issues Found ({parseResult.errors.length})</span>
                  </div>
                  <ul className="text-xs text-rose-700 space-y-1 pl-5 list-disc">
                    {parseResult.errors.map((err, i) => (
                      <li key={i}>
                        {err.rowNumber > 0 ? `Row ${err.rowNumber}: ` : ''}
                        <strong>{err.field}</strong> — {err.message}
                        {err.rawValue && <span className="font-mono ml-1 text-rose-900 font-bold">[{err.rawValue}]</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success Preview */}
              {parseResult.rows.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{parseResult.rows.length} Valid Rows Parsed Successfully</span>
                    </div>
                    <span className="text-slate-500 font-normal">
                      Total entries in file: {parseResult.totalParsed}
                    </span>
                  </div>

                  {/* Quick Preview Table of first 3 rows */}
                  <div className="overflow-x-auto text-[11px]">
                    <table className="w-full text-left text-slate-700">
                      <thead>
                        <tr className="border-b border-emerald-200 text-emerald-900 font-bold">
                          <th className="py-1">Date</th>
                          <th className="py-1">Time</th>
                          <th className="py-1">CourseSem</th>
                          <th className="py-1">Subject</th>
                          <th className="py-1">Teacher</th>
                          <th className="py-1">Venue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        {parseResult.rows.slice(0, 3).map((r, i) => (
                          <tr key={i}>
                            <td className="py-1 font-mono">{r.date}</td>
                            <td className="py-1 font-mono font-bold text-emerald-800">{r.time}</td>
                            <td className="py-1">{r.courseSem}</td>
                            <td className="py-1 font-medium text-purple-900">{r.subject || 'CS Lecture'}</td>
                            <td className="py-1">{r.teacherName}</td>
                            <td className="py-1">{r.venue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!parseResult || parseResult.rows.length === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer ${
                !parseResult || parseResult.rows.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95'
              }`}
            >
              Import Schedule ({parseResult?.rows.length || 0} rows)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
