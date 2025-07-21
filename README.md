# Liphi: Collaborative Documentation Platform

## Overview
Liphi is a Notion-like collaborative documentation platform supporting real-time editing, sharing, and role-based access control. It features a React + Vite frontend and an Express + Firebase backend.

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Deployment Guide](#deployment-guide)

---

## Features
- Real-time collaborative document editing
- Role-based access (admin, editor, viewer)
- Document sharing and permissions
- Firebase authentication and Firestore storage
- Modern React frontend (Vite, Tailwind)

---

## Architecture
### System Design
- **Frontend:** React (Vite), communicates with backend via REST API, uses Firebase for authentication.
- **Backend:** Node.js (Express), Firebase Admin SDK for authentication and Firestore for storage.
- **Database:** Firestore (NoSQL, document-based)

### Database Schema (Firestore)
- **Collection:** `docs`
  - `id`: string (auto-generated)
  - `title`: string
  - `content`: string (optional)
  - `roles`: object (`{ userId: role }`)
  - `members`: array of user IDs
  - `comments`: array
  - `suggestions`: array
  - `createdByName`: string
  - `createdAt`: timestamp
  - `updatedAt`: timestamp

### Authentication
- Uses Firebase Authentication (ID tokens)
- All API requests require a Bearer token in the `Authorization` header

---

## Setup Instructions
### Prerequisites
- Node.js (v18+ recommended)
- Bun (for backend, [install Bun](https://bun.sh/))
- Firebase project & service account

### Backend Setup
```bash
cd backend
bun install
# Place your Firebase service account in config/serviceAccount.json
# Create a .env file with any required environment variables (e.g., PORT)
bun run server.js
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## API Documentation
- All endpoints are prefixed with `/api`.
- All endpoints require a valid Firebase Bearer token.
- See [`openapi.yaml`](./openapi.yaml) for full OpenAPI 3.0 specification.

### Main Endpoints
| Method | Endpoint                   | Description                       |
|--------|----------------------------|-----------------------------------|
| GET    | /api/notes                 | List all documents for user       |
| POST   | /api/notes                 | Create a new document             |
| GET    | /api/note/:id              | Get a specific document           |
| PUT    | /api/note/:id              | Update a document                 |
| DELETE | /api/note/:id              | Delete a document                 |
| GET    | /api/note/:id/access       | Get document permissions          |
| POST   | /api/note/:id/invite       | Share document with a user        |
| POST   | /api/note/:id/remove_user  | Remove a user's access            |
| POST   | /api/members/info          | Get user details by IDs           |

---

## Deployment Guide
### Backend
- Requires `serviceAccount.json` in `backend/config/` (never commit this file)
- Set environment variables in `.env` (e.g., `PORT`)
- Start with `bun run server.js` or `npm start` (if using Node)

### Frontend
- Build with `npm run build` (output in `dist/`)
- Serve with `npm run preview` or deploy to static hosting (Vercel, Netlify, etc.)

### Environment Variables
- **Backend:** `.env` for secrets, Firebase config, and port
- **Frontend:** `.env` for Vite/Firebase config (if needed)

---

## License
MIT

---

## Contact
For questions or support, open an issue or contact the maintainer. 