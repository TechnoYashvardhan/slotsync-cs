import React, { useState } from 'react';
import { ScheduleRow } from '../types/schedule';
import { Search, Trash2, Filter, MapPin, User, Layers, Plus } from 'lucide-react';
import { formatDuration } from '../utils/timeUtils';

interface ScheduleTableProps {
  schedule: ScheduleRow[];
  selectedDate: string;
  onDeleteRow: (id: string) => void;
  onOpenBooking?: () => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedule,
  selectedDate,
  onDeleteRow,
  onOpenBooking,
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
    <div className="rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-5 sm:p-6 space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
            <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">
              Class Schedule Directory
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Displaying {filtered.length} scheduled lectures {filterByDateOnly ? `for ${selectedDate}` : 'across entire database'}.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search faculty, batch, lab..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-zinc-800/60 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all"
            />
          </div>

          {/* Toggle Date Scope */}
          <button
            type="button"
            onClick={() => setFilterByDateOnly(!filterByDateOnly)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              filterByDateOnly
                ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                : 'bg-zinc-800/60 text-zinc-400 border-white/[0.05] hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>{filterByDateOnly ? `Only ${selectedDate}` : 'Show All Dates'}</span>
          </button>

          {onOpenBooking && (
            <button
              type="button"
              onClick={onOpenBooking}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Book Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Card List (< 768px) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-white/[0.08] rounded-xl p-8 text-center text-zinc-500 text-sm font-medium">
            No matching timetable records found.
          </div>
        ) : (
          filtered.map((row) => (
            <div
              key={row.id}
              className="bg-zinc-800/60 border border-white/[0.06] rounded-xl p-4 space-y-3 hover:border-indigo-500/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono tabular-nums text-xs font-medium text-zinc-300 bg-zinc-900/80 px-2.5 py-0.5 rounded-lg border border-white/[0.08]">
                    {row.date}
                  </span>
                  <span className="font-mono tabular-nums text-sm font-semibold text-emerald-400">
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
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-zinc-100 text-sm flex items-center gap-1.5">
                    <span>{row.courseSem}</span>
                    {row.sessionType && (
                      <span className="text-[10px] font-medium bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                        {row.sessionType}
                      </span>
                    )}
                  </div>
                  <span className="font-mono tabular-nums text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    {formatDuration(row.endMinutes - row.startMinutes)}
                  </span>
                </div>

                <div>
                  <span className="font-medium bg-violet-500/15 text-violet-400 px-2.5 py-1 rounded-lg border border-violet-500/30 text-xs inline-block">
                    {row.subject || 'CS Lecture'}
                  </span>
                </div>

                {row.sessionTitle && (
                  <p className="text-xs text-zinc-400 italic pt-0.5">
                    {row.sessionTitle}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300">
                <div className="flex items-center gap-1.5 font-medium">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{row.teacherName}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>{row.venue}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table Container (>= 768px) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider font-semibold border-b border-zinc-800">
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
          <tbody className="divide-y divide-zinc-800/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-zinc-500 text-sm font-medium">
                  No matching timetable records found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono tabular-nums text-zinc-300 font-medium">{row.date}</td>
                  <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-emerald-400 whitespace-nowrap">
                    {row.time}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-zinc-100">
                    <div className="flex items-center gap-2">
                      <span>{row.courseSem}</span>
                      {row.sessionType && (
                        <span className="text-[10px] font-medium bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/30">
                          {row.sessionType}
                        </span>
                      )}
                    </div>
                    {row.sessionTitle && (
                      <div className="text-xs text-zinc-400 font-normal truncate max-w-xs mt-0.5">
                        {row.sessionTitle}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium bg-violet-500/15 text-violet-400 px-2.5 py-1 rounded-lg border border-violet-500/30 text-xs">
                      {row.subject || 'CS Lecture'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300">
                    <div className="flex items-center gap-1.5 font-medium">
                      <User className="w-4 h-4 text-indigo-400" />
                      <span>{row.teacherName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-sky-400" />
                      <span>{row.venue}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono tabular-nums text-zinc-400">
                    <span className="bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 text-[10px]">
                      {formatDuration(row.endMinutes - row.startMinutes)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Remove class for ${row.courseSem} (${row.time})?`)) {
                          onDeleteRow(row.id);
                        }
                      }}
                      title="Delete this class"
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer inline-flex items-center justify-center"
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
