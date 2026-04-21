AyuSetu Backend API

Production-grade backend for the AyuSetu telemedicine and Panchakarma platform.

Core modules implemented

- Auth and OTP login with role-based access control
- Patient symptom assessment with AI + rule-based triage
- Doctor discovery, profile, and availability scheduling
- Concurrency-safe appointment booking flow
- Digital prescriptions and pharmacy QR lookup
- Panchakarma therapy planning and daily session tracking
- AI assistant chat with doctor escalation workflow
- Admin verification and analytics dashboards
- Notification persistence for in-app event tracking

Step-by-step setup

1. Install dependencies
   npm install

2. Create environment file
   Copy .env.example to .env and update values

3. Start backend in development
   npm run dev

4. Health check
   GET /health

Authentication flow

- Register with email or phone:
  POST /api/auth/register
- Login with email/phone + password:
  POST /api/auth/login
- Send OTP:
  POST /api/auth/send-otp
- Verify OTP:
  POST /api/auth/verify-otp
- Get current user:
  GET /api/auth/me

Main endpoint map

Patient and AI

- POST /api/symptoms/submit
- GET /api/symptoms/history
- GET /api/symptoms/:id
- POST /api/chats
- GET /api/chats/mine
- GET /api/chats/memory
- POST /api/chats/:id/patient-message
- POST /api/chats/prescription-analyze

Doctors and booking

- GET /api/doctors
- GET /api/doctors/:id
- GET /api/doctors/:id/availability
- PATCH /api/doctors/me/profile
- PUT /api/doctors/me/availability
- POST /api/appointments
- GET /api/appointments/mine
- GET /api/appointments/room/:roomId/access
- PATCH /api/appointments/:id/status
- GET /api/appointments/:id/case-summary

Prescription, therapy, pharmacy

- POST /api/prescriptions
- GET /api/prescriptions/mine
- GET /api/prescriptions/qr/:token
- POST /api/therapy
- GET /api/therapy/mine
- PATCH /api/therapy/:id/session
- GET /api/pharmacy/inventory
- PUT /api/pharmacy/inventory
- GET /api/pharmacy/search?query=

Admin and analytics

- GET /api/admin/pending-doctors
- GET /api/admin/overview
- PATCH /api/admin/verify-doctor/:id
- GET /api/admin/system-health
- GET /api/analytics/trends
- GET /api/analytics/district-trends
- GET /api/analytics/dashboard

Security and scalability features

- Helmet, CORS, compression, and global rate limits
- JWT authentication with role-based authorization
- Structured error handling middleware
- MongoDB pooled connections and graceful shutdown
- Slot locking pattern for double-booking prevention
- Modular architecture ready for microservice extraction

AI assistant behavior

- Rule-based triage for core symptom set from config/rules.json
- Optional OpenAI integration via OPENAI_API_KEY
- Automatic escalation trigger to doctor when user is dissatisfied or asks for a doctor
- NLP symptom memory captures recurring symptoms from chat + upload flows and reuses them for future guidance
- Prescription upload analysis supports server-side extraction (text/PDF parsing and image OCR via OpenAI Vision when configured)
