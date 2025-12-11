# Anna Johnson Cleaning Service

Web application for managing Anna Johnson's home-cleaning engagements from request intake all the way through billing and analytics. The system follows the course brief: every quote and bill response is persisted, clients can upload photos, and Anna gets the dashboard queries required for submission.

## Tech stack

- **Database:** MySQL schema defined in `database/schema.sql` (ER model -> relational). Includes clients, requests, photos, quotes, negotiations, orders, bills, bill negotiations, payments, and admin users.
- **Backend:** Node.js + Express (see `backend/`). Uses `mysql2/promise`, JWT-based auth, and Multer-powered local uploads.
- **Frontend:** React SPA (see `frontend/`). Two workspaces:
  - Client portal for registration/login, request submission with photo uploads, quote negotiation, and bill payment/dispute.
  - Anna's dashboard for reviewing requests, issuing quotes, responding to negotiations, completing orders, revising bills, and running analytics.
- **Analytics SQL:** Stored in `sql.txt` as required by the project instructions and exposed through `/api/analytics/*` endpoints.

## Getting started

### 1. Database

1. Create the schema:
   ```sql
   SOURCE database/schema.sql;
   ```
   This creates `home_cleaning_service` plus sample admin/client records. Update the seeded passwords with secure bcrypt hashes before deploying (e.g., `bcrypt.hashSync('admin123', 10)`).
2. Ensure the MySQL user referenced in `.env` has permissions to read/write this database.

### 2. Backend API

```bash
cd backend
npm install
cp .env.example .env
```

Populate `.env` with your MySQL credentials, JWT secret, and optional `UPLOAD_DIR` (defaults to `backend/uploads`). Then run:

```bash
npm run dev     # watches for changes
# or
npm start       # production mode
```

Key routes (all under `/api`):

- `POST /auth/clients/register` and `POST /auth/clients/login`
- `POST /auth/admin/login`
- `POST /requests` (multipart with up to five files), `GET /requests`, `GET /requests/admin`
- `POST /quotes`, `/quotes/:quoteId/negotiate`, `/quotes/:quoteId/accept`, `/quotes/:quoteId/reject`
- `POST /orders/:orderId/complete`
- `POST /bills/:billId/pay`, `/bills/:billId/dispute`, `/bills/:billId/revise`
- `GET /analytics/*` (eight required dashboard queries)

Uploads are saved locally (ignored via `.gitignore`) and served from `/uploads/<filename>`.

### 3. Frontend SPA

```bash
cd frontend
npm install
```

Set `REACT_APP_API_BASE_URL` in `frontend/.env` (defaults to `http://localhost:5000`). Then run:

```bash
npm start
```

Navigate to:

- `http://localhost:3000/` — overview page + links to both workspaces.
- `http://localhost:3000/client` — client experience (registration/login, request form with uploads, quote negotiation widget, bill payment/dispute).
- `http://localhost:3000/admin` — Anna's dashboard (request triage, quote creation, negotiation tracker, order completion, bill revisions, analytics with month filter).

## Testing & demo tips

1. Register a client, log in, and submit a request with a few photo uploads (JPG/PNG ≤ 5 MB each) plus optional external URLs.
2. Log out, switch to the admin workspace, sign in with your seeded admin credentials, and send a quote for that request. Use the negotiation form to exchange messages.
3. Accept the quote from the client workspace, then mark the order complete as Anna to generate a bill.
4. Pay or dispute the bill from the client view. Revisit Anna's dashboard to revise bills or check analytics.
5. For the required video demo, `sql.txt` already lists every analytics statement. Trigger each `/api/analytics/*` endpoint via the dashboard UI, then update the database and re-run the query, as requested in the brief.

## Repository structure

```
database/
  schema.sql          # relational model + sample data

backend/
  server.js           # Express app + route wiring
  src/
    config/db.js      # MySQL pool + helpers
    middleware/auth.js
    routes/*.js       # auth, requests, quotes, orders, bills, analytics
  .env.example        # configuration template

frontend/
  src/
    App.js, PageLayout.js, HomePage.js
    pages/ClientPortal.js
    pages/AdminPortal.js
    api.js, styles.css, etc.
  .env                # example pointing to localhost API
```

## Notes

- All uploaded photos, quote negotiations, and bill negotiations are persisted to support disputes.
- The React UI sticks to simple inputs/tables per the project rubric but covers every workflow (no manual SQL during demos).
- Honors extensions (remote hosting, manuals) are *not* implemented per the request.
