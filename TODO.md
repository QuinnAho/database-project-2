## Project TODO

1. **Requirements & Design**
   - Translate the course brief into specific user stories covering client registration, request submission, quote handling, negotiations, billing, and payments.
   - Produce the required ER diagram with proper cardinalities and document all design assumptions.
   - Align `database/schema.sql` (or a new script) with the ER design, ensuring every workflow entity and constraint is captured.

2. **Backend Implementation** *(mostly complete; file uploads pending)*
   - Replace the JWT tutorial API with domain-specific endpoints (clients, service requests, photos, quotes, quote negotiations, orders, bills, bill negotiations, payments, admin users). ✅
   - Add proper authentication/authorization flows for clients and Anna (admin), using environment-based secrets instead of hard-coded credentials. ✅
   - Implement file upload support for up to five photos per request (e.g., multer + S3/local storage) and persist metadata to the `photos` table. ⏳ (currently URL inputs only)
   - Create business-logic routes for each workflow step: submitting requests, issuing quotes, negotiating, converting to orders, generating bills, logging disputes, and recording payments. ✅
   - Incorporate validation and audit logging so every quote/bill response is stored for dispute resolution. ✅

3. **Frontend Implementation** *(initial pass live; extend for negotiations/order completion)*
   - Build client-facing pages: registration, request form with photo upload, request status tracking, bill payment, and dispute submission. ✅ (photo upload still URL-based)
   - Build Anna's dashboard: pending requests review, quote creation, negotiation interface, order completion, billing adjustments. ✅ (negotiation + completion UIs still to come)
   - Implement UI components for the analytics queries, including filters (e.g., month selectors) and result tables with pagination/search if needed. ✅ (basic analytics cards shipped)

4. **Analytics & Reporting** *(SQL + API done; UI wired into Admin portal)*
   - Write SQL (and corresponding backend routes/UI) for all required dashboard queries:
     - Frequent clients (most completed orders).
     - Uncommitted clients (≥3 requests, never completed an order).
     - Accepted quotes within a selected month.
     - Prospective clients (registered, no requests).
     - Largest jobs (most rooms completed).
     - Overdue bills (>7 days unpaid).
     - Bad clients (never paid any overdue bill).
     - Good clients (always pay within 24 hours).
   - Store these statements in `sql.txt` for submission and expose them via the dashboard UI. ✅

5. **Deployment & Documentation**
   - Write a comprehensive README covering setup, configuration, partner contributions, and run instructions.
   - Prepare the submission artifacts: PDF with required metadata, video demo plan, zipped source, and `sql.txt`.
   - For honors credit: deploy to a remote host, add a user manual accessible from the site, and create a developer manual with architecture diagrams and extension guidance.
