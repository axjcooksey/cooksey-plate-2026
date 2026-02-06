# Round 0 Testing Guide

This guide explains how to test the tipping workflow, lockout functionality, and scoring system using Round 0 sample data.

## Quick Start

```bash
cd backend

# 1. Populate Round 0 with sample tips for all 24 users
npm run populate-round0

# 2. Simulate different time scenarios
npm run simulate-time -- pre-lockout     # 30 mins before lockout
npm run simulate-time -- post-lockout    # 30 mins after first game starts
npm run simulate-time -- mid-round       # After 2 games complete
npm run simulate-time -- post-round      # Tuesday after round complete

# 3. Clean up when done
npm run rollback-test
```

## Testing Scenarios

### Scenario 1: Pre-Lockout (Tips Still Open)

**What it simulates:** 30 minutes before the first game starts

```bash
npm run simulate-time -- pre-lockout
```

**Expected behavior:**
- ✅ Users can submit and change tips
- ✅ Tipping page shows "Round Open" status
- ✅ Tips are NOT visible to other users
- ✅ Countdown timer shows time until lockout

**Test cases:**
1. Log in as any user and change tips
2. Submit new tips for users who haven't tipped
3. Verify tips save successfully
4. Verify other users can't see your tips yet

---

### Scenario 2: Post-Lockout (Round Locked)

**What it simulates:** 30 minutes after the first game has started

```bash
npm run simulate-time -- post-lockout
```

**Expected behavior:**
- ❌ Users CANNOT submit or change tips
- ✅ All tips become visible to everyone
- ✅ First game shows "IN PROGRESS" with live score
- ✅ Tipping page shows "Round Locked" message

**Test cases:**
1. Try to submit tips (should be blocked)
2. View "View All Tips" page - all tips visible
3. Verify lockout message is clear
4. Check that game 1 shows as in progress

---

### Scenario 3: Mid-Round (2 Games Complete)

**What it simulates:** Saturday evening, 2 games finished, 1 in progress, 2 upcoming

```bash
npm run simulate-time -- mid-round
```

**Game results:**
- ✅ Game 1: Sydney 98 def Carlton 76
- ✅ Game 2: Geelong 112 def Gold Coast 88
- 🔄 Game 3: IN PROGRESS (75% complete)
- ⏰ Game 4: Upcoming in 1 hour
- ⏰ Game 5: Upcoming tomorrow

**Expected behavior:**
- ✅ Tips for games 1-2 show ✓ correct or ✗ incorrect
- ✅ Ladder updates with partial scores
- ✅ Users can see their current standing
- ✅ Game 3 shows live progress

**Test cases:**
1. Check ladder - should show correct tip counts
2. View tips page - games 1-2 have correctness indicators
3. Verify ladder sorting is correct
4. Check user stats are updating

---

### Scenario 4: Post-Round (All Complete)

**What it simulates:** Tuesday after the round - all 5 games finished

```bash
npm run simulate-time -- post-round
```

**All game results:**
- ✅ Game 1: Sydney 98 def Carlton 76
- ✅ Game 2: Geelong 112 def Gold Coast 88
- ✅ Game 3: Hawthorn 95 def GWS 92
- ✅ Game 4: Brisbane Lions 108 def Western Bulldogs 71
- ✅ Game 5: Collingwood 89 def St Kilda 84

**Expected behavior:**
- ✅ All tips show correctness (✓ or ✗)
- ✅ Ladder fully updated with Round 0 scores
- ✅ Round status shows "Completed"
- ✅ History page shows Round 0 results

**Test cases:**
1. Verify ladder shows correct total scores
2. Check each user's tips show all correct/incorrect
3. View history page for Round 0
4. Verify family group standings are correct
5. Test ladder filters and sorting

---

## Rollback & Reset

### Clean Up Test Data

Remove all test tips and reset Round 0 to original state:

```bash
npm run rollback-test
```

This will:
- Delete all Round 0 tips
- Reset game times to original Squiggle values
- Set round status back to "upcoming"
- Clear all scores and tip correctness

### Reset to Real Times Only

Keep the tips but reset times to actual Squiggle data:

```bash
npm run simulate-time -- reset
```

---

## Sample Tip Patterns

When you run `npm run populate-round0`, tips are distributed using 4 different patterns:

**Pattern 1** (Users 1, 5, 9, 13, 17, 21): Home, Home, Away, Away, Home
**Pattern 2** (Users 2, 6, 10, 14, 18, 22): Away, Home, Home, Away, Away  
**Pattern 3** (Users 3, 7, 11, 15, 19, 23): Home, Away, Home, Away, Home  
**Pattern 4** (Users 4, 8, 12, 16, 20, 24): Away, Away, Home, Home, Away

This ensures variety in tip selections and creates realistic ladder competition.

---

## Testing Checklist

### Core Functionality
- [ ] Tip submission works before lockout
- [ ] Tip submission blocked after lockout
- [ ] Tips become visible after lockout
- [ ] Lockout countdown timer works
- [ ] Game status updates correctly (upcoming/active/complete)

### Scoring & Ladder
- [ ] Tips marked correct/incorrect after game completion
- [ ] Ladder updates with correct scores
- [ ] Ladder sorting is accurate (by correct tips, then alphabetical)
- [ ] Family group standings calculate correctly
- [ ] User stats show accurate percentages

### Admin Features
- [ ] Admin can view all tips
- [ ] Admin can edit tips for any user
- [ ] Admin can create tips for users who haven't tipped
- [ ] Admin sync shows correct data
- [ ] Scheduler status updates properly

### UI/UX
- [ ] Round status indicator is clear
- [ ] Game times display in correct timezone (AEDT)
- [ ] Tip correctness indicators (✓/✗) are visible
- [ ] Mobile responsive design works
- [ ] Navigation between pages smooth

---

## Troubleshooting

### Scripts won't run
```bash
# Make sure you're in the backend directory
cd backend

# Check that TypeScript dependencies are installed
npm install
```

### Database errors
```bash
# Reset the database completely
npm run setup-db
npm run populate-round0
```

### Tips not showing
```bash
# Check database directly
sqlite3 db/cooksey-plate.db "SELECT COUNT(*) FROM tips WHERE round_id = 3;"
```

### Times seem wrong
```bash
# Reset to Squiggle times
npm run simulate-time -- reset
```

---

## Production Notes

**⚠️ IMPORTANT:** These scripts modify game times and scores in the database. They are for **testing ONLY** and should **NEVER** be run in production.

Before deploying to production:
1. Run `npm run rollback-test` to clean all test data
2. Verify Round 0 status is "upcoming"
3. Confirm game times match Squiggle API
4. Remove or disable these scripts from production environment

---

## Questions?

If you encounter issues:
1. Check backend logs: The server console shows detailed error messages
2. Verify database state: Use `sqlite3 db/cooksey-plate.db` to inspect tables
3. Reset and try again: `npm run rollback-test` then start over
