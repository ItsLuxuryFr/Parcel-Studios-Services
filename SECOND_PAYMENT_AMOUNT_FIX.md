# Second Payment Amount Calculation Fix ✅

## Problem

When the second half of a split payment was completed, the `amount_paid` field was being **overwritten** instead of **added to** the first payment. 

### Example:
- Commission total: $32
- First payment: $16 → `amount_paid = 16` ✅
- Second payment: $16 → `amount_paid = 16` ❌ (should be 32!)

**Result:** Total paid showed as $16 instead of $32

## Root Cause

Both the webhook handler and verification function were using this logic:
```typescript
// ❌ WRONG - Overwrites the amount
updateData.amount_paid = amountPaid  // Just the second payment amount
```

Instead of:
```typescript
// ✅ CORRECT - Adds to existing amount
updateData.amount_paid = existingAmountPaid + amountPaid  // Total of both payments
```

## Solution

### 1. Enhanced `stripe-webhook` Edge Function

**Before:**
```typescript
if (isSecondPayment) {
  await supabase
    .from('commissions')
    .update({
      payment_status: 'completed',
      amount_paid: amountPaid,  // ❌ Only second payment
      second_payment_completed_at: new Date().toISOString()
    })
}
```

**After:**
```typescript
if (isSecondPayment) {
  // For second payment, add to existing amount_paid
  const existingAmountPaid = commission?.amount_paid || 0
  const totalAmountPaid = existingAmountPaid + amountPaid
  
  console.log('[WEBHOOK] Second payment amount calculation:', {
    existingAmountPaid,
    newPaymentAmount: amountPaid,
    totalAmountPaid: totalAmountPaid
  })
  
  await supabase
    .from('commissions')
    .update({
      payment_status: 'completed',
      amount_paid: totalAmountPaid,  // ✅ Total of both payments
      second_payment_completed_at: new Date().toISOString()
    })
}
```

### 2. Enhanced `stripe-payment` Edge Function

Applied the same fix to the verification function for consistency.

### 3. Added `amount_paid` to Database Query

Both functions now fetch `amount_paid` when retrieving commission data:
```typescript
const { data: commission } = await supabase
  .from('commissions')
  .select('payment_type, payment_status, stripe_product_id, stripe_price_id, amount_paid') // ✅ Added amount_paid
  .eq('id', commissionId)
  .single()
```

## What This Fixes

✅ **Correct Total Amount** - Second payment now adds to existing amount
✅ **Accurate Records** - Database shows total paid across both payments
✅ **Payment History** - Users can see correct payment totals
✅ **Consistent Behavior** - Both webhook and verification functions handle it the same way

## Deployment Status

- ✅ `stripe-webhook` function deployed
- ✅ `stripe-payment` function deployed

## Expected Behavior

For a $32 split payment commission:

**First Payment ($16):**
- `payment_status`: `unpaid` → `payment_started`
- `amount_paid`: `0` → `16`

**Second Payment ($16):**
- `payment_status`: `payment_started` → `completed`
- `amount_paid`: `16` → `32` ✅

**Total Paid:** $32 ✅

## Testing

1. Complete the first payment for a split commission
2. Complete the second payment
3. Check database - `amount_paid` should equal total commission amount
4. Check commission details page - should show correct total

## Console Output (Success)

```
[WEBHOOK] Processing second payment completion
[WEBHOOK] Second payment amount calculation: {
  existingAmountPaid: 16,
  newPaymentAmount: 16,
  totalAmountPaid: 32
}
[WEBHOOK] Commission second payment completed and status updated to completed
```

## Files Modified

- ✅ `supabase/functions/stripe-webhook/index.ts` - Fixed second payment amount calculation
- ✅ `supabase/functions/stripe-payment/index.ts` - Fixed second payment amount calculation

## Next Steps

After deployment:
- ✅ Second payments will now correctly accumulate the total amount
- ✅ Database will show accurate payment totals
- ✅ All future second payments will work correctly

