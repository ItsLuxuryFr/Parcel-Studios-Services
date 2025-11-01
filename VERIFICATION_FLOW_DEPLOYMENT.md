# Email Verification Flow - Deployment Guide

## Overview
This guide explains how to deploy the updated email verification system with server-side verification checks.

## Changes Made

### 1. New Supabase Edge Function
- **Location**: `supabase/functions/check-verification/index.ts`
- **Purpose**: Uses Supabase admin client (service role key) to check if a user's email is verified
- **Endpoint**: `/api/check-verification`
- **Method**: POST
- **Input**: `{ email: string }`
- **Output**: `{ verified: boolean }` or `{ error: string, verified: false }`

### 2. Updated VerifyEmail Component
- **Location**: `src/pages/VerifyEmail.tsx`
- **Changes**:
  - Added `checkVerificationWithServer()` function that calls the server endpoint
  - Modified `checkVerification()` to catch `AuthSessionMissingError` and fall back to server endpoint
  - Updated auth state listener to use server endpoint as fallback
  - Maintains polling (every 3 seconds) and auth state listener for real-time detection

### 3. Verification of signUp Configuration
- **Location**: `src/contexts/AuthContext.tsx`
- **Confirmed**:
  - ✅ Stores email to localStorage when confirmation is required
  - ✅ Includes `emailRedirectTo: ${window.location.origin}/verify-email`

## Deployment Steps

### Step 1: Deploy the Edge Function

```bash
# Navigate to your project directory
cd "path/to/your/project"

# Deploy the check-verification function
supabase functions deploy check-verification
```

### Step 2: Set Up Environment Variables

The Edge Function requires the Supabase service role key. Set it as a secret:

```bash
# Set the SUPABASE_SERVICE_ROLE_KEY secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Also ensure SUPABASE_URL is set (should be automatic)
supabase secrets set SUPABASE_URL=<your-supabase-url>
```

**To find your service role key:**
1. Go to your Supabase Dashboard
2. Navigate to Project Settings → API
3. Copy the `service_role` key (⚠️ Keep this secret!)

### Step 3: Verify the Deployment

```bash
# List all deployed functions
supabase functions list

# Test the function locally (optional)
supabase functions serve check-verification --env-file .env.local
```

### Step 4: Configure Supabase Dashboard Settings

**Authentication URL Configuration:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL** to your app base URL:
   - Development: `http://localhost:3000` (or your dev port)
   - Production: `https://yourdomain.com`
3. Add to **Redirect URLs**:
   - `http://localhost:3000/verify-email`
   - `https://yourdomain.com/verify-email`

## How It Works

### Flow Diagram

```
1. User signs up
   ↓
2. Supabase sends verification email with link
   ↓
3. User clicks link → redirects to /verify-email
   ↓
4. VerifyEmail component checks verification:
   ├─ Primary: Try supabase.auth.getUser()
   ├─ Fallback: If AuthSessionMissingError → call server endpoint
   └─ Polling: Check every 2 seconds
   ↓
5. Once verified detected → redirect to /onboarding
```

### Error Handling

The system has multiple layers of verification checking:

1. **Client SDK** (`supabase.auth.getUser()`) - Fast, works when session exists
2. **Server Endpoint** (`/functions/v1/check-verification`) - Admin lookup via Supabase Edge Function
3. **Polling** - Checks every 2 seconds to catch verification from any source

### When Server Endpoint is Called

The server endpoint is used when:
- `AuthSessionMissingError` is thrown by `getUser()`
- Session is missing or expired
- User clicks verification link in a fresh browser/tab with no existing session

### Implementation Details

The new approach is simpler and more reliable:
- Uses `getUser()` instead of `getSession()` for better error handling
- Falls back to server-side admin lookup when no session exists
- Polls every 2 seconds (faster than before)
- Removed auth state listener (simpler code, polling handles everything)

## Testing

### Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create a new account at `/signup`

3. Check your email for the verification link

4. Click the link - you should land on `/verify-email`

5. The page should automatically detect verification and redirect to `/onboarding`

### Manual Testing

You can test the server endpoint directly:

```bash
# Test the endpoint
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-verification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Expected response:
# {"verified": true} or {"verified": false}
```

## Troubleshooting

### Issue: "Function not found" or 404 errors

**Solution:**
- Deploy the function: `supabase functions deploy check-verification`
- Verify deployment: `supabase functions list`

### Issue: "Unauthorized" or service role key errors

**Solution:**
- Set the service role key: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<key>`
- Verify secrets: `supabase secrets list`

### Issue: Verification not detected

**Solutions:**
- Check browser console for errors
- Verify the email was sent (check Supabase Auth logs)
- Ensure redirect URLs are configured in Supabase Dashboard
- Try the manual "Check now" button on `/verify-email` page
- Use the "Debug session" button to inspect session state

### Issue: Redirects to wrong page

**Solution:**
- Verify `Site URL` in Supabase Dashboard matches your app URL
- Check `emailRedirectTo` in signup call: should be `${window.location.origin}/verify-email`

## Environment Variables

Make sure your `.env` file (or environment) has:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Security Notes

⚠️ **Important**:
- The service role key has admin access - never expose it in client-side code
- Only the Edge Function uses the service role key
- The Edge Function is protected by Supabase's function authorization
- Client-side code uses the anon key (read-only for verification status)

## Files Modified

- ✅ `supabase/functions/check-verification/index.ts` - **NEW FILE**
- ✅ `src/pages/VerifyEmail.tsx` - Updated with server endpoint fallback
- ✅ `src/contexts/AuthContext.tsx` - Already configured correctly (verified)

## Next Steps

1. Deploy the Edge Function
2. Set the service role key secret
3. Configure Supabase Dashboard URL settings
4. Test the complete flow
5. Monitor logs for any issues

## Support

If you encounter issues:
1. Check Supabase Edge Function logs: `supabase functions logs check-verification`
2. Check browser console for client errors
3. Verify all environment variables are set correctly
4. Test the server endpoint directly with curl

