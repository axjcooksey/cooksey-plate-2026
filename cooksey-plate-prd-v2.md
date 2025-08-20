# Product Requirements Document (PRD) v2.0
## Cooksey Plate - Family AFL Tipping Platform
### AI-Optimized for Claude Code Development

---

## 1. Executive Summary
**Product Name:** Cooksey Plate 2025  
**Version:** 2.0 (Fresh Restart)  
**Date:** August 13, 2025  
**Development Approach:** AI-Assisted with Claude Code  
**Current Status:** HISTORICAL DATA INTEGRATION COMPLETE - APPLICATION READY ✅

### Vision Statement
A family-focused AFL tipping platform that automates the Excel-based system, provides real-time updates via Squiggle API integration, and maintains the transparent, family-friendly competition culture.

### 🎉 DEVELOPMENT UPDATE - JANUARY 2025
**MAJOR MILESTONE ACHIEVED:** Full-stack application successfully built and functional!

#### ✅ COMPLETED FEATURES (PRODUCTION READY)
- **Frontend Application:** React + TypeScript + Tailwind CSS with clean UI/UX
- **Backend API:** Node.js + Express with complete RESTful API
- **Database:** SQLite with complete schema, 25 tipsters across 8 family groups
- **Authentication:** User login system with family group management
- **Squiggle Integration:** Real-time AFL data fetching and caching
- **Core Functionality:** Tip submission, ladder calculations, stats dashboard
- **UI/UX:** Responsive design with custom favicon and optimized branding
- **Navigation:** All main pages implemented (Home, Enter Tips, Ladder, View All Tips, Admin)
- **Advanced Features:** 
  - Finals rounds with margin prediction functionality (Rounds 25-28)
  - Complex lockout logic for tip submissions
  - Visual feedback system (blue/green/red glows)
  - Countdown timers and real-time status updates
  - Comprehensive tips matrix view for all tipsters
- **UI Improvements:** Terminology updated to "Tipsters", family groups hidden from display
- **Margin Prediction System:** Complete implementation for finals rounds with closest-margin-wins logic
- **Family Tipping System:** Full implementation with permission-based tipping
  - Family group members can submit tips on behalf of other family members
  - Admins can submit tips on behalf of any tipster
  - UI selector for choosing target tipster on Enter Tips page
  - Backend validation for tipping permissions
  - Individual users (Ant, Jayne) properly separated into own family groups
- **Auto-Save System:** Immediate tip saving with state management
  - Tips save automatically on selection
  - Visual feedback during save process ("Saving...", "Tips Submitted")
  - Optimistic UI updates prevent page jumping
  - State timing fixes for smooth user experience
- **Error Handling & Stability:** Production-ready error handling
  - Fixed database schema issues for margin predictions
  - Proper API validation for null/invalid parameters
  - Console error elimination and graceful failure handling
  - Backend service initialization reliability
- **Advanced Admin Features (August 15, 2025):** Complete administrative control system
  - **Comprehensive Data Sync Monitoring:** Real-time sync logs with last/next sync times and frequency
  - **API Abuse Prevention:** Reduced Squiggle API calls from 312/day to 50/day (83% reduction)
  - **Historical Tip Editing:** Admin interface to edit any user's tips for any round
  - **Sync Activity Dashboard:** Complete logging with 24-hour statistics and recent activity tracking
  - **Scheduler Management:** Live status, next run times, and manual trigger capabilities

#### 🔄 CURRENT STATE (August 15, 2025)
- **Production-Ready Application:** Fully functional with all core features
- **Backend & Frontend:** Both servers running stable on development ports
- **Live Testing:** Successfully tested tip submission, auto-save, and family tipping
- **Recent Fixes Applied:** All major bugs resolved, smooth user experience achieved
- **Advanced Admin Panel:** Complete with sync monitoring, scheduler control, and tip editing
- **API Optimization:** Scheduler frequency optimized for respectful API usage

#### 🆕 EXCEL IMPORT SYSTEM COMPLETED (August 20, 2025)
- **Phase 1 - Excel Extraction:** Complete extraction of 31 sheets from Excel file into JSON format
- **Phase 2 - CSV Transformation:** Complete transformation into flat CSV with 4,684 tip records
- **Squiggle Game Key Generation:** Automated key generation matching database schema
- **Data Validation:** Case-insensitive tip correctness with 65.1% historical accuracy
- **Export Files Ready:** `/export/phase1-raw/` and `/export/phase2-csv/` with complete data

#### ✅ HISTORICAL DATA INTEGRATION COMPLETED (August 20, 2025)
- **Phase 3 - Database Import:** Complete migration of 4,684 historical tips into production database
- **Data Validation:** 100% tip accuracy verification with existing Excel data
- **Migration Scripts:** Full automation with rollback safety and verification
- **Database Integration:** Historical tips seamlessly integrated with live application
- **Accuracy Verification:** Ladder calculations now showing correct historical performance
  - Tom: 149 correct tips (76.0% accuracy)
  - Paulie: 146 correct tips (74.5% accuracy) 
  - Anne: 143 correct tips (73.0% accuracy)
  - All 24 family members with complete historical data

#### ⏳ REMAINING FOR PRODUCTION
- Enhanced admin user management and tip creation capabilities  
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
6. ⏳ Historical data import from Excel
7. ✅ Admin scheduler interface
8. ⏳ Admin user management (edit names, roles, family groups)
9. ⏳ Admin tip creation for users with no existing tips

### Should Have
1. ✅ Round-by-round history view
2. ✅ Mobile-responsive design
3. ✅ Countdown timer for round lockout
4. Basic statistics (win streaks, averages)
5. ✅ Advanced admin monitoring and control system

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

## 10. Complex Tip Submission Lockout Rules

### Overview
The application implements sophisticated lockout logic that balances competition integrity with user flexibility. The system allows users to submit tips up until individual games start, but prevents changes once a user has submitted tips and the round begins.

### Core Lockout Principles

#### 1. **Individual Game Lockout**
- Users can submit tips for any game that hasn't started yet
- Once a game starts (Squiggle `complete` > 0), no tips can be submitted for that specific game
- Games within a round can have different lockout times based on their start times

#### 2. **Round Commitment Rule**
- **If user submits tips BEFORE first game**: After first game starts, ALL tips for that round become locked (cannot be changed)
- **If user hasn't submitted tips BEFORE first game**: User can still submit tips for remaining games that haven't started

#### 3. **Submission States**
- **"Open"**: User can submit/change tips for games that haven't started
- **"Committed"**: User submitted tips before round started - all tips locked after first game
- **"Partial Available"**: User didn't submit before round started - can tip remaining games
- **"Game Locked"**: Individual game has started - no tips allowed for that game

### Detailed Logic Flow

```javascript
// Lockout Decision Tree
function canSubmitTip(userId, gameId, roundId) {
  const game = getGame(gameId);
  const userTips = getUserRoundTips(userId, roundId);
  const round = getRound(roundId);
  
  // 1. Game-specific lockout (always enforced)
  if (game.start_time <= now || game.complete > 0) {
    return false; // Game has started or finished
  }
  
  // 2. Round commitment lockout
  const hasSubmittedTips = userTips.length > 0;
  const roundHasStarted = round.first_game_time <= now;
  
  if (hasSubmittedTips && roundHasStarted) {
    return false; // User committed tips before round started - all locked
  }
  
  // 3. Otherwise, user can submit tip
  return true;
}
```

### Visual Feedback States

#### Tip Selection Colors
- **Blue Glow**: Current selection for upcoming/active rounds
- **Green Glow**: Winning team (shows during active and completed rounds)
- **Red Glow**: Losing team for completed rounds only
- **Grey**: Unavailable option (game started, no tip submitted)

#### Game State Indicators
```javascript
// Color coding for tip buttons
const getButtonStyling = (game, userTip, isSelected) => {
  // Game finished - show results
  if (game.complete === 100) {
    if (isSelected) {
      return userTip === game.winner ? 'green-glow' : 'red-glow';
    }
    return 'grey-unavailable';
  }
  
  // Game in progress - show current winner
  if (game.complete > 0 && game.winner) {
    if (game.home_team === game.winner || game.away_team === game.winner) {
      return 'green-glow'; // Winning team
    }
  }
  
  // Game not started - show user selection
  if (isSelected) {
    return 'blue-glow'; // User's tip
  }
  
  return 'default'; // Available for selection
};
```

### Business Rules Examples

#### Scenario 1: Early Submitter
```
User submits all Round 23 tips on Wednesday
Round 23 first game starts Friday 7:30pm
Result: After Friday 7:30pm, user cannot change ANY Round 23 tips
```

#### Scenario 2: Late Submitter  
```
User doesn't submit tips before Round 23 starts Friday 7:30pm
Saturday games at 1:30pm and 4:00pm haven't started yet
Result: User can still submit tips for Saturday games until they start
```

#### Scenario 3: Individual Game Lockout
```
Friday 7:30pm game: Tips locked at 7:30pm (game started)
Saturday 1:30pm game: Tips locked at 1:30pm (game started) 
Saturday 4:00pm game: Tips available until 4:00pm
```

### Database Schema Requirements

#### Tips Table Enhancement
```sql
-- Track when tips were first submitted for lockout logic
ALTER TABLE tips ADD COLUMN first_submitted_at TIMESTAMP;
ALTER TABLE tips ADD COLUMN last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Index for efficient lockout queries
CREATE INDEX idx_tips_user_round_submitted ON tips(user_id, round_id, first_submitted_at);
```

#### Game State Tracking
```sql
-- Enhanced game state from Squiggle API
SELECT 
  g.*,
  sg.complete,
  sg.winner,
  CASE 
    WHEN sg.complete = 0 THEN 'upcoming'
    WHEN sg.complete > 0 AND sg.complete < 100 THEN 'active'
    WHEN sg.complete = 100 THEN 'completed'
  END as game_status
FROM games g
LEFT JOIN squiggle_games sg ON g.squiggle_game_key = sg.squiggle_game_key;
```

### Implementation Requirements

#### Backend API Changes
- `POST /api/tips/submit` - Check lockout rules before accepting tips
- `GET /api/tips/lockout-status/:userId/:roundId` - Return lockout state per game
- `PUT /api/tips/update/:tipId` - Enforce no-change rule for committed rounds

#### Frontend UX Requirements
- Real-time lockout status updates during active rounds
- Clear visual indicators for each lockout state
- Informative error messages explaining why tips can't be submitted
- Progress indicators showing which games are still available

#### Error Messages
```javascript
const lockoutMessages = {
  gameStarted: "This game has already started. Tips are locked.",
  roundCommitted: "You submitted tips before this round started. All tips are now locked.",
  gameCompleted: "This game is finished. Results are final.",
  networkError: "Unable to submit tip. Please try again."
};
```

### Testing Scenarios

#### Automated Test Cases
1. **Early submission lockout**: Submit tips, advance time past first game, verify all tips locked
2. **Late submission flexibility**: Don't submit initially, verify individual game lockouts
3. **Real-time updates**: Mock game start during active session, verify UI updates
4. **Edge cases**: Tips submitted exactly at game start time
5. **Network failures**: Handle submission failures gracefully

---

## 11. Advanced Admin Control System

### Overview
The admin panel provides comprehensive oversight and control over the entire tipping platform, including data synchronization monitoring, scheduler management, and historical tip editing capabilities.

### Data Sync Monitoring Dashboard

#### Real-time Sync Status
- **Latest Sync Information**: Shows exact timestamps of last successful API syncs
- **Next Sync Scheduling**: Displays when next automated sync will occur
- **Frequency Display**: Clear indication of sync intervals (e.g., "Every 30 minutes", "Twice daily")
- **Status Indicators**: Visual success/failure badges for all sync operations

#### Sync Activity Logging
- **24-Hour Statistics**: Aggregate success/failure counts and total records processed
- **Recent Activity Feed**: Real-time log of sync operations with timestamps
- **Error Tracking**: Detailed error messages and failure analysis
- **Historical Trends**: Long-term sync performance monitoring

### Scheduler Management

#### Automated Job Control
- **Live Score Updates**: Every 30 minutes during AFL season (was every 5 minutes)
- **Full Data Sync**: Twice daily at 6 AM & 6 PM (was hourly)
- **Round Status Updates**: Every 2 hours (was every 15 minutes)
- **Tip Correctness**: Hourly calculation (was every 10 minutes)

#### API Optimization Results
- **Before**: ~312 API calls per day (potential abuse)
- **After**: ~50 API calls per day (83% reduction)
- **Impact**: Respectful API usage while maintaining functionality

#### Manual Controls
- **Trigger Individual Jobs**: Admin can manually run any scheduled job
- **Full Sync Operations**: Emergency sync for all data types
- **Scheduler Status**: Enable/disable scheduler components
- **Real-time Monitoring**: Live job status and next run times

### Historical Tip Editing System

#### Admin Tip Management
- **User Selection**: Dropdown of all users with family group context
- **Round Selection**: All rounds (upcoming/active/completed) available
- **Tip Editing Interface**: Edit team selections and margin predictions
- **Real-time Updates**: Changes save immediately to database

#### Editing Features
- **Team Selection**: Dropdown with valid home/away teams for each game
- **Margin Predictions**: Numeric input for margin betting
- **Status Display**: Shows correct/incorrect status for completed games
- **Game Context**: Clear display of matchups, dates, and game numbers

#### Security & Audit
- **Admin-only Access**: Requires admin role verification
- **Permission Validation**: Backend validates admin privileges
- **Change Logging**: All edits logged with admin user identification
- **Data Integrity**: Validates team selections against actual game participants

### Implementation Details

#### Backend Enhancements
```typescript
// New API Endpoints
PUT /api/tips/:tipId/admin-update          // Edit any user's tip
GET /api/squiggle/sync-logs               // Comprehensive sync status
GET /api/scheduler/status                 // Live scheduler information
GET /api/scheduler/jobs                   // Job details with next run times

// New Service Methods
TipsService.adminUpdateTip()              // Admin tip editing
SquiggleService.updateLiveScores()        // Optimized sync frequency
SchedulerService.getJobStatus()           // Real-time job monitoring
```

#### Frontend Components
```typescript
// Enhanced Admin Interface
AdminPage.tsx                            // Complete admin dashboard
  - EditUserTips tab                      // Historical tip editing
  - DataSyncScheduler tab                 // Sync monitoring
  - Real-time status updates              // Live job information
  - Comprehensive logging interface       // Activity tracking
```

#### Database Schema Updates
```sql
-- Enhanced logging
import_logs table                         -- Comprehensive sync tracking
  - import_type, status, records_processed
  - error_messages, file_names, timestamps

-- Tip editing audit
tips table updates                        -- Admin edit tracking
  - updated_at timestamps
  - Admin user identification in logs
```

### User Experience Benefits

1. **Administrative Oversight**: Complete visibility into system operations
2. **Proactive Monitoring**: Early warning of sync failures or issues  
3. **Historical Management**: Ability to correct historical tip data
4. **Performance Optimization**: Respectful API usage with maintained functionality
5. **Operational Control**: Manual override capabilities for emergency situations

### Security Considerations

- **Role-based Access**: Admin features restricted to admin users only
- **Audit Trail**: All admin actions logged with user identification
- **Data Validation**: All edits validated against game constraints
- **Permission Verification**: Backend validates admin privileges on every request

### Planned Enhanced Admin Features

#### User Management System
**Comprehensive User Editing Capabilities**
- **Name & Family Group Management**: Admins can modify user names and reassign family group memberships
- **Role Administration**: Promote users to admin status or demote admins to regular users
- **Permission Controls**: Backend validation ensures only admins can perform user management operations
- **Audit Trail**: Complete logging of all user management actions with admin identification

#### Advanced Tip Management System
**Complete Tip Creation & Editing**
- **Historical Tip Creation**: Admins can create tips for users who never submitted for specific rounds
- **Comprehensive Editing**: Modify existing tips or create new ones seamlessly in same interface
- **Retroactive Management**: Full historical tip management for any user/round combination
- **Automatic Validation**: Ensures tip correctness calculations update immediately after creation/modification

#### Auto-Calculation Integration
**Intelligent Tip Correctness Updates**
- **Real-time Calculation**: Automatic `is_correct` field updates when tips are created or modified
- **Game Result Integration**: Immediate validation against current game results and winners
- **Retroactive Updates**: Historical tip changes trigger correctness recalculation
- **Visual Feedback**: Real-time display of correct/incorrect status during admin operations

#### Enhanced Admin Interface
**Intuitive Management Experience**
- **Unified Tip Interface**: Single interface handles both tip creation and editing seamlessly
- **Missing Tip Detection**: Clear indicators when users have no tips for selected rounds
- **"Add Tips" Functionality**: Prominent option to create tips when none exist
- **User Management Tab**: Enhanced Admin > Users interface with edit capabilities

---

## 12. Development Guidelines for Claude Code

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