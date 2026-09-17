import type { ScheduleRow, FreeSlot } from '../types/schedule';
import { minutesToReadable } from '../utils/timeUtils';

const STORAGE_KEY = 'slotsync_gemini_api_key';

export interface ActionableSlotBooking {
  date: string;
  startMinutes: number;
  endMinutes: number;
  batch?: string;
  subject?: string;
  teacherName?: string;
  venue?: string;
  sessionTitle?: string;
}

export function getGeminiApiKey(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const customKey = window.localStorage.getItem(STORAGE_KEY);
    if (customKey && customKey.trim()) {
      return customKey.trim();
    }
  }
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY);
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  return '';
}

export function saveGeminiApiKey(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (key.trim()) {
      window.localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export function hasCustomApiKey(): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    return Boolean(window.localStorage.getItem(STORAGE_KEY));
  }
  return false;
}

export interface GeminiResponse {
  text: string;
  actionableBooking?: ActionableSlotBooking | null;
}

const CANDIDATE_MODELS = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];

/**
 * Direct REST caller to Google Generative Language API.
 * Uses gemini-3.6-flash by default, falls back gracefully across active models.
 */
export async function generateGeminiContent(
  prompt: string,
  systemInstruction?: string,
  model = 'gemini-3.6-flash'
): Promise<GeminiResponse> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('No Gemini API key found. Please provide an API key in the AI Assistant settings.');
  }

  const payload: any = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      maxOutputTokens: 1500,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const modelsToTry = [model, ...CANDIDATE_MODELS.filter((m) => m !== model)];
  let lastErrorMessage = '';

  for (const currentModel of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text: string = candidate?.content?.parts?.[0]?.text || 'No response generated.';

        // Extract any action trigger tag <<<BOOK:{...}>>>
        let actionableBooking: ActionableSlotBooking | null = null;
        const actionMatch = text.match(/<<<BOOK:([\s\S]*?)>>>/);
        if (actionMatch) {
          try {
            actionableBooking = JSON.parse(actionMatch[1].trim());
          } catch (e) {
            console.warn('Could not parse actionable booking JSON from Gemini:', e);
          }
        }

        // Clean text by stripping raw action tag
        const cleanText = text.replace(/<<<BOOK:[\s\S]*?>>>/g, '').trim();

        return {
          text: cleanText,
          actionableBooking,
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        lastErrorMessage =
          errorData?.error?.message ||
          `Gemini API returned HTTP ${response.status} (${response.statusText})`;
        // If not a model error, don't keep retrying other models
        if (response.status !== 404 && response.status !== 400) {
          throw new Error(lastErrorMessage);
        }
      }
    } catch (err: any) {
      lastErrorMessage = err.message || 'Network error connecting to Gemini';
    }
  }

  throw new Error(lastErrorMessage || 'Failed to connect to Google Gemini service.');
}

/**
 * Builds schedule context and calls Gemini to answer timetable questions
 * or assist in booking / slot recommendations.
 */
export async function askGeminiScheduler(
  userQuery: string,
  context: {
    targetDate: string;
    selectedBatches: string[];
    freeSlots: FreeSlot[];
    schedule: ScheduleRow[];
    allTeachers: string[];
    allVenues: string[];
    allBatches: string[];
  }
): Promise<GeminiResponse> {
  const currentClasses = context.schedule
    .filter((r) => r.date === context.targetDate)
    .map(
      (r) =>
        `- [${r.time}] ${r.courseSem}: "${r.subject}" with ${r.teacherName} at ${r.venue} (${r.startMinutes}-${r.endMinutes}m)`
    )
    .join('\n');

  const freeSlotsFormatted =
    context.freeSlots.length > 0
      ? context.freeSlots
          .map(
            (s) =>
              `- Free Slot: ${s.formattedRange} (${s.durationFormatted}) [${s.startMinutes}-${s.endMinutes}m] free for: ${s.applicableBatches.join(', ')}`
          )
          .join('\n')
      : 'None identified for the selected batches and duration.';

  const systemInstruction = `You are "Gemini SlotSync AI", the dedicated intelligent scheduling assistant for a University Computer Science Department.
Department Operating Window: 08:00 AM (480 mins) to 05:00 PM (1020 mins).
MANDATORY DEPARTMENT LUNCH BREAK: 10:30 AM (630 mins) to 11:45 AM (705 mins). No classes, guest lectures, or laboratory sessions can ever be scheduled during this 75-minute recess under any circumstances.

CURRENT TIMETABLE CONTEXT:
- Active Target Date: ${context.targetDate}
- Selected Batches: ${context.selectedBatches.join(', ')}
- All Known Batches: ${context.allBatches.join(', ')}
- Known Faculty Members: ${context.allTeachers.join(', ')}
- Known Venues / Labs: ${context.allVenues.join(', ')}

SCHEDULED CLASSES ON ${context.targetDate}:
${currentClasses || 'No classes currently scheduled on this date.'}

COMPUTED CONFLICT-FREE COMMON SLOTS ON ${context.targetDate}:
${freeSlotsFormatted}

YOUR INSTRUCTIONS:
1. Provide concise, clear, authoritative responses tailored for university administrators and CS professors.
2. If the user asks when a slot is free, evaluate the current free slots and teacher/venue availability accurately. NEVER suggest or accept times between 10:30 AM and 11:45 AM because that is the mandatory Department Lunch Break.
3. If the user wants to book or reserve a slot (e.g. "book a guest lecture for BCA 1st Sem at 1 PM with Dr. Turing"), check for conflicts. If valid, you can provide an actionable booking tag in this exact syntax at the end of your response:
<<<BOOK:{"date":"${context.targetDate}","startMinutes":START_MINS,"endMinutes":END_MINS,"batch":"BATCH_NAME","subject":"SUBJECT_NAME","teacherName":"TEACHER_NAME","venue":"VENUE_NAME","sessionTitle":"TITLE"}>>>
(e.g., START_MINS 780 for 01:00 PM, END_MINS 870 for 02:30 PM). NEVER emit a booking tag that overlaps 10:30 AM (630 mins) to 11:45 AM (705 mins).
4. If there is a collision or if the requested time falls within the 10:30 AM – 11:45 AM Lunch Break, explain specifically why (e.g. "That overlaps the mandatory Department Lunch Break from 10:30 AM to 11:45 AM" or specify which teacher/venue is occupied) and suggest alternative conflict-free times.
5. Format your response with markdown, bullet points, and bold timestamps.`;

  return generateGeminiContent(userQuery, systemInstruction);
}

/**
 * Generates an official department student circular for a newly booked session.
 */
export async function generateStudentNotice(sessionDetails: {
  sessionTitle: string;
  subject: string;
  teacherName: string;
  venue: string;
  date: string;
  timeRange: string;
  batches: string[];
  sessionType?: string;
}): Promise<string> {
  const prompt = `Draft a professional, ready-to-broadcast student circular / notice for a Computer Science department event with these details:
- Title/Topic: ${sessionDetails.sessionTitle}
- Subject/Domain: ${sessionDetails.subject}
- Speaker / Faculty: ${sessionDetails.teacherName}
- Date: ${sessionDetails.date}
- Time: ${sessionDetails.timeRange}
- Venue: ${sessionDetails.venue}
- Target Batches: ${sessionDetails.batches.join(', ')}
- Category: ${sessionDetails.sessionType || 'Guest Session'}

Include:
1. Official Department Header ("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING")
2. Catchy yet formal announcement headline
3. Key bullet points (Date, Time, Venue, Speaker profile reminder)
4. Brief note explaining why this session is important for CS students (1-2 sentences on career/technical relevance)
5. Notice sign-off (Timetable Coordinator / HOD)
6. A short copy-ready WhatsApp/Slack broadcast snippet at the bottom.`;

  const result = await generateGeminiContent(prompt);
  return result.text;
}

/**
 * Analyzes department timetable health, faculty workload, and room utilization.
 */
export async function analyzeDepartmentSchedule(
  schedule: ScheduleRow[],
  targetDate: string
): Promise<string> {
  const dateClasses = schedule.filter((r) => r.date === targetDate);
  const prompt = `Analyze this Computer Science Department timetable for ${targetDate}:
Total Scheduled Classes: ${dateClasses.length}
Lectures list:
${dateClasses.map((c) => `- ${c.time} | ${c.courseSem} | ${c.subject} | ${c.teacherName} | ${c.venue}`).join('\n')}

Provide an executive 3-point diagnostic:
1. Room & Lab Utilization (identify bottleneck rooms vs underutilized classrooms)
2. Faculty Workload & Back-to-Back strain (check if any professor has consecutive classes without rest)
3. Strategic Prime Gaps (best available open windows for guest lectures or exams)
Keep it crisp, actionable, and formatted with bullet points.`;

  const result = await generateGeminiContent(prompt);
  return result.text;
}
