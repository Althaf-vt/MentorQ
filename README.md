# MentorQ — On-Demand Mentorship & Queue Management Platform

MentorQ is a lightweight, real-time, highly-scalable Progressive Web App (PWA) ticketing and queue management platform designed for student mentorship. It solves the chaotic nature of unstructured doubt-clearing sessions by implementing a structured ticket queue, dynamic mentor capacity planning, real-time interactive timers, and live in-ticket chat.

Built to scale into a premier peer-to-peer mentorship marketplace, the codebase strictly adheres to a **Feature-First, 3-Layer Service-Oriented Architecture** ensuring exceptional maintainability, strict separation of concerns, and clean enterprise-grade code quality.

---

## 🎯 Project Vision & Motivation

MentorQ was born out of a real-world time management challenge. As a senior engineering student with a broad technical stack (MERN, NestJS, System Design, Python, GenAI), I frequently found myself acting as an ad-hoc mentor for peers needing help with architecture decisions and debugging. While I am deeply passionate about mentoring, the volume of requests became unmanageable, derailing my own daily tasks. Ad-hoc sessions often dragged on without limits.

I built MentorQ as a personal utility tool to solve this bottleneck. It is a lightweight ticketing system designed to structure mentorship, protect focus time, and encourage student self-reliance. By enforcing strict daily time budgets, requiring explicit time-slot requests, and utilizing live WebSocket countdown timers, MentorQ ensures sessions hard-stop when the time is up. It also provides workflows to reject easily searchable queries, pushing students to self-learn before consuming a time slot.

### From Personal Utility to P2P Platform: The Long-Term Vision
While MentorQ excels as a personal productivity shield, its architectural foundation is designed for massive scale. The core vision is to transition this from a single-mentor utility into a decentralized, peer-to-peer (P2P) academic and technical consulting network:
- **Self-Scaling Ecosystem:** Empowering students who receive high reputation scores and badges to request mentor upgrades, turning mentees into mentors who can pay it forward.
- **Knowledge Monetization:** Integrating secure billing, premium paid doubt sessions, and earnings ledgers to reward mentors for their specialized focus and deep expertise.
- **Immersive Interactive Learning:** Implementing WebRTC peer-to-peer video, study rooms, screen sharing, and interactive code whiteboards to make doubt-clearing as seamless as sitting in the same room.

---

## 🛠️ Tech Stack & Technical Architecture

### 1. Backend Architecture: Feature-First 3-Layer Pattern
The NestJS backend implements a decoupled 3-layer architecture to guarantee high testability and seamless database-agnostic portability:

```
[ Client / WebSocket ] ──> [ Controller / Gateway ]
                                  │
                                  ▼
                            [ Service Layer ]  <── (Core Business Logic / State Machine)
                                  │
                                  ▼
                           [ Repository Layer ] <── (Mongoose / MongoDB Abstraction)
```

- **Controller Layer (`*.controller.ts` & `*.gateway.ts`):** Exposes RESTful endpoints and WebSocket gateways. Handles routing, security guards, and DTO validation via `class-validator`. **Contains no business logic.**
- **Service Layer (`*.service.ts`):** Core orchestration of business logic, state machine transitions, time budget validations, and third-party integrations. Completely decoupled from underlying ODM/ORM queries.
- **Repository Layer (`*.repository.ts`):** Encapsulates all Mongoose queries and operations. This acts as a database-access abstraction, permitting future migrations (e.g., MongoDB to PostgreSQL) without modifying the service layer.

### 2. Frontend Stack: Modern React PWA
The frontend is engineered as a modern, high-performance Progressive Web App:
- **Framework:** React + Vite (configured for port `5180` with `strictPort` enforcement).
- **State & Caching:** Redux Toolkit (RTK Query) utilizing robust cache tag invalidations (`providesTags`, `invalidatesTags`) for instantaneous UI updates upon database state transitions.
- **Styling & Design:** Tailwind CSS & Shadcn UI. Features a clean, professional, "Fake 3D" light-theme design with elegant mesh gradients and noise textures (no emojis).
- **PWA Capabilities:** PWA manifest and background service worker registration via `vite-plugin-pwa` for standalone app installation and seamless offline capabilities.
- **Real-Time Sync:** WebSockets (`socket.io-client`) synced directly with the NestJS gateway for live ticket state notifications, chat, and concurrent countdown timers.

### 3. Core Tech Stack Component Summary
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | NestJS (v12.x) | Node.js MVC framework utilizing modular structure |
| **Database ODM** | MongoDB + Mongoose | Schema modeling, indexed relationship binding |
| **Real-Time Layer** | Socket.io | WebSockets for synchronized timers and instant chat |
| **State Management** | Redux Toolkit Query | Declarative data fetching, caching, and tag invalidation |
| **Styling Library** | Tailwind CSS + Shadcn UI | Custom, highly-polished "Fake 3D" design tokens |
| **Email Service** | Nodemailer (SMTP) | Dynamic secure OTP delivery for password recovery |
| **OAuth Gateway** | Passport (Google Strategy) | Secure one-click Google authentication flow |


---

## 📋 Feature Breakdown: MVP vs. Roadmap

MentorQ's development is structured around a clear trajectory from a highly specialized, reliable MVP to an extensive global marketplace.

### 🌟 MVP Core Features (Fully Implemented & Verified)

#### 1. Secure Authentication & Role Management
- **Local Flow:** Secure email/password registration and login with cryptographically-hashed passwords (using `bcrypt`) and JWT token emission.
- **Forgot Password Flow:** Secure OTP (One-Time Password) generation, delivery via SMTP (Nodemailer), and credential reset.
- **Google OAuth Strategy:** Multi-tenant single sign-on (SSO) integration.
- **Role Guards:** Strict enforcement of `STUDENT`, `MENTOR`, and `ADMIN` boundaries.

#### 2. Profiles & Capacity Planning
- **Personal Profile Management:** Editable fields for names, avatars, and bios.
- **Mentor Capacity Panel:** Mentors dynamically set their `dailyAvailableMinutes` and `operatingHours`.
- **Automatic Budget Checks:** Prevents approval of any student request that exceeds the mentor's remaining daily time budget.

#### 3. Ticket & Queue State Machine
- **FIFO Queue Calculator:** Live calculation of student position and estimated wait time based on preceding active/approved requests.
- **Status Workflows:** Structured transitions: `PENDING` ➔ `APPROVED` ➔ `ACTIVE` ➔ `COMPLETED`/`REJECTED`.
- **Triage Console:** Mentors approve, reject, or redirect tickets to a pre-session discussion chat.

#### 4. Real-Time Workspace, Live Timers & Chat
- **In-Ticket Live Chat:** Pre-session 1-on-1 text coordination with read-only archiving once a ticket resolves. Supports attachments.
- **WebSocket Gateway:** Real-time state synchronization.
- **Live Focus Mode:** Interactive synchronized countdown timer. Auto-reconciliation deducts exact elapsed minutes from the mentor's daily pool upon session completion or manual early stoppage.

#### 5. Feedback, Notifications & Admin Module
- **Post-Session Reviews:** Students provide ratings and qualitative feedback directly to the mentor.
- **Live Notifications Drawer:** WebSockets broadcast real-time queue progression warnings ("You are next in line") and status updates.
- **Admin Dashboard:** Holistic analytics, active ticket tracking, and direct user management.

---

### 🚀 Future Roadmap (Planned Enhancements)

```
┌───────────────────────────────────────┐
│     Phase 1: Verification & Badges    │ ➔ Upgrade requests, Student reputation & badges
└───────────────────┬───────────────────┘
                    ▼
┌───────────────────────────────────────┐
│     Phase 2: Expanded Queue Flows     │ ➔ Vacation mode, Global unassigned ticket claiming pool
└───────────────────┬───────────────────┘
                    ▼
┌───────────────────────────────────────┐
│   Phase 3: Video & Rich Collaboration │ ➔ Peer-to-peer WebRTC video, shared whiteboards
└───────────────────┬───────────────────┘
                    ▼
┌───────────────────────────────────────┐
│      Phase 4: Monetization Suite      │ ➔ Material marketplace, paid premium bookings, ledgers
└───────────────────────────────────────┘
```

1. **Role Upgrade & Verification Workflow:** Secure interface for verified Students applying to become platform-approved Mentors.
2. **Student Reputation & Badges:** Gamified feedback tracking to reward well-prepared students and top contributors.
3. **Vacation Mode:** Toggle to instantly suspend availability and schedule temporary absences.
4. **Global Claiming Pool:** General/unassigned doubt pool where any qualified mentor can claim and triage student doubts.
5. **Video Collaboration Suite:** In-browser 1:1 WebRTC video calls, shared study rooms, screen sharing, and interactive code whiteboards.
6. **Monetization & Marketplace:** Dynamic booking for premium paid sessions, earnings ledgers, subscription tiers, and a dedicated mentor resource store.
7. **Expertise Tag Directory:** Deep public search and filtering for discovery of mentors based on niche skills, ratings, and active hours.


---

## ⚙️ Getting Started

### Prerequisites
- **Node.js:** `v18.x` or higher (tested and verified on Node `v24.x`).
- **MongoDB:** A running local MongoDB instance or a remote MongoDB Atlas cluster.
- **NPM / Git** installed locally.

---

### Environment Setup

Create a `.env` file in the root of both `/backend` and `/frontend` using the templates below.

#### Backend Environment Template (`backend/.env`)
Create `backend/.env` with the following variables:
```env
# Server Configuration
PORT=3133
NODE_ENV=development
FRONTEND_URL=http://localhost:5180

# Database (MongoDB)
# Make sure to provide a valid connection string and target database (e.g. /mentorq_db)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mentorq_db

# Authentication (JWT)
JWT_SECRET=your_secure_random_jwt_secret_here
JWT_EXPIRATION=7d

# Email Service (Nodemailer SMTP)
# Used for resetting password OTPs
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password_here
EMAIL_FROM="MentorQ Support <your_email@gmail.com>"

# Google OAuth Service
# Obtain these from the Google Cloud Console
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3133/api/v1/auth/google/callback
```

#### Frontend Environment Template (`frontend/.env`)
Create `frontend/.env` with the following variables:
```env
# API Base Endpoint (NestJS)
VITE_API_BASE_URL=http://localhost:3133/api/v1

# WebSocket Endpoint (NestJS Gateway)
VITE_WS_URL=http://localhost:3133
```

---

### Installation & Execution

MentorQ features a workspace-level boot setup. You can install all project dependencies and launch both servers simultaneously using a single command from the root directory.

#### 1. Clone the repository
```bash
git clone https://github.com/Althaf-vt/MentorQ.git
cd MentorQ
```

#### 2. Install All Dependencies (Root, Backend, Frontend)
Run this command in the root folder to perform a clean installation across all folders:
```bash
npm run install:all
```

#### 3. Start Both Services Concurrently
Boot up the complete stack with:
```bash
npm start
```
This single command runs:
- **Backend:** NestJS Server on port **`3133`** (with automatic watch mode).
- **Frontend:** Vite Server on port **`5180`** (enforcing `strictPort: true`).

---

## 🚦 Port Configurations
To prevent cross-origin resource sharing (CORS) conflicts and socket handshake failures, the application enforces rigid port restrictions:
- **Backend Port:** Always configured to **`3133`**.
- **Frontend Port:** Always configured to **`5180`** with strict enforcement.

---

## 🧪 Testing and Quality Control
- **Backend Verification:** Runs unit, integration, and E2E specs via `vitest`.
  ```bash
  cd backend
  npm run test      # Runs unit & repository tests
  npm run test:e2e  # Runs API endpoint test suites
  ```
- **Linting & Code Quality:** Code quality is strictly checked and optimized using `oxlint` for lightning-fast analysis in both environments.
  ```bash
  npm run lint --prefix backend
  npm run lint --prefix frontend
  ```

---

## 📝 License
This project is licensed under the UNLICENSED terms. Feel free to clone and modify for educational use.

