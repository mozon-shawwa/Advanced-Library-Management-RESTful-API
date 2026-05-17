# 📚 Advanced Library Management API
 
A RESTful API built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**, following the **MVC + Services** architectural pattern with a full custom middleware pipeline.
 
---
 
## 🏗️ Project Structure
 
```
Advanced_Library_API/
├── server.js                         # Entry point — connects DB then starts server
└── src/
    ├── app.js                        # Express app — middleware stack & route mounting
    ├── config/
    │   └── index.js                  # Centralized config (PORT, MONGO_URI, limits)
    ├── database/
    │   └── index.js                  # Mongoose connection
    ├── middlewares/
    │   ├── index.js                  # Barrel export — single import point for all middlewares
    │   ├── auth.js                   # JWT authentication guard
    │   ├── errorHandler.js           # Global error handler + validateBody factory + notFound
    │   ├── logger.js                 # Winston logger + requestId + requestLogger
    │   └── rateLimit.js              # Three-tier rate limiting
    ├── models/
    │   ├── book.js                   # Book Mongoose schema
    │   └── review.js                 # Review Mongoose schema
    ├── controllers/
    │   ├── bookController.js         # HTTP layer — delegates to bookService
    │   └── reviewController.js       # HTTP layer — delegates to reviewService
    ├── services/
    │   ├── bookService.js            # Business logic — Books
    │   └── reviewService.js          # Business logic — Reviews
    ├── routes/
    │   ├── index.js                  # Master router
    │   ├── books.js                  # /books routes
    │   ├── reviews.js                # /books/:bookId/reviews routes
    │   ├── search.js                 # /search route
    │   └── stats.js                  # /stats route
    └── utils/
        └── sanitizer.js              # XSS string sanitization
```
 
---
 
## ⚙️ Architecture
 
The project enforces strict **Separation of Concerns** across four layers:
 
```
HTTP Request
     ↓
Middleware Layer   →  requestId, requestLogger, helmet, globalLimiter,
                      authenticate, writeLimiter, validateBody
     ↓
Controller Layer  →  Receives req/res, calls service, returns response
     ↓
Service Layer     →  All business logic and database queries
     ↓
Model Layer       →  Mongoose schemas with built-in validation
     ↓
MongoDB
```
 
Controllers are intentionally thin — every method is under 6 lines and only delegates to the service layer. All business rules live in services.
 
---
 
## 🔧 Middleware Pipeline
 
All middlewares are defined in `src/middlewares/` and exported through a single barrel file (`index.js`), so any route file only needs one import:
 
```js
const { authenticate, writeLimiter, validate } = require('../middlewares');
```
 
### Middleware execution order in `src/app.js`
 
```
Request
  ↓  helmet()           Security HTTP headers
  ↓  express.json()     Parse body (10kb limit)
  ↓  requestId          UUID v4 → req.id + X-Request-ID header
  ↓  requestLogger      Log after res.finish with timing in ms
  ↓  globalLimiter      100 req / 15 min
  ↓  Routes             authenticate → writeLimiter → validateBody → controller
  ↓  notFound           Unmatched routes → 404
  ↓  errorHandler       Global error handler
```
 
### 1. `requestId`
Assigns a UUID v4 to every request via `req.id` and sets it in the `X-Request-ID` response header. Every log line includes this ID for full request traceability.
 
### 2. `requestLogger`
Hooks into `res.on('finish')` using `process.hrtime()` (nanosecond precision) to calculate and log the exact response time in milliseconds after the response completes.
 
### 3. `authenticate`
Reads the `Authorization: Bearer <token>` header, verifies the JWT, and attaches the decoded payload to `req.user`. Returns 401 for missing, invalid, or expired tokens.
 
### 4. `validateBody(fields)`
A middleware factory that accepts an array of required field names. Rejects requests with missing fields (400) and sanitizes all string values through `sanitizer.js` to strip `<` and `>` characters before the data reaches the controller.
 
```js
// Usage in routes:
validate(['title', 'author', 'isbn', 'year', 'genre'])
```
 
### 5. Rate Limiting — Three Tiers
 
| Limiter | Window | Max Requests | Applied To |
|---|---|---|---|
| `globalLimiter` | 15 min | 100 | All `/api/v1` routes |
| `searchLimiter` | 1 min | 20 | `GET /search` only |
| `writeLimiter` | 1 min | 10 | POST / PUT / DELETE |
 
### 6. `errorHandler`
A 4-argument Express error handler that catches every error passed via `next(err)`. Returns a consistent JSON shape and hides stack traces in production.
 
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "The requested book record was not found."
}
```
 
---
 
## 📡 API Endpoints
 
Base URL: `http://localhost:3000/api/v1`
 
### Books — `/api/v1/books`
 
| Method | Endpoint | Description | Middleware |
|---|---|---|---|
| GET | `/` | List books with pagination & genre filter | — |
| GET | `/:id` | Get single book by ID | — |
| POST | `/` | Create a new book | `authenticate`, `writeLimiter`, `validateBody` |
| PUT | `/:id` | Update book (whitelisted fields only) | `authenticate`, `writeLimiter` |
| DELETE | `/:id` | Delete a book | `authenticate`, `writeLimiter` |
 
**Pagination & Filtering:**
```
GET /api/v1/books?page=1&limit=10&genre=Fiction
```
 
**Field whitelist on PUT:** Only `title`, `author`, `year`, `genre` can be updated — `isbn` is immutable.
 
### Reviews — `/api/v1/books/:bookId/reviews`
 
| Method | Endpoint | Description | Middleware |
|---|---|---|---|
| GET | `/` | Get all reviews for a book | — |
| POST | `/` | Add a review (rating: 1–5) | `writeLimiter`, `validateBody` |
 
Uses `mergeParams: true` to access `:bookId` from the parent router.
 
### Search & Stats
 
| Method | Endpoint | Description | Middleware |
|---|---|---|---|
| GET | `/api/v1/search` | Search by title, author, genre, year | `searchLimiter` |
| GET | `/api/v1/stats` | Total books, reviews, genres, avg rating | — |
| GET | `/health` | Server uptime check | — |
 
**Search params:** `?q=tolkien&genre=fantasy&year=1954`
 
**Stats response:**
```json
{
  "totalBooks": 42,
  "totalReviews": 128,
  "genres": ["Fiction", "Sci-Fi", "Fantasy"],
  "avgRating": 4.23
}
```
 
Stats use a MongoDB `$group` aggregation pipeline — the average rating is computed database-side, not in Node.js memory.
 
---
 
## 🗄️ Data Models
 
### Book
```js
{
  title:  String  (required, trimmed)
  author: String  (required, trimmed)
  isbn:   String  (required, unique, trimmed)
  year:   Number  (required)
  genre:  String  (required, trimmed)
}
```
 
### Review
```js
{
  bookId:  ObjectId  (ref: 'Book', required)
  user:    String    (required, trimmed)
  rating:  Number    (required, min: 1, max: 5)
  comment: String    (required, trimmed)
}
```
 
---
 
## 🔒 Security
 
| Layer | Implementation |
|---|---|
| Security headers | `helmet()` — sets 11+ HTTP security headers automatically |
| Body size limit | `express.json({ limit: '10kb' })` — prevents memory exhaustion |
| XSS sanitization | All string input stripped of `<` and `>` before reaching controller |
| Authentication | JWT verification on all write endpoints |
| Rate limiting | Three independent limiters protect different attack surfaces |
| Field whitelisting | PUT requests can only modify explicitly allowed fields |
 
---
 
## 🚀 Getting Started
 
**Prerequisites:** Node.js, MongoDB running locally or a MongoDB Atlas URI.
 
```bash
# 1. Install dependencies
npm install
 
# 2. Set environment variables (optional)
MONGO_URI=mongodb://localhost:27017/library_db
JWT_SECRET=your_secret_here
PORT=3000
 
# 3. Start the server
node server.js
 
# 4. Verify
curl http://localhost:3000/health
```
 
---
 
## 📋 Logging
 
Winston writes structured JSON logs to two rotating files:
 
| File | Content |
|---|---|
| `logs/combined.log` | All log levels |
| `logs/error.log` | Errors only |
 
Console output is enabled in development mode with colorized formatting. Every log line includes `reqId`, `method`, `url`, `status`, and `durationMs`.
 
**Example log line:**
```json
{
  "level": "info",
  "message": "HTTP Request Processed",
  "reqId": "6edf5c77-6b94-42e8-850c-aad328c6fd27",
  "method": "POST",
  "url": "/api/v1/books",
  "status": 401,
  "durationMs": "1.79",
  "timestamp": "2026-05-16T10:33:17.845Z"
}
```
