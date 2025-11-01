# Second Payment Status Not Updating Fix

## Problem

After completing the second payment for a split commission, when going back to commission details, it still shows "Pay Second Half (50%)" button. This means the payment status is not being updated to `completed`.

## Changes Made

### 1. Added `amountPaid` to Commission Context
- Added `amountPaid` field to the Commission interface
- Added `amountPaid` mapping in `loadUserCommissions` function
- This ensures the total amount paid is properly displayed

### 2. Enhanced Logging in PaymentConfirmation
- Added detailed logging to track payment status before/after refresh
- This will help diagnose if the webhook is working or not

### 3. Fixed Webhook to Sum Amounts
- Webhook now adds second payment to existing amount
- Database query now includes `amount_paid` field

## Debugging Steps

### 1. Complete Second Payment and Check Console

After completing the second payment, check the console for:
```
[DEBUG] Final commission data: { paymentStatus: 'completed', ... }
[DEBUG] Before refresh - payment status: completed
[DEBUG] After refresh - fetching commission from context
[DEBUG] Refreshed commission payment status: completed
```

### 2. If Status is NOT 'completed'

Check the webhook logs:
1. Go to: https://supabase.com/dashboard/project/kruklumapcgvfaecbabs/functions/stripe-webhook/logs
2. Look for entries with your commission ID
3. Check if you see:
   - `[WEBHOOK] Processing second payment completion`
   - `[WEBHOOK] Second payment amount calculation`
   - `[WEBHOOK] Commission second payment completed and status updated to completed`

### 3. Verify Database Directly

Run this query in Supabase SQL Editor:

```sql
SELECT 
  id, 
  payment_status, 
  payment_type, 
  amount_paid, 
  second_payment_completed_at 
FROM commissions 
WHERE id = 'YOUR_COMMISSION_ID';
```

Expected result after second payment:
- `payment_status`: `completed` ✅
- `amount_paid`: `32` (or your total commission amount)
- `second_payment_completed_at`: Timestamp of when second payment completed

## If Status Still Not Updating

### Check Webhook Metadata

The checkout session metadata must include `is_second_payment: 'true'`. Verify this:

1. Go to Stripe Dashboard → Checkout Sessions
2. Find your session
3. Check metadata section
4. Should see:
   - `commission_id`: `<commission-id>`
   - `is_second_payment`: `true`
   - `payment_type`: `split`

### Manual Database Fix

If webhook isn't working, manually update the database:

```sql
UPDATE commissions 
SET 
  payment_status = 'completed',
  amount_paid = 32,  -- Your actual total
  second_payment_completed_at = NOW()
WHERE id = 'YOUR_COMMISSION_ID';
```

## Expected Flow

1. User clicks "Pay Second Half (50%)"
2. Checkout session created with `is_second_payment: true`
3. User completes payment
4. Webhook fires with `checkout.session.completed`
5. Webhook detects `is_second_payment: 'true'`
6. Webhook updates database:
   - `payment_status`: `payment_started` → `completed`
   - `amount_paid`: `existing + new` = total
   - `second_payment_completed_at`: timestamp
7. Frontend polls for status update
8. Status changes to `completed`
9. Button disappears

## Files Modified

- ✅ `src/types/index.ts` - Added `amountPaid` field
- ✅ `src/contexts/CommissionContext.tsx` - Added `amountPaid` mapping
- ✅ `src/pages/PaymentConfirmation.tsx` - Enhanced logging
- ✅ `supabase/functions/stripe-webhook/index.ts` - Fixed amount summation (already deployed)
- ✅ `supabase/functions/stripe-payment/index.ts` - Fixed amount summation (already deployed)

## Testing

1. Complete the second payment
2. Check console logs for payment status
3. Navigate back to commissions list
4. Open commission details
5. Should NOT see "Pay Second Half" button
6. Should show "Paid on [date]"

## Next Steps

If the issue persists after these changes:

1. **Check webhook logs** for errors
2. **Verify metadata** in Stripe dashboard
3. **Check database directly** to see actual status
4. **Share console output** for further diagnosis

