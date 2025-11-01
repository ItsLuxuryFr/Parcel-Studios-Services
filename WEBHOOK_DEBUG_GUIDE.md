# Webhook Debugging Guide - Second Payment Not Updating

## Current Issue

After completing the second payment, the status remains `payment_started` instead of updating to `completed`. The webhook is not recognizing this as a second payment.

## What to Check

### 1. Check Webhook Logs

Go to: https://supabase.com/dashboard/project/kruklumapcgvfaecbabs/functions/stripe-webhook/logs

Look for these log entries after completing the second payment:

```
[WEBHOOK] Payment completed for commission: { commissionId: '...', isSecondPayment: true/false, metadata: {...} }
[WEBHOOK] isSecondPayment check: { rawMetadataValue: 'true/false', comparison: true/false, isSecondPayment: true/false }
```

**What to look for:**
- Is `isSecondPayment` set to `true`?
- What does `rawMetadataValue` show?
- Is `metadata.is_second_payment` present?

### 2. Check Browser Console

After clicking "Pay Second Half", look for:
```
[DEBUG] Creating checkout session for second payment
[DEBUG] Calling createCheckoutSession with isSecondPayment=true
[DEBUG] Second payment checkout session created: cs_xxx
```

### 3. Check Stripe Session Metadata

1. Go to Stripe Dashboard → Checkout Sessions
2. Find your second payment session
3. Check the metadata section
4. Should show:
   - `commission_id`: Your commission ID
   - `is_second_payment`: `true`
   - `payment_type`: `split`

## Expected Behavior

### When Metadata is Correct:
```
[WEBHOOK] Payment completed for commission: { ..., isSecondPayment: true }
[WEBHOOK] isSecondPayment check: { rawMetadataValue: 'true', comparison: true, isSecondPayment: true }
[WEBHOOK] Processing second payment completion
[WEBHOOK] Second payment amount calculation: { existingAmountPaid: 16, newPaymentAmount: 16, totalAmountPaid: 32 }
[WEBHOOK] Commission second payment completed and status updated to completed
```

### When Metadata is Incorrect:
```
[WEBHOOK] Payment completed for commission: { ..., isSecondPayment: false }
[WEBHOOK] isSecondPayment check: { rawMetadataValue: 'false', ... }
[WEBHOOK] Processing first payment for split payment type
[WEBHOOK] Commission first payment completed and status updated to payment_started
```

## If isSecondPayment is False

This means the metadata wasn't set correctly. Check:

1. **Is the Edge Function being called?**
   - Check Edge Function logs for `create-checkout-session` action
   - Should see: `[DEBUG] Creating checkout session for second payment`

2. **Is the parameter being passed correctly?**
   - Check the request body in the Edge Function logs
   - Should see: `is_second_payment: true`

3. **Is the metadata being set in Stripe?**
   - Check Stripe session metadata
   - `is_second_payment` should be `'true'` (string)

## Quick Fix Test

If the webhook isn't working, try completing the second payment and check the logs. Then share:
1. What you see in the webhook logs
2. What you see in the browser console
3. What the Stripe session metadata shows

## Files Modified (Already Deployed)

- ✅ `supabase/functions/stripe-webhook/index.ts` - Added detailed logging
- ✅ `supabase/functions/stripe-payment/index.ts` - Added logging
- ✅ `src/lib/stripe.ts` - Added logging
- ✅ `src/pages/PaymentConfirmation.tsx` - Added logging
- ✅ `src/contexts/CommissionContext.tsx` - Added amountPaid mapping
- ✅ `src/types/index.ts` - Added amountPaid field

## Next Steps

1. Complete another second payment
2. Check webhook logs for the debug output
3. Share the console output showing what you see
4. We can then fix the exact issue

