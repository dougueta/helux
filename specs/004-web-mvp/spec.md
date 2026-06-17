# Feature Specification: Web MVP — Helux Fitness Dashboard

**Feature Branch**: `004-web-mvp`
**Created**: 2026-06-15
**Status**: Draft
**Input**: Web MVP responsivo — substitui o app mobile como interface principal para uso pessoal

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View & Execute Today's Workout (Priority: P1)

Doug opens the web app on his iPhone and sees the AI-generated workout plan for today. He can start the workout, log each set as he completes it, and finish the session.

**Why this priority**: Core value proposition of the app — personalized workout execution. Without this, no other feature delivers value.

**Independent Test**: Can open the app, see a generated workout plan, tap "Start Workout", log 3 sets of an exercise, and finish the session — all without needing any other feature to be implemented.

**Acceptance Scenarios**:

1. **Given** a workout plan has been generated, **When** Doug opens the web app, **Then** he sees the plan with exercises, sets, reps, and intensity guidance
2. **Given** a workout plan is displayed, **When** Doug taps "Start Workout", **Then** an active workout mode begins with the first exercise visible and a set counter ready
3. **Given** an active workout, **When** Doug logs a completed set, **Then** the set is marked complete and a rest timer starts automatically
4. **Given** all sets are logged, **When** Doug taps "Finish Workout", **Then** the session is saved and a brief summary is shown
5. **Given** the browser is closed mid-workout, **When** Doug reopens the app, **Then** the session resumes from where it left off with no data lost

---

### User Story 2 — Generate a New Workout Plan (Priority: P2)

Doug requests the AI to generate a fresh workout recommendation based on his current recovery data and genetic profile.

**Why this priority**: Plans persist between generations, so this action is infrequent — but necessary to bootstrap content and to adapt when recovery changes significantly.

**Independent Test**: Can tap "Generate Plan", observe a loading state, and receive a new personalized workout recommendation with AI reasoning visible.

**Acceptance Scenarios**:

1. **Given** Doug wants a new plan, **When** he requests plan generation, **Then** the app generates a recommendation using the latest available recovery and genetic data
2. **Given** generation is in progress, **When** waiting, **Then** a loading state is clearly visible — no blank or frozen screen
3. **Given** a plan is generated, **When** it appears, **Then** it includes a brief explanation of why specific exercises and intensities were chosen
4. **Given** no recovery data exists, **When** generating a plan, **Then** the plan is still generated using only genetic data, with a notice that recovery data is missing

---

### User Story 3 — Check Recovery Status (Priority: P3)

Doug views his current recovery metrics (HRV, resting heart rate, active calories, sleep duration) that were synced via iOS Shortcut.

**Why this priority**: Recovery data informs training intensity decisions and helps Doug understand the AI's recommendations. It's read-only — syncing happens outside the app.

**Independent Test**: After running the iOS Shortcut, Doug opens the web app and sees his latest HRV, resting HR, active calories, and sleep data with a sync timestamp.

**Acceptance Scenarios**:

1. **Given** health data was synced via iOS Shortcut, **When** Doug views the Recovery section, **Then** he sees HRV, resting HR, active calories, and sleep duration with the last sync timestamp
2. **Given** no health data has been synced yet, **When** Doug views Recovery, **Then** a message guides him to run the iOS Shortcut — no error state, just clear guidance
3. **Given** data was synced more than 24 hours ago, **When** viewing Recovery, **Then** a visible indicator flags the data as potentially stale

---

### User Story 4 — View Genetic Profile Summary (Priority: P4)

Doug views a summary of his genetic traits relevant to training (injury risk, muscle fiber type, recovery speed, VO2 max potential, etc.) in plain language.

**Why this priority**: Reference information that rarely changes. Helps Doug understand long-term training tendencies and AI recommendations.

**Independent Test**: Can navigate to the DNA section and read trait summaries without needing to understand raw genetic codes.

**Acceptance Scenarios**:

1. **Given** genetic data has been loaded server-side, **When** Doug views the DNA section, **Then** he sees key fitness traits in plain language (not raw SNP codes)
2. **Given** a trait is displayed, **When** Doug taps on it, **Then** a brief explanation of how that trait affects training appears

---

### User Story 5 — View Workout History (Priority: P5)

Doug reviews past workout sessions including exercises performed, weights used, and session duration.

**Why this priority**: Progress tracking and motivation. Lower priority than execution but important for long-term engagement.

**Independent Test**: Can navigate to History and see a list of past sessions in reverse chronological order with dates, exercises, and key stats.

**Acceptance Scenarios**:

1. **Given** past workouts have been logged, **When** Doug views History, **Then** sessions appear in reverse chronological order with date, duration, and primary muscle groups
2. **Given** a session is listed, **When** Doug taps it, **Then** the full detail (exercises, sets, weights, rest times) is shown

---

### Edge Cases

- What happens when the AI service is unavailable during plan generation?
- How does the app behave when both recovery data and genetic data are missing?
- What if a workout session is interrupted (browser closed, phone locked mid-session)?
- How does the app handle very slow mobile network connections during set logging?
- What if the iOS Shortcut syncs data while Doug is mid-workout?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the most recently generated workout plan on the home screen upon login
- **FR-002**: System MUST allow the user to start an active workout session from the displayed plan
- **FR-003**: System MUST support real-time set logging during an active workout (mark sets as complete)
- **FR-004**: System MUST automatically start a rest timer after each logged set, with the recommended duration
- **FR-005**: System MUST allow the user to swap an exercise for a genetic-compatible alternative during an active workout
- **FR-006**: System MUST persist active workout session state so it survives browser refresh or accidental closure
- **FR-007**: System MUST allow the user to generate a new workout plan on demand
- **FR-008**: System MUST display recovery metrics (HRV, resting HR, active calories, sleep duration) with last sync timestamp
- **FR-009**: System MUST visually indicate when recovery data is older than 24 hours
- **FR-010**: System MUST guide the user to run the iOS Shortcut when no recovery data is available
- **FR-011**: System MUST display genetic trait summaries in plain, non-technical language
- **FR-012**: System MUST display workout history in reverse chronological order with session detail on demand
- **FR-013**: System MUST be fully functional on iPhone Safari with a mobile-responsive layout (no horizontal scrolling)
- **FR-014**: System MUST require authentication before displaying any personal data
- **FR-015**: System MUST show a loading state during AI plan generation — no silent waits

### Key Entities

- **Workout Plan**: AI-generated training recommendation including exercises, sets, reps, intensity level, and a plain-language rationale
- **Workout Session**: An in-progress or completed training session with timestamped set logs, duration, and exercise list
- **Exercise**: A movement within a session with name, target muscle groups, set/rep targets, and genetic-matched alternative variants
- **Recovery Data**: Apple Watch metrics (HRV, resting HR, active calories, sleep duration) with a sync timestamp and staleness flag
- **Genetic Profile**: Processed fitness trait summaries (muscle fiber composition, injury risk, recovery speed, VO2 max potential) derived from raw genetic data

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Doug can open the app on his iPhone and see today's workout plan within 3 seconds on a mobile connection
- **SC-002**: Doug can log a complete workout session (start to finish) with no more overhead than the workout itself takes — friction is invisible
- **SC-003**: An interrupted workout session is fully recoverable after reopening the browser — zero data loss
- **SC-004**: Recovery metrics appear within 3 seconds of opening the Recovery section
- **SC-005**: The interface is fully usable one-handed on a standard iPhone screen — no horizontal scrolling, all tap targets at least 44×44 points
- **SC-006**: All primary actions (start workout, log set, generate plan) are reachable within 2 taps from the home screen
- **SC-007**: Plan generation completes within 15 seconds under normal conditions

---

## Assumptions

- Single user (Doug) — no multi-user support, no public registration screen
- Authentication reuses the existing Google OAuth + Supabase session flow already implemented
- Health data arrives via the existing iOS Shortcuts → `POST /api/health/sync` flow — no in-app sync trigger is needed
- Genetic data (Genera JSON) is pre-loaded server-side — no file upload UI is required in this phase
- The app requires an internet connection — offline mode is out of scope for MVP
- Workout session state and history are already persisted server-side via the existing REST API — no new backend endpoints are required
- The `apps/mobile` Expo app is frozen and receives no new features; the web app is the primary client going forward
- Design should follow the existing Helux brand tokens (dark background #0A0C0A, accent #C8FA4B, Space Grotesk + JetBrains Mono typography)
