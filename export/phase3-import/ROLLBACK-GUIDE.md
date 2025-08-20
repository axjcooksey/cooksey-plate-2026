# 🛡️ Rollback Safety Guide
## Cooksey Plate Historical Tips Import

### **Multi-Layer Protection Strategy:**
1. **Database File Backup** → `/export/db-backup/cooksey-plate-backup.db` (Complete database copy)
2. **Table Backup** → `historical_tips_backup` table (Created automatically by SQL script) 
3. **Transaction Safety** → Each batch wrapped in BEGIN/COMMIT for atomic operations

---

## 🚨 **Emergency Rollback Procedures**

### **OPTION 1: Complete Database Restore (Nuclear Option)**
**Use when:** Major corruption or you want to completely reset everything

```bash
# Stop any running backend processes first
pkill -f "node.*backend"

# Restore complete database from file backup
cp /export/db-backup/cooksey-plate-backup.db ./db/cooksey-plate.db

# Restart backend services
cd backend && npm run dev
```

**Result:** Entire database returns to exact state when backup was created

---

### **OPTION 2: Table-Level Rollback (Recommended)**
**Use when:** Import went wrong and you want to return to exactly the state before import

```sql
-- Step 1: Remove the imported table
DROP TABLE historical_tips;

-- Step 2: Restore from automatic backup
ALTER TABLE historical_tips_backup RENAME TO historical_tips;

-- Step 3: Verify restoration
SELECT 'ROLLBACK COMPLETE' as status, COUNT(*) as records FROM historical_tips;
```

**Result:** Only `historical_tips` table restored, all other data untouched

---

### **OPTION 3: Partial Rollback (Surgical Removal)**
**Use when:** Import worked but you want to remove only the newly imported data

```sql
-- Check what will be removed (run this first)
SELECT 
    'RECORDS TO BE REMOVED' as status,
    COUNT(*) as count,
    MIN(imported_at) as first_import,
    MAX(imported_at) as last_import
FROM historical_tips 
WHERE imported_at >= '2025-08-20 12:00:00';  -- Adjust timestamp as needed

-- Actually remove the records
DELETE FROM historical_tips 
WHERE imported_at >= '2025-08-20 12:00:00';  -- Use timestamp from import start

-- Verify removal
SELECT 'PARTIAL ROLLBACK COMPLETE' as status, COUNT(*) as remaining_records FROM historical_tips;
```

**Result:** Removes only imported records, keeps any existing data

---

### **OPTION 4: Batch-Level Recovery**
**Use when:** Import failed partway and you want to continue or restart

```sql
-- Check which batches were imported
SELECT 
    'BATCH STATUS' as report,
    DATE(imported_at) as import_date,
    TIME(imported_at) as import_time,
    COUNT(*) as records
FROM historical_tips 
GROUP BY DATE(imported_at), TIME(imported_at)
ORDER BY imported_at;

-- Remove incomplete batches (if needed)
DELETE FROM historical_tips 
WHERE imported_at >= '[timestamp_of_failed_batch]';
```

**Result:** Clean up partial imports, ready to re-run remaining batches

---

## 🔍 **Verification Commands**

### **Check Current State:**
```sql
-- Overall status
SELECT 
    'CURRENT STATE' as status,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_name) as users,
    MIN(imported_at) as first_import,
    MAX(imported_at) as last_import
FROM historical_tips;

-- Check if backup exists
SELECT 
    'BACKUP STATUS' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM sqlite_master WHERE name = 'historical_tips_backup')
        THEN 'Backup table exists'
        ELSE 'No backup table found'
    END as backup_status;
```

### **Compare Database Files:**
```bash
# Check sizes of database files
ls -lh ./db/cooksey-plate.db
ls -lh ./export/db-backup/cooksey-plate-backup.db

# Quick record count comparison
sqlite3 ./db/cooksey-plate.db "SELECT 'CURRENT DB' as db, COUNT(*) as records FROM historical_tips;"
sqlite3 ./export/db-backup/cooksey-plate-backup.db "SELECT 'BACKUP DB' as db, COUNT(*) as records FROM historical_tips;"
```

### **Compare Before/After:**
```sql
-- Compare current vs backup table
SELECT 
    'MAIN TABLE' as table_type,
    COUNT(*) as records,
    COUNT(DISTINCT user_name) as users
FROM historical_tips

UNION ALL

SELECT 
    'BACKUP TABLE' as table_type,
    COUNT(*) as records,
    COUNT(DISTINCT user_name) as users  
FROM historical_tips_backup;
```

---

## ⚠️ **Recovery Priority Order**

1. **First Try: Partial Rollback** (if only recent imports need removal)
2. **Second Try: Table-Level Rollback** (if table is corrupted)
3. **Last Resort: Complete Database Restore** (if entire database has issues)

---

## 🛡️ **Backup Verification**

### **Before Import - Verify Your Backups:**
```bash
# Verify file backup exists and is readable
file ./export/db-backup/cooksey-plate-backup.db
sqlite3 ./export/db-backup/cooksey-plate-backup.db "SELECT COUNT(*) FROM users;"

# Verify current database state
sqlite3 ./db/cooksey-plate.db "SELECT COUNT(*) FROM historical_tips;"
```

### **Expected Results:**
- File backup should show: `SQLite 3.x database`
- User count should be: `24`
- Historical tips before import should be: `0` (or known count)

---

## 🎯 **Recommended Import Process**

1. **Pre-Import Verification:**
   ```bash
   # Confirm backups exist
   ls -la ./export/db-backup/cooksey-plate-backup.db
   
   # Record current state
   sqlite3 ./db/cooksey-plate.db "SELECT 'PRE-IMPORT' as status, COUNT(*) as records FROM historical_tips;"
   ```

2. **Import Execution:**
   ```bash
   # Run the SQL script
   sqlite3 ./db/cooksey-plate.db < ./export/phase3-import/historical-tips-insert.sql
   ```

3. **Post-Import Verification:**
   ```sql
   -- Verify success
   SELECT 
       'IMPORT SUCCESS CHECK' as status,
       COUNT(*) as total_records,
       CASE WHEN COUNT(*) = 4684 THEN 'SUCCESS ✅' ELSE 'CHECK NEEDED ⚠️' END as result
   FROM historical_tips;
   ```

4. **Clean Up (after confirming success for several days):**
   ```sql
   -- Optional: Remove table backup after successful import
   -- DROP TABLE historical_tips_backup;
   ```

---

## 🚨 **Emergency Contacts & Recovery**

**If something goes wrong:**

1. **STOP** - Don't run more commands
2. **ASSESS** - Check what state the database is in
3. **CHOOSE** - Pick the appropriate rollback option above
4. **EXECUTE** - Run the rollback commands
5. **VERIFY** - Confirm restoration worked

**Multiple Safety Nets:**
- ✅ **Complete database file backup** at `/export/db-backup/`
- ✅ **Automatic table backup** created by SQL script  
- ✅ **Transaction-based batching** prevents partial corruption
- ✅ **Detailed rollback procedures** for every scenario

**🛡️ Bottom Line: You have triple protection. No matter what happens, you can always restore to exactly where you started - either at the table level or the entire database level.**