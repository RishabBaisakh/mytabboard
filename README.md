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