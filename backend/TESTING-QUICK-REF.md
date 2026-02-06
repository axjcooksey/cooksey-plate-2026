# Testing Quick Reference Card

## 🚀 Quick Commands

```bash
cd backend

# Setup
npm run populate-round0              # Create 120 sample tips for all users
npm run status                       # Check current Round 0 status

# Time Scenarios (simulate different times)
npm run simulate-time -- pre-lockout    # 30 mins before lockout
npm run simulate-time -- post-lockout   # 30 mins after first game
npm run simulate-time -- mid-round      # 2 games complete
npm run simulate-time -- post-round     # All games complete
npm run simulate-time -- reset          # Reset to real times

# Cleanup
npm run rollback-test                # Remove all test data
```

## 📋 Test Scenarios Summary

| Scenario | Tips Open? | Games Status | Tip Visibility | Correctness |
|----------|-----------|--------------|----------------|-------------|
| **pre-lockout** | ✅ Yes | All upcoming | Hidden | None |
| **post-lockout** | ❌ No | 1 in progress | Visible to all | None yet |
| **mid-round** | ❌ No | 2 complete, 1 active | Visible to all | Games 1-2 only |
| **post-round** | ❌ No | All complete | Visible to all | All calculated |

## 🎯 What to Test

### Pre-Lockout (Tips Open)
- [ ] Can submit tips
- [ ] Can change existing tips
- [ ] Tips NOT visible to others
- [ ] Countdown shows time until lockout

### Post-Lockout (Round Locked)
- [ ] CANNOT submit/change tips
- [ ] Tips visible on "View All Tips" page
- [ ] Clear lockout message displayed
- [ ] Game 1 shows "IN PROGRESS"

### Mid-Round (2 Complete)
- [ ] Tips show ✓ or ✗ for games 1-2
- [ ] Ladder updates with scores
- [ ] Game 3 shows progress
- [ ] Games 4-5 show upcoming

### Post-Round (Complete)
- [ ] All tips show correctness
- [ ] Ladder fully updated
- [ ] Round status: "Completed"
- [ ] History page shows results

## 🔄 Typical Testing Workflow

```bash
# 1. Start fresh
npm run rollback-test

# 2. Populate tips
npm run populate-round0
npm run status

# 3. Test pre-lockout
npm run simulate-time -- pre-lockout
# → Open http://localhost:5173 and test tip submission

# 4. Test lockout
npm run simulate-time -- post-lockout
# → Verify tips are locked and visible

# 5. Test scoring
npm run simulate-time -- mid-round
npm run status
# → Check ladder updates

# 6. Test completion
npm run simulate-time -- post-round
npm run status
# → Verify all scores calculated

# 7. Clean up
npm run rollback-test
```

## 📊 Expected Results (Post-Round)

**Winners (3 correct):** Jamie, Jayne, Jenni, Katie, Ruby, Shannan  
**Correct Tips:** 48 out of 120 total (40%)

**Game Results:**
- Sydney 98 def Carlton 76
- Geelong 112 def Gold Coast 88
- Hawthorn 95 def GWS 92
- Brisbane Lions 108 def Western Bulldogs 71
- Collingwood 89 def St Kilda 84

## ⚠️ Important Notes

- All scripts modify the database
- Always run `npm run rollback-test` when done
- Check `npm run status` to verify state
- Test data is for Round 0 only
- Backend must be running for frontend testing

## 🔗 URLs

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **API Status:** http://localhost:3001/health
