# AfyaMama: Maternal & Child Healthcare Continuity System

AfyaMama is a maternal and child healthcare continuity system designed to support prenatal and postnatal care monitoring, appointment tracking, child immunization tracking, growth monitoring, health record management, wellness tips, and automated reminders.

This document serves as the project charter, repository architectural map, and development roadmap.

---

## 1. Project Overview

Antenatal Care (ANC) and Postnatal Care (PNC) are critical for preventing maternal and infant mortality. AfyaMama provides a unified platform that bridges the communication gap between expectant/new mothers and healthcare providers. It provides mothers with a self-monitoring companion tool, clinicians with a diagnostic and observation portal, and clinic administrators with data-driven analytics.

### Core Users
1. **Mother (Mobile App)**: Can record health observations, track pregnancy weeks, schedule clinic consultations, check child immunization checkups, monitor child growth progression, and read daily wellness notifications.
2. **Doctor / Healthcare Provider (Web Portal)**: Can search mother profiles, view pregnancy logs, review child health stats, record clinical checkup indicators, update vaccination logs, and log appointment bookings.
3. **Administrator (Web Portal)**: Can manage clinic user profiles, oversee doctor assignments, publish wellness tips, and view clinical compliance reports and statistics.

---

## 2. Planned Directory Structure

The repository is structured as a **TypeScript Monorepo** utilizing **npm workspaces** to streamline local dependency management and share logic between applications.

```
afyamama/
├── apps/
│   ├── mobile/         # Expo React Native App (for Mothers)
│   └── web/            # Next.js Clinical Portal (for Doctors & Admins)
├── packages/
│   ├── types/          # Shared TypeScript models and payload interfaces
│   ├── api/            # Shared, typed HTTP client (axios/fetch wrapper)
│   └── config/         # Shared configurations (ESLint, TSConfig bases)
├── server/             # Express.js REST API Backend (TypeScript)
├── prisma/
│   ├── schema.prisma   # PostgreSQL Relational Schemas
│   └── seed.ts         # Initial database seeding routines
├── .env.example        # Reference environment parameters
├── package.json        # Workspace orchestration configs
└── README.md           # Getting started guidelines
```

---

## 3. Core Modules

- **Authentication & Role-Based Access**: Role validation for `MOTHER`, `DOCTOR`, and `ADMIN` profiles.
- **Mother Profile Management**: Detailed histories including demographics, blood group, allergies, emergency contacts, and locations.
- **Pregnancy Tracking**: Antenatal Care (ANC) timeline mapping gestation weeks, estimated due dates (EDD), and pregnancy terms.
- **Appointment Scheduling**: Interactive clinical scheduling linking mothers to gynecologists and pediatricians.
- **Maternal Health Records**: Physical observations logs tracking weight, blood pressure, fetal heart rates, and clinician observations.
- **Child Health Records**: Pediatric profiles listing births, gender, and clinical history.
- **Immunization Tracking**: Timeline checklist tracking completed and pending vaccines (e.g., BCG, Polio, Pentavalent, Measles) matching WHO schedules.
- **Growth Monitoring**: Developmental trackers graphing child weight and height progressions.
- **Wellness Tips**: Curated, targeted health tips delivered based on pregnancy trimester or child age.
- **Notifications & Reminders**: Automated alerts for upcoming clinical appointments, immunizations, or critical risk conditions.
- **Clinical Analytics & Reporting**: Summaries of clinics, detailing vaccine completion rates, ANC compliance, and high-risk case metrics.

---

## 4. Development Roadmap

The project development is divided into 10 structured phases:

### Phase 1: Repository Setup
- Configure npm workspaces in root `package.json`.
- Create folder directories for `apps`, `packages`, `server`, and `prisma`.
- Set up root `tsconfig.json` and package-specific extended configurations.
- Add shared linting (ESLint) and formatting configurations to `packages/config`.

### Phase 2: Backend API Setup
- Build Express TypeScript application in `server/`.
- Implement health check endpoint `/api/health`.
- Configure `dotenv` to load configurations.
- Initialize Prisma ORM.
- Configure PostgreSQL database connections.

### Phase 3: Database Modelling
Define relational database schemas in `prisma/schema.prisma` for the following entities:
- **User**: Authentication credentials, email, hashed password, and role (`MOTHER`, `DOCTOR`, `ADMIN`).
- **MotherProfile**: Demographic details linked to `User`.
- **DoctorProfile**: Specialization, hospital info, and credentials linked to `User`.
- **Child**: Profile and birth parameters linked to `MotherProfile`.
- **Pregnancy**: Antenatal logs (start date, status, EDD) linked to `MotherProfile`.
- **Appointment**: Clinic slots linking `MotherProfile`, `DoctorProfile`, and clinical status.
- **MaternalRecord**: Checkups logs (BP, weight, fetal heart rate) linked to `Pregnancy`.
- **GrowthRecord**: Child vitals logs (height, weight, date) linked to `Child`.
- **ImmunizationRecord**: Vaccine entries (vaccine name, status, dates) linked to `Child`.
- **WellnessTip**: Tips categorised by pregnancy terms or infant ages.
- **Notification**: Alerts linked to `User` profiles.

### Phase 4: Authentication & Roles
- Implement signup and login endpoints.
- Secure passwords using bcrypt hashing.
- Set up JSON Web Token (JWT) signatures.
- Build role authorization middleware (`requireRole(['DOCTOR', 'ADMIN'])`).

### Phase 5: Mother Mobile App
Create screens using Expo React Native:
- **Login**: Credential verification forms.
- **Mother Dashboard**: Current pregnancy milestone tracks, notifications, and baby checklists.
- **Profile**: Account settings and emergency contact details.
- **Pregnancy Details**: Visual trimesters and EDD count-down logs.
- **Appointments**: List booked visits and request new slots.
- **Health Records**: View historic prenatal physical measurements.
- **Child Growth**: Height and weight progress logs.
- **Immunization Schedule**: Checklist of pending and completed vaccinations.
- **Wellness Tips**: Read health tips curated for the mother's current pregnancy stage.

### Phase 6: Doctor Web Dashboard
Build pages using Next.js App Router:
- **Login**: Clinical authentication screen.
- **Doctor Dashboard**: Clinic stats, patient loads, and today's appointment registry.
- **View Mothers**: Searchable registry of all registered mothers.
- **View Mother Records**: Antenatal care vitals history.
- **Update Maternal Records**: Add checkup logs (BP, weight, clinician observations).
- **Record Child Growth**: Input infant height and weight parameters.
- **Record Immunization**: Mark vaccines completed or log scheduled dates.
- **Schedule Appointments**: Allocate clinic calendar entries.

### Phase 7: Admin Web Dashboard
Build pages using Next.js App Router:
- **Admin Dashboard**: System logs, database statuses, and reporting dashboards.
- **Manage Users**: Create, view, update, or deactivate system accounts.
- **Manage Doctors**: Manage clinician profiles, hospital allocations, and specializations.
- **Manage Wellness Tips**: CRUD system for publishing targeted health advice.
- **View Reports / Statistics**: Visual reporting graphs mapping clinic performance metrics.

### Phase 8: API Integration
- Compile `@afryamama/api` as a shared client library using axios/fetch.
- Integrate `@afryamama/api` client in `apps/mobile` for remote communication.
- Integrate `@afryamama/api` client in `apps/web` for remote communication.
- Manage component loading, error boundaries, and success indicator states.

### Phase 9: Notifications & Reminders
- Add notification model schema to store system messages.
- Implement server-side cron triggers to search for appointments due in 24-48 hours.
- Generate notification entries and prepare systems for Firebase Cloud Messaging (FCM).

### Phase 10: Testing & Documentation
- Build test suites for the Express backend REST routes.
- Build basic unit tests for web and mobile components.
- Document workspace configurations and environment parameters.
- Outline database migrations and setup steps.
- Compile startup commands for local development environments.

---

## 5. Local Development Setup

### Prerequisites
- Node.js v20.x
- PostgreSQL v15.x or higher

### Environment Variables Setup
Create a `.env` file at the root or within the `server/` directory:
```env
PORT=5055
DATABASE_URL="postgresql://<db_user>:<db_password>@localhost:5432/afyamama_db?schema=public"
JWT_SECRET="your_secure_development_jwt_secret_key"
```

### Installation
From the root workspace directory, run:
```bash
# Install all dependencies and link workspaces
npm install
```

### Database Migrations
Deploy schema definitions to your PostgreSQL database:
```bash
# Generate the Prisma client
npm run db:generate

# Generate and apply migrations
npm run db:migrate
```

### Development Launch Commands
Run the workspaces concurrently or individually from the root directory:

```bash
# Run all workspaces in development mode (Express, Next.js, and Expo)
npm run dev

# Run Express server only
npm run dev:server

# Run Next.js clinical dashboard only
npm run dev:web

# Run Expo mobile client bundler only
npm run dev:mobile
```

---

## 6. Planned REST API Endpoint Overview

All endpoints (except `/api/auth`) require a `Bearer <JWT_Token>` authorization header.

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | *All* | Create a new user profile |
| **POST** | `/api/auth/login` | *All* | Authenticate credentials and return JWT |
| **GET** | `/api/mothers` | `DOCTOR`, `ADMIN` | Retrieve all registered mothers |
| **GET** | `/api/mothers/:id` | `MOTHER`, `DOCTOR` | Retrieve specific mother details |
| **POST** | `/api/mothers` | `DOCTOR` | Register a new mother profile |
| **GET** | `/api/children` | `MOTHER`, `DOCTOR` | List pediatric profiles |
| **POST** | `/api/children` | `DOCTOR` | Create a new child profile |
| **GET** | `/api/appointments` | `MOTHER`, `DOCTOR` | View scheduled clinic visits |
| **POST** | `/api/appointments` | `DOCTOR` | Book a clinical appointment |
| **PATCH**| `/api/appointments/:id/status`| `DOCTOR` | Update appointment status |
| **GET** | `/api/maternal-records`| `MOTHER`, `DOCTOR` | Retrieve ANC checkup records |
| **POST** | `/api/maternal-records`| `DOCTOR` | Log a new ANC checkup card |
| **GET** | `/api/growth-records` | `MOTHER`, `DOCTOR` | View growth progression cards |
| **POST** | `/api/growth-records` | `DOCTOR` | Log weight and height parameters |
| **GET** | `/api/immunizations` | `MOTHER`, `DOCTOR` | View vaccination checklists |
| **PUT** | `/api/immunizations/:id` | `DOCTOR` | Update vaccine administration status |
| **GET** | `/api/wellness-tips` | *All* | Fetch wellness notifications |
| **GET** | `/api/notifications` | *All* | Retrieve user alerts |

---

## 7. Contribution Protocol

1. **Branch Management**: Code should be branched from `develop` using standard naming conventions (e.g., `feature/auth-setup` or `bugfix/appointment-leak`).
2. **Linting**: Ensure code conforms to workspace standards by running `npm run lint` before committing.
3. **Commit Messages**: Commits must follow Conventional Commits format (e.g., `feat: add growth tracking API`, `fix: correct token validation`).
4. **Pull Requests**: Pull requests targeting `develop` require code review approval and passing build checks.

---

## 8. Future Improvements
- **Interactive Growth Charts**: Integrate WHO growth percentiles and render SVGs of weight/height curves on both mobile and web.
- **Offline Syncing**: Configure SQLite storage inside the Expo client to cache records locally and push changes back when connectivity is restored.
- **USSD/SMS Gateways**: Support feature-phone users by bridging profile registrations and appointment notifications via Africa's Talking API.
- **FCM Push Notifications**: Connect FCM to deliver real-time immunization alerts to mothers' phones.
