# Steps to Fix the Login Issue

## The Problem
The URL `/auth/login` doesn't exist - the correct login URL is `/login`.

## Solution

### Option 1: Clear Browser Data (Recommended)
1. Open DevTools (F12 or Cmd+Opt+I)
2. Go to the **Application** tab
3. Under **Storage**, click **Clear site data**
4. Close and reopen the browser
5. Navigate to `http://localhost:3000/login` (not /auth/login)
6. Log in with `dev@orchidsw.com`

### Option 2: Manual Logout
1. Navigate directly to: `http://localhost:3000/login`
2. Log in with `dev@orchidsw.com`
3. You should be redirected to `/super-admin`

### Option 3: Force Clear Supabase Session
Run this in the browser console:
```javascript
localStorage.clear()
sessionStorage.clear()
location.href = '/login'
```

## What to Expect After Login
- If you're a super admin (dev@orchidsw.com): You'll be redirected to `/super-admin`
- If you're a regular admin: You'll be redirected to `/dashboard`
- If you're a parent: You'll be redirected to `/parent`
- If you're a student: You'll be redirected to `/student`
