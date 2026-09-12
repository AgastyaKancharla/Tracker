# ChronoTrack: Unified Personal, Business & Client Management Hub

A modern, high-density tracker inspired by **Linear** and **Raycast**, built with Next.js, React, Tailwind CSS, and Lucide Icons. Designed for solo founders, freelancers, consultants, and professionals balancing three distinct spheres of life and work:

1. 🌌 **Personal Realm**: Errands, health checkups, workouts, learning, and daily wellness habits.
2. 💼 **Business Hub**: Revenue, corporate operations, marketing campaigns, tax prep, and strategic goals.
3. 🤝 **Client Hub**: Client roster, active deliverables, retainer budgets, billing rates, and meetings.

---

## ✨ Features & Architecture

- **Unified & Sphere-Filtered Workspaces**:
  - Switch smoothly between **All**, **Personal** (emerald), **Business** (indigo), and **Clients** (amber).
- **Multiple High-Productivity Views**:
  - **Mission Control (Dashboard)**: Real-time overview of today's scheduled agenda, in-progress sprint tasks, active client health, and daily habit consistency.
  - **Kanban Workflow**: Linear-style columns (`Backlog`, `To Do`, `In Progress`, `Review`, `Completed`) with quick-move controls and priority badges.
  - **Task & Event Ledger (List View)**: High-density data table with inline status changes, multi-field sorting, and overdue indicators.
  - **Interactive Calendar & Agenda**: Full monthly grid with scheduled timed events, meeting details, and day-by-day agenda drill-down.
  - **Client Hub**: Dedicated client profiles showing hourly/retainer rates, total project value, and deliverable progress bars.
  - **Daily Routine & Habit Matrix**: 7-day visual consistency grid with streak counters (🔥) and routine categories.
- **Raycast-Style Command Palette (`⌘K` / `Ctrl+K`)**:
  - Instant fuzzy search across tasks, meetings, client names, and quick action shortcuts.
- **Offline-Ready & Persistent**:
  - Instant local synchronization with `localStorage`, JSON data backup export, and one-click demo data reset.

---

## 🚀 Getting Started

### 1. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Production Build & Start
```bash
npm run build
npm run start
```
