# 🍔 KAHA Restaurant E-Commerce Platform

A comprehensive, production-ready full-stack restaurant e-commerce platform featuring a NestJS backend and a React + TypeScript frontend, designed to integrate with the KAHA main ecosystem.

---

## 🏗️ System Architecture & Structure

The repository is organized as a monorepo containing the main sub-components of the platform:

```
KAHA_Verse/
├── Kaha_restaurant-ecommerce/    # NestJS Backend API
│   └── restaurant-ecommerce/
│       ├── src/                  # Application source files
│       ├── docs/                 # Detailed system & API docs
│       ├── migrations/           # Database migration files
│       └── postman/              # Postman API testing collections
├── kaha_Restarant_Eecommerce_Frontend/ # React Frontend Application
│   └── src/                      # UI components, pages & API client
│       ├── components/           # Reusable UI components
│       ├── pages/                # Page views (Customer & Admin)
│       └── api/                  # API communication layer
├── start-kaha-fullstack.sh       # Startup script (Mock/Local Auth mode)
├── START_FIXED_SYSTEM.sh         # Startup script (Production/Kaha Main V3 mode)
└── stop-kaha-fullstack.sh        # Cleanup script to stop services
```

---

## 🛠️ Tech Stack

### Backend
- **Framework:** NestJS
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT with Passport (Local Mock or Production Main V3 Integration)
- **Validation:** `class-validator` & `class-transformer`
- **Testing:** Jest & Supertest
- **API Documentation:** Swagger / OpenAPI

### Frontend
- **Framework:** React with TypeScript & Vite
- **Styling:** Vanilla CSS & TailwindCSS (where applicable)
- **Routing:** React Router DOM
- **API Client:** Axios (fully configured with interceptors for auth tokens)

---

## 🚀 Getting Started

### 📋 Prerequisites
Make sure you have the following installed on your system:
- **Node.js** (v18+ recommended)
- **NPM** (v9+)
- **Docker & Docker Compose** (for running PostgreSQL database)
- **PostgreSQL Client** (optional, for DB verification)

---

## ⚙️ Configuration & Environment Setup

### 1. Backend Configuration
Navigate to `Kaha_restaurant-ecommerce/restaurant-ecommerce/` and copy the example environment file:
```bash
cp .env.example .env
```
Key backend variables (`.env`):
- `PORT=3001` - Port where backend runs
- `DATABASE_HOST=localhost`
- `DATABASE_PORT=5432`
- `DATABASE_NAME=kaha_restaurant_db`
- `DATABASE_USER=postgres`
- `DATABASE_PASSWORD=postgres`
- `JWT_SECRET=your_jwt_secret`
- `USE_MOCK_AUTH=false` - Set to `true` for development mock auth, or `false` for production/external API integration
- `KAH_API_V3_BASE_URL=https://api.kaha.com.np/main/api/v3` - Base URL for the Kaha Main API

### 2. Frontend Configuration
Navigate to `kaha_Restarant_Eecommerce_Frontend/` and copy the example environment file:
```bash
cp .env.example .env
```
Key frontend variables (`.env`):
- `VITE_API_URL=http://localhost:3001` - Backend API URL
- `VITE_KAHA_MAIN_V3_URL=https://api.kaha.com.np/main/api/v3` - Main V3 API integration endpoint

---

## 🏁 Starting the Application

You can start the full stack using one of the pre-configured shell scripts in the root directory.

### Mode A: Development / Mock Authentication
This mode uses local mock auth and seeds the database with mock categories, menus, and addons.
```bash
# Make script executable (if not already)
chmod +x start-kaha-fullstack.sh stop-kaha-fullstack.sh

# Run startup script
./start-kaha-fullstack.sh
```
This script will:
1. Verify/start PostgreSQL via Docker.
2. Install backend dependencies and seed the database.
3. Start the NestJS backend on `http://localhost:3001`.
4. Install frontend dependencies and start the Vite server on `http://localhost:5173`.

### Mode B: Production / Kaha Main V3 Integration
This mode connects directly to the production main Kaha APIs for authentication and user sessions.
```bash
# Make script executable
chmod +x START_FIXED_SYSTEM.sh

# Run production system startup
./START_FIXED_SYSTEM.sh
```
This script will:
1. Validate environment configuration flags (`USE_MOCK_AUTH=false`).
2. Verify PostgreSQL service status.
3. Test connectivity to the remote Kaha Main API.
4. Run migrations and start both backend and frontend servers in the background.

---

## 🔑 Test Credentials

### Mode A (Local Mock)
- **Business ID:** `biz-mock-001`
- **Customer Account:** Use any register flow or configured mock user.
- **Admin Login:** Credentials provided during seed execution.

### Mode B (Production Kaha Main V3)
- **Admin User (Ishwor thapa):**
  - **Contact Number:** `9813870231`
  - **Password:** `ishwor19944`
- **Owner User:**
  - **Email:** `owner@kahastays.com`
  - **Password:** `password123`

---

## 🛑 Stopping the Application

To clean up and shut down all background full-stack processes, run:
```bash
./stop-kaha-fullstack.sh
```
You will be prompted on whether you want to stop the local Docker PostgreSQL database container.

---

## 📖 Key Commands & Scripts

### Backend Commands
From directory `Kaha_restaurant-ecommerce/restaurant-ecommerce/`:
- `npm run start:dev` - Run the NestJS application in watch mode
- `npm run migration:run` - Apply database migrations
- `npm run seed` - Seed database with menu data
- `npm run test` - Run backend unit tests

### Frontend Commands
From directory `kaha_Restarant_Eecommerce_Frontend/`:
- `npm run dev` - Run Vite development server
- `npm run build` - Build production assets
- `npm run preview` - Preview production build locally

---

## 🌐 API & Documentation References
- **Swagger UI:** Accessible at `http://localhost:3001/api` (or `http://localhost:3001/api/v1/docs` in production mode) when backend is running.
- **Frontend Integration Guide:** [FRONTEND_API_GUIDE.md](./kaha_Restarant_Eecommerce_Frontend/FRONTEND_API_GUIDE.md) - Details all endpoints, parameters, request payloads, and UI connection code snippets.
- **Project Status Summary:** [PROJECT_STATUS_SUMMARY.md](./PROJECT_STATUS_SUMMARY.md) - Status of components, deliverables, and integration checkpoints.
