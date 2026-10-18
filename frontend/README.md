# MentorQ — Frontend

The client application for **MentorQ**, a real-time mentorship queue and 1-on-1 session platform. It features live queue tracking, interactive chat sessions, mentor directory, and role-based portals for students, mentors, and administrators.

## 🚀 Features

- **Role-Based Portals:** Tailored interfaces for Students, Mentors, and Admins.
- **Live Queue Tracking:** Real-time updates on ticket status and queue positions.
- **Session Focus Mode:** Dedicated 1-on-1 mentoring room with live chat via WebSockets.
- **Mentor Directory:** Browse mentors, view skill profiles, and check availability.
- **PWA Enabled:** Progressive Web App configuration with offline capabilities.

## 🛠 Tech Stack

- **Core:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide Icons
- **State & Forms:** Redux Toolkit, React Hook Form, Zod
- **Networking & Real-Time:** Axios / Fetch, Socket.io Client
- **Routing:** React Router v7

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- `npm`, `pnpm`, or `yarn`

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:  
   Create a `.env` file in the `frontend` root:
   ```env
   VITE_API_BASE_URL=http://localhost:3133/api/v1
   VITE_WS_URL=http://localhost:3133
   ```

### Running the App

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
```

The application runs at `http://localhost:5173` by default.

---

## 📁 Project Structure

```text
src/
├── assets/       # Icons, logos, and global styles
├── components/   # Shared UI components (modals, forms, layout)
├── context/      # Context providers (auth, theme)
├── pages/        # Views (Dashboards, QueueTracker, SessionFocus, MentorsDirectory)
├── routes/       # Route guards (ProtectedRoute, RoleRoute, AdminGuard)
├── services/     # API endpoints and WebSocket clients
├── store/        # Redux Toolkit store and feature slices
├── types/        # TypeScript interfaces and types
└── utils/        # Date formatters and helper utilities
```
