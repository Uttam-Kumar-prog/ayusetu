# AyuSetu Endpoint Sync Skill

Use this skill when adding or changing features that touch both backend APIs and frontend integration.

## Goal

Deliver backend and frontend updates together without breaking auth, validation, or request/response contracts.

## Scope

- Backend route/controller/middleware changes in `backend/`
- Frontend API/context/page integration in `frontend/src/`

## Preconditions

1. Read [AGENTS.md](../../../AGENTS.md)
2. Read API overview in [backend/README.md](../../../backend/README.md)

## Workflow

1. Identify endpoint contract

- Confirm method, path, auth role(s), request payload, and response shape.

2. Implement backend safely

- Add/adjust route-level validators (`express-validator`) and `validate` middleware.
- Keep middleware order: `protect`, then `authorize(...)`, then validators, then handler.
- Use `ApiError` for controlled failures.

3. Wire frontend integration

- Add/update API method in `frontend/src/utils/api.js`.
- Prefer expanding grouped API namespaces (`authAPI`, `symptomsAPI`, `doctorsAPI`, `appointmentsAPI`, etc.) instead of page-level Axios calls.
- Ensure auth flow stores JWT under `localStorage` key `token` for interceptor usage.
- Update affected page/context components to consume updated contract.

### Reference Wiring Map (Current)

- Auth page: `frontend/src/pages/Login.jsx` -> `/api/auth/login`, `/api/auth/register`
- Symptom submission: `frontend/src/pages/SymptomInput.jsx` -> `/api/symptoms/submit`
- Patient dashboard: `frontend/src/pages/Dashboard.jsx` -> `/api/symptoms/history`, `/api/appointments/mine`
- Doctor list/profile: `frontend/src/pages/DoctorList.jsx`, `frontend/src/pages/DoctorProfile.jsx` -> `/api/doctors`, `/api/doctors/:id`, `/api/doctors/:id/availability`
- Appointment booking/update: `frontend/src/pages/DoctorProfile.jsx`, `frontend/src/pages/DoctorDashboard.jsx` -> `/api/appointments`, `/api/appointments/:id/status`

4. Verify quickly

- Backend: run `cd backend && npm run dev` and smoke-test changed endpoint(s).
- Frontend: run `cd frontend && npm run dev` and verify updated page flow.
- Run diagnostics after edits.

## Chatbot Prescription Upload Pattern (AyuBot)

Use this pattern when implementing in-chat report upload analysis and follow-up guidance.

1. Frontend flow contract (`frontend/src/components/chatbot/ChatAssistantWidget.jsx`)

- Add a dedicated state machine for upload-driven flow (example steps: `upload -> followup -> report`).
- Parse text-like files client-side first (`.txt/.csv/.json/.md`) and gracefully degrade for binary formats.
- Ask a mandatory follow-up question about current condition before generating the final report.
- Convert upload findings + follow-up answer into `symptomsAPI.submit` payload, then render in-chat report card.

2. Report behavior requirements

- Always include:
  - Home remedy
  - Ayurvedic explanation
  - Severity level
  - Download/print/copy actions
- If any symptom severity is high/severe, display high-risk warning and a clear `Book Doctor Consultation` CTA.

3. Edge-case checklist

- End chat then start again: quick actions must be shown again.
- Cancel active flow: clear flow state and keep assistant usable.
- Authentication missing or stale token: show role/auth help message, do not silently fail.
- No extractable text from file: continue with follow-up/manual symptom description.
- Repeated generic assistant response: prefer deterministic local flow prompts before generic fallback.

## Longitudinal Symptom Memory Pattern

Use this when chatbot must remember patient symptoms across sessions and expose data to doctors.

1. Capture points

- Persist inferred symptoms from:
  - NLP patient chat messages (`source: CHAT`)
  - Prescription/report upload analysis (`source: UPLOAD`)
  - Structured symptom submissions (`source: ASSESSMENT`)

2. Memory model expectations

- One memory document per patient (`userId` unique).
- Keep rolling entries with source, raw text, symptom list, severity, and timestamps.
- Maintain derived summary fields (top symptoms + likely causes) for quick retrieval.

3. Doctor integration

- Include memory summary in appointment case summary endpoint so doctors can see:
  - recurring symptoms
  - likely contributors
  - recent conversation signals

4. Personal assistant continuity

- Allow patient to set assistant display name in NLP (for example “Call you Alex”).
- Persist chosen name in chat session/memory and restore in subsequent sessions.

## Done Checklist

- Endpoint has validation and proper auth guards.
- Frontend call path exists and uses correct payload/response fields.
- Auth bootstrap restores user via `/api/auth/me` when token exists.
- No new diagnostics errors.
- One happy-path smoke check completed.

## Common Guardrails

- Do not expose admin-only actions to public role flows.
- Do not bypass route validators by pushing checks only into controllers.
- Keep edits minimal and avoid unrelated refactors.
