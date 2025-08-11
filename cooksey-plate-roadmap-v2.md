# Cooksey Plate Development Roadmap v2.0
## Fresh Start Implementation Guide

---

## 🎯 High-Level Execution Order

### Step-by-Step Implementation Sequence

#### **Step 1: Documentation Setup (30 minutes)**
```bash
1. Create project folder: cooksey-plate-2025
2. Create CLAUDE.md file with:
   - Project context and goals
   - Technical stack decisions
   - API endpoints and data structures
   - Family group configurations
   - Copy PRD v2.0 content for reference
```

#### **Step 2: Project Initialization (1 hour)**
```bash
# Frontend setup
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install tailwindcss postcss autoprefixer
npm install @radix-ui/react-* lucide-react class-variance-authority clsx
npm install axios react-router-dom date-fns

# Backend setup
mkdir backend
cd backend
npm init -y
npm install express cors dotenv sqlite3 node-cron axios
npm install -D @types/node @types/express typescript nodemon
npm install xlsx csv-parser
```

#### **Step 3: GitHub Repository (15 minutes)**
```bash
git init
git add .
git commit -m "Initial commit: Cooksey Plate 2025 fresh start"
git branch -M main
git remote add origin https://github.com/[username]/cooksey-plate-2025.git
git push -u origin main
git checkout -b develop
```

#### **Step 4: Database Schema Creation (1 hour)**
```sql
-- Create all tables with squiggle_game_key as linking field
-- squiggle_games table: Full mirror of Squiggle API
-- games table: Application-specific with squiggle_game_key reference
-- Add indexes on squiggle_game_key for all tables
-- Create views for complex queries (ladder calculations)
-- Add triggers for automatic timestamp updates

-- Key generation stored procedure/function
CREATE FUNCTION generate_squiggle_key(round_num INT, game_num INT) 
RETURNS VARCHAR(3) AS 
  LPAD(round_num, 2, '0') || game_num
```

#### **Step 5: Squiggle API Integration (2 hours)**
```javascript
// Priority implementation order:
1. Create SquiggleService class
2. Implement fetchGames(year, round?)
3. Store complete API response in squiggle_games table
4. Generate squiggle_game_key for each game (roundNumber + gameNumber)
5. Transform and copy needed data to games table with key reference
6. Add caching layer to minimize API calls
7. Build error handling and retry logic
8. Test with 2025 data and verify key generation
```

#### **Step 6: Core Backend APIs (2 hours)**
```javascript
// Build in this order:
1. Database connection and models
2. /api/rounds endpoints
3. /api/games endpoints  
4. /api/tips submission
5. /api/ladder calculation
6. Authentication middleware
```

#### **Step 7: Frontend Components (3 hours)**
```javascript
// Component build order:
1. Layout/Navigation
2. TeamSelector with logos
3. TipsSubmission form
4. LadderTable
5. RoundSelector
6. Apply Lovable styleguide
```

#### **Step 8: Scheduler Implementation (2 hours)**
```javascript
// Scheduler setup:
1. Port existing manage-scheduler.js
2. Create SchedulerService class
3. Add cron jobs for updates
4. Build admin UI for control
5. Add logging and monitoring
```

#### **Step 9: Historical Data Import (2 hours)**
```javascript
// ETL Pipeline:
1. Create ExcelImporter class
2. Parse Cooksey Plate - 2025.xlsx
3. Transform to database format
4. Match with Squiggle game IDs
5. Validate tip correctness
6. Bulk insert with progress tracking
```

#### **Step 10: Testing & Deployment (1 day)**
```bash
# Testing checklist:
- [ ] Import historical data successfully
- [ ] Verify ladder calculations match Excel
- [ ] Test family group permissions
- [ ] Validate Squiggle updates work
- [ ] Check mobile responsiveness
- [ ] Beta test with 3 family members

# Deployment:
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway
- [ ] Configure environment variables
- [ ] Set up production database
- [ ] Enable scheduler
- [ ] Monitor first live round
```

---

## 📊 Development Timeline

### Week 1: Foundation & Core Features
| Day | Focus | Deliverables |
|-----|-------|-------------|
| **Day 1** | Setup & Architecture | Project initialized, GitHub repo, database schema |
| **Day 2** | Squiggle Integration | API connected, caching working, data transformed |
| **Day 3** | Backend APIs | All endpoints functional, authentication working |
| **Day 4** | Frontend UI | Components built, Lovable design applied |
| **Day 5** | Scheduler & Admin | Automated updates, admin panel functional |

### Week 2: Data & Polish
| Day | Focus | Deliverables |
|-----|-------|-------------|
| **Day 6** | Historical Import | Excel data imported, validated against Squiggle |
| **Day 7** | Testing | All features tested, bugs fixed |
| **Day 8** | Deployment | Live on production, family onboarded |

---

## 🔑 Critical Path Items

### Must Complete Before Moving Forward
1. **Squiggle API caching** - Prevents rate limiting
2. **Database schema** - Foundation for everything
3. **Family group logic** - Core permission system
4. **Historical import** - Needed for ladder accuracy

### Can Be Done In Parallel
- Frontend styling while backend develops
- Scheduler while import tools built
- Documentation while testing

---

## 📋 Data Import Strategy

### Excel to Database Mapping
```javascript
// Excel columns → Database fields
{
  "Person": "users.name",
  "Round X - Game Y": "tips.selected_team",
  "Correct": "tips.is_correct",
  
  // Process flow:
  // 1. Read Excel row by row
  // 2. For each person and round
  // 3. Generate squiggle_game_key (e.g., Round 2 Game 9 = "029")
  // 4. Match with squiggle_games table using key
  // 5. Validate team names
  // 6. Calculate correctness
  // 7. Insert into tips table with squiggle_game_key
}

// Key generation examples:
// Round 0, Game 1 → "001"
// Round 2, Game 9 → "029"
// Round 10, Game 3 → "103"
// Round 23, Game 5 → "235"
```

### Validation Checklist
- [ ] All 25 family members imported
- [ ] Rounds 0-22 complete
- [ ] Tips match Excel exactly
- [ ] Ladder calculations verified
- [ ] No duplicate entries

---

## 🚀 Launch Criteria

### Minimum Viable Product
- ✅ Users can submit tips
- ✅ Tips lock at game start
- ✅ Ladder updates automatically
- ✅ Historical data imported
- ✅ Family groups working
- ✅ Mobile responsive

### Go-Live Checklist
- [ ] Production database backed up
- [ ] Scheduler running reliably
- [ ] Admin accounts created
- [ ] Family members invited
- [ ] Support channel established
- [ ] First round tips entered

---

## 🛠️ Technology Stack Summary

### Frontend
```json
{
  "framework": "React 18 with TypeScript",
  "build": "Vite",
  "styling": "Tailwind CSS + shadcn/ui",
  "routing": "React Router v6",
  "state": "Context API + hooks",
  "http": "Axios"
}
```

### Backend
```json
{
  "runtime": "Node.js 20+",
  "framework": "Express",
  "database": "SQLite (dev) / PostgreSQL (prod)",
  "scheduler": "node-cron",
  "auth": "JWT",
  "validation": "Joi or Zod"
}
```

### External Services
```json
{
  "data": "Squiggle API",
  "hosting_frontend": "Vercel",
  "hosting_backend": "Railway",
  "monitoring": "Console logs → Datadog (future)"
}
```

---

## 📝 Quick Reference Commands

### Development
```bash
# Start frontend
cd frontend && npm run dev

# Start backend
cd backend && npm run dev

# Run scheduler
node backend/manage-scheduler.js

# Import historical data
node backend/scripts/import-excel.js

# Check database
sqlite3 backend/db/cooksey-plate.db
```

### Git Workflow
```bash
# Feature development
git checkout develop
git checkout -b feature/squiggle-integration
# ... make changes ...
git add .
git commit -m "feat: add Squiggle API integration"
git push origin feature/squiggle-integration
# Create PR to develop

# Release to production
git checkout main
git merge develop
git tag v1.0.0
git push origin main --tags
```

---

## ⚠️ Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Squiggle API down | Cache last known data, manual override |
| Import fails | Validation checks, rollback capability |
| Scheduler crashes | Health checks, auto-restart, logging |
| Database corruption | Daily backups, transaction logs |

### Process Risks
| Risk | Mitigation |
|------|------------|
| Scope creep | Stick to MVP features only |
| Family adoption | Simple UI, training video |
| Data accuracy | Validate against Excel multiple times |

---

## 🎯 Definition of Done

### Feature Complete When:
1. Code reviewed and tested
2. Database migrations run
3. API endpoints documented
4. Frontend connected and styled
5. Error handling implemented
6. Logged appropriately
7. Deployed to staging
8. Tested by family member

### Project Complete When:
1. All MVP features working
2. Historical data imported
3. First live round successful
4. Family onboarded
5. Documentation complete
6. Backup strategy in place