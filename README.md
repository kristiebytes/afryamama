# AfyaMama Maternal & Infant Health Platform

AfyaMama is a digital health platform designed to improve maternal and child health outcomes by connecting pregnant women and mothers with healthcare providers. The system provides clinical tools for doctors and administrators, and a mobile portal for mothers to monitor their pregnancy milestone markers, infant growth records, immunizations, and clinical appointments.

This repository is set up as a **TypeScript Monorepo** managed with **npm workspaces**.

---

## Repository Structure

The project is structured as follows:

```
├── packages/
│   ├── types/           # Shared TypeScript interfaces (User, Mother, Doctor, Child, records, etc.)
│   └── api/             # Shared API client wrapping fetch calls for the REST API
├── apps/
│   ├── web/             # Next.js Clinical Portal for Doctors and Administrators (Vanilla CSS)
│   └── mobile/          # Expo React Native mobile application for Mothers (TypeScript)
├── server/              # Node.js Express TypeScript REST API backend
├── prisma/
│   └── schema.prisma    # Prisma PostgreSQL database schemas
├── package.json         # Workspace definitions and dev orchestration scripts
└── tsconfig.json        # Base TypeScript compiler parameters
```

---

## Prerequisites

Ensure you have the following installed on your local environment:
- **Node.js**: `v20.0.0` or higher (tested on `v20.10.0`)
- **npm**: `10.0.0` or higher
- **PostgreSQL**: A running instance (or Docker container) to host the database.

---

## Quick Start Setup

### 1. Install Workspace Dependencies
From the repository root, install dependencies and link workspaces:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `server` directory. A `.env.example` has been provided:
```bash
cp server/.env.example server/.env
```
Update the `DATABASE_URL` in `server/.env` with your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/afryamama?schema=public"
JWT_SECRET="super-secret-afryamama-key-change-me-in-production"
PORT=5055
```

### 3. Setup Database Schema & Migrations
Once your PostgreSQL instance is running and the connection string is set up, initialize Prisma:
```bash
# Generate Prisma Client
npm run db:generate

# Generate and apply database migrations
npm run db:migrate
```

---

## Development Workflow

We provide unified orchestrator scripts in the root `package.json` to launch individual parts of the application:

### Run Backend REST API
Launches the Express TypeScript server with hot-reloading:
```bash
npm run dev:server
```
- **Local Endpoint**: `http://localhost:5055`
- **Health Check**: `http://localhost:5055/api/health`

### Run Clinical Web Portal
Launches the Next.js development server:
```bash
npm run dev:web
```
- **Local URL**: `http://localhost:3000`

### Run Mobile Application
Launches the Expo development server:
```bash
npm run dev:mobile
```
- Press `w` to run in the web browser, `a` for Android Emulator, or `i` for iOS Simulator.

---

## Unified Package System

To support compile-time type safety across the mobile app, web app, and backend, we use shared packages:

### 1. Shared Types (`@afryamama/types`)
Located in `packages/types`, this exports database models, user roles (`MOTHER`, `DOCTOR`, `ADMIN`), and API request/response contracts.
- **Usage**:
  ```typescript
  import { User, Role } from '@afryamama/types';
  ```

### 2. Shared API Client (`@afryamama/api`)
Located in `packages/api`, this exports a fetch-based class client (`AfyaMamaAPI`) preconfigured to query the backend REST endpoints. It supports JWT token injection and provides fully-typed methods for operations (e.g., `.login()`, `.getMothers()`, `.createAppointment()`).
- **Usage**:
  ```typescript
  import { AfyaMamaAPI } from '@afryamama/api';
  const api = new AfyaMamaAPI('http://localhost:5055');
  const session = await api.login({ email: 'doctor@afryamama.org', password: 'password' });
  ```

---

## Test Accounts (Mock Authentication)

The REST API exposes real authentication routes but operates on a safe, memory-based fallback dataset if PostgreSQL is not yet migrated, ensuring frontend teams can iterate immediately.

You can log in to the portals using these pre-registered clinic credentials:

| Portal Role | Test Email Address | Default Password | Workspace Redirect |
| :--- | :--- | :--- | :--- |
| **Doctor / Clinician** | `doctor@afryamama.org` | *any value* | Redirects to Doctor Dashboard |
| **System Administrator** | `admin@afryamama.org` | *any value* | Redirects to Admin Dashboard |
| **Mother (Mobile App)** | `mother@afryamama.org` | *any value* | Authenticates Mother profile |

---

## Building for Production

To build all workspaces in the monorepo:
```bash
npm run build
```
This builds packages first, then compiles the Express server and compiles the Next.js web application.
