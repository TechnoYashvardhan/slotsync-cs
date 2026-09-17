import React, { useState } from 'react';
import { ScheduleRow } from '../types/schedule';
import { Search, Trash2, Filter, MapPin, User, Layers } from 'lucide-react';
import { formatDuration } from '../utils/timeUtils';

interface ScheduleTableProps {
  schedule: ScheduleRow[];
  selectedDate: string;
  onDeleteRow: (id: string) => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedule,
  selectedDate,
  onDeleteRow,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByDateOnly, setFilterByDateOnly] = useState(true);

  const filtered = schedule.filter((row) => {
    if (filterByDateOnly && selectedDate && row.date !== selectedDate) {
      return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      row.courseSem.toLowerCase().includes(term) ||
      (row.subject && row.subject.toLowerCase().includes(term)) ||
      row.teacherName.toLowerCase().includes(term) ||
      row.venue.toLowerCase().includes(term) ||
      row.time.toLowerCase().includes(term) ||
      row.date.toLowerCase().includes(term) ||
      (row.sessionTitle && row.sessionTitle.toLowerCase().includes(term))
    );
  });

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300 bg-white border border-slate-200/90 shadow-sm">
      
      {/* Header & Search - Light Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-sm" />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Class Schedule Directory
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Displaying {filtered.length} scheduled lectures {filterByDateOnly ? `for ${selectedDate}` : 'across entire database'}.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search faculty, batch, lab..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-2xl pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-64 font-medium shadow-sm"
            />
          </div>

          {/* Toggle Date Scope */}
          <button
            type="button"
            onClick={() => setFilterByDateOnly(!filterByDateOnly)}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 ${
              filterByDateOnly
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>{filterByDateOnly ? `Only ${selectedDate}` : 'Show All Dates'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Card List (< 768px) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs font-medium">
            No matching timetable records found.
          </div>
        ) : (
          filtered.map((row) => (
            <div
              key={row.id}
              className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                    {row.date}
                  </span>
                  <span className="font-mono text-xs font-black text-emerald-700">
                    {row.time}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remove class for ${row.courseSem} (${row.time})?`)) {
                      onDeleteRow(row.id);
                    }
                  }}
                  title="Delete this class"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <span>{row.courseSem}</span>
                    {row.sessionType && (
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                        {row.sessionType}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                    {formatDuration(row.endMinutes - row.startMinutes)}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-xs inline-block">
                    {row.subject || 'CS Lecture'}
                  </span>
                </div>

                {row.sessionTitle && (
                  <p className="text-xs text-slate-500 italic pt-0.5">
                    {row.sessionTitle}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{row.teacherName}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>{row.venue}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table Container (>= 768px) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-4 px-4 font-mono">Date</th>
              <th className="py-4 px-4 font-mono">Time Window</th>
              <th className="py-4 px-4">Batch / Course</th>
              <th className="py-4 px-4">Subject</th>
              <th className="py-4 px-4">Faculty In-Charge</th>
              <th className="py-4 px-4">Venue / Lab</th>
              <th className="py-4 px-4 text-center font-mono">Duration</th>
              <th className="py-4 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-400 text-xs font-medium">
                  No matching timetable records found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">{row.date}</td>
                  <td className="py-3.5 px-4 font-mono font-black text-emerald-700 whitespace-nowrap">
                    {row.time}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{row.courseSem}</span>
                      {row.sessionType && (
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                          {row.sessionType}
                        </span>
                      )}
                    </div>
                    {row.sessionTitle && (
                      <div className="text-[11px] text-slate-500 font-normal truncate max-w-xs mt-0.5">
                        {row.sessionTitle}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-xs">
                      {row.subject || 'CS Lecture'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{row.teacherName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      <span>{row.venue}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-500 font-medium">
                    {formatDuration(row.endMinutes - row.startMinutes)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Remove class for ${row.courseSem} (${row.time})?`)) {
                          onDeleteRow(row.id);
                        }
                      }}
                      title="Delete this class"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
