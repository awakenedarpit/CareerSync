# CarrerSync API Documentation

## Base URL
- **Local Development**: `http://localhost:5000/api`
- **Root URL**: `http://localhost:5000/`

---

## 1. Implemented Endpoints (Phase 1)

### 1.1 Root Information
- **Endpoint**: `GET /`
- **Description**: Returns general service information, description, and status links.
- **Authentication**: None (Public)

#### Request
```http
GET / HTTP/1.1
Host: localhost:5000
```

#### Response (`200 OK`)
```json
{
  "name": "CarrerSync API",
  "description": "Agentic Placement Intelligence Platform",
  "version": "1.0.0",
  "documentation": "/docs",
  "health": "/api/health"
}
```

---

### 1.2 System & Database Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Verifies API operational status and reports live MongoDB connection status (`connected` or `disconnected`). Non-blocking: will never crash if database credentials have not been configured.
- **Authentication**: None (Public)

#### Request
```http
GET /api/health HTTP/1.1
Host: localhost:5000
```

#### Response (`200 OK`) - When Database is Disconnected / Unconfigured
```json
{
  "success": true,
  "message": "CarrerSync API is running",
  "database": "disconnected"
}
```

#### Response (`200 OK`) - When Database is Connected
```json
{
  "success": true,
  "message": "CarrerSync API is running",
  "database": "connected"
}
```

---

## 2. Error Responses

### 2.1 Route Not Found (404)
When a client requests an unmapped or invalid endpoint:

#### Response (`404 Not Found`)
```json
{
  "success": false,
  "error": "Route not found",
  "path": "/api/invalid-route",
  "method": "GET"
}
```

### 2.2 Centralized Error Handling (500 / 4xx)
All unhandled errors return a structured JSON response. In production mode (`NODE_ENV=production`), internal stack traces are masked.

#### Response (`500 Internal Server Error`)
```json
{
  "success": false,
  "error": "Internal Server Error"
}
```

---

## 3. Planned Endpoints for Future Phases

| Method | Endpoint | Description | Phase |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Tenant-isolated user registration | Phase 2 |
| `POST` | `/api/auth/login` | JWT issue & authentication | Phase 2 |
| `GET` | `/api/student/profile` | Verified student profile & skills | Phase 2 |
| `POST` | `/api/evidence/github` | Ingest and verify GitHub repository | Phase 3 |
| `GET` | `/api/gaps/target-role` | Skill gap analysis against job role | Phase 3 |
| `GET` | `/api/drives/eligible` | Student eligible campus drives | Phase 4 |
| `POST` | `/api/admin/drives` | Create new recruitment drive | Phase 4 |
