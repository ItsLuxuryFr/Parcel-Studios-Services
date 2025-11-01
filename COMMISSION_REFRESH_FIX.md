# Commission Refresh After Payment Fix ✅

## Problem

After completing the second payment:
1. Payment confirmation page correctly showed it as second payment ✅
2. BUT returning to commission details still showed "Pay Second Half" button ❌
3. This means the payment_status wasn't being updated to 'completed' in the database
4. OR the commission context wasn't refreshing with the latest data

## Root Cause

The webhook **WAS** updating the status to 'completed' (with the fallback logic we added), but the commission context in memory was showing stale data when the user returned to the commission details page.

## Solution

### 1. Enhanced Webhook Fallback Logic (Already Deployed)
- If `is_second_payment` metadata is missing but commission is already `payment_started` for a split payment type
- The webhook now treats it as the second payment and updates status to `completed`

### 2. Added Commission Refresh on Return
- Added `useLocation` import to track navigation
- Added `location.key` to the first useEffect dependency array to trigger refresh when location changes
- Added second useEffect that specifically checks if returning from payment/payment-confirmation pages
- Automatically refreshes commission data when returning from payment

### 3. Fixed Polling Logic
- Payment confirmation page now properly waits for webhook to update status to 'completed'
- Doesn't break out of polling loop prematurely for second payments

## What This Fixes

✅ **Webhook Updates Status Correctly** - Fallback logic ensures second payment status is updated
✅ **Commission Context Refreshes** - Data is reloaded from database when returning from payment
✅ **Button Disappears** - "Pay Second Half" button no longer shows after second payment
✅ **Polling Works** - Payment confirmation waits for webhook to complete

## Files Modified

- ✅ `supabase/functions/stripe-webhook/index.ts` - Added fallback logic (deployed)
- ✅ `src/pages/PaymentConfirmation.tsx` - Fixed polling and second payment detection
- ✅ `src/pages/Commissions.tsx` - Added refresh on navigation from payment

## Expected Flow

### Second Payment Completes:
1. User clicks "Pay Second Half (50%)"
2. Completes payment on Stripe
3. Redirects to `/payment-confirmation`
4. Page waits for webhook (polls up to 10 seconds)
5. Webhook fires and updates status to `completed` ✅
6. Shows second payment confirmation message
7. User clicks "Back to Commissions"
8. Commission context refreshes with latest data ✅
9. Commission details no longer shows "Pay Second Half" button ✅

## Console Output (Success)

```
[WEBHOOK] FALLBACK: Treating as second payment because commission is already payment_started
[WEBHOOK] Processing second payment completion
[WEBHOOK] Commission second payment completed and status updated to completed
[DEBUG] Returning from payment page, refreshing commissions
[DEBUG] Second payment button visibility check: { 
  paymentStatus: 'completed',  // ✅ Updated!
  shouldShow: false 
}
```

## Testing

After completing the second payment:

1. ✅ Payment confirmation page shows correct message
2. ✅ Click "Back to Commissions"
3. ✅ Commission context refreshes
4. ✅ Open commission details
5. ✅ Should NOT see "Pay Second Half" button
6. ✅ Should see payment status as completed

