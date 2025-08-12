# CLAUDE.md - Cooksey Plate 2025 Project Context

## Project Overview
You are helping build the Cooksey Plate 2025, a family AFL tipping competition web application. This replaces an Excel-based system with an automated platform that integrates with the Squiggle API for live AFL data.

## Current Status - JANUARY 2025
- **Phase:** 70% COMPLETE - MVP FUNCTIONAL ✅
- **Development:** Full-stack application built and running
- **Frontend:** React + TypeScript + Tailwind CSS with Lovable design ✅
- **Backend:** Node.js + Express API with SQLite database ✅
- **Integration:** Squiggle API working, all endpoints functional ✅
- **Authentication:** User login system with family groups ✅
- **Database:** Complete schema with 25 family members across 8 groups ✅
- **UI/UX:** Clean, responsive design matching Lovable styleguide ✅

### ✅ COMPLETED FEATURES
- User authentication and family group management
- Tip submission with team selection and validation
- Ladder calculations and display
- Homepage dashboard with stats
- All main navigation pages (Tipping, Ladder, History, Admin)
- Real-time Squiggle API integration
- Responsive mobile design
- Clean Lovable-inspired styling

### 🔄 IN PROGRESS
- Backend servers running on development ports
- Live Squiggle API testing and validation

### ⏳ REMAINING WORK
- Automated scheduler for game updates and tip locking
- Historical Excel data import tool
- Production deployment setup

## Technical Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **External API:** Squiggle API for AFL game data
- **Deployment:** Vercel (frontend) + Railway (backend)

## Key URLs
- **Product Requirements:** cooksey-plate-prd-v2.md
- **Product Roadmap:** cooksey-plate-roadmap-v2.md
- **Lovable Prototype:** https://preview--cooksey-tipping-trophy.lovable.app/
- **Styleguide:** https://preview--cooksey-tipping-trophy.lovable.app/styleguide
- **Squiggle API:** https://api.squiggle.com.au/?q=games;year=2025;format=json

## Family Structure
```javascript
const FAMILY_GROUPS = {
  "Ashtons & PFCs": ["David", "Chris", "Jamie", "Emma", "Zoe", "Pop", "Katie"],
  "PJCs": ["Phil", "Tracy", "Ryan"],
  "Chelsea Florences": ["Shannan", "Tom", "Billy"],
  "Richmond Cookseys": ["Alex", "Ruby"],
  "South-East Cookseys": ["Mark", "Henry"],
  "Perth Cookseys": ["Paulie", "Jenni", "Charlee"],
  "Tassie Cookseys": ["Anne", "Stephen"],
  "Individuals": ["Jayne", "Ant"]
};

const ADMINS = ["Alex", "Phil"]; // Can tip for anyone
```

## Database Schema
```sql
-- AFL Teams table
teams (
  id INTEGER PRIMARY KEY, -- Squiggle team ID
  name, abbrev, logo, primary_colour, secondary_colour
)

-- Squiggle API Mirror (complete copy with all fields)
squiggle_games (
  id, squiggle_game_key VARCHAR(3), -- RoundNumber + GameNumber (e.g., "001", "029", "235")
  round_number, game_number, year, complete, -- complete: 0-100 (100 = finished)
  hteam, ateam, hscore, ascore, hgoals, agoals, hbehinds, abehinds,
  date, venue, winner, localtime, hmargin, is_final, is_grand_final,
  raw_json -- Complete API response
)

-- Core application tables
users (id, name, email, family_group_id, role)
family_groups (id, name)
rounds (id, round_number, year, status, lockout_time)
games (
  id, squiggle_game_key VARCHAR(3), -- Links to squiggle_games
  round_id, home_team, away_team, 
  home_score, away_score, start_time, venue, is_complete
)
tips (id, user_id, game_id, squiggle_game_key, round_id, selected_team, is_correct)

-- Key Generation Logic:
-- Round 0, Game 1 = "001"
-- Round 2, Game 9 = "029"
-- Round 10, Game 3 = "103"
-- Round 23, Game 5 = "235"
```

## API Endpoints
```
-- Squiggle Integration
GET    /api/squiggle/games/:year    - Get games by year/round
GET    /api/squiggle/teams          - Get all AFL teams
POST   /api/squiggle/update/:year   - Manually trigger Squiggle update
POST   /api/squiggle/update-teams   - Update teams from Squiggle API

-- Core Application
GET    /api/rounds/current/:year    - Get current round info
GET    /api/rounds/:id/games        - Get games for a round
POST   /api/tips                    - Submit tips
GET    /api/tips/round/:roundId     - Get all tips for a round
GET    /api/ladder/:year            - Get ladder standings
GET    /api/users                   - Get all users
GET    /api/family-groups           - Get family groups
POST   /api/admin/import/excel      - Import historical Excel data
```

## Business Rules
1. **Tipping Rules:**
   - Tips lock at first game start time
   - All tips visible after first game starts (transparency)
   - Family members can tip for others in their group
   - Admins can tip for anyone

2. **Scoring:**
   - 1 point per correct tip
   - Ladder ordered by total correct tips
   - Tiebreaker: alphabetical by name

3. **Data Updates:**
   - Squiggle API checked twice daily (6 AM, 8 PM AEST)
   - Live updates every 5 minutes during games
   - Cache results to avoid API rate limits
   - Complete field: 0 = not started, 1-99 = in progress, 100 = finished
   - Teams updated daily from Squiggle API

## Development Priority - NEXT STEPS
### ✅ COMPLETED
1. ✅ Initialize project with proper folder structure
2. ✅ Set up Git repository and version control  
3. ✅ Create database schema and migrations
4. ✅ Implement Squiggle API integration with caching
5. ✅ Build core tipping functionality
6. ✅ Build frontend with Lovable design system
7. ✅ Full-stack integration and testing

### 🔄 NEXT PRIORITIES
1. **Scheduler Implementation** - Automated game updates and tip locking
2. **Historical Data Import** - Excel import tool for past seasons
3. **Production Deployment** - Vercel frontend + Railway backend
4. **Live Testing** - Beta test with family members
5. **Final Polish** - Bug fixes and performance optimization

## Import Strategy
The Excel file "Cooksey Plate - 2025.xlsx" contains historical tips from Rounds 0-22. Process:
1. Parse Excel file with xlsx library
2. For each tip, generate squiggle_game_key (Round + Game Number)
3. Match with squiggle_games table using the key
4. Validate team names and calculate correctness
5. Bulk insert into database with squiggle_game_key reference
6. Verify ladder calculations match Excel

## Squiggle Game Key Convention
Always use this format for linking games across tables:
- **Format:** `[RoundNumber:2digits][GameNumber:1digit]`
- **Examples:**
  - Round 0, Game 1 = "001"
  - Round 2, Game 9 = "029"
  - Round 10, Game 3 = "103"
  - Round 23, Game 5 = "235"
- This key links squiggle_games → games → tips → historical_tips

## Common Pitfalls to Avoid
- Don't query Squiggle API too frequently (use caching)
- Ensure tips are locked at game start time
- Validate all historical data imports
- Test family group permissions thoroughly
- Always maintain backward compatibility with Excel data

## File Structure
```
cooksey-plate-2025/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── db/
│   │   └── schedulers/
│   ├── scripts/
│   └── package.json
├── CLAUDE.md
├── README.md
└── .gitignore
```

## Testing Checklist
- ✅ All 25 family members can log in (dropdown selector working)
- ✅ Family groups display correctly (8 groups organized properly)
- ✅ Tip submission form working with team selection
- ✅ Squiggle data fetching and API integration working
- ✅ Ladder calculations implemented and displaying
- ✅ Mobile responsive design works (Tailwind CSS)
- ✅ All main pages functional (Home, Tipping, Ladder, History, Admin)
- ⏳ Tips lock at correct time (needs scheduler implementation)
- ⏳ Historical data matches Excel exactly (needs import tool)
- ⏳ Scheduler runs reliably (needs implementation)

## Success Metrics
- Zero manual Excel updates needed
- 100% accurate scoring via API
- <5 minute delay for live scores
- All historical data imported correctly
- 80%+ family adoption rate

## Notes for Claude Code
- Always use TypeScript with strict mode
- Implement comprehensive error handling
- Add logging for debugging
- Comment complex business logic
- Test data imports thoroughly
- Maintain clean Git history
- Follow the established folder structure
- Reference Lovable prototype for UI/UX