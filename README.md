# VSB LeetCode Analytics Dashboard

A production-ready, full-stack LeetCode Analytics Dashboard for colleges with role-based dashboards for Admins, Faculty, and Students.

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| UI Components | shadcn/ui + Lucide Icons + Framer Motion |
| Charts | Recharts |
| State | Zustand + TanStack Query |
| Forms | React Hook Form + Zod |
| Backend | Node.js + Express + TypeScript |
| Database | Supabase (PostgreSQL) + Prisma ORM |
| Authentication | Firebase Auth (Google + Email/Password) |

## 📁 Project Structure

```
VSB-DEMO-ERP/
├── frontend/          # Vite + React + TypeScript
│   └── src/
│       ├── components/   # UI, Layout, Charts, Tables, Shared
│       ├── hooks/        # Custom hooks (useAuth, useLeetCode, etc.)
│       ├── lib/          # Firebase, QueryClient, utils
│       ├── pages/        # admin/, faculty/, student/, auth/
│       ├── routes/       # React Router config + ProtectedRoute
│       ├── services/     # API service layer (axios)
│       ├── store/        # Zustand stores (auth, ui)
│       └── types/        # TypeScript interfaces
└── backend/           # Node.js + Express + Prisma
    ├── prisma/           # schema.prisma + seed.ts
    └── src/
        ├── config/       # Prisma client, Firebase Admin
        ├── middleware/   # auth.ts, errorHandler.ts
        ├── routes/       # auth, leetcode, admin
        └── services/     # leetcode.service.ts, sync.service.ts
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js 20+
- Supabase account + project
- Firebase project

### 1. Clone and install

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### 2. Configure Environment Variables

**Frontend** — create `frontend/.env.local`:
```env
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:5000/api
```

**Backend** — copy `.env.example` to `.env`:
```env
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 3. Setup Database

```bash
cd backend
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to Supabase
npm run db:seed       # Seed sample data
```

### 4. Run Development

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## 🔐 Authentication & Roles

| Role | Dashboard | Access |
|------|-----------|--------|
| ADMIN | `/admin/dashboard` | Full system management |
| FACULTY | `/faculty/dashboard` | Student monitoring + own stats |
| STUDENT | `/student/dashboard` | Personal analytics |

## 🔄 LeetCode Sync

- **Manual Sync**: Users can trigger via the "Sync Now" button
- **Scheduled Sync**: Runs daily at 2:00 AM (production only)
- **Data Synced**: Total Solved, Easy/Medium/Hard, Contest Rating, Rank, Streaks, Calendar
- **Source**: LeetCode public GraphQL API (unofficial)

## 🚀 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
```

### Backend → Render/Railway
Set environment variables and deploy from the `/backend` directory.

### Database → Supabase
Database is already on Supabase — just ensure `DATABASE_URL` and `DIRECT_URL` are set.

## 📊 Features

- ✅ Three-role system (Admin, Faculty, Student)
- ✅ Firebase Authentication (Google + Email/Password)
- ✅ LeetCode profile linking and sync
- ✅ Submission heatmap calendar
- ✅ Contest rating history charts
- ✅ DataTable with sort, search, pagination, CSV export
- ✅ Collapsible animated sidebar
- ✅ Dark/Light/System theme toggle
- ✅ Notification panel
- ✅ Global error boundary
- ✅ Loading skeletons
- ✅ Toast notifications
- ✅ Fully responsive (mobile, tablet, desktop)

## 🛠️ API Endpoints

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/auth/me` | All | Get current user profile |
| POST | `/api/auth/register` | Public | Register new user |
| GET | `/api/leetcode/profile/:userId` | All | Get LeetCode profile |
| POST | `/api/leetcode/link` | All | Link LeetCode username |
| POST | `/api/leetcode/sync/:userId` | All | Manual sync |
| GET | `/api/leetcode/activity/:userId` | All | Daily activity |
| GET | `/api/leetcode/contests/:userId` | All | Contest history |
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |
| GET | `/api/admin/departments` | Admin | List departments |
| POST | `/api/admin/departments` | Admin | Create department |
| GET | `/api/admin/users` | Admin | List all users |
