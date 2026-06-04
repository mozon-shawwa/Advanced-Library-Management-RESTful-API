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
↓  helmet()              Security HTTP headers
↓  cors()                Trusted origin access control
↓  compression()         Gzip response payload compression
↓  express.json()        Parse incoming body (10kb security limit)
↓  requestId             UUID v4 generation (Sets X-Request-ID header)
↓  requestLogger         Winston logging with high-precision duration (ms)
↓  rateLimiters()        Multi-tier rate limiting enforcement
↓  authenticate()        JWT verification & User payload extraction
↓  validateBody()        Input validation & XSS string sanitization
↓  Controllers           Business logic execution
↓  notFound()            Unmatched routes fallback (404)
↓  errorHandler()        Global centralized error exception handler
```

### 🧠 Core Middlewares Overview

* **Helmet & CORS:** Applies 11+ security-focused HTTP headers automatically to protect against Clickjacking, MIME sniffing, and XSS attacks, while restricting API access to whitelisted origins.
* **Authentication (JWT):** Validates access tokens extracted from the `Authorization: Bearer` header, decodes the user payload, and attaches information to the request for secure downstream utilization.
* **Validation & Sanitization:** A robust factory middleware that enforces required payload fields and sanitizes all string values through custom RegEx utilities to completely strip malicious XSS scripts.
* **Centralized Error Handler:** A 4-argument Express handler that catches every error passed via `next(err)`. It formats responses into a consistent JSON shape and safely hides database stack traces in production.

---

## 🚦 Advanced Rate Limiting

The API implements a highly secure, multi-layered rate limiting strategy to prevent abuse and protect server infrastructure:

1. **Global Limiter:** Applied to all routes to handle overall traffic spikes (100 requests per 15 minutes).
2. **Write Operations Limiter:** Stricter limits applied exclusively to `POST`, `PUT`, and `DELETE` endpoints to prevent data flooding.
3. **Search Limiter:** Dedicated rate limiting on the `/search` endpoint to mitigate intensive database querying overhead.
4. **Sensitive Endpoint Limiter:** Critical endpoints like `/login` and `/register` receive extremely strict limits to prevent brute-force attacks.

---

## 📡 API Endpoints

Base URL: `http://localhost:3000/api/v1`

### 📘 Books Navigation (`/books`)

| Method     | Endpoint     | Description           | Features & Middleware Pipeline                    |
| :--------- | :----------- | :-------------------- | :------------------------------------------------ |
| **GET**    | `/books`     | List all books        | Pagination, Genre Filtering & Server-Side Caching |
| **GET**    | `/books/:id` | Get single book by ID | Instant Cache Delivery (`1ms - 2ms`)              |
| **POST**   | `/books`     | Create a new book     | `authenticate`, `writeLimiter`, `validateBody`    |
| **PUT**    | `/books/:id` | Update a book         | Whitelisted fields only (`isbn` is immutable)     |
| **DELETE** | `/books/:id` | Delete a book record  | Permanent record eviction                         |

### 💬 Reviews Management (`/books/:bookId/reviews`)

| Method   | Endpoint                 | Description                | Core Validations                                          |
| :------- | :----------------------- | :------------------------- | :-------------------------------------------------------- |
| **GET**  | `/books/:bookId/reviews` | Get all reviews for a book | Public access pipeline                                    |
| **POST** | `/books/:bookId/reviews` | Add a book review          | Rating boundary verification (1–5) & Ownership validation |

### 🔍 Advanced Utilities

* **Search (`GET /api/v1/search`)**: Supports combined full-text search parameters (`?q=tolkien&genre=fantasy&year=1954`) and is tightly protected by endpoint-specific rate limiting.
* **Statistics (`GET /api/v1/stats`)**: Computes deep metrics (Total books, reviews, list of unique genres, and overall average rating) leveraging highly efficient database-side **MongoDB Aggregation Pipelines**.

---

## ⚡ Caching & Performance Optimization

### 🛡️ ETag Support & HTTP Validation

All cacheable responses include an automatically generated **ETag header**. When a client makes a subsequent request with `If-None-Match`, the server performs a lightweight validation:

* If data is unchanged, it returns **`304 Not Modified`**, saving massive network bandwidth.

### 📦 Response Compression

Gzip compression is enabled via the `compression` middleware layer. It drastically minimizes payload sizes, ensures faster network data transfers, and reduces bandwidth utilization.

---

## 📋 Observability & Winston Logging

The system records structured JSON operational logs into automated physical files using **Winston**:

* `logs/combined.log`: Fully detailed audit trail of every single HTTP transaction.
* `logs/error.log`: Isolated production failures and exceptions for rapid system post-mortems.

### 📝 Example Log Structure

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

### 2. Configure Environment Variables (.env file in Root)

```env
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/library_db
JWT_SECRET=your_ultra_secure_jwt_production_secret
```

### 3. Run the Server

```bash
node server.js
```

### 4. Perform Health Check

```bash
curl http://localhost:3000/health
```
