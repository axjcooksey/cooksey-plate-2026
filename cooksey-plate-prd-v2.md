# Product Requirements Document (PRD) v2.0
## Cooksey Plate - Family AFL Tipping Platform
### AI-Optimized for Claude Code Development

---

## 1. Executive Summary
**Product Name:** Cooksey Plate 2025  
**Version:** 2.0 (Fresh Restart)  
**Date:** August 12, 2025  
**Development Approach:** AI-Assisted with Claude Code

### Vision Statement
A family-focused AFL tipping platform that automates the Excel-based system, provides real-time updates via Squiggle API integration, and maintains the transparent, family-friendly competition culture.

### Key Technical Decisions
- **Framework:** React with TypeScript (using Vite)
- **UI Framework:** Tailwind CSS with shadcn/ui components
- **Database:** SQLite for local development, PostgreSQL for production
- **API:** Node.js/Express backend with Squiggle API integration
- **Deployment:** Vercel (frontend) + Railway/Render (backend)

---

## 2. Core Architecture

### Data Flow
```
Squiggle API → Local Database Cache → Backend API → React Frontend
                        ↑
                Historical Data Import (Excel)
```

### Database Schema (Essential Tables)
```sql
-- Squiggle API Mirror (complete copy of API data)
squiggle_games (
  id, 
  squiggle_game_key VARCHAR(3), -- Custom key: RoundNumber + GameNumber (e.g., "001", "029", "235")
  round_number,
  game_number,
  year,
  complete,
  date,
  tz,
  hteam,
  ateam,
  hscore,
  ascore,
  hgoals,
  agoals,
  hbehinds,
  abehinds,
  venue,
  winner,
  updated,
  raw_json, -- Store complete API response
  created_at,
  updated_at
)

-- Core application tables (linked via squiggle_game_key)
users (id, name, email, family_group_id, role, created_at)
family_groups (id, name, created_at)
rounds (id, round_number, year, status, lockout_time)
games (
  id, 
  squiggle_game_key VARCHAR(3), -- Links to squiggle_games table
  round_id, 
  home_team, 
  away_team, 
  home_score, 
  away_score, 
  start_time, 
  venue, 
  is_complete
)
tips (id, user_id, game_id, squiggle_game_key, round_id, selected_team, is_correct, created_at)

-- Historical import tables
historical_tips (id, user_name, round, game_number, squiggle_game_key, selected_team, is_correct, year)
import_logs (id, import_type, status, records_processed, created_at)
```

### Squiggle Game Key Logic
```javascript
// Generate squiggle_game_key
function generateSquiggleKey(roundNumber, gameNumber) {
  // Pad round to 2 digits, game to 1 digit
  const round = String(roundNumber).padStart(2, '0');
  const game = String(gameNumber);
  return `${round}${game}`;
}

// Examples:
// Round 0, Game 1 = "001"
// Round 2, Game 9 = "029" 
// Round 23, Game 5 = "235"
// Round 10, Game 3 = "103"
```

---

## 3. Development Phases (AI-Optimized Order)

### Phase 1: Foundation Setup (Day 1)
**Goal:** Establish project structure and development environment

1. **Project Initialization**
   - Create React app with Vite and TypeScript
   - Install core dependencies (Tailwind, shadcn/ui, React Router)
   - Set up ESLint and Prettier
   - Create folder structure:
     ```
     /src
       /components
       /pages
       /services
       /hooks
       /utils
       /types
     /backend
       /routes
       /services
       /db
       /schedulers
     ```

2. **Version Control**
   - Initialize Git repository
   - Create .gitignore (node_modules, .env, dist, *.db)
   - Initial commit with boilerplate
   - Create GitHub repository
   - Set up main/develop branches

3. **Environment Configuration**
   - Create .env files for dev/prod
   - Configure database connections
   - Set up API endpoints

### Phase 2: UI Implementation (Day 2)
**Goal:** Implement Lovable prototype design

1. **Component Library Setup**
   - Implement Lovable wireframe layout
   - Apply styleguide colors and typography
   - Create reusable components:
     - TeamSelector (with AFL team logos)
     - TipsCard
     - LadderTable
     - RoundSelector
     - CountdownTimer

2. **Page Structure**
   - Home (current round overview)
   - Tipping page (team selection interface)
   - Ladder (live standings)
   - History (past rounds)
   - Admin panel (scheduler, import tools)

### Phase 3: Backend & Database (Day 3-4)
**Goal:** Create API and database infrastructure

1. **Database Setup**
   - Create SQLite database for development
   - Implement schema with all tables
   - Create migration scripts
   - Set up database connection pool

2. **API Development**
   - Express server setup
   - Authentication endpoints
   - Tips submission endpoints
   - Ladder calculation logic
   - Family group management

3. **Squiggle Integration**
   - Create Squiggle API service
   - Implement caching mechanism
   - Build data transformation layer
   - Error handling and retry logic

### Phase 4: Scheduler Implementation (Day 5)
**Goal:** Automated data updates

1. **Scheduler Service**
   - Implement node-cron for scheduling
   - Create update jobs:
     - Daily fixture updates (6 AM, 8 PM AEST)
     - Live score updates (every 5 min during games)
     - Cache refresh
   
2. **Admin Interface**
   - Scheduler status dashboard
   - Manual trigger buttons
   - Log viewer
   - Database status monitor

### Phase 5: Historical Data Import (Day 6)
**Goal:** ETL pipeline for Excel data

1. **Import Service**
   - Excel parser (xlsx library)
   - Data validation layer
   - Mapping to database schema
   - Duplicate detection
   - Progress tracking

2. **Import Workflow**
   ```
   Excel → Parse → Validate → Transform → 
   Match with Squiggle → Calculate Correctness → 
   Insert to DB → Update Ladder
   ```

### Phase 6: Testing & Deployment (Day 7-8)
**Goal:** Production-ready deployment

1. **Testing**
   - Component testing
   - API endpoint testing
   - Data import validation
   - Family beta testing

2. **Deployment**
   - Deploy frontend to Vercel
   - Deploy backend to Railway
   - Configure domain
   - Set up SSL certificates
   - Enable production scheduler

---

## 4. API Specifications

### Squiggle API Integration
```javascript
// Primary endpoint for 2025 games
GET https://api.squiggle.com.au/?q=games;year=2025;format=json

// Response structure to handle:
{
  "games": [{
    "id": 123,
    "round": 1,
    "hteam": "Richmond",
    "ateam": "Carlton", 
    "hscore": 95,
    "ascore": 87,
    "date": "2025-03-20 19:20:00",
    "venue": "MCG"
  }]
}
```

### Internal API Endpoints
```
GET    /api/rounds/current
GET    /api/rounds/:id/games
POST   /api/tips
GET    /api/tips/round/:roundId
GET    /api/ladder
GET    /api/users/family-group/:groupId
POST   /api/admin/scheduler/trigger
GET    /api/admin/scheduler/status
POST   /api/admin/import/excel
```

---

## 5. Family Structure Configuration

### Family Groups (Confirmed)
```javascript
const FAMILY_GROUPS = {
  1: { name: "Ashtons & PFCs", members: ["David", "Chris", "Jamie", "Emma", "Zoe", "Pop", "Katie"] },
  2: { name: "PJCs", members: ["Phil", "Tracy", "Ryan"] },
  3: { name: "Chelsea Florences", members: ["Shannan", "Tom", "Billy"] },
  4: { name: "Richmond Cookseys", members: ["Alex", "Ruby"] },
  5: { name: "South-East Cookseys", members: ["Mark", "Henry"] },
  6: { name: "Perth Cookseys", members: ["Paulie", "Jenni", "Charlee"] },
  7: { name: "Tassie Cookseys", members: ["Anne", "Stephen"] }
};

const INDIVIDUALS = ["Jayne", "Ant"];
const ADMINS = ["Alex", "Phil"];
```

---

## 6. Key Features Priority

### Must Have (MVP)
1. ✅ User authentication with family groups
2. ✅ Tips submission with dropdown for family members
3. ✅ Transparent tips display after first game
4. ✅ Live ladder with automatic calculations
5. ✅ Squiggle API integration with caching
6. ✅ Historical data import from Excel
7. ✅ Admin scheduler interface

### Should Have
1. Round-by-round history view
2. Mobile-responsive design
3. Countdown timer for round lockout
4. Basic statistics (win streaks, averages)

### Nice to Have
1. Weekly newsletter generation
2. Push notifications
3. Head-to-head comparisons
4. Season predictions

---

## 7. Technical Constraints & Decisions

### Performance Requirements
- Page load: <2 seconds
- API response: <500ms
- Database queries: <100ms
- Squiggle cache TTL: 5 minutes during games, 1 hour otherwise

### Security
- JWT authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration for production

### Data Validation Rules
- Tips must be submitted before game start time
- Users can only tip for their family group members
- Admins can tip for anyone
- Historical data must match Squiggle game IDs
- No duplicate tips per user per game

---

## 8. Success Metrics
- Zero manual Excel updates required
- 100% accurate scoring via Squiggle API
- <5 minute delay for live score updates
- Successful import of all historical data
- 80%+ family adoption in first month

---

## 9. Development Guidelines for Claude Code

### Code Style
- Use TypeScript with strict mode
- Functional components with hooks
- Async/await over promises
- Comprehensive error handling
- Clear variable naming

### File Organization
- One component per file
- Shared types in `/types`
- API calls in `/services`
- Database queries in `/backend/db`
- Utility functions in `/utils`

### Testing Approach
- Test data import accuracy first
- Validate Squiggle integration
- Check family group permissions
- Verify ladder calculations

### Documentation
- Inline comments for complex logic
- README with setup instructions
- API documentation with examples
- Database schema diagram