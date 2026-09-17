# SlotSync CS — Departmental Timetable & Free-Slot Engine

An intelligent, automated class timetable and free-slot scheduling engine built for Computer Science Departments. Powered by **React 19**, **Tailwind CSS**, **Vite**, and **Google Gemini AI**.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### 2. Environment Setup
Copy the example environment file and add your Google Gemini API key:
```bash
cp .env.example .env
```
Inside `.env`:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: You can also configure or override your Gemini API key directly inside the app via the AI Copilot settings modal).*

### 3. Install & Run Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## ✨ Key Features

### 🔍 1. Slot Inversion Engine
- Computes open free periods by mathematically inverting scheduled lectures within official operating hours (**08:00 AM – 05:00 PM**).
- Multi-batch coordination finds common free windows where all selected semesters are simultaneously available.
- Configurable minimum duration filters (`30m`, `45m`, `1h`, `1.5h`, `2h`, `3h`).

### 📅 2. Weekly Master Timetable (Monday – Saturday)
- Academic 6-day master grid with high-contrast, razor-sharp partitions.
- Fixed uniform column geometry (`table-fixed`) across all working days.
- **Simultaneous Classes Grouping**: Clearly banners concurrent lectures happening across parallel batches and labs.
- One-click vacant slot reservation directly into empty schedule periods.

### 📊 3. Department Schedule Matrix (Timeline Visualizer)
- Visual Gantt timeline comparing occupied lectures and free slots side-by-side.
- Master common slot track identifying periods where all cohorts are free.
- Real-time double-booking clash verification for teachers and venues.

### 🤖 4. Gemini AI Timetable Copilot
- Integrated with **Google Gemini (`gemini-3.6-flash`)**.
- Real-time departmental context awareness (classes, teachers, labs, and free slots).
- Interactive booking triggers recommended directly by the assistant.
- Instant drafting of student notices, WhatsApp circulars, and room audits.
- Full markdown formatting with typography rendering.

### 🔁 5. Recurring Weekly Booking & Clash Prevention
- Reserve recurring sessions across **2**, **4**, **8**, or **12 weeks**.
- Pre-checks every future week for faculty, venue, and batch conflicts before booking.

### 📱 6. Mobile-First UI/UX
- Responsive day routine switcher with touch day tabs (`Mon`, `Tue`, `Wed`, etc.).
- High-readability card layouts for class schedules on mobile viewports.
- Touch-friendly horizontal navigation bar.

### 💾 7. Data Center & Reporting
- 5 and 6-column CSV schedule parser with instant formatting validation.
- Built-in CS Department demo dataset (37 lectures across BCA, MCA, and B.Tech CS).
- One-click CSV export and official departmental PDF timetable generation.
