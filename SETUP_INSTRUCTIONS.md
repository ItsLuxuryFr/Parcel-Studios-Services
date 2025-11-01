# Email Verification Setup Instructions

## What Has Been Done

1. ✅ Service Role Key set as secret: `SERVICE_ROLE_KEY`
2. ✅ Edge Function deployed (version 3) with updated environment variable
3. ✅ VerifyEmail component configured with server fallback
4. ✅ Signup configured with `emailRedirectTo: /verify-email`

## Current Status

The Edge Function is deployed and active, but it may take a few minutes for the secret to be fully available to the function.

## How to Verify It's Working

1. **Wait 1-2 minutes** for the secret to propagate
2. **Test the verification flow:**
   - Sign up with a new account at `/signup`
   - Check your email and click the verification link
   - You should land on `/verify-email`
   - The page should automatically redirect to `/onboarding` when verified

## If Still Getting 500 Errors

If you're still seeing 500 errors after waiting, try these steps:

### Option 1: Redeploy the Function

```bash
npx supabase functions deploy check-verification --project-ref kruklumapcgvfaecbabs
```

### Option 2: Check Secret Status

```bash
npx supabase secrets list --project-ref kruklumapcgvfaecbabs
```

You should see `SERVICE_ROLE_KEY` in the list.

### Option 3: Manually Verify via Dashboard

1. Go to Supabase Dashboard → Project Settings → Secrets
2. Verify `SERVICE_ROLE_KEY` is set
3. If not, add it manually:
   - Secret name: `SERVICE_ROLE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydWtsdW1hcGNndmZhZWNiYWJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4NjMzMiwiZXhwIjoyMDc2NDYyMzMyfQ.RzMP--J0suTU3jHUOhBMivlPaIgbGG-DDpSALbg-Qlk`

## Expected Behavior

Once the secret propagates:
- Edge Function should return 200 status
- Verification page should successfully detect verified users
- Users should be redirected to onboarding after verification

## Testing

The verification flow uses multiple layers:
1. **Client SDK** - Uses `getUser()` for fast checking
2. **Server Endpoint** - Falls back to admin lookup when no session exists
3. **Polling** - Checks every 2 seconds to catch verification from any source

This ensures verification is detected even if the user:
- Clears their browser cookies
- Opens the verification link in a different tab
- Verifies from another device

