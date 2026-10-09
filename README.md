# FinTrace AI — Automated Financial Micro-Audit & Ghost-Beneficiary Detection Engine

FinTrace AI is an automated financial micro-audit and ghost-beneficiary detection platform designed to perform automated forensic audits, detect illicit financial webs, identify ghost beneficiaries, and score risk across transactions.

---

## 🏗️ Project Architecture

Monorepo workspace structure:

```text
fintrace-ai/
├── frontend/             # React + Vite + TypeScript + Tailwind CSS UI
│   ├── src/
│   │   ├── components/   # Reusable UI & Layout components
│   │   ├── pages/        # Main route pages (Dashboard, etc.)
│   │   ├── features/     # Feature modules (beneficiaries, network, copilot, etc.)
│   │   ├── lib/          # Utilities & helper functions
│   │   ├── hooks/        # Custom React hooks
│   │   └── types/        # Frontend TypeScript definitions
│   └── package.json
├── backend/              # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/       # Environment & database configurations
│   │   ├── controllers/  # Route handlers
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Ingestion, graph analysis, risk scoring modules
│   │   ├── models/       # Mongoose schemas & Zod validators
│   │   ├── middleware/   # Centralized error handling & validation
│   │   └── types/        # Backend TypeScript definitions
│   └── package.json
├── package.json          # Monorepo root runner
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js `v18+`
- npm `v9+`
- MongoDB instance (local or MongoDB Atlas cluster connection string)

### 1. Installation

Install dependencies across the monorepo:

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --prefix backend
npm install --prefix frontend
```

### 2. Environment Configuration

Copy the example environment files for both services:

```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.example frontend/.env
```

**`backend/.env`**:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fintrace-ai
CORS_ORIGIN=http://localhost:5173
```

**`frontend/.env`**:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🛠️ Development Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs both backend API (`:5000`) and frontend (`:5173`) concurrently |
| `npm run dev:backend` | Runs only the backend TypeScript server in watch mode |
| `npm run dev:frontend` | Runs only the Vite frontend dev server |
| `npm run build` | Builds both backend (tsc) and frontend (vite build) for production |
| `npm run type-check` | Type-checks both TypeScript sub-projects |

---

## 📡 Health Check API

Verify backend status:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "FinTrace AI Backend",
  "timestamp": "2026-10-09T12:00:00.000Z",
  "uptime": 12.34
}
```
