**MENTORQ - AUTONOMOUS EXECUTION MASTER PLAN**

**Core Architecture & Configuration Rules (Strictly Enforce):**

- **Backend Path:** `/backend` (NestJS). MUST run on PORT `3133`.
- **Frontend Path:** `/frontend` (React + Vite PWA). MUST run on PORT `5180`. Enforce `server: { port: 5180, strictPort: true }`.
- **Backend Architecture:** Feature-First 3-Layer Architecture (Controller -> Service -> Repository). Mongoose for database.
- **Frontend Stack:** React, Tailwind CSS, Shadcn UI, RTK Query, Lucide React icons.
- **Design Language:** Clean, modern, "Fake 3D" light-theme, mesh gradients, noise textures. NO emojis.

**Git & Version Control Protocol (Strictly Enforce):**

- **Remote Origin:** `https://github.com/Althaf-vt/MentorQ.git`.
- **Branch Strategy:** Use industry-standard prefixing (`feat/...`, `chore/...`, `fix/...`). Always branch from updated `main`.
- **Merge Gate:** Before concluding any phase, merge the feature branch cleanly into `main`, resolve any conflicts, verify build passes, and only then branch for the next phase.
- **Granular Staging:** NEVER run broad bulk staging like `git add .`, `git add /backend`, or `git add /frontend`. Stage specific related files per logical unit (e.g., `git add backend/src/modules/auth/dto/*`).
- **Frequent Commits:** Commit frequently within a phase as each domain unit compiles.
- **Commit Message Convention:** Short, conventional commit messages under 72 chars (e.g., `feat(auth): implement user registration repository`).
- **Security:** Verify `.gitignore` strictly ignores all `.env` files, credentials, and `node_modules` across root, `/backend`, and `/frontend` before any commit.

**Execution Protocol:**
You must execute this plan sequentially. After completing a Phase, you MUST pause, summarize what was built, and ask the user for confirmation before beginning the next Phase. Do not skip ahead.

***

**PHASE 0: Workspace & Configuration Initialization \[COMPLETED - GIT RETROFIT]**

1. Initialize git in project root (`git init`).
2. Add remote origin: `https://github.com/Althaf-vt/MentorQ.git`.
3. Create root `.gitignore` protecting `*.env`, `backend/.env`, `frontend/.env`, `node_modules/`, and `dist/`.
4. Create branch `chore/workspace-initialization`.
5. Granularly stage configuration and scaffold files:
   - Root project files and documentation (`docs/`).
   - Backend scaffold configuration (`backend/package.json`, `backend/src/main.ts`, etc.).
   - Frontend scaffold configuration (`frontend/package.json`, `frontend/vite.config.ts`, etc.).
6. Commit granularly:
   - `docs: add initial project specifications, api and db schema`
   - `chore(backend): initialize nestjs scaffold with port 3133`
   - `chore(frontend): initialize react vite pwa on port 5180`
7. Merge `chore/workspace-initialization` into `main`.
8. Verify workspace build and **PAUSE** for user confirmation.

**PHASE 1: Backend Core Modules (Auth, Users, Profiles)**

1. Branch from `main` to `feat/backend-core-auth-users`.
2. Read `docs/MentorQ_MVP.dbs` and connect Mongoose using `process.env.MONGODB_URI`.
3. Read `docs/MentorQ.postman_collection.json` for Auth and Users/Profiles API contracts.
4. Build the **Auth**, **Users**, and **Mentor Profiles** modules using 3-layer architecture (Controller -> Service -> Repository).
5. Implement JWT Authentication, Nodemailer for SMTP OTP flows (Forgot Password), and Google OAuth.
6. Commit granularly as each piece is completed:
   - `feat(database): configure mongoose connection and database module`
   - `feat(users): implement user schema, repository, service, and controller`
   - `feat(mentor): implement mentor profile schema and availability repository`
   - `feat(auth): implement jwt registration, login, and password reset flows`
   - `feat(auth): implement google oauth strategy and callback`
7. Merge `feat/backend-core-auth-users` into `main`.
8. Run API smoke test, verify clean build, **PAUSE** and wait for user confirmation.

**PHASE 2: Backend Operational Modules (Tickets, Sessions, Chat, Notifications, Reviews)**

1. Branch from `main` to `feat/backend-operational-modules`.
2. Build the **Tickets & Queue** modules, strictly enforcing references to `student_id` and `mentor_id`.
3. Build the **Live Sessions** module and set up the WebSocket Gateway (port 3133) for live countdown timers.
4. Build the **Chat & Guidance** (ticket messages) and **Notifications** modules with WebSocket event broadcasting.
5. Build the **Reviews & Ratings** module.
6. Commit granularly per module:
   - `feat(tickets): implement ticket queue schema, repository, and controller`
   - `feat(sessions): implement live session timer gateway and reconciliation`
   - `feat(chat): implement ticket messages and guidance chat module`
   - `feat(notifications): implement user notification service and gateway`
   - `feat(reviews): implement review schema and post-session rating flow`
7. Merge `feat/backend-operational-modules` into `main`.
8. Verify full backend compilation, **PAUSE** and wait for user confirmation.

**PHASE 3: Frontend Tooling & PWA Setup**

1. Branch from `main` to `feat/frontend-pwa-setup`.
2. Inside `/frontend`, install Tailwind CSS, Shadcn UI, RTK Query, and Lucide React.
3. Configure `vite-plugin-pwa` for Progressive Web App capabilities.
4. Configure global Redux store and base RTK Query API service (`import.meta.env.VITE_API_BASE_URL`).
5. Configure global WebSocket client (`import.meta.env.VITE_WS_URL`).
6. Commit granularly:
   - `chore(frontend): configure tailwind css and shadcn ui primitives`
   - `feat(frontend): setup rtk query api slice and redux store`
   - `feat(frontend): configure websocket client and pwa manifest`
7. Merge `feat/frontend-pwa-setup` into `main`.
8. Verify frontend compiles cleanly, **PAUSE** and wait for user confirmation.

**PHASE 4: Autonomous UI Generation - Part 1 (Auth & User Base)**

1. Branch from `main` to `feat/ui-auth-and-settings`.
2. Extract Tailwind classes from `code.html` and layout structure from `screen.png` across:
   - `mentorq_login`
   - `mentorq_registration`
   - `mentorq_password_reset`
   - `mentorq_user_settings`
   - `mentorq_mentor_configuration`
3. Wire components directly to backend Auth/User RTK Query endpoints.
4. Commit granularly per completed screen:
   - `feat(ui): implement login screen with rtk query integration`
   - `feat(ui): implement registration screen and validation`
   - `feat(ui): implement password reset and otp modal`
   - `feat(ui): implement user settings and mentor configuration view`
5. Merge `feat/ui-auth-and-settings` into `main`.
6. Verify UI loads cleanly, **PAUSE** and wait for user confirmation.

**PHASE 5: Autonomous UI Generation - Part 2 (Queue & Dashboards)**

1. Branch from `main` to `feat/ui-queue-and-workspace`.
2. Extract visual design and wire APIs across:
   - `mentorq_student_dashboard`
   - `mentorq_mentor_workspace`
   - `mentorq_ticket_creation_modal`
   - `mentorq_queue_tracker`
   - `mentorq_ticket_history_archive`
   - `mentorq_notifications_drawer`
3. Commit granularly per screen:
   - `feat(ui): implement student dashboard and active ticket card`
   - `feat(ui): implement mentor workspace with pending queue triage`
   - `feat(ui): implement ticket creation modal and duration selector`
   - `feat(ui): implement live queue tracker and wait estimation`
   - `feat(ui): implement ticket history archive with pagination`
   - `feat(ui): implement notifications drawer component`
4. Merge `feat/ui-queue-and-workspace` into `main`.
5. Verify build, **PAUSE** and wait for user confirmation.

**PHASE 6: Autonomous UI Generation - Part 3 (Live Execution & Post-Session)**

1. Branch from `main` to `feat/ui-live-sessions-and-reviews`.
2. Extract visual styling and wire real-time WebSocket events across:
   - `mentorq_chat_guidance_interface`
   - `mentorq_live_session_focus_mode`
   - `mentorq_post_session_rating_modal`
3. Commit granularly:
   - `feat(ui): implement in-ticket chat guidance interface`
   - `feat(ui): implement live session focus mode with timer countdown`
   - `feat(ui): implement post-session rating modal and feedback form`
4. Merge `feat/ui-live-sessions-and-reviews` into `main`.
5. Run full end-to-end smoke test, **PAUSE** and await final review.

