# Product Requirements Document (PRD) v2.0
## Cooksey Plate - Family AFL Tipping Platform
### AI-Optimized for Claude Code Development

---

## 1. Executive Summary
**Product Name:** Cooksey Plate 2025  
**Version:** 2.0 (Fresh Restart)  
**Date:** August 12, 2025  
**Development Approach:** AI-Assisted with Claude Code  
**Current Status:** 70% COMPLETE - MVP FUNCTIONAL ✅

### Vision Statement
A family-focused AFL tipping platform that automates the Excel-based system, provides real-time updates via Squiggle API integration, and maintains the transparent, family-friendly competition culture.

### 🎉 DEVELOPMENT UPDATE - JANUARY 2025
**MAJOR MILESTONE ACHIEVED:** Full-stack application successfully built and functional!

#### ✅ COMPLETED FEATURES (MVP READY)
- **Frontend Application:** React + TypeScript + Tailwind CSS with clean Lovable design
- **Backend API:** Node.js + Express with complete RESTful API
- **Database:** SQLite with complete schema, 25 family members across 8 groups
- **Authentication:** User login system with family group management
- **Squiggle Integration:** Real-time AFL data fetching and caching
- **Core Functionality:** Tip submission, ladder calculations, stats dashboard
- **UI/UX:** Responsive design with AFL stadium imagery and red gradient branding
- **Navigation:** All main pages implemented (Home, Tipping, Ladder, History, Admin)

#### 🔄 IN PROGRESS
- Backend servers running on development ports
- Live API testing and validation

#### ⏳ REMAINING FOR PRODUCTION
- Automated scheduler for game updates and tip locking
- Historical Excel data import functionality  
- Production deployment configuration

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

## 9. Round Status Business Logic

### Overview
The application implements sophisticated round status determination based on Squiggle API completion data with specific business rules for optimal user experience.

### Round Status Definitions

#### Status Types
1. **"upcoming"** - Round not yet started, tips can be submitted
2. **"active"** - Round in progress, tips locked, games being played
3. **"completed"** - All games finished, results available

#### Determination Logic (Using Squiggle API `complete` field 0-100)

```javascript
// Round Status Rules (implemented in TipsService.updateRoundStatus):

if (all games have complete = 100) {
  status = "completed"
} else if (some games have 0 < complete < 100 OR current time > first game start time) {
  status = "active"  
} else if (all games have complete = 0 AND current time < first game start time) {
  status = "upcoming"
}
```

### Current Round Selection Logic

#### 2-Day Grace Period Rule
After a round is completed (all games complete = 100), the system continues showing that completed round as the "current round" for **2 days** after the last game finishes. On the 3rd day, it switches to the next upcoming/active round.

```javascript
// Current Round Algorithm (implemented in TipsService.getCurrentRound):

1. Find most recently completed round
2. If completed round exists AND we're within 2 days of last game time:
   → Return completed round (grace period)
3. Else find active round:
   → Return first active round
4. Else find upcoming round:  
   → Return first upcoming round
5. Else return latest available round
```

#### Grace Period Calculation
```javascript
const lastGameTime = new Date(latestCompletedRound.last_game_time);
const twoDaysAfter = new Date(lastGameTime.getTime() + (2 * 24 * 60 * 60 * 1000));
const now = new Date();

if (now <= twoDaysAfter) {
  // Still in grace period - show completed round
  return completedRound;
} else {
  // Grace period over - show next round
  return nextRound;
}
```

### Default Round Behavior

#### Tipping Page
- Always defaults to current round (determined by algorithm above)
- Uses `currentRound` from AppContext automatically
- Shows round status indicator (Open/In Progress/Completed)
- Locks tips when round status is not 'upcoming'

#### All Tips Page  
- Defaults to current round when page loads
- Implemented via React useEffect:
```javascript
React.useEffect(() => {
  if (currentRound && selectedRound === null) {
    setSelectedRound(currentRound.id);
  }
}, [currentRound, selectedRound]);
```
- Shows round status indicators in dropdown (🟢 Completed, 🔴 Active, ⏳ Upcoming)

### Status Update Automation

#### Backend Processing
- `updateAllRoundStatuses(year)` - Updates all rounds for a year
- `updateRoundStatus(roundId)` - Updates single round using Squiggle data
- Joins rounds → games → squiggle_games to get completion data
- Automatically sets lockout_time to first game time if not set

#### Database Query Structure
```sql
SELECT 
  r.*,
  COUNT(sg.id) as total_games,
  COUNT(CASE WHEN sg.complete = 100 THEN 1 END) as completed_games,
  COUNT(CASE WHEN sg.complete > 0 AND sg.complete < 100 THEN 1 END) as in_progress_games,
  MIN(sg.date) as first_game_time,
  MAX(sg.date) as last_game_time
FROM rounds r
LEFT JOIN games g ON r.id = g.round_id
LEFT JOIN squiggle_games sg ON g.squiggle_game_key = sg.squiggle_game_key
WHERE r.id = ?
GROUP BY r.id
```

### User Experience Benefits

1. **Seamless Transition**: Users see completed rounds for 2 days to review results
2. **Automatic Progression**: System automatically moves to next round after grace period  
3. **Clear Status Indicators**: Visual feedback on round state across all pages
4. **Consistent Defaults**: Both Tipping and All Tips use same current round logic
5. **Real-time Updates**: Status updates based on live Squiggle API data

### Implementation Files

- **Backend**: `/backend/src/services/TipsService.ts` (lines 163-290)
- **Frontend**: `/frontend/src/pages/TippingPage.tsx` (uses currentRound from context)
- **Frontend**: `/frontend/src/pages/HistoryPage.tsx` (lines 13-18, default selection)
- **Helpers**: `/frontend/src/utils/helpers.ts` (round status display functions)
- **Database**: Squiggle games table with `complete` field (0-100)

---

## 10. Development Guidelines for Claude Code

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