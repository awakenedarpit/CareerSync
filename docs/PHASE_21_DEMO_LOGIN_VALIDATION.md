# Phase 21: Demo Account Login & Repeat Authentication Validation

**Document ID:** PHASE_21_DEMO_LOGIN_VALIDATION  
**Execution Date:** 2026-11-16  
**Auditor:** Senior Authentication Security Architect  
**Test Suite:** Live API Endpoint Validation against Neon PostgreSQL  
**Status:** **100% VERIFIED ACROSS ALL 6 ROLES**  

---

## 1. Executive Summary

All 6 canonical demo accounts were tested against the live CareerSync API endpoint (`POST /api/v1/auth/login`) backed by Neon PostgreSQL. Every account verified successfully with **HTTP 200 OK**, returned a valid signed JWT containing the correct role and tenant claims, and remained functional for repeated logins after session termination (logout).

---

## 2. 6-Role Live Authentication Matrix

| Persona | Email | Tested Password | HTTP Status | Role Claim | Target Dashboard | Repeated Login After Logout |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Student** | `aditya.sharma@apex.edu` | `DemoPassword@123` | **200 OK** | `student` | `/student` | ✅ Succeeded |
| **TPO Admin** | `tpo@apex.edu` | `DemoPassword@123` | **200 OK** | `tpo_admin` | `/admin` | ✅ Succeeded |
| **College Admin** | `admin@apex.edu` | `DemoPassword@123` | **200 OK** | `college_admin`| `/college-admin` | ✅ Succeeded |
| **Recruiter** | `recruiter@cloudscale.example.com` | `DemoPassword@123` | **200 OK** | `recruiter` | `/recruiter` | ✅ Succeeded |
| **Super Admin** | `admin@carrersync.internal` | `DemoPassword@123` | **200 OK** | `superadmin` | `/super-admin` | ✅ Succeeded |
| **Alumni** | `alumni@apex.edu` | `DemoPassword@123` | **200 OK** | `alumni` | `/alumni` | ✅ Succeeded |

---

## 3. Detailed JWT Claims Inspection

### Student JWT (`aditya.sharma@apex.edu`):
```json
{
  "sub": "9a733ff1-d2ce-4a10-a760-30bfa6487ec0",
  "tenant_id": "adffd8ec-d6f2-4fe4-a36a-97e2a84f6f69",
  "role": "student",
  "email": "aditya.sharma@apex.edu",
  "iat": 1794796136,
  "exp": 1794803336
}
```

### Super Admin JWT (`admin@carrersync.internal`):
```json
{
  "sub": "111ebee6-fcf2-4abb-a979-e7c86aab1357",
  "tenant_id": "e7413866-45a6-45d8-aaac-508c3c69c4d0",
  "role": "superadmin",
  "email": "admin@carrersync.internal",
  "iat": 1794796136,
  "exp": 1794803336
}
```

---

## 4. Logout & Repeated Login Integrity

### 4.1 Client Logout Behavior
When a user logs out in the frontend (`authService.logout()`):
1. `localStorage.removeItem('token')`
2. `localStorage.removeItem('user')`
3. `localStorage.removeItem('role')`
4. `localStorage.removeItem('tenant_id')`
5. `sessionStorage.clear()`

### 4.2 Account Preservation Invariant
- **Crucial Invariant Verified**: Logout executes client-side storage clearance. It does **not** call any deletion endpoint, does not alter `users.is_active`, and does not invalidate the password hash in PostgreSQL.
- **Repeat Login Verified**: Immediately following logout, logging in with the same email and `DemoPassword@123` produces a new valid JWT and grants access to the dashboard.
