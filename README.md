# Delta State Election Results Web Application

A full-stack, data-driven web application built with **Node.js, Express.js, React.js, and MySQL** powered by the legacy `bincomphptest` database (`bincom_test.sql`).

---

## 🏛️ Key Features

1. **Dashboard & Statewide Leaderboard (`/`)**
   - High-level KPI metrics: Total Delta LGAs (25), Polling Stations, Accredited Parties, and Total Ballots Cast.
   - Real-time statewide vote distribution bar chart.
   - Interactive Delta State LGA directory grid with instant status badges.

2. **Individual Polling Unit Results (`/polling-units` & `/polling-units/:uniqueid`)**
   - Search polling units by station name, code, ward, or description.
   - Filter dynamically by Delta State LGAs (`state_id = 25`).
   - Detailed station scorecard displaying rank, party code, full name, votes, and vote share percentages.
   - Unit winner ribbon with party spotlight.

3. **Calculated Local Government Area Results (`/lga-results`)**
   - Dynamic LGA select dropdown populated live from `lga` (`WHERE state_id = 25`).
   - Pure **bottom-up aggregation**: sums `announced_pu_results.party_score` where `polling_unit.lga_id = ?`.
   - **Absolute Integrity Rule**: `announced_lga_results` is NEVER queried or used.
   - Collapsible **Calculation Audit & Verification Panel** showing the exact breakdown of contributing polling units for transparency.

4. **Political Party Management (`/parties`)**
   - Manage registered political parties in the `party` table.
   - Create new parties with automatic duplicate abbreviation prevention.
   - Update party information.
   - Delete parties with **historical result reference protection** (blocks deletion of parties referenced in `announced_pu_results` to prevent data corruption).

5. **Record Polling Unit Results (`/new-result`)**
   - Interface for presiding officers to record station results for all accredited parties into `polling_unit` and `announced_pu_results`.

---

## 🛠️ Technology Stack & Architecture

### Backend (`/server`)
- **Runtime**: Node.js, Express.js
- **Database Access**: Clean Layered Architecture (`repositories` → `services` → `controllers` → `routes`)
- **Database Engine**: Supports standard **MySQL** connection pool via `mysql2/promise` with prepared statements (`?` parameters), and includes an automatic embedded SQL engine initialized directly from `bincom_test.sql` for instant zero-config evaluation.
- **Testing**: Jest and SuperTest suite with 100% pass rate across 20 test cases.

### Frontend (`/client`)
- **Framework**: React.js (Vite), React Router v6
- **Icons**: Lucide React
- **Styling**: Modern, responsive Vanilla CSS design system with custom properties, glassmorphism, responsive tables, loading skeletons, and interactive modal dialogs.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- (Optional) MySQL Server running on `localhost:3306`

### 2. Backend Setup
```bash
cd server
npm install

# (Optional) Seed MySQL if MySQL server is running
npm run db:seed

# Run backend test suite
npm test

# Start backend server (Port 5000)
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install

# Start Vite dev server (Port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Automated Tests

Run the test suite from `server/`:
```bash
npm test
```

### Test Coverage:
- **`lga.test.js`**: Delta LGA filter (`state_id = 25`), calculated SUM aggregation, verification breakdown.
- **`pollingUnit.test.js`**: Polling unit pagination, search, details, announced scores, new result creation.
- **`party.test.js`**: Party CRUD, duplicate prevention, historical reference protection.
- **`announcedLgaIndependence.test.js`**: Explicitly proves that `announced_lga_results` is never queried and that corrupting or modifying `announced_lga_results` does not affect calculated LGA results.
