import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Clock,
  Search,
  Calendar,
  CalendarDays,
  Layers,
  Database,
  Sparkles,
  Zap,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Activity,
  Flame,
  BookOpen,
  User,
  MapPin,
  Utensils,
  ArrowRight,
  SlidersHorizontal,
  Lightbulb,
  Plus,
  Bot,
  Keyboard,
  FileSpreadsheet,
  Printer,
  Compass,
} from 'lucide-react';
import type { ScheduleRow, FreeSlot } from '../types/schedule';
import type { NavTab } from './Sidebar';

interface DashboardViewProps {
  schedule: ScheduleRow[];
  allBatches: string[];
  allTeachers: string[];
  allVenues: string[];
  availableDates: string[];
  commonFreeSlotsCount: number;
  onNavigate: (tab: NavTab) => void;
  onOpenAIModal: () => void;
  onOpenBooking: () => void;
  onExportPDF: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  schedule,
  allBatches,
  allTeachers,
  allVenues,
  availableDates,
  commonFreeSlotsCount,
  onNavigate,
  onOpenAIModal,
  onOpenBooking,
  onExportPDF,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Compute key academic metrics
  const totalClasses = schedule.length;
  const totalTeachingMinutes = schedule.reduce(
    (acc, row) => acc + Math.max(0, row.endMinutes - row.startMinutes),
    0
  );
  const totalTeachingHours = (totalTeachingMinutes / 60).toFixed(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const TOOLS_LIST = [
    {
      id: 'finder' as NavTab,
      title: 'Smart Slot Finder',
      tagline: 'Multi-Batch Gap & Free Window Calculator',
      description:
        'Find common free windows across single or multiple semesters with custom duration sliders (30m to 180m), auto-calculated 5-minute transit buffers, and 1-click reservation.',
      icon: Search,
      gradient: 'from-indigo-500/20 via-sky-500/10 to-transparent',
      borderColor: 'border-indigo-500/30 hover:border-indigo-500/60',
      badge: 'Algorithm Powered',
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      actionText: 'Launch Slot Finder',
    },
    {
      id: 'timeline' as NavTab,
      title: 'Department Master Timeline',
      tagline: '3D Gantt Matrix & Conflict Simulator',
      description:
        'Compare Semester Batches, Faculty Workloads, and Lab/Room Occupancy side-by-side along the 08:00 AM – 05:00 PM ruler with a live "What-If" conflict scanner and "Who is Free" radar.',
      icon: Calendar,
      gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
      borderColor: 'border-purple-500/30 hover:border-purple-500/60',
      badge: '3-Way Matrix',
      badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      actionText: 'Open Timeline Matrix',
    },
    {
      id: 'weekly' as NavTab,
      title: 'Weekly Timetable Studio',
      tagline: 'De-Cluttered Daily Routine Cards',
      description:
        'Mon–Sat academic routine with smart subject color coding, zero text truncation, full teacher & lab badges, visible transit gaps, lunch recess, and free day highlights.',
      icon: CalendarDays,
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
      badge: 'Zero Clutter',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      actionText: 'View Weekly Routines',
    },
    {
      id: 'table' as NavTab,
      title: 'Live Class Directory',
      tagline: 'Searchable Registry & Inline Editor',
      description:
        'Browse all scheduled lectures across the department with multi-field search, batch/teacher/venue filters, and on-the-fly inline cell editing.',
      icon: Layers,
      gradient: 'from-sky-500/20 via-blue-500/10 to-transparent',
      borderColor: 'border-sky-500/30 hover:border-sky-500/60',
      badge: 'Inline Editing',
      badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      actionText: 'Browse Class Registry',
    },
    {
      id: 'data' as NavTab,
      title: 'Real-Time CSV & Data Studio',
      tagline: 'Visual Spreadsheet & Raw CSV Editor',
      description:
        'Add, edit, duplicate, or delete classes without re-uploading spreadsheets. Includes an interactive visual spreadsheet grid and live raw CSV code validator with localStorage persistence.',
      icon: Database,
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'border-amber-500/30 hover:border-amber-500/60',
      badge: 'Live Parser',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      actionText: 'Open Data Studio',
    },
    {
      id: 'ai' as any,
      title: 'Gemini AI Academic Copilot',
      tagline: 'Intelligent Timetable Assistant',
      description:
        'Query the timetable in plain English: "When is Mr. Bhupendra free for a doubt session?", "Find an empty lab for a workshop", or ask for timetable optimization recommendations.',
      icon: Bot,
      gradient: 'from-rose-500/20 via-fuchsia-500/10 to-transparent',
      borderColor: 'border-rose-500/30 hover:border-rose-500/60',
      badge: 'Gemini 3.7 AI',
      badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      actionText: 'Chat with AI Copilot',
      isAI: true,
    },
  ];

  const PRO_TIPS = [
    {
      icon: Sparkles,
      title: 'Multi-Batch Joint Scheduling',
      text: 'Select multiple batches in Find Slots or Timeline to reveal joint "Common Free Slots" — ideal for department workshops, hackathons, and guest lectures.',
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      icon: Clock,
      title: 'The 5-Minute Transit Rule',
      text: 'SlotSync automatically enforces a 5-minute transit buffer between consecutive classes because students and professors cannot teleport between labs.',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: Utensils,
      title: 'Mandatory Recess Lock',
      text: 'The 10:30 AM – 11:45 AM window is strictly locked as Department Lunch Break across all views to prevent any accidental scheduling over food hours.',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: Keyboard,
      title: 'Productivity Hotkeys',
      text: 'Press Ctrl+B (or ⌘B) to collapse/expand the sidebar. Click any vacant dashed slot in the Weekly Grid or Matrix to pre-fill the booking drawer instantly.',
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      icon: SlidersHorizontal,
      title: 'Live What-If Simulator',
      text: 'Use the Simulator on the Timeline tab to test any proposed slot against Batch, Teacher, and Venue in real time before making a reservation.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      icon: FileSpreadsheet,
      title: 'Instant CSV Synchronization',
      text: 'Any change made in the Real-Time Data Center persists instantly to your browser storage and synchronizes across all tabs without requiring a page reload.',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
  ];

  const FAQ_ITEMS = [
    {
      q: 'How does SlotSync CS detect scheduling conflicts and double bookings?',
      a: 'SlotSync runs a 3-way conflict verification algorithm whenever a slot is evaluated. It cross-references the requested date and time interval against: (1) all existing batch commitments, (2) the faculty member’s assigned schedule across all batches, (3) the room/lab occupancy, and (4) the mandatory department lunch break. It also incorporates a 5-minute transit buffer to ensure students and teachers have travel time between classrooms.',
    },
    {
      q: 'What is the "Weekly Routine Cards" view and why does it look so clean?',
      a: 'Unlike traditional timetable grids that try to stack all semesters into single tiny table cells (causing severe clutter and truncated names), the Weekly Routine Studio isolates your selected batch (e.g., BCA 1st Sem) into 6 clear Mon–Sat daily cards. Each card displays full non-truncated subject titles, color-coded badges, faculty names, room numbers, lunch breaks, and free booking gaps.',
    },
    {
      q: 'How can I schedule a joint workshop for multiple batches at the same time?',
      a: 'Go to the "Find Slots" tab or "Timeline" tab, select multiple batches (e.g., BCA 1st Sem, BCA 3rd Sem, and MCA 1st Sem). SlotSync will compute the mathematical intersection of their free intervals and display glowing "COMMON SLOTS". Clicking on any common slot launches the booking modal with all batches pre-selected.',
    },
    {
      q: 'Can I add, edit, or delete classes without re-uploading a CSV file?',
      a: 'Yes! Navigate to the "Data Center" tab. Under Section 2 ("Live Timetable Studio & Real-Time CSV Editor"), you can click "+ Add Class" to insert a new session with autocomplete suggestions, click the edit icon on any row to inline-edit times or teachers, click copy to duplicate a row, or switch to "Raw CSV Code" to paste/edit raw CSV text directly with live validation.',
    },
    {
      q: 'How does the Live "What-If" Conflict Simulator work in the Timeline tab?',
      a: 'In the Timeline tab, the What-If Simulator allows you to enter any hypothetical start time, end time, batch, teacher, and venue. In real time, it checks for clashing sessions and either gives an "All Clear (0 Clashes)" green badge with an Instant Reserve button, or highlights the exact conflicts (e.g. "BCA Lab is occupied by Mrs. Anita") and suggests 1-click alternative venues or time slots.',
    },
    {
      q: 'Where is my schedule data stored and does it survive page refreshes?',
      a: 'All timetable modifications, newly booked classes, and imported CSV datasets are persisted in your browser’s localStorage under high-integrity keys. Your changes persist across reloads and tab closures automatically.',
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-300 pb-12">
      
      {/* 1. Hero Command Center Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-indigo-950/60 dark:via-zinc-900/90 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-500/20 p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
        
        {/* Decorative Glow Circles */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>SlotSync CS Intelligence Suite • v2.4</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span>Conflict-Free Engine Active</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
              Master Timetable Hub & <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-600 via-sky-500 to-purple-600 dark:from-indigo-400 dark:via-sky-300 dark:to-purple-400 bg-clip-text text-transparent">
                Department Control Center
              </span>
            </h1>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Real-time academic scheduling, multi-batch free slot discovery, 3D Gantt matrices, and instant CSV synchronization for the Department of Computer Science & Engineering.
            </p>

            {/* Quick Action Launch Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('finder')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Search className="w-4 h-4" />
                <span>Find Available Slots</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('weekly')}
                className="px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-white/[0.1] text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer hover:border-indigo-500/40"
              >
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                <span>Weekly Routine Studio</span>
              </button>

              <button
                type="button"
                onClick={onOpenAIModal}
                className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer hover:border-purple-500/50"
              >
                <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>AI Copilot</span>
              </button>

              <button
                type="button"
                onClick={onOpenBooking}
                className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer hover:border-emerald-500/50"
              >
                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Book a Class</span>
              </button>
            </div>
          </div>

          {/* Live Department Overview Card */}
          <div className="lg:w-80 rounded-2xl bg-white/95 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-white/[0.08] p-5 space-y-4 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>System Status</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Live Sync</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Active Dates in Dataset</span>
                <span className="font-mono text-zinc-200 font-bold">{availableDates.length} Days</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Current Operating Window</span>
                <span className="font-mono text-indigo-400 font-semibold">08:00 AM – 05:00 PM</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Department Lunch Recess</span>
                <span className="font-mono text-amber-400 font-semibold">10:30 – 11:45 AM</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Transit Buffer Security</span>
                <span className="font-mono text-emerald-400 font-semibold">5 Min Enforced</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
              <span>Local Storage Engine</span>
              <span className="text-emerald-400 font-mono">100% Synced</span>
            </div>
          </div>

        </div>

      </div>

      {/* 2. Key Academic Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl space-y-2 hover:border-indigo-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Batches</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-zinc-100 font-mono">{allBatches.length}</div>
          <p className="text-[11px] text-zinc-500 truncate">Semesters Tracked</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl space-y-2 hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Total Classes</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-zinc-100 font-mono">{totalClasses}</div>
          <p className="text-[11px] text-zinc-500 truncate">In Master Schedule</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl space-y-2 hover:border-sky-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">CS Faculty</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-zinc-100 font-mono">{allTeachers.length}</div>
          <p className="text-[11px] text-zinc-500 truncate">Professors Active</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl space-y-2 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Labs & Venues</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-zinc-100 font-mono">{allVenues.length}</div>
          <p className="text-[11px] text-zinc-500 truncate">Dedicated Rooms</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl space-y-2 hover:border-amber-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Teaching Load</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-zinc-100 font-mono">{totalTeachingHours}h</div>
          <p className="text-[11px] text-zinc-500 truncate">Total Lecture Hours</p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl space-y-2 hover:border-rose-500/30 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Conflict Rate</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">0%</div>
          <p className="text-[11px] text-emerald-500/80 truncate">Strictly Verified</p>
        </div>

      </div>

      {/* 3. Interactive Tool Showcase / Feature Navigator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              <span>Tool Suite & Feature Navigator</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Explore the specialized modules built for Computer Science department operations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS_LIST.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.title}
                className={`rounded-2xl bg-gradient-to-b ${tool.gradient} bg-zinc-900/90 border ${tool.borderColor} p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5 group`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-zinc-800/80 border border-white/[0.08] text-zinc-200 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className={`text-[10px] font-semibold font-mono px-2.5 py-1 rounded-full border ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">
                      {tool.title}
                    </h3>
                    <div className="text-xs font-mono text-zinc-400 mt-0.5">
                      {tool.tagline}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      if (tool.isAI) {
                        onOpenAIModal();
                      } else {
                        onNavigate(tool.id);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-800/70 hover:bg-indigo-600 text-zinc-200 hover:text-white border border-white/[0.08] hover:border-indigo-500/50 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-md group-hover:shadow-indigo-600/20"
                  >
                    <span>{tool.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Pro-Tips, System Rules & Best Practices */}
      <div className="rounded-3xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Department Best Practices & Pro Tips
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Key principles to maximize scheduling efficiency and eliminate room collisions
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRO_TIPS.map((tip, idx) => {
            const Icon = tip.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-zinc-850/50 border border-white/[0.05] hover:border-white/[0.12] space-y-2.5 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${tip.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-200">{tip.title}</h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {tip.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Frequently Asked Questions (FAQ) Accordion */}
      <div className="rounded-3xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/15 border border-sky-500/20 text-sky-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Frequently Asked Questions (FAQ)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Everything you need to know about SlotSync CS algorithms and workflow
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'bg-zinc-850/80 border-indigo-500/30'
                    : 'bg-zinc-850/40 border-white/[0.05] hover:border-white/[0.1]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-semibold text-zinc-200">
                    {faq.q}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-zinc-800 text-zinc-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-400' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-white/[0.04]">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Comprehensive Department Footer */}
      <footer className="rounded-3xl bg-white/95 dark:bg-zinc-950/80 border border-slate-200/80 dark:border-white/[0.08] p-6 sm:p-8 backdrop-blur-xl text-xs text-zinc-600 dark:text-zinc-500 space-y-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-white/[0.06]">
          
          <div className="space-y-2 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
                ⚡
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">SlotSync CS</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                Department Edition
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Intelligent Academic Timetable & Multi-Batch Free Slot Discovery Engine for Computer Science & Engineering.
            </p>
          </div>

          {/* Quick Nav Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-[11px]">
            <div className="space-y-2">
              <div className="font-semibold text-zinc-900 dark:text-zinc-300">Tool Suite</div>
              <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                <li>
                  <button onClick={() => onNavigate('finder')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Find Slots</button>
                </li>
                <li>
                  <button onClick={() => onNavigate('timeline')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Timeline Matrix</button>
                </li>
                <li>
                  <button onClick={() => onNavigate('weekly')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Weekly Routines</button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-zinc-900 dark:text-zinc-300">Management</div>
              <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                <li>
                  <button onClick={() => onNavigate('table')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Class Registry</button>
                </li>
                <li>
                  <button onClick={() => onNavigate('data')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Data Studio</button>
                </li>
                <li>
                  <button onClick={onOpenBooking} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Reserve Slot</button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-zinc-900 dark:text-zinc-300">Intelligence</div>
              <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                <li>
                  <button onClick={onOpenAIModal} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">AI Copilot</button>
                </li>
                <li>
                  <button onClick={onExportPDF} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">Export Timetable</button>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-500">
          <div>
            <span>© {new Date().getFullYear()} Dept. of Computer Science & Engineering • Built with ❤️ for Faculty & Students</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </span>
            <span className="text-zinc-400 dark:text-zinc-700">•</span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
