# Developer Documentation: Agro-Investment Platform

A guide for developers to setup, contribute, and deploy the platform.

## 1. Project Overview
- **Architecture**: MERN Stack (Prisma as ORM).
- **Frontend**: React + Tailwind CSS + Recharts.
- **Backend**: Node.js + Express + Prisma (PostgreSQL recommended).
- **Testing**: Jest + Supertest.
- **Documentation**: Swagger/OpenAPI.

## 2. Local Setup
### Prerequisites
- Node.js (v18+)
- PostgreSQL (or any Prisma-supported DB)
- AWS Account (for S3 storage)
- Mailtrap/Gmail (for SMTP)

### Installation
1.  **Clone Repository**: `git clone <repo-url>`
2.  **Backend Setup**:
    - `cd backend`
    - `npm install`
    - Create `.env` based on `.env.example`.
    - `npx prisma migrate dev`
3.  **Frontend Setup**:
    - `cd frontend`
    - `npm install`
    - Create `.env` for `REACT_APP_API_URL`.

## 3. Environment Variables
### Backend
- `DATABASE_URL`: Connection string.
- `JWT_SECRET`: Secret for auth tokens.
- `AWS_ACCESS_KEY_ID`/`SECRET_ACCESS_KEY`: For file uploads.
- `SMTP_HOST`/`USER`/`PASS`: For email notifications.

## 4. Testing
- **Run Unit Tests**: `npm test` (in backend)
- **Run Integration Tests**: `npx jest tests/integration`
- **Coverage Reports**: Available in `backend/coverage` after running tests.

## 5. Deployment
### Production Requirements
- SSL Certificates.
- Security Headers (Helmet configured).
- Rate Limiting (Express-rate-limit configured).
- CI/CD: GitHub Actions workflow located in `.github/workflows`.

## 6. Code Style
- Follow ES6+ standards.
- Use `successResponse` and `errorResponse` helpers for API consistency.
- Document new routes using Swagger annotations.
