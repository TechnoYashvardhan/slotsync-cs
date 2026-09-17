import React, { useState, useRef, useEffect } from 'react';
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

const PRESET_PROMPTS = [
  {
    label: '⚡ Find joint free slot',
    query: 'Find the best conflict-free common slot for BCA 1st Sem and BCA 3rd Sem today.',
  },
  {
    label: '🏫 When is Lab 1 free?',
    query: 'When is Lab 1 (Programming) completely free today for an extra session?',
  },
  {
    label: '📢 Draft student notice',
    query: 'Draft an official department circular for an upcoming Guest Lecture on "Artificial Intelligence & Distributed Systems" by Dr. Alan Turing in Seminar Hall A.',
  },
  {
    label: '📊 Audit timetable health',
    query: 'Analyze the current timetable for bottleneck rooms, back-to-back faculty workload, and prime unused gaps.',
  },
];

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

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(getGeminiApiKey());
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `### 👋 Welcome to your Gemini Timetable Copilot!\n\nI have real-time awareness of your **${schedule.length} departmental classes**, faculty assignments, and conflict-free slots on **${targetDate || 'today'}**.\n\n* **Try asking:** *"Find a 1.5-hour free slot for BCA & MCA"* or *"When is Lab 1 free?"*\n* **Automated Notice:** *"Draft a WhatsApp circular for Dr. Turing's guest lecture"*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, targetDate, schedule.length]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-md">
      <div className="relative w-full sm:max-w-2xl h-[100dvh] sm:h-[88vh] sm:max-h-[780px] bg-white sm:border border-slate-200 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-emerald-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  Gemini SlotSync Copilot
                </h3>
                <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-mono font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  AI Active
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[220px] sm:max-w-none">
                Contextual Scheduling Assistant for CS Timetable Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              title="Configure Gemini API Key"
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                showKeyConfig
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Key Settings</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Key Configuration Drawer */}
        {showKeyConfig && (
          <div className="p-4 bg-indigo-50/70 border-b border-indigo-200 animate-in slide-in-from-top-2 duration-150 flex-shrink-0">
            <form onSubmit={handleSaveKey} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  Google Gemini API Key Configuration
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
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
                  className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm cursor-pointer transition"
                >
                  Save Key
                </button>
              </div>
              <p className="text-[10px] text-indigo-700">
                Your key is stored securely in your browser's local storage and used directly for Google AI Studio API calls.
              </p>
            </form>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 bg-slate-50/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 sm:gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-xs shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-600/10'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-current/10 opacity-75">
                  <span className="font-bold text-[10px] uppercase tracking-wider">
                    {msg.sender === 'user' ? 'You' : 'Gemini Copilot'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]">{msg.timestamp}</span>
                    {msg.sender === 'assistant' && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy text"
                        className="hover:opacity-100 opacity-60 transition cursor-pointer p-1"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Content: Rich Markdown for Assistant, Clean Text for User */}
                {msg.sender === 'assistant' ? (
                  <MarkdownView content={msg.text} />
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed font-sans font-medium">
                    {msg.text}
                  </div>
                )}

                {/* Actionable Booking Card (if extracted) */}
                {msg.actionableBooking && (
                  <div className="mt-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-slate-900 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Recommended Slot Reservation</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        <span>{msg.actionableBooking.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>
                          {minutesToReadable(msg.actionableBooking.startMinutes)} –{' '}
                          {minutesToReadable(msg.actionableBooking.endMinutes)}
                        </span>
                      </div>
                      {msg.actionableBooking.batch && (
                        <div className="col-span-2 font-semibold text-indigo-700">
                          Batch: {msg.actionableBooking.batch}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTriggerBooking(msg.actionableBooking!)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                    >
                      <span>Open Booking Modal for this Slot</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 text-xs text-slate-500 shadow-sm flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Gemini is analyzing timetable and checking constraints...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompt Chips */}
        <div className="px-4 py-2.5 bg-slate-100/70 border-t border-slate-200 overflow-x-auto flex gap-2 no-scrollbar">
          {PRESET_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(p.query)}
              disabled={isLoading}
              className="text-[11px] font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200/90 hover:border-indigo-300 px-3 py-1.5 rounded-xl whitespace-nowrap shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex-shrink-0">
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
              placeholder="Ask Gemini (e.g. Find 2-hr slot for BCA, or When is Lab 1 free?)..."
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm font-medium disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs font-black flex items-center gap-1.5 sm:gap-2 shadow-md transition cursor-pointer flex-shrink-0 ${
                !inputText.trim() || isLoading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-emerald-600/20 active:scale-95'
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
