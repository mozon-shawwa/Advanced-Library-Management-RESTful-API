# 📚 Advanced Library Management API

A Production-Ready RESTful API built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**, following the **MVC + Services** architectural pattern with an enterprise-grade custom middleware pipeline, advanced security controls, caching, and performance optimizations.

---

## ⚙️ Architecture

The application enforces strict **Separation of Concerns** across clean architectural layers:

```text
HTTP Request
↓
Middleware Layer   →  Security, logging, validation, rate limiting, authentication
↓
Controller Layer  →  HTTP request/response handling & service delegation
↓
Service Layer     →  Core business logic, caching mechanisms, and database queries
↓
Model Layer       →  Data modeling, index optimization, and Mongoose validation
↓
MongoDB Atlas
```

---

## 🔧 Middleware Pipeline

All middlewares are centralized and executed in a strict pipeline to guarantee security and traceability before any request reaches the core business logic.

### 📜 Middleware Execution Order

```text
Request
↓  helmet()                  Security HTTP headers (11+ protections)
↓  cors()                    Trusted origin access control
↓  compression()             Gzip response payload compression
↓  express.json()            Parse incoming body (10kb security limit)
↓  requestId                 UUID v4 generation (Sets X-Request-ID header)
↓  requestContextMiddleware  AsyncLocalStorage context initialization per request
↓  requestLogger             Winston logging with high-precision duration (ms)
↓  globalLimiter()           IP-based global rate limiting enforcement
↓  authenticate()            JWT verification, user payload extraction & context injection
↓  validateBody()            Input validation & XSS string sanitization
↓  Controllers               Business logic execution
↓  notFound()                Unmatched routes fallback (404)
↓  errorHandler()            Global centralized error exception handler
```

### 🧠 Core Middlewares Overview

* **Helmet & CORS:** Applies 11+ security-focused HTTP headers automatically to protect against Clickjacking, MIME sniffing, and XSS attacks, while restricting API access to whitelisted origins defined via `ALLOWED_ORIGINS` environment variable.
* **AsyncLocalStorage Context (`requestContextMiddleware`):** Initializes a per-request context store using Node.js `AsyncLocalStorage`. This allows any downstream code — services, utilities, loggers — to access request-scoped data such as `requestId`, `userId`, `tenantId`, and `startTime` without passing `req` through every function call.
* **Authentication (JWT):** Validates access tokens extracted from the `Authorization: Bearer` header, decodes the user payload, attaches it to `req.user`, and simultaneously injects `userId`, `tenantId`, and `userRole` into the AsyncLocalStorage context for zero-propagation access across the entire async call chain.
* **Validation & Sanitization:** A robust factory middleware that enforces required payload fields and sanitizes all string values through custom RegEx utilities to completely strip malicious XSS scripts.
* **Centralized Error Handler:** A 4-argument Express handler that catches every error passed via `next(err)`. It formats responses into a consistent JSON shape and safely hides database stack traces in production.

---

## 🚦 Advanced Rate Limiting

The API implements a highly secure, **6-tier** rate limiting strategy to prevent abuse and protect server infrastructure at multiple levels simultaneously:

| Limiter | Scope | Limit | Applied On |
| :--- | :--- | :--- | :--- |
| **Global Limiter** | Per IP | 100 req / 15 min | All `/api/v1` routes |
| **Write Limiter** | Per IP | 10 req / 1 min | `POST`, `PUT`, `DELETE` only |
| **Search Limiter** | Per IP | 20 req / 1 min | `/search` endpoint |
| **User Limiter** | Per User ID | 200 req / hour | Authenticated routes (after JWT) |
| **Tenant Limiter** | Per Organization | 1000 req / hour | Authenticated routes (after JWT) |
| **Sensitive Endpoint Limiter** | Per IP | 5 req / 15 min | `/login`, `/register` — skips successful requests |

> **Why User & Tenant limiters matter:** IP-based limiting alone can be bypassed using VPNs or proxies. User-based limiting ties the quota to the authenticated identity regardless of IP, while Tenant limiting prevents a single organization from monopolizing the API quota in multi-tenant deployments.

---

## 📡 API Endpoints

Base URL: `http://localhost:3000/api/v1`

### 📘 Books (`/books`)

| Method | Endpoint | Description | Middleware Pipeline |
| :--- | :--- | :--- | :--- |
| **GET** | `/books` | List all books | Pagination, Genre Filtering & 5-min Server Cache |
| **GET** | `/books/:id` | Get single book by ID | ETag validation — `304 Not Modified` on cache hit |
| **POST** | `/books` | Create a new book | `authenticate` → `userLimiter` → `tenantLimiter` → `writeLimiter` → `requireRole(admin, librarian)` → `validateBody` |
| **PUT** | `/books/:id` | Update a book | `authenticate` → `userLimiter` → `writeLimiter` → `requireBookOwnership` |
| **DELETE** | `/books/:id` | Delete a book record | `authenticate` → `userLimiter` → `writeLimiter` → `requireBookOwnership` |

### 💬 Reviews (`/books/:bookId/reviews`)

| Method | Endpoint | Description | Middleware Pipeline |
| :--- | :--- | :--- | :--- |
| **GET** | `/books/:bookId/reviews` | Get all reviews for a book | Public — `globalLimiter` |
| **POST** | `/books/:bookId/reviews` | Add a new review | `authenticate` → `writeLimiter` → `validateBody` |
| **PUT** | `/books/:bookId/reviews/:id` | Update your own review | `authenticate` → `writeLimiter` → `requireReviewOwnership` |
| **DELETE** | `/books/:bookId/reviews/:id` | Delete your own review | `authenticate` → `writeLimiter` → `requireReviewOwnership` |

### 🔐 Authentication (`/auth`)

| Method | Endpoint | Description | Middleware Pipeline |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/register` | Create a new user account | `globalLimiter` → `writeLimiter` → `validateBody` |
| **POST** | `/auth/login` | Login and receive JWT token | `sensitiveEndpointLimiter` → `validateBody` |
| **GET** | `/auth/me` | Get current user profile | `authenticate` |

### 🔍 Advanced Utilities

* **Search (`GET /api/v1/search`):** Supports combined query parameters (`?q=tolkien&genre=fantasy&year=1954`). Protected by `searchLimiter` and returns ETag headers for client-side revalidation.
* **Statistics (`GET /api/v1/stats`):** Computes deep metrics (total books, total reviews, unique genres list, overall average rating) using highly efficient **MongoDB Aggregation Pipelines**, cached server-side for 5 minutes.

---

## 🔐 Resource-Based Authorization

Beyond standard role checks, the API enforces ownership-level authorization on mutation endpoints:

* **`requireBookOwnership`:** Before any `PUT` or `DELETE` on a book, the middleware queries the database to verify that `book.createdBy === req.user.id`. Admin role bypasses this check.
* **`requireReviewOwnership`:** Same principle applied to reviews — only the review author or an admin can modify or delete a review.
* **`requireRole(...roles)`:** Factory middleware for role-based access. Used on `POST /books` to restrict creation to `admin` and `librarian` roles only.

---

## ⚡ Caching & Performance Optimization

### 🗂️ Server-Side In-Memory Cache

GET endpoints serving list data use an in-memory cache with configurable TTL:

* `GET /books` — cached for **5 minutes**
* `GET /stats` — cached for **5 minutes**

Any `POST`, `PUT`, or `DELETE` operation automatically **invalidates** the relevant cache keys to guarantee data consistency.

### 🛡️ ETag Support & HTTP Validation

All cacheable responses include an automatically generated **ETag header** (MD5 hash of the response body). When a client sends a subsequent request with `If-None-Match`:

* If data is **unchanged** → server returns **`304 Not Modified`** with no body, saving bandwidth.
* If data **has changed** → server returns fresh data with a new ETag.

### 📦 Response Compression

Gzip compression via the `compression` middleware minimizes payload sizes for responses larger than 1KB, reducing bandwidth and improving transfer speed.

---

## 📋 Observability & Winston Logging

The system records structured JSON logs into automated physical files using **Winston**:

* `logs/combined.log` — Full audit trail of every HTTP transaction.
* `logs/error.log` — Isolated production failures for rapid post-mortems.

Every log entry is correlated by a unique `reqId` (UUID v4) injected at the start of the middleware pipeline, allowing full end-to-end request tracing.

### 📝 Example Log Entry

```json
{
  "level": "info",
  "reqId": "6edf5c77-6b94-42e8-850c-aad328c6fd27",
  "method": "POST",
  "url": "/api/v1/books",
  "status": 201,
  "durationMs": "12.45",
  "timestamp": "2026-06-04T12:20:00.000Z"
}
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/library_db
JWT_SECRET=your_ultra_secure_jwt_production_secret
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
JSON_BODY_LIMIT=10kb
```

> **`ALLOWED_ORIGINS`** — Comma-separated list of trusted frontend origins. Any request from an unlisted origin will be rejected by the CORS middleware. Defaults to `http://localhost:3000` if not set.

### 3. Run the Server

```bash
node server.js
```

### 4. Perform Health Check

```bash
curl http://localhost:3000/health
```

---

## 📦 Tech Stack

| Layer | Technology |
| :--- | :--- |
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| Password Hashing | bcrypt |
| Security Headers | Helmet |
| Logging | Winston |
| Compression | compression (Gzip) |
| Rate Limiting | express-rate-limit |
| Request Tracing | AsyncLocalStorage + UUID v4 |
