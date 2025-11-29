# 🚀 Backend Setup Guide

## Prerequisites
- Docker Desktop installed and **running**
- Node.js 20+ installed

## Quick Start

### 1. Start Docker Desktop
Make sure Docker Desktop is running before proceeding.

### 2. Start Databases
```bash
cd "c:/Users/toluk/Desktop/Base Jungle"
docker-compose -f docker-compose.backend.yml up -d
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Adminer (DB UI) on `localhost:8080`

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env if needed (default values should work)
```

### 5. Start Backend Server
```bash
npm run dev
```

Backend will run on `http://localhost:3001`

## Verify Installation

### Check Database
1. Open http://localhost:8080 (Adminer)
2. Login with:
   - System: PostgreSQL
   - Server: postgres
   - Username: basejungle
   - Password: basejungle_dev_pass
   - Database: basejungle

### Check Backend
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","database":"connected","redis":"connected"}
```

## Useful Docker Commands

```bash
# View logs
docker-compose -f docker-compose.backend.yml logs -f

# Stop services
docker-compose -f docker-compose.backend.yml down

# Reset database (delete all data)
docker-compose -f docker-compose.backend.yml down -v
docker-compose -f docker-compose.backend.yml up -d
```

## Next Steps
Once the backend is running:
1. Start Ponder indexer (Phase 2)
2. Connect frontend to backend
3. Test deposit flow end-to-end
