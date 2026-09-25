import React, { useState } from 'react';
import { ScheduleRow } from '../types/schedule';
import { Search, Trash2, Edit2, Check, X, Filter, MapPin, User, Layers, Plus } from 'lucide-react';
import { formatDuration, parseTimeRange, formatTimeRangeToCSV } from '../utils/timeUtils';

interface ScheduleTableProps {
  schedule: ScheduleRow[];
  selectedDate: string;
  onDeleteRow: (id: string) => void;
  onUpdateRow?: (row: ScheduleRow) => void;
  onOpenBooking?: () => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedule,
  selectedDate,
  onDeleteRow,
  onUpdateRow,
  onOpenBooking,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByDateOnly, setFilterByDateOnly] = useState(true);

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

  const handleSaveEdit = (rowId: string) => {
    if (!editForm.date || !editForm.time || !editForm.courseSem || !editForm.teacherName || !editForm.venue) {
      alert('All fields are required.');
      return;
    }

    const parsedTime = parseTimeRange(editForm.time);
    if (!parsedTime) {
      alert(`Invalid Time format "${editForm.time}". Example: "8:15 AM - 9:15 AM".`);
      return;
    }

    if (onUpdateRow) {
      onUpdateRow({
        id: rowId,
        date: editForm.date.trim(),
        time: formatTimeRangeToCSV(parsedTime.startMinutes, parsedTime.endMinutes),
        courseSem: editForm.courseSem.trim(),
        subject: editForm.subject.trim() || 'CS Lecture',
        teacherName: editForm.teacherName.trim(),
        venue: editForm.venue.trim(),
        startMinutes: parsedTime.startMinutes,
        endMinutes: parsedTime.endMinutes,
      });
    }
    setEditingRowId(null);
  };

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
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            Search, filter, edit, or remove classes in real time.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search faculty, batch, room..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-800/60 border border-white/[0.08] rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 transition-all font-medium"
            />
          </div>

          {/* Date Filter Toggle */}
          <button
            type="button"
            onClick={() => setFilterByDateOnly(!filterByDateOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterByDateOnly
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                : 'bg-zinc-800/60 text-zinc-400 border border-white/[0.05] hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{filterByDateOnly ? `Only ${selectedDate}` : 'All Dates'}</span>
          </button>

          {/* Quick Book CTA Button */}
          {onOpenBooking && (
            <button
              type="button"
              onClick={onOpenBooking}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-card flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Card List (< 768px) */}
      <div className="block md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs font-medium">
            No matching timetable records found.
          </div>
        ) : (
          filtered.map((row) => {
            const isEditing = editingRowId === row.id;

            if (isEditing) {
              return (
                <div key={row.id} className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 font-bold text-indigo-300">
                    <span>Editing Class</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSaveEdit(row.id)}
                        className="p-1 rounded bg-emerald-600 text-white"
                        title="Save"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setEditingRowId(null)}
                        className="p-1 rounded bg-zinc-800 text-zinc-400"
                        title="Cancel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="bg-zinc-900 border border-white/[0.08] rounded px-2 py-1 text-zinc-100 font-mono"
                      placeholder="Date"
                    />
                    <input
                      type="text"
                      value={editForm.time}
                      onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                      className="bg-zinc-900 border border-white/[0.08] rounded px-2 py-1 text-zinc-100 font-mono"
                      placeholder="Time"
                    />
                    <input
                      type="text"
                      value={editForm.courseSem}
                      onChange={(e) => setEditForm({ ...editForm, courseSem: e.target.value })}
                      className="bg-zinc-900 border border-white/[0.08] rounded px-2 py-1 text-zinc-100"
                      placeholder="Batch"
                    />
                    <input
                      type="text"
                      value={editForm.venue}
                      onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                      className="bg-zinc-900 border border-white/[0.08] rounded px-2 py-1 text-zinc-100"
                      placeholder="Venue"
                    />
                    <input
                      type="text"
                      value={editForm.subject}
                      onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                      className="col-span-2 bg-zinc-900 border border-white/[0.08] rounded px-2 py-1 text-zinc-100"
                      placeholder="Subject"
                    />
                    <input
                      type="text"
                      value={editForm.teacherName}
                      onChange={(e) => setEditForm({ ...editForm, teacherName: e.target.value })}
                      className="col-span-2 bg-zinc-900 border border-white/[0.08] rounded px-2 py-1 text-zinc-100"
                      placeholder="Teacher"
                    />
                  </div>
                </div>
              );
            }

            return (
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
                  <div className="flex items-center gap-1">
                    {onUpdateRow && (
                      <button
                        onClick={() => handleStartEdit(row)}
                        title="Edit this class"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Remove class for ${row.courseSem} (${row.time})?`)) {
                          onDeleteRow(row.id);
                        }
                      }}
                      title="Delete this class"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
            );
          })
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
              filtered.map((row) => {
                const isEditing = editingRowId === row.id;

                if (isEditing) {
                  return (
                    <tr key={row.id} className="bg-indigo-950/30 border-y border-indigo-500/30">
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
                          className="w-full bg-zinc-900 border border-white/[0.1] rounded px-2 py-1 text-zinc-100 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={editForm.subject}
                          onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                          className="w-full bg-zinc-900 border border-white/[0.1] rounded px-2 py-1 text-zinc-100 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={editForm.teacherName}
                          onChange={(e) => setEditForm({ ...editForm, teacherName: e.target.value })}
                          className="w-full bg-zinc-900 border border-white/[0.1] rounded px-2 py-1 text-zinc-100 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={editForm.venue}
                          onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                          className="w-full bg-zinc-900 border border-white/[0.1] rounded px-2 py-1 text-zinc-100 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2 text-center text-xs font-mono text-zinc-500">
                        Edit Mode
                      </td>
                      <td className="py-2 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(row.id)}
                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white mr-1 cursor-pointer transition"
                          title="Save Changes"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRowId(null)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 cursor-pointer transition"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={row.id} className="hover:bg-zinc-800/40 transition-colors group">
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
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {onUpdateRow && (
                        <button
                          onClick={() => handleStartEdit(row)}
                          title="Edit this class"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer mr-1 inline-flex items-center justify-center"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(`Remove class for ${row.courseSem} (${row.time})?`)) {
                            onDeleteRow(row.id);
                          }
                        }}
                        title="Delete this class"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
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
  );
};
