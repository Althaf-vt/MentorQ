# MentorQ — Backend

The core REST API and WebSocket service powering **MentorQ**. It provides role-based authentication, live ticketing queue management, real-time 1-on-1 session chat, mentor scheduling, reviews, and admin analytics.

## 🚀 Features

- **Authentication & RBAC:** JWT authentication, Google OAuth 2.0, and role guards (Student, Mentor, Admin).
- **Real-Time Queue & Chat:** WebSocket gateways for live queue updates and active session messaging.
- **Ticket Lifecycle:** Create, claim, manage, resolve, and archive help requests.
- **Mentor Profiles & Availability:** Schedule management, session logs, and student ratings/reviews.
- **Notifications:** Automated email notifications via Nodemailer for key queue and session events.

## 🛠 Tech Stack

- **Framework:** NestJS
- **Runtime:** Node.js + TypeScript
- **Database:** MongoDB via Mongoose
- **Real-Time:** WebSockets (`@nestjs/platform-socket.io`)
- **Authentication:** Passport.js (`passport-jwt`, `passport-google-oauth20`), Bcrypt
- **Testing:** Vitest

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas)
- `npm`, `pnpm`, or `yarn`

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:  
   Create a `.env` file in the `backend` root:
   ```env
   PORT=3133
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   MONGODB_URI=mongodb://localhost:27017/mentorq

   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION=7d

   # Email / Notifications (optional for dev)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   EMAIL_FROM=noreply@mentorq.com

   # Google OAuth (optional for dev)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:3133/api/v1/auth/google/callback

   # Default Admin Credentials
   ADMIN_EMAIL=admin@mentorq.com
   ADMIN_PASSWORD=adminpassword
   ```

### Running the Server

```bash
# Start in development mode (auto-reload)
npm run start:dev

# Build for production
npm run build

# Start production build
npm run start:prod

# Run tests
npm run test

# Run linter
npm run lint
```

The API service runs at `http://localhost:3133` with endpoints prefixed by `/api/v1`.

---

## 📁 Project Structure

```text
src/
├── database/            # MongoDB connection and database configuration
├── modules/
│   ├── admin/           # Admin dashboards and user management
│   ├── auth/            # JWT, Google OAuth & authentication guards
│   ├── chat/            # WebSocket gateway and chat history
│   ├── mentor-profiles/ # Mentor profiles, bios, and availability
│   ├── notifications/   # Email notifications and dispatchers
│   ├── reviews/         # Session feedback and ratings
│   ├── sessions/        # 1-on-1 mentoring session lifecycle
│   ├── tickets/         # Support ticket queue and claiming logic
│   └── users/           # User accounts and profiles
├── app.module.ts        # Root NestJS module
└── main.ts              # Server bootstrap and configuration
```
