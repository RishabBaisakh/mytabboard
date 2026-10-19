# MyTabBoard

An AI-powered Chrome new tab workspace that helps you plan your day, track tasks, manage workflows, and stay informed.

## Overview

MyTabBoard transforms your browser's new tab into a personalized productivity dashboard.

Instead of opening an empty tab, you get a smart workspace with:

- ✅ Daily and weekly task planning
- 🚀 Sprint-style workflow tracking
- 🧠 AI-powered insights and assistance
- 📰 Personalized news and learning feeds
- 💻 Developer-focused information and resources
- 📌 Notes and personal knowledge management

## Features

### Productivity Dashboard
- Manage daily TODOs
- Organize weekly goals
- Track progress and priorities

### AI Assistant
- Get intelligent suggestions
- Summarize information
- Assist with planning and decision-making

### Personalized Workspace
- Store your interests
- Track your technology stack
- Customize your dashboard experience

### Information Hub
- Curated AI and technology news
- Learning resources
- Developer updates

## Tech Stack

- React + TypeScript
- Plasmo Framework
- Chrome Extension Manifest V3
- Tailwind CSS
- AI APIs
- Browser Storage APIs

## API and Authentication

The extension uses the Django REST API at `http://127.0.0.1:8000` by default.
Set `PLASMO_PUBLIC_API_BASE_URL` in the appropriate Plasmo environment file to
override the base URL, for example `http://127.0.0.1:8000` for local development.
The selected API origin must also be listed in the extension's `host_permissions`
in `package.json` before building; add the deployed backend origin there for
production builds.

Google sign-in uses the Chrome Identity API configured by
`PLASMO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` and the existing `oauth2.scopes` in
`package.json`. Configure the public Chrome extension OAuth client ID and its
extension ID in Google Cloud Console. No client secret belongs in the extension.

### Onboarding

Run `pnpm dev` and load/reload the generated development extension to preview
the four-step onboarding flow against Django. The frontend does not include an
onboarding mock; the backend must be running and reachable at the configured
API base URL.

The first onboarding step collects a display name and optional bio, and shows
the existing default avatar. Time zone is derived from the browser environment
and is not displayed. The authenticated `GET /api/onboarding/status/` response
provides `is_complete` for route decisions. The authenticated
`GET /api/onboarding/` response provides `is_complete`,
`onboarding_completed_at`, `profile`, `basic_info.questions` (question and
option IDs, keys, text, selection rules, and saved option IDs), `interests`, and
`personality_tags`. This full response is loaded once and cached for the flow.

Each Next/Complete action sends one authenticated `PATCH /api/onboarding/`:
`step: "basic_info"` with profile fields; `step: "questions"` with question IDs
and selected option IDs; `step: "interests"` with `selected_ids`; or
`step: "personality_tags"` with `selected_ids`. The final PATCH response's
`is_complete` and `onboarding_completed_at` determine whether the dashboard
opens. Interest and personality selections have no client-imposed maximum; at
least one of each is required before advancing.