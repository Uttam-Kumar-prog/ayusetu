# Data-Driven Ayurvedic Healthcare Recommendation System (AyuSetu)

AyuSetu is a full-stack healthcare platform that combines Ayurvedic triage guidance, AI-assisted patient conversation, doctor appointment workflows, digital prescriptions, therapy tracking, pharmacy support, and admin analytics.

It is designed for three main user groups:
- Patients: symptom guidance, chatbot assistance, doctor booking, therapy/prescription tracking
- Doctors: appointment management, case summaries, notes, availability, patient context
- Admins/Operations: doctor verification, platform health, analytics and trend monitoring

## Table of Contents

- [Project Goals](#project-goals)
- [Core Features](#core-features)
- [Feature-by-Feature: How It Works + Use Cases](#feature-by-feature-how-it-works--use-cases)
- [AI Assistant (AyuBot) Detailed Flow](#ai-assistant-ayubot-detailed-flow)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Quick Start (Local Development)](#quick-start-local-development)
- [Environment Variables](#environment-variables)
- [Vercel Deployment](#vercel-deployment)
- [API Overview](#api-overview)
- [Roles and Access Control](#roles-and-access-control)
- [Operational Notes and Safety](#operational-notes-and-safety)
- [Testing and Verification Checklist](#testing-and-verification-checklist)
- [Current Limitations and Next Improvements](#current-limitations-and-next-improvements)

## Project Goals

- Provide accessible first-line Ayurvedic guidance for common symptoms.
- Reduce friction between symptom discovery and doctor consultation.
- Preserve patient context over time using longitudinal symptom memory.
- Help doctors see meaningful pre-consultation case summaries.
- Keep the platform modular and production-oriented with validation, auth, and clear API contracts.

## Core Features

1. Authentication and role-based access control
2. Symptom submission and AI/rule-based triage
3. AI Chat Assistant with natural language conversation
4. Prescription/report upload analysis with OCR/parsing support
5. Longitudinal symptom memory across sessions
6. Doctor discovery, profile, availability, and booking
7. Doctor dashboard with case report and status updates
8. Digital prescriptions, therapy plans, and pharmacy inventory/search
9. Admin verification and analytics dashboards

## Feature-by-Feature: How It Works + Use Cases

### 1) Authentication and User Roles

What it does:
- Allows registration/login with role-specific flows (`patient`, `doctor`, `pharmacy`; admin access for system operations).
- Stores JWT token in frontend localStorage (`token`) for protected API calls.

How to use:
- Open Login/Register page.
- Authenticate and continue to role-appropriate dashboard/pages.

Use cases:
- Patient signs in to submit symptoms and book appointments.
- Doctor signs in to manage appointments and case details.
- Admin signs in to verify doctor accounts and monitor system health.

### 2) Symptom Assessment and Triage

What it does:
- Accepts symptom list + severity + lifestyle data.
- Runs rule-driven triage and returns:
  - dosha imbalance signal
  - severity level
  - urgency
  - recommended specialty
  - recommendation items (home remedy + Ayurvedic reasoning)

How to use:
- Patient goes to symptom input flow.
- Selects symptoms and severity.
- Adds profile/lifestyle and natural language details.
- Gets report-style output in UI.

Use cases:
- User with mild headache gets lifestyle/home remedy guidance.
- High-severity user receives warning and gets pushed toward doctor consultation.

### 3) AI Chat Assistant (AyuBot)

What it does:
- Conversational assistant for symptoms, guidance, booking navigation, and escalation.
- Supports quick actions (doctor talk, symptom guidance, booking, account help, routine tips, assistant naming).

How to use:
- Open chatbot widget from launcher.
- Chat in natural language.
- Use guided cards/workflows for structured symptom assessment and booking.

Use cases:
- Patient types: "I have severe headache and anxiety since morning".
- Assistant guides to report flow and if severe, prompts urgent doctor booking.

### 4) Prescription/Report Upload Analysis (Server-side)

What it does:
- Uploads previous prescription/report files to backend endpoint.
- Extracts text and structured health signals from:
  - text-like files (`txt`, `json`, `csv`, `md`)
  - PDFs (text parse)
  - images (OCR via OpenAI Vision when API key configured)
- Asks follow-up "how do you feel now" and can generate fresh triage report.

How to use:
- In chatbot, select upload flow or paperclip attachment.
- Upload report/prescription.
- Provide follow-up current feeling.
- Generate report.

Use cases:
- Returning patient uploads old prescription + says symptoms are now worse.
- System boosts risk sensitivity, provides warning/remedy guidance, and prompts doctor booking.

### 5) Longitudinal Symptom Memory

What it does:
- Stores recurring symptom signals captured from:
  - chat messages
  - upload-analysis flows
  - formal symptom assessments
- Computes "top recurring symptoms" and "likely contributors".
- Reuses memory for future guidance and doctor case context.

How to use:
- Patient chats naturally over multiple sessions.
- On return, chatbot memory panel can show recurring patterns.

Use cases:
- A patient repeatedly reports fatigue + insomnia.
- Future sessions immediately start with personalized context and better recommendations.

### 6) Doctor Discovery, Availability, and Booking

What it does:
- Lists doctors and profile details.
- Reads doctor availability slots.
- Books appointments with slot locking to avoid double booking.

How to use:
- Patient opens doctor list/profile.
- Chooses specialty, doctor, date, and time.
- Confirms appointment.

Use cases:
- Patient triage suggests `Kayachikitsa`; patient books first available relevant doctor.

### 7) Doctor Dashboard + Case Report

What it does:
- Doctor sees appointments and updates status (`CONFIRMED`, `IN_PROGRESS`, etc.).
- Doctor can open case report modal containing:
  - appointment summary
  - recent symptom assessments
  - symptom memory (top symptoms, likely causes, conversation signals)

How to use:
- Doctor logs in, opens dashboard.
- Clicks `Case Report` for any appointment.
- Reviews context before call and records notes.

Use cases:
- Doctor sees recurring anxiety + insomnia context before consultation starts.

### 8) Prescriptions, Therapy, Pharmacy

What it does:
- Digital prescription creation and retrieval.
- Therapy plan/session tracking.
- Pharmacy inventory updates and medicine search.

How to use:
- Relevant role dashboards/pages call these APIs.

Use cases:
- Doctor updates therapy session progress.
- Pharmacy verifies medicine availability and updates stock.

### 9) Admin and Analytics

What it does:
- Doctor verification queue for safe onboarding.
- System health endpoint and trend analytics.

How to use:
- Admin views pending doctors and approves/rejects.
- Admin checks trend dashboards for operational planning.

Use cases:
- Operations team observes district trend shifts and allocates doctor availability.

## AI Assistant (AyuBot) Detailed Flow

### Standard Symptom Guidance Flow

1. Patient starts chat
2. Selects symptoms
3. Sets severity for each symptom
4. Enters profile/lifestyle details
5. Adds natural language description
6. Gets report card with remedy and Ayurvedic explanation
7. If any severity is high/severe:
   - warning displayed
   - doctor consultation CTA shown

### Upload + Follow-up Flow

1. Upload old prescription/report
2. Backend extracts and detects symptom/medication signals
3. Assistant asks follow-up about current condition
4. Patient responds in NLP + feeling state
5. New triage report generated and stored
6. Memory updated for future sessions

### Personalized Assistant Name Flow

- If patient says "Call you Alex", session stores assistant name.
- Future chat header/replies can continue with that preferred name.

## Architecture Overview

- Frontend: React + Vite SPA
- Backend: Express API with modular controllers/routes
- Database: MongoDB (Mongoose)
- Auth: JWT + role-based authorization middleware
- AI/Triage:
  - Rule engine for core symptoms (`backend/config/rules.json`)
  - Optional OpenAI integration for richer responses/OCR

High-level flow:
- UI action -> frontend API wrapper -> backend route validation -> controller -> services/models -> JSON response -> UI render

## Tech Stack

- Frontend: React, Vite, Axios
- Backend: Node.js, Express, express-validator
- DB: MongoDB, Mongoose
- Security/ops: helmet, cors, compression, rate limiting
- File handling: multer, pdf-parse
- Optional AI provider: OpenAI API

## Repository Structure

- `backend/` Express + MongoDB API
- `frontend/` React + Vite application
- `.github/skills/` project workflow skills/docs
- `AGENTS.md` agent/developer operational guidance

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB local or Atlas

### 1) Install dependencies

```powershell
cd backend
npm install

cd ../frontend
npm install
```

### 2) Configure environment

- Copy `backend/.env.example` -> `backend/.env`
- Copy `frontend/.env.example` -> `frontend/.env`

Minimum important values:
- Backend:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `PORT=5000`
  - `CORS_ORIGIN=http://localhost:5173`
- Frontend:
  - `VITE_API_URL=http://localhost:5000/api`

Optional AI/OCR enhancement:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`

### 3) Run services

Terminal 1:
```powershell
cd backend
npm run dev
```

Terminal 2:
```powershell
cd frontend
npm run dev
```

### 4) Smoke checks

- Backend health: `GET /health`
- Login/register works
- Symptom submit works
- Chat opens and sends messages
- Doctor list/profile/availability loads
- Booking works
- Doctor dashboard loads appointments/case report

## Environment Variables

See:
- [backend/.env.example](backend/.env.example)
- [frontend/.env.example](frontend/.env.example)

Key backend vars:
- `PORT`
- `NODE_ENV`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`
- `WEB_URL`
- `OPENAI_API_KEY` (optional)
- `OPENAI_MODEL` (optional)
- `OPENAI_BASE_URL` (optional)

## Vercel Deployment

Deploy as two Vercel projects:
- `backend` as Serverless API
- `frontend` as Vite web app

### Files added for Vercel

- `backend/vercel.json`
- `backend/api/index.js`
- `frontend/vercel.json`

### Scripts added

- `frontend/package.json`
  - `vercel-build`
- `backend/package.json`
  - `vercel-build`

### 1) Deploy backend project on Vercel

1. In Vercel dashboard, create new project from this repo.
2. Set **Root Directory** to `backend`.
3. Framework preset: `Other`.
4. Build command: `npm run vercel-build`.
5. Output directory: leave empty.
6. Add environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `CORS_ORIGIN` (set later to frontend domain)
   - `WEB_URL` (frontend domain)
   - `NODE_ENV=production`
   - Optional: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`
7. Deploy and copy backend URL, for example:
   - `https://ayu-backend.vercel.app`

Health check after deploy:
- `https://ayu-backend.vercel.app/health`

### 2) Deploy frontend project on Vercel

1. Create another Vercel project from same repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: `Vite`.
4. Build command: `npm run vercel-build`.
5. Output directory: `dist`.
6. Add environment variable:
   - `VITE_API_URL=https://<your-backend-domain>/api`
7. Deploy and copy frontend URL, for example:
   - `https://ayu-frontend.vercel.app`

### 3) Final CORS and web URL update

After frontend deploy, update backend environment variables:
- `CORS_ORIGIN=https://<your-frontend-domain>`
- `WEB_URL=https://<your-frontend-domain>`

Redeploy backend once after updating these values.

### 4) Verify production flow

- Open frontend URL.
- Register/login.
- Check symptom submission.
- Check chatbot API calls.
- Check doctor list and appointment APIs.

## API Overview

Detailed backend endpoint reference is in:
- [backend/README.md](backend/README.md)

High-use endpoints:
- Auth: `/api/auth/*`
- Symptoms: `/api/symptoms/*`
- Chats: `/api/chats/*`
- Doctors: `/api/doctors/*`
- Appointments: `/api/appointments/*`
- Prescriptions/Therapy/Pharmacy/Admin/Analytics modules available as documented

## Roles and Access Control

Main roles:
- `patient`
- `doctor`
- `pharmacy`
- `admin`

Authorization is enforced in middleware per route.

## Operational Notes and Safety

- Response shape is generally consistent (`{ success, message?, ...data }`).
- Keep frontend calls centralized in `frontend/src/utils/api.js`.
- Token must exist in localStorage key `token` for protected endpoints.
- For high-severity symptoms, always prefer immediate doctor consultation.
- AI guidance is supportive, not a substitute for emergency or definitive medical diagnosis.

## Testing and Verification Checklist

Before release:
- Backend starts and DB connects
- Frontend production build succeeds
- Auth/login persistence works
- Chat message send/receive works
- Upload analyze endpoint works with at least one text/PDF/image sample
- Report generation works from both symptom flow and upload flow
- Doctor case report modal displays memory + recent assessments

## Current Limitations and Next Improvements

- Scanned-image PDFs may need enhanced OCR pipeline for best extraction quality.
- Expand symptom ruleset and multilingual symptom aliasing.
- Add stronger automated tests (unit + API integration + e2e).
- Add audit/history UI for case-report timeline filtering.

---

For backend-focused endpoint and module documentation, see [backend/README.md](backend/README.md).
For frontend setup baseline, see [frontend/README.md](frontend/README.md).
