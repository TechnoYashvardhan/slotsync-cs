import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  X,
  Send,
  Key,
  Bot,
  User,
  Copy,
  Check,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { ScheduleRow, FreeSlot } from '../types/schedule';
import {
  askGeminiScheduler,
  generateStudentNotice,
  analyzeDepartmentSchedule,
  getGeminiApiKey,
  saveGeminiApiKey,
  hasCustomApiKey,
  ActionableSlotBooking,
} from '../services/geminiService';
import { minutesToReadable } from '../utils/timeUtils';
import { MarkdownView } from './MarkdownView';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionableBooking?: ActionableSlotBooking | null;
}

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  selectedBatches: string[];
  allBatches: string[];
  allTeachers: string[];
  allVenues: string[];
  schedule: ScheduleRow[];
  freeSlots: FreeSlot[];
  onBookSlot: (slot: {
    date: string;
    startMinutes: number;
    endMinutes: number;
    batch?: string;
    subject?: string;
    teacherName?: string;
    venue?: string;
    sessionTitle?: string;
  }) => void;
}

export const GeminiAssistantModal: React.FC<GeminiAssistantModalProps> = ({
  isOpen,
  onClose,
  targetDate,
  selectedBatches,
  allBatches,
  allTeachers,
  allVenues,
  schedule,
  freeSlots,
  onBookSlot,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetPrompts: { label: string; query: string }[] = useMemo(() => {
    const b1 = allBatches[0] || 'BCA 1st Sem';
    const b2 = allBatches[1] || allBatches[0] || 'BCA 3rd Sem';
    const v1 = allVenues[0] || 'Lab';
    const t1 = allTeachers[0] || 'Faculty Member';

    return [
      {
        label: '⚡ Find joint free slot',
        query: `Find the best conflict-free common slot for ${b1} and ${b2} today.`,
      },
      {
        label: `🏫 When is ${v1} free?`,
        query: `When is ${v1} completely free today for an extra session?`,
      },
      {
        label: '📢 Draft student notice',
        query: `Draft an official department circular for an upcoming session by ${t1} in ${v1}.`,
      },
      {
        label: '📊 Audit timetable health',
        query: 'Analyze the current timetable for bottleneck rooms, back-to-back faculty workload, and prime unused gaps.',
      },
    ];
  }, [allBatches, allVenues, allTeachers]);

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(getGeminiApiKey());
      const b1 = allBatches[0] || 'BCA';
      const v1 = allVenues[0] || 'Lab';
      const t1 = allTeachers[0] || 'Faculty';

      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `### 👋 Welcome to your Gemini Timetable Copilot!\n\nI have real-time awareness of your **${schedule.length} departmental classes**, faculty assignments, and conflict-free slots on **${targetDate || 'today'}**.\n\n* **Try asking:** *"Find a 1-hour free slot for ${b1}"* or *"When is ${v1} free?"*\n* **Automated Notice:** *"Draft an official circular for ${t1}'s session"*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, targetDate, schedule.length, allBatches, allVenues, allTeachers]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await askGeminiScheduler(query, {
        targetDate,
        selectedBatches,
        freeSlots,
        schedule,
        allTeachers,
        allVenues,
        allBatches,
      });

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionableBooking: response.actionableBooking,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Error connecting to Gemini:**\n${err.message || 'Please check your API key or network connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    saveGeminiApiKey(apiKeyInput.trim());
    setShowKeyConfig(false);
    alert('Gemini API key updated successfully!');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTriggerBooking = (booking: ActionableSlotBooking) => {
    onClose();
    onBookSlot({
      date: booking.date || targetDate,
      startMinutes: booking.startMinutes || 480,
      endMinutes: booking.endMinutes || 540,
      batch: booking.batch,
      subject: booking.subject,
      teacherName: booking.teacherName,
      venue: booking.venue,
      sessionTitle: booking.sessionTitle,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full sm:max-w-2xl h-[100dvh] sm:h-[88vh] sm:max-h-[780px] bg-zinc-900 border-0 sm:border border-white/[0.08] rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-zinc-900/95 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-100 tracking-tight">
                  Gemini SlotSync Copilot
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-violet-500/15 text-violet-400 border border-violet-500/25">
                  AI Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium truncate max-w-[220px] sm:max-w-none">
                Contextual Scheduling Assistant for CS Timetable Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              title="Configure Gemini API Key"
              className={`p-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                showKeyConfig
                  ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border-white/[0.06]'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Key Settings</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Key Configuration Drawer */}
        {showKeyConfig && (
          <div className="p-4 bg-zinc-850 border-b border-white/[0.08] animate-in slide-in-from-top-2 duration-150 flex-shrink-0">
            <form onSubmit={handleSaveKey} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-violet-400" />
                  Google Gemini API Key Configuration
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste your Gemini API key (AQ... or AIzaSy...)"
                  className="flex-1 bg-zinc-800 border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-sm cursor-pointer transition"
                >
                  Save Key
                </button>
              </div>
              <p className="text-[10px] text-zinc-400">
                Your key is stored securely in your browser's local storage and used directly for Google AI Studio API calls.
              </p>
            </form>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-950/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 text-xs shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-600/10'
                    : 'bg-zinc-900/90 text-zinc-200 border border-white/[0.08] rounded-bl-none'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-white/[0.06] opacity-75">
                  <span className="font-bold text-[10px] uppercase tracking-wider">
                    {msg.sender === 'user' ? 'You' : 'Gemini Copilot'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400">{msg.timestamp}</span>
                    {msg.sender === 'assistant' && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text"
                        className="hover:opacity-100 opacity-60 transition cursor-pointer p-1"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-zinc-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Content */}
                {msg.sender === 'assistant' ? (
                  <MarkdownView content={msg.text} />
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed font-sans font-medium text-white">
                    {msg.text}
                  </div>
                )}

                {/* Actionable Booking Card */}
                {msg.actionableBooking && (
                  <div className="mt-3.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-zinc-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Recommended Slot Reservation</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        <span>{msg.actionableBooking.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>
                          {minutesToReadable(msg.actionableBooking.startMinutes)} –{' '}
                          {minutesToReadable(msg.actionableBooking.endMinutes)}
                        </span>
                      </div>
                      {msg.actionableBooking.batch && (
                        <div className="col-span-2 font-semibold text-indigo-400">
                          Batch: {msg.actionableBooking.batch}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTriggerBooking(msg.actionableBooking!)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-98"
                    >
                      <span>Open Booking Modal for this Slot</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-200 border border-white/[0.08] flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-zinc-900 border border-white/[0.08] rounded-2xl rounded-bl-none p-4 text-xs text-zinc-400 shadow-sm flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Gemini is analyzing timetable and checking constraints...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompt Chips */}
        <div className="px-4 py-2.5 bg-zinc-900/90 border-t border-white/[0.06] overflow-x-auto flex gap-2 no-scrollbar">
          {presetPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p.query)}
              disabled={isLoading}
              className="text-[11px] font-semibold text-zinc-300 hover:text-indigo-400 bg-zinc-800/80 hover:bg-zinc-750 border border-white/[0.06] hover:border-indigo-500/30 px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-zinc-900 border-t border-white/[0.08] flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask Gemini (e.g. Find 1-hr slot for ${allBatches[0] || 'BCA'}, or When is ${allVenues[0] || 'lab'} free?)...`}
              disabled={isLoading}
              className="flex-1 bg-zinc-800/70 border border-white/[0.08] rounded-xl px-4 py-2.5 sm:py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition-all font-medium disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 shadow-md transition cursor-pointer flex-shrink-0 ${
                !inputText.trim() || isLoading
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/[0.04]'
                  : 'bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 hover:from-violet-500 hover:to-emerald-500 text-white shadow-lg shadow-violet-600/20 active:scale-98'
              }`}
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
