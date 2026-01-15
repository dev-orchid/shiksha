# How to Get Your Supabase Service Role Key

## What is the Service Role Key?

The **service role key** is a special API key that:
- Bypasses Row Level Security (RLS) policies
- Has full database access
- Should ONLY be used on the server-side (never in client code)
- Is required for admin operations like checking user roles

## Steps to Get Your Service Role Key

### 1. Open Your Supabase Project
Go to: https://supabase.com/dashboard

### 2. Navigate to Project Settings
1. Select your project
2. Click the **Settings** icon (⚙️) in the left sidebar
3. Click **API** in the settings menu

### 3. Find the Service Role Key
Scroll down to the **Project API keys** section. You'll see:
- `anon` `public` - This is your public/anonymous key (already in .env.local)
- `service_role` `secret` - **This is the key you need!**

### 4. Copy the Service Role Key
Click the copy icon next to the `service_role` key.

⚠️ **IMPORTANT**: This key has admin privileges. Keep it secret!

### 5. Add to .env.local
Open `/Applications/Projects/school/shiksha-sms/.env.local` and update the line:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXJwcm9qZWN0IiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MTU2MDAwMDB9...
```

### 6. Restart Your Dev Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 7. Test the Login
Go to: http://localhost:3000/login
Login with: dev@orchidsw.com

You should now be redirected to `/super-admin` without errors!

## Security Notes

❌ **DO NOT**:
- Commit this key to version control
- Share it publicly
- Use it in client-side code
- Expose it in browser console

✅ **DO**:
- Keep it in `.env.local` (which is gitignored)
- Only use it in server-side code (API routes, Server Components)
- Treat it like a password

## Still Getting Errors?

If you still see errors after adding the key:
1. Make sure you copied the complete key (they're very long)
2. Restart your dev server completely
3. Clear your browser cache/cookies
4. Navigate to http://localhost:3000/logout first, then log in again
