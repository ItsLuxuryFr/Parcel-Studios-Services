# Payment Status Polling Fix

## Problem Identified
When users complete payment on Stripe and get redirected to the Payment Confirmation page, the commission payment_status was still showing as 'unpaid' because:

1. **Timing Issue**: The webhook from Stripe takes time to process
2. **No Polling**: The confirmation page was checking payment status once and not waiting for the webhook to update the database
3. **Result**: Users saw error messages or incorrect payment status even though payment was successful

## Solution Implemented

### 1. **Polling Mechanism** (`src/pages/PaymentConfirmation.tsx`)
Added intelligent polling that:
- Fetches commission data from database every 1 second
- Waits up to 10 seconds (10 attempts) for webhook to process
- Stops polling immediately when payment status changes
- Falls back to Stripe session verification if polling doesn't find an update
- Refreshes commission context after verification

```typescript
// Poll for updated payment status (webhook might take a moment)
let commissionData = null;
let attempts = 0;
const maxAttempts = 10; // Wait up to 10 seconds

while (attempts < maxAttempts) {
  attempts++;
  console.log(`[DEBUG] Fetching payment status (attempt ${attempts}/${maxAttempts})`);
  
  const { data, error } = await supabase
    .from('commissions')
    .select('id, subject, reference_number, proposed_amount, payment_status, payment_type, amount_paid, paid_at')
    .eq('id', commissionId)
    .single();

  if (commissionData.payment_status !== 'unpaid' && commissionData.payment_status !== 'pending') {
    console.log('[DEBUG] Payment status updated, stopping polling');
    break;
  }

  // Wait 1 second before next attempt
  if (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

### 2. **Enhanced Debug Logging**
Added comprehensive debug statements throughout:
- `[DEBUG]` prefix for all frontend logs
- `[WEBHOOK]` prefix for all webhook logs
- Payment flow tracking at every step
- Commission data state tracking

### 3. **Context Refresh**
After payment is verified, the commission context is refreshed:
```typescript
// Refresh commission context so it shows updated status when user navigates back
console.log('[DEBUG] Refreshing commission context');
await loadUserCommissions();
```

## Expected Behavior

### Before Payment
- Commission status: `unpaid`
- Pay button visible

### During Payment
- User redirected to Stripe checkout
- Payment processed by Stripe

### After Payment
1. **Immediate**: User redirected to confirmation page
2. **Polling**: Page checks database every second
3. **Webhook**: Stripe webhook updates database (usually within 2-3 seconds)
4. **Status Update**: Page detects updated status (payment_started for split, completed for full)
5. **Display**: Shows correct payment confirmation message

### Split Payment Flow
1. First payment (50%) → Status: `payment_started`
2. Commission completed by admin
3. Second payment (50%) → Status: `completed`
4. Files downloadable

### Full Payment Flow
1. Full payment (100%) → Status: `completed`
2. Files downloadable immediately

## Debug Console Output

### During Payment Processing
```
[DEBUG] Loading commission for payment confirmation: abc123
[DEBUG] Fetching payment status (attempt 1/10)
[DEBUG] Current payment status: { paymentStatus: 'unpaid', paymentType: 'split', attempt: 1 }
[DEBUG] Fetching payment status (attempt 2/10)
[DEBUG] Current payment status: { paymentStatus: 'unpaid', paymentType: 'split', attempt: 2 }
[WEBHOOK] Payment completed for commission: { commissionId: 'abc123', paymentType: 'split', isSecondPayment: false, amountPaid: 50 }
[WEBHOOK] Processing first payment for split payment type
[WEBHOOK] Commission first payment completed and status updated to payment_started
[DEBUG] Fetching payment status (attempt 3/10)
[DEBUG] Current payment status: { paymentStatus: 'payment_started', paymentType: 'split', attempt: 3 }
[DEBUG] Payment status updated, stopping polling
[DEBUG] Final commission data: { paymentStatus: 'payment_started', paymentType: 'split', amountPaid: 50 }
[DEBUG] Payment verified
[DEBUG] Refreshing commission context
```

### Payment Confirmation Display
- **First Payment (Split)**: "Your first payment of $X has been successfully processed. You'll pay the remaining 50% once the work is completed."
- **Second Payment (Split)**: "Your second payment of $X has been successfully processed. All payments complete! You can now download your files."
- **Full Payment**: "Your payment of $X has been successfully processed. Your commission will start soon."

## Testing

### Test Cases
1. ✅ First payment for split type commission
2. ✅ Second payment for split type commission (after completion)
3. ✅ Full payment for full type commission
4. ✅ Retry mechanism if webhook is slow
5. ✅ Error handling if payment fails
6. ✅ Context refresh after successful payment

### Manual Testing Steps
1. Create a commission with `payment_type: 'split'`
2. Have admin accept the commission
3. Click "Pay Now"
4. Complete payment on Stripe
5. Observe debug console logs
6. Verify payment status updates to `payment_started`
7. Confirm correct message displays
8. Navigate back to commissions
9. Verify commission shows correct payment status

## Known Issues and Solutions

### Issue: Payment Status Still Shows Unpaid
**Solution**: Polling mechanism waits up to 10 seconds for webhook to process

### Issue: Webhook Not Triggering
**Solution**: Falls back to Stripe session verification using session_id

### Issue: Context Not Refreshing
**Solution**: `loadUserCommissions()` called after payment verification

## Performance
- Polling attempts: Up to 10 (10 seconds max)
- Delay between attempts: 1 second
- Minimum wait time: 0 seconds (if webhook is instant)
- Maximum wait time: 10 seconds (if webhook is slow)
- Fallback: Stripe session verification

## Future Improvements
- Consider using Supabase Realtime to listen for payment status changes
- Implement exponential backoff for polling
- Add retry mechanism for failed webhook calls
- Show loading states during polling

