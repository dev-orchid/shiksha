# Fix Super Admin Access

## Problem
The super admin user (dev@orchidsw.com) has a `school_id` set in the database, which causes them to be treated as a regular school admin instead of a super admin with access to all schools.

## Solution
We need to set the `school_id` to `NULL` for super admin users.

## How to Fix

### Option 1: Call the Fix API Endpoint (Easiest)

1. Open your browser's developer console
2. Make sure you're logged in as any user
3. Run this command in the console:

```javascript
fetch('/api/fix-super-admin', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

4. You should see a success message
5. Log out and log back in as dev@orchidsw.com
6. You should now be redirected to `/super-admin` dashboard

### Option 2: Run SQL Directly in Supabase

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run this SQL:

```sql
UPDATE users
SET school_id = NULL
WHERE role = 'super_admin';
```

4. Log out and log back in as dev@orchidsw.com

### Option 3: Apply the Migration

If you have Supabase CLI set up locally:

```bash
npx supabase db push
```

This will apply the migration file `011_fix_super_admin_school_id.sql`.

## What Was Fixed

1. **SessionProvider**: Now explicitly sets `schoolId` to `null` for super admin users, even if the database has a value
2. **usePermissions Hook**: Now returns the profile object so sidebar can access user role and schoolId
3. **Migration File**: Created SQL migration to fix the database
4. **Fix API Endpoint**: Created `/api/fix-super-admin` to manually fix the issue

## Expected Behavior After Fix

When logged in as dev@orchidsw.com (super admin):
- You should see only "Dashboard" and "Settings" in the sidebar
- The header should show "Super Admin" instead of "School MS"
- The school name "XYZ Public School" should NOT appear
- You should be at `/super-admin` URL showing all schools
- You can click "View" on any school to see their details
- You can click "Edit Plan" to manage school pricing plans

## Troubleshooting

If the issue persists:
1. Clear your browser cache and cookies
2. Log out completely
3. Close all browser tabs
4. Log back in as dev@orchidsw.com

The changes to SessionProvider ensure that even if the database has a school_id, super admins will have it set to null in the session.
