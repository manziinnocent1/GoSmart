# GoSmart backend implementation guide

This document translates the current GoSmart app flows into a practical backend plan. It is a design and implementation guide, not a claim that these backend services already exist. The current app is a front-end prototype with local state and sample data.

## 1. Product scope and current frontend

GoSmart is a Rwanda-focused ride-booking prototype with passenger, driver, and admin experiences. The frontend is React Native/Expo with Expo Router and TypeScript. A Django backend should become the source of truth for users, rides, prices, payments, driver availability, support, and admin actions.

### Existing flows to support

| Area | Current app flow | Backend capability needed |
| --- | --- | --- |
| Passenger identity | Sign-in, registration, role selection, Google sign-in configuration, and a standalone phone OTP screen | Account registration, verified phone/email identity, login/session lifecycle, role authorization, Google ID-token verification |
| Passenger profile | Profile and settings screens, payment-method selection, sample ride history, saved-place and safety placeholders | Profile CRUD, preferences, tokenized payment instruments, saved places, completed ride history, safety/contact features |
| Booking | Select Moto/Car/XL, pickup/destination labels, estimated price and optional surge, confirm request, see a matched driver | Server-generated quote, ride creation, dispatch/matching, live status, cancellation policy, durable ride history |
| Payment | MTN MoMo, Airtel Money, or cash; a demo PIN/payment screen precedes booking completion | Provider integration, payment intents/status, verified provider callbacks, receipts/refunds; cash collection and commission ledger |
| Driver | Go online, receive timed offer, accept/decline, navigate to pickup, enter a four-digit trip PIN, complete trip, rate passenger | Driver approval and availability, expiring dispatch offers, location updates, server-side PIN verification, trip state transitions and ratings |
| Driver earnings | Daily/week summaries, wallet balance, trip/cash-out history, cash out to MoMo | Immutable earnings/commission ledger, reconciled balances, payout requests and provider status |
| Admin | Overview, live-map preview, driver document approval, fare/surge controls, support tickets, and settings | Admin RBAC, operational queries, document storage/review/audit, versioned fare rules and zones, ticket management, controlled refund actions |

### Important prototype limitations

These are observations from the current frontend, not backend requirements that are already settled:

- App and screen state is held in React state/context and resets when the app is restarted. Sample profile, payment methods, ride history, drivers, tickets, metrics, fare settings, and map data are hard-coded.
- The booking path uses fixed example pickup/drop-off labels. There are no real passenger or driver coordinates, location permissions integration, geocoding, or routing service requests.
- Driver offers, countdowns, movement on the map, pickup PIN checks, trip completion, ratings, cash-outs, and earnings are simulated locally. The four-digit PIN is currently present in demo data and must never be returned to a driver as plaintext in production.
- Passenger login and registration currently advance through the UI without creating/authenticating an account. Google client IDs are read from `EXPO_PUBLIC_...` variables, but the app does not verify the identity token with a backend.
- The admin login compares `EXPO_PUBLIC_ADMIN_EMAIL` and `EXPO_PUBLIC_ADMIN_PASSWORD` in the client. This is for local preview only; an Expo public variable is not a secret and is not an authentication mechanism.
- The support refund interaction marks a sample ticket solved; it does not refund a payment. The support messages are also sample data.
- Admin overview metrics, live map, pricing and surge controls, driver approvals, and admin settings are preview data/state.
- Some demo fare values differ: passenger tiers start at RWF 800 / 2,500 / 4,200; the driver demo contains example fares; pricing admin displays base/per-kilometre values; surge is excluded from Moto in the passenger quote screen. Decide the authoritative formula and policy before launch. Never trust a fare submitted by the client.
- The passenger payment vocabulary (`mtn`, `airtel`, `cash`) and the driver demo vocabulary (`momo`, `cash`) need a consistent backend payment-provider model.

## 2. Recommended architecture

Start with a **modular Django monolith**: one deployable API and one PostgreSQL database, separated into Django apps by business domain. This keeps ride matching and payments transactional without introducing microservice coordination too early.

### Core stack

- **Django 5.2 LTS** for the backend framework. Select and pin the latest security patch in the implementation environment; review the supported Django/Python matrix when scaffolding.
- **Django REST Framework (DRF)** for versioned JSON APIs, authentication integration, serializers, permissions, pagination, and validation.
- **PostgreSQL** as the primary relational database.
- **PostGIS** is strongly recommended for nearby-driver and geographic-zone queries. If it cannot be enabled initially, keep coordinates as validated latitude/longitude and isolate the geospatial query layer so it can be upgraded.
- **Redis + Celery** for tasks that should not delay API requests: OTP delivery, payment reconciliation, push notifications, stale-offer expiry, and reports. A periodic worker/scheduler is useful for expiry and reconciliation.
- **Django Channels + Redis (optional, later)** for live ride/driver updates. Begin with short polling if that makes the first release simpler; both transports must use the same authorized state and event rules.
- **Object storage** (S3-compatible or cloud equivalent) for driver verification documents. Keep private documents out of the public web root and return short-lived authorized URLs only.
- **Provider adapters** for MTN MoMo, Airtel Money, SMS/OTP, push notifications, maps/geocoding, and calling/messaging if those providers are selected.

Keep the API stateless except for database/Redis-backed session, task, and real-time state. Use environment-based configuration for development, staging, and production. Do not add payment-provider or Google client secrets to the mobile app.

### Suggested Django apps

```text
config/          Django settings, root URLs, ASGI/WSGI
accounts/        User model, authentication, profiles, preferences
drivers/         Driver profile, vehicle, documents, availability, location
rides/           Quotes, rides, dispatch offers, events, PIN verification, ratings
payments/        Payment methods/tokens, attempts, webhooks, refunds
wallet/          Driver ledger, commission, cash-out requests
pricing/         Fare policies, ride tiers, surge zones, quotes
support/         Tickets, messages, attachments
operations/      Admin-only metrics, audit trail, operational APIs
notifications/   Notification preferences and delivery records
```

These can be consolidated at first if useful, but keep ownership boundaries clear. Business logic belongs in domain/service functions and transactions, not duplicated across views or serializers.

## 3. Domain model proposal

Use UUID primary keys for public-facing records, timestamps (`created_at`, `updated_at`), explicit indexes, and database constraints for important invariants. Store money as integer minor units or integer RWF (the current UI formats whole RWF); never use floating-point money. Store timestamps in UTC and convert for display (Kigali uses Africa/Kigali).

| Entity | Important fields and relationships | Notes |
| --- | --- | --- |
| `User` | UUID, normalized unique phone, optional normalized email, password/auth identity, `is_active`, `created_at` | Use a custom Django user model from the start. A phone-first login may be best aligned with the OTP screen. Avoid putting application roles in an untrusted client claim. |
| `Role` / role membership | user, role (`passenger`, `driver`, `support_agent`, `operations_admin`, `superadmin`) | A user may have more than one role. Enforce role permissions on every endpoint. Django staff/superuser flags are not substitutes for business roles. |
| `PassengerProfile` | user, display name, locale, preferences | Keep authentication identifiers separate from profile attributes. |
| `DriverProfile` | user, approval state, online state, rating aggregate, payout destination token/reference, cash preference | Online state should also have an expiry/heartbeat so a crashed app does not leave a driver available forever. |
| `Vehicle` | driver, tier/type, make/model, color, plate, capacity, active/verified | A driver may have multiple vehicles; the accepted ride records the assigned vehicle snapshot/reference. |
| `DriverDocument` | driver, document type, private object key, verification state, expiry date, reviewer, review timestamps | Do not store uploaded file bytes in PostgreSQL. Restrict access and log reviews/downloads. |
| `SavedPlace` | passenger, label, address, latitude, longitude | Optional until the saved-place UI is wired to real CRUD. |
| `PaymentInstrument` | owner, provider (`mtn_momo`, `airtel_money`, `cash`), provider token/reference, masked display, default flag, state | Store only provider tokens/references and masked values. Do not store raw card data, PINs, or mobile-money account secrets. Cash can be represented as a payment choice, not a saved financial instrument. |
| `FarePolicy` / `FareTier` | tier, base fare, per-distance rate, optional time rate, minimum fare, enabled, effective interval, currency | Version policy changes. Store amounts as integer RWF. Specify rounding, distance/time source, tax/fee, and cancellation rules. |
| `SurgeZone` | name, polygon/geometry, multiplier, active interval, tier applicability, enabled, creator | Validate overlap/priority rules and cap multipliers. Keep a quote's applied multiplier/policy snapshot immutable. |
| `Ride` | passenger, assigned driver/vehicle, public reference, tier, pickup/drop-off labels and coordinates, fare snapshot, payment choice, status, requested/accepted/pickup/started/completed/cancelled timestamps | Model one ride lifecycle and retain fare/address snapshots even after policies or profiles change. Add a database constraint/transaction to prevent conflicting active rides per passenger/driver as required by product rules. |
| `RideEvent` | ride, event type, actor, timestamp, safe metadata | Append-only event history for state changes, cancellations, and support investigation. Avoid sensitive data in metadata. |
| `DispatchOffer` | ride, driver, offered/expiry timestamps, state, response timestamp, sequence | Unique active offer policy; accept must atomically assign one driver. Do not expose another driver's offer or passenger details to unauthorized drivers. |
| `Payment` / `PaymentAttempt` | ride, amount, currency, provider, provider transaction reference, idempotency key, state, failure code, timestamps | A ride can have multiple attempts but one effective captured amount. State transitions must reconcile with signed provider webhooks. |
| `Refund` | payment, amount, reason, requested by, approval/execution states, provider reference | Refunds are separate financial records and must not be represented only by closing a support ticket. |
| `WalletAccount` / `WalletLedgerEntry` | driver, entry type, signed integer amount, currency, ride/payment/refund/cash-out reference, balance snapshot optional | Treat ledger entries as the accounting source of truth. Avoid making a mutable balance the only record. Define commission and cash/MoMo settlement semantics explicitly. |
| `CashoutRequest` | driver, amount, payout destination reference, state, idempotency key, provider reference, status timestamps | A cash-out is asynchronous. Reserve/debit funds transactionally and reconcile success/failure; never tell the UI it succeeded before provider confirmation. |
| `Rating` | ride, author, recipient, integer score 1–5, optional comment | Enforce one rating per author/ride and only permit ratings after completion. |
| `SupportTicket` | creator, related ride/payment, category, priority, status, assigned agent, timestamps | Suggested statuses: `open`, `in_progress`, `waiting_on_customer`, `resolved`, `closed`; urgency/priority should be independent from status. |
| `SupportMessage` | ticket, sender, body, created timestamp, optional private-note flag | Use pagination and access rules; distinguish internal notes from customer-visible replies. |
| `AuditLog` | actor, action, target type/id, timestamp, request correlation ID, minimal before/after metadata | Record sensitive admin changes, driver approvals, pricing publication, manual adjustments, and refund actions. Do not log credentials, OTPs, tokens, or full payment details. |
| `Notification` / delivery record | user, channel, template, status, provider reference, timestamps | Useful for in-app inbox and delivery troubleshooting; push/SMS delivery is not proof of payment or ride-state change. |

Decide retention and deletion/anonymization rules for phone numbers, precise trip locations, identity documents, support messages, and audit records before collecting real users' data.

## 4. Authoritative state and business rules

### Ride lifecycle

Use explicit server-side transitions, reject invalid transitions, and append a `RideEvent` within the same transaction:

```text
requested -> matching -> accepted -> driver_arriving -> at_pickup
          -> in_progress -> completed
          -> cancelled (only from product-approved states)
matching -> no_driver_found / expired
```

Choose exact names and cancellation/refund behavior before implementation. A driver must not move a ride to `in_progress` until the backend verifies the trip PIN. Enforce the PIN attempt limit and lockout server-side (the current driver UI uses five demo attempts; the passenger payment screen has its own three-attempt demo PIN flow—clarify whether these are different PINs or one flow). Prevent duplicate acceptance with a database transaction/row lock or conditional update.

### Quote and fare

`POST /api/v1/rides/quotes` should calculate the fare from server-owned policy and validated route/distance/time inputs. Return an expiring quote ID, itemized fare, currency, tier, and policy snapshot. `POST /rides` should accept the quote ID, selected payment method, and pickup/drop-off data, then verify the quote is still valid. Never accept an authoritative `price`, commission, surge multiplier, or driver payout amount from the client.

Before implementation, specify:

- Fare formula, minimums, rounding, supported vehicle tiers/capacity, and whether the current passenger prices or admin base/per-km editor are intended.
- How route distance and duration are measured, what happens when a maps provider is unavailable, and allowed service boundaries.
- Which tiers surge applies to (the current screen excludes Moto) and whether zone multipliers combine or select one.
- Quote expiry, fare changes after a quote, tolls/waiting/cancellation charges, and customer disclosures.

### Dispatch and location

Only approved, eligible, online drivers should receive offers. Filter by vehicle tier, cash preference/payment capability, service area, recent location, and driver/ride state. Offer expiry is 15 seconds in the demo; make the production timeout configurable. Use a transactional queue/lease strategy to avoid the same driver being assigned to multiple rides. Keep driver location updates authenticated, rate-limited, and short-lived; do not make raw location globally readable. Begin with polling or use authenticated WebSockets for offers and ride status.

### Payment, settlement, and refunds

Treat payment as an independent state machine (for example `created`, `pending`, `succeeded`, `failed`, `cancelled`, `refunded`, `partially_refunded`). Mobile Money can be asynchronous. Create a payment request server-side, save its provider reference, and rely on verified provider callbacks/status checks—not a client success callback—to confirm settlement. Verify webhook signatures, reject replayed/duplicate events, store provider event IDs uniquely, and make handlers idempotent.

Do not complete or mark a refund solely because an admin tapped a button. Check eligibility, record the refund request, apply an approval policy, call the provider, reconcile the result, write ledger entries, and only then update customer-facing status. Cash rides require a separately defined driver cash-collection and commission collection process. The demo's 15% commission, RWF 1,000 minimum cash-out, earnings arithmetic, and payout examples are candidate business rules only; confirm them before implementing money movement.

## 5. Proposed versioned API surface

Prefix JSON endpoints with `/api/v1/`. These names are a starting contract; align final request/response schemas with the mobile screens before building them. Apply authentication, role checks, ownership checks, validation, rate limits, and audit rules to every applicable endpoint.

### Identity and account

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /auth/otp/request` | Public, throttled | Request phone verification code; return generic response to limit account enumeration. |
| `POST /auth/otp/verify` | Public, throttled | Verify code, register or authenticate the account, return access/refresh tokens. |
| `POST /auth/google` | Public, throttled | Send Google ID token; backend verifies issuer, audience, signature, and expiry before issuing GoSmart tokens. |
| `POST /auth/token/refresh` | Refresh token | Rotate/refresh access token according to chosen policy. |
| `POST /auth/logout` | Authenticated | Revoke/blacklist refresh token or session. |
| `GET /me` / `PATCH /me` | Authenticated | Retrieve/update permitted profile fields and preferences. |
| `GET /me/payment-methods`, `POST /me/payment-methods`, `DELETE /me/payment-methods/{id}` | Passenger | Manage provider-tokenized methods and default selection. Never submit/store provider PINs. |
| `GET /me/rides` | Passenger | Paginated ride history. |

### Passenger rides

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /rides/quotes` | Passenger | Calculate authoritative estimate from origin/destination coordinates, tier, payment choice, and any validated promo. |
| `POST /rides` | Passenger | Create a ride from a valid quote; return ride ID/reference and initial state. Require an idempotency key. |
| `GET /rides/{id}` | Ride participant / authorized support | Retrieve ride state and permitted passenger/driver details. |
| `POST /rides/{id}/cancel` | Ride participant | Request cancellation; enforce transition, reason, and fee/refund policy. |
| `POST /rides/{id}/payment-intent` | Passenger | Initiate or retry payment when needed. |
| `GET /rides/{id}/events` | Ride participant | Recover event history after reconnect/polling. |
| `POST /rides/{id}/ratings` | Ride participant after completion | Submit a permitted rating. |

The ride response should include state, quote/fare summary, pickup/drop-off display and coordinates only as appropriate to the caller, assigned driver details only after assignment, payment status, cancellation eligibility, and timestamps. Mask phone numbers until the matching/ride state allows contact.

### Driver operations

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /driver/me` / `PATCH /driver/me` | Approved driver | Read/update allowed driver and vehicle data. |
| `POST /driver/availability` | Approved driver | Set online/offline and eligibility preferences. |
| `POST /driver/location` | Approved online driver | Submit validated location/heading/accuracy and timestamp. |
| `GET /driver/offers` | Approved online driver | Poll currently valid offers if not using WebSockets. |
| `POST /driver/offers/{id}/accept` | Offered driver only | Atomically accept an unexpired offer and assign the ride. |
| `POST /driver/offers/{id}/decline` | Offered driver only | Decline and record the response. |
| `POST /rides/{id}/arrived` | Assigned driver | Record arrival at pickup. |
| `POST /rides/{id}/verify-pin` | Assigned driver | Submit PIN securely; enforce expiry/attempt lockout, never return the expected PIN. |
| `POST /rides/{id}/start` | Assigned driver after PIN verification | Transition ride to in-progress. |
| `POST /rides/{id}/complete` | Assigned driver | Request completion; validate state and settle payment/ledger as appropriate. |
| `POST /rides/{id}/driver-cancel` | Assigned driver | Cancel under rules and record reason. |
| `GET /driver/earnings` / `GET /driver/ledger` | Approved driver | Read aggregates and paginated ledger/history. |
| `POST /driver/cashouts` / `GET /driver/cashouts` | Approved driver | Create an idempotent payout request and inspect status. |

### Admin and support

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /admin/overview` | Operations admin | Compute real, time-bounded activity, revenue, driver, and support metrics. |
| `GET /admin/drivers` | Support/operations | Search/filter drivers and onboarding state. |
| `GET /admin/drivers/{id}/documents` | Authorized reviewer | List document metadata and obtain restricted, short-lived document access. |
| `POST /admin/drivers/{id}/review` | Driver reviewer | Approve/reject with required reason and audit record. |
| `GET /admin/live-map` | Operations admin | Return only necessary, current fleet locations and active rides. |
| `GET/POST /admin/pricing/tiers` | Pricing admin | Read/create versioned tier policies. |
| `POST /admin/pricing/publish` | Pricing admin | Publish an audited policy effective at a specified time. |
| `GET/POST/PATCH /admin/pricing/zones` | Pricing admin | Manage validated, bounded surge zones. |
| `GET/POST /support/tickets` | Customer/support agent | List/create tickets with ownership-aware visibility. |
| `GET /support/tickets/{id}` | Ticket participant/assigned agent | Read ticket and paginated messages. |
| `POST /support/tickets/{id}/messages` | Ticket participant/agent | Add customer-visible reply or authorized internal note. |
| `POST /support/tickets/{id}/status` | Assigned agent/admin | Change ticket status with an audit record. |
| `POST /admin/payments/{id}/refunds` | Explicit finance permission | Create a refund request with reason and idempotency key. |

### API conventions

- Use JSON, ISO 8601 UTC timestamps, UUID identifiers, explicit enum values, and integer RWF amounts with a `currency` field (initially `RWF`).
- Validate phone numbers into one canonical E.164 format (Rwanda `+250...`) while allowing expected local entry formats at the UI boundary.
- Use a consistent error body, for example `{"error":{"code":"quote_expired","message":"Request a new quote.","details":{},"request_id":"..."}}`; do not expose stack traces or provider secrets.
- Paginate unbounded collections and support documented filter/sort parameters.
- Require an `Idempotency-Key` on create ride, payment attempt, refund, and cash-out operations. Persist the key and result scoped to the authenticated actor.
- Add a request/correlation ID, structured logs, health/readiness endpoints, and OpenAPI schema. Keep API behavior discoverable for the React Native client.
- Avoid returning database models directly. Use explicit serializer fields and role-specific response serializers.

## 6. Authentication, authorization, and safety

1. **Use backend identity, not frontend role state.** Verify Google tokens on the backend or use server-issued phone OTP. Authorization must be based on a database role and current driver approval state.
2. **Use HTTPS everywhere outside local development.** Choose a supported access/refresh-token or secure session strategy, define token expiry and rotation/revocation, and store tokens in platform secure storage on mobile. Avoid long-lived tokens in browser local storage.
3. **Rate-limit authentication and sensitive actions.** Apply controls to OTP requests/verification, login, PIN attempts, ride creation, driver location, support message submission, and provider webhook ingress. Use generic auth errors where account enumeration is possible.
4. **Scope every object query.** A passenger sees only their own profile, payment methods, and rides; a driver sees only their own profile/assigned rides/offers; support sees tickets within its permissions; admins receive only the access needed for their role.
5. **Make state changes transactional.** Use row locks/conditional updates for offer acceptance, ride transition, wallet reservations, and refund/cash-out execution. Protect side-effect endpoints with idempotency.
6. **Keep payment security provider-led.** Store provider tokens/references only, verify callback signatures, reconcile asynchronous states, and never log or collect mobile-money PINs, OTPs, or raw financial credentials.
7. **Protect high-risk ride features.** Hash trip PINs; do not expose PINs in APIs/logs; enforce server-side expiry and attempt limits. Minimize driver/passenger location and contact visibility and expose them only to participants at the appropriate stage.
8. **Protect documents and admin actions.** Private file storage, malware/format validation, expiring access links, reviewer role separation, audit logs, and explicit approval/rejection reasons.
9. **Secure configuration.** Keep Django `SECRET_KEY`, database passwords, SMS/payment credentials, signing keys, and Google secrets in a secret manager or local ignored `.env`. Never use `EXPO_PUBLIC_` to store secrets. Restrict CORS to known app origins; CORS is not authentication.
10. **Plan privacy and operations.** Define consent, data retention/deletion, breach response, backup/restore, database migrations, monitoring, and least-privilege production access before onboarding real users.

## 7. Backend project setup (local development)

Create a separate backend directory/repository when ready; do not place Django inside the Expo `src/` tree. Example layout:

```text
gosmart-backend/
  manage.py
  config/
  accounts/
  drivers/
  rides/
  payments/
  wallet/
  pricing/
  support/
  operations/
  tests/
  .env.example
  requirements.txt
```

Example setup using a local virtual environment (choose a Python release supported by the selected Django patch):

```bash
mkdir gosmart-backend
cd gosmart-backend
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install "Django>=5.2,<5.3" djangorestframework djangorestframework-simplejwt django-cors-headers "psycopg[binary]" django-filter drf-spectacular
django-admin startproject config .
python manage.py startapp accounts
```

Add subsequent domain apps after establishing the custom user model. Add Redis/Celery, Channels, GIS, and storage packages only when wiring those features, then pin all tested dependency versions in a lock/requirements workflow.

Development checklist:

1. Create a local PostgreSQL database and a private `.env` file from a safe `.env.example`. Configure `DEBUG` only locally, allowed hosts, database URL/credentials, `SECRET_KEY`, API origins, and provider sandbox settings.
2. Set `AUTH_USER_MODEL` to the custom user model **before the first migration**.
3. Configure DRF authentication, default-deny permissions, pagination, exception formatting, throttling, and schema generation.
4. Add `corsheaders` with only the development web origin(s). CORS is primarily a browser control; a native app still needs authentication and server-side authorization.
5. Create migrations, run `python manage.py migrate`, create a local admin with `python manage.py createsuperuser`, and start with `python manage.py runserver`.
6. Expose the API to the phone on the same LAN using the development machine's reachable address, not `localhost` on the phone. Configure Expo with a development API base URL, for example `EXPO_PUBLIC_API_URL=http://<development-machine-address>:8000/api/v1`. Use HTTPS outside local development.
7. Use provider sandbox/test credentials only. Never seed production credentials or real customer details into fixtures.

Example local `.env` keys (values are placeholders; do not commit the actual file):

```dotenv
DJANGO_SECRET_KEY=replace-for-local-development
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://gosmart:local-password@localhost:5432/gosmart
GOOGLE_OAUTH_CLIENT_ID=your-server-verified-client-id
MTN_MOMO_API_KEY=use-provider-sandbox-secret
AIRTEL_MONEY_CLIENT_SECRET=use-provider-sandbox-secret
SMS_PROVIDER_API_KEY=use-provider-sandbox-secret
```

The optional provider variable names above are examples. Define actual names only when selecting a provider and put live secrets in a managed secrets service.

## 8. Connecting the Expo app

Add a typed API client in the frontend (for example `src/services/api.ts`) with a configurable base URL, JSON/error parsing, timeouts, auth-token attachment/refresh, and request IDs. Keep tokens in secure platform storage and do not put access tokens in logs. Add domain modules such as `authApi`, `ridesApi`, `paymentsApi`, and `driverApi`; components should call these through app-level state/hooks rather than constructing URLs directly.

Replace demo state in this order:

1. **Auth:** make registration/login/phone OTP call the backend; verify Google ID tokens server-side; maintain authenticated user and role from backend; add logout/token revocation.
2. **Profile/settings:** fetch and save profile, locale/theme preferences, payment-method references, and saved places. Persist local-only presentation settings separately if appropriate.
3. **Quote and ride creation:** send real pickup/drop-off coordinates and tier/payment selection; display only server-returned quote totals; create ride with an idempotency key.
4. **Matching and status:** poll or subscribe to authenticated ride events, show matched driver only after assignment, handle no-driver/expired/cancelled/reconnected states.
5. **Payment:** replace the timeout/default `processPayment` with a backend payment-intent flow; wait for backend-confirmed status; support pending/failure/retry. Cash should follow a distinct confirmation path.
6. **Driver operations:** load approved driver profile, update online status/location, consume server-side offers, and submit accept/decline/arrival/PIN/start/complete actions. Server is authoritative for request countdown, PIN limits, route state, and earnings.
7. **Earnings/cash-out:** read ledger-based summaries and status; submit idempotent payout requests and show pending/failed/succeeded state from the API.
8. **Admin/support:** use admin-only authenticated routes for live metrics, review decisions, pricing publication, tickets/messages, and refund requests. Remove demo credentials and simulated success alerts.

Use an explicit loading/error/retry state for each request. Never silently show demo success when the backend or a payment provider fails. The app should handle network loss and reconcile by fetching the current server state after reconnecting.

## 9. Testing and quality gates

- **Django unit tests:** fare arithmetic/rounding, pricing snapshots, role permissions, phone normalization, state transitions, cancellation policy, commission, ledger invariants, and serializers.
- **API tests:** auth throttling, ownership/role access, validation/error shapes, pagination, expired quotes/offers, idempotency, duplicate provider webhooks, and concurrency around driver acceptance and wallet operations.
- **Provider adapter tests:** use mocked provider responses and sandbox contract tests; verify callback signature failures, retries, duplicate events, delayed/pending results, and reconciliation.
- **Integration tests:** passenger creates a quote/ride, dispatches and accepts an offer, verifies PIN, completes ride, settles payment, writes earnings, and rates the trip. Test the cash path separately.
- **Admin tests:** unverified drivers cannot go online, document review is audited, pricing publication is versioned, support access is scoped, and refund/cash-out permissions are enforced.
- **Operational tests:** migration from empty database, backup restore, worker retry/dead-letter behavior, health checks, logs/metrics, and staging deployment.
- **Frontend tests/manual QA:** token expiry, offline/reconnect, duplicate taps, provider-pending states, role-specific unauthorized responses, and responsive native/web behavior.

Use separate development, test, staging, and production databases and provider credentials. CI should run formatting/linting, Django tests, migration checks, and frontend type/lint checks. Do not point destructive test/reset commands at staging or production.

## 10. Implementation order and decisions to make

### Suggested delivery sequence

1. **Agree on product rules:** authentication method, user roles, pricing formula, service geography, payment provider(s), refund/cancellation rules, cash settlement, commission, cash-out, and privacy/retention requirements.
2. **Foundation:** Django project, custom user, environment settings, PostgreSQL, DRF, API schema, CI, logging, permissions, and initial tests.
3. **Accounts and driver onboarding:** OTP/auth, profiles, vehicles, private documents, approval workflow, and admin roles.
4. **Pricing and quotes:** tier/policy/version models, validated coordinates, quote endpoint, tests for exact RWF calculations.
5. **Ride and dispatch lifecycle:** transactional state machine, offers, driver availability/location, PIN verification, polling/realtime events.
6. **Payments and ledger:** sandbox provider adapter, webhook verification/idempotency, cash workflow, refunds, commission ledger, cash-out requests/reconciliation.
7. **Support and operations:** ticket/message APIs, safe admin metrics, pricing audit, operational map, reporting.
8. **Production readiness:** monitoring, rate limits, security review, data protection policy, provider production certification, load/concurrency tests, backups and incident procedures.

### Product decisions that must be confirmed

- Is phone OTP the primary account identifier? Are email/password and Google sign-in required, and how are accounts linked?
- Can one account be both passenger and driver? What information and checks are required before driver approval?
- Which maps, geocoding, routing, and driver-location provider will be used? What are the consent, retention, and service-area rules?
- What exact base/per-kilometre/time pricing and rounding rules apply to Moto, Car, and XL? Are the displayed demo prices final or illustrative?
- Does surge apply to every tier? Who can publish it, how long does it last, and how is it disclosed to the passenger?
- Which Mobile Money providers are launching first, and which account owns each transaction? When is a ride considered booked for MoMo versus cash?
- What are the passenger/driver cancellation windows and fees? How do partial/full refunds work?
- Is 15% commission, the RWF 1,000 minimum cash-out, and cash-commission deduction the intended production policy?
- What exact PIN is used, when does it expire, how many server-side attempts are allowed, and how does support recover from a lockout?
- What do “Urgent” support cases mean operationally, which staff can refund, and is dual approval required above a threshold?
- What personal data and driver documents will be collected, who can see them, and when are they deleted?

## References

- [Django documentation](https://docs.djangoproject.com/)
- [Django REST Framework documentation](https://www.django-rest-framework.org/)
- [Django deployment checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/)
- [Expo environment variables](https://docs.expo.dev/guides/environment-variables/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [PostGIS documentation](https://postgis.net/documentation/)

Relevant frontend areas: [main app flow](../src/app/index.tsx), [admin route](../src/app/admin.tsx), [ride tier examples](../src/constants/rideTiers.ts), [driver demo rules/data](../src/screens/driver/driverData.ts), and [shared local settings](../src/context/AppSettings.tsx).
