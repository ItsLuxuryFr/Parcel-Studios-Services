# 🔗 Stripe Webhook Setup Guide

## Problem
After completing payment, the commission status doesn't update to "paid" because the webhook isn't configured to notify our system about payment completion.

## Solution
Set up a Stripe webhook to automatically update commission status when payments are completed.

## Step 1: Configure Stripe Webhook

### In Stripe Dashboard:

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Click "Add endpoint"**
3. **Set endpoint URL**: 
   ```
   https://kruklumapcgvfaecbabs.supabase.co/functions/v1/stripe-webhook
   ```
4. **Select events to listen for**:
   - `checkout.session.completed` - When payment is successful
   - `checkout.session.expired` - When payment is abandoned
   - `payment_intent.succeeded` - Backup payment confirmation

5. **Click "Add endpoint"**

### Copy Webhook Secret:

1. **Click on the newly created webhook**
2. **Copy the "Signing secret"** (starts with `whsec_`)
3. **Set it as environment variable**:

```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret --project-ref kruklumapcgvfaecbabs
```

## Step 2: Test the Webhook

### Test with Stripe CLI (Optional):

```bash
# Install Stripe CLI
npm install -g stripe

# Login to Stripe
stripe login

# Forward events to your webhook
stripe listen --forward-to https://kruklumapcgvfaecbabs.supabase.co/functions/v1/stripe-webhook
```

### Test with Test Payment:

1. **Go to payment page** for a commission
2. **Use test card**: `4242 4242 4242 4242`
3. **Complete payment**
4. **Check commission status** - should update to "paid"
5. **Check Stripe Dashboard** - should see webhook events

## Step 3: Verify Webhook is Working

### Check Webhook Events:

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Click on your webhook endpoint**
3. **Check "Recent deliveries"** - should show successful events
4. **Look for `checkout.session.completed` events**

### Check Database:

```sql
-- Check if commissions are being updated
SELECT id, reference_number, payment_status, paid_at 
FROM commissions 
WHERE payment_status = 'paid';
```

### Check Edge Function Logs:

```bash
npx supabase functions logs stripe-webhook --project-ref kruklumapcgvfaecbabs
```

## Expected Behavior After Setup

### ✅ **Payment Flow**
1. User clicks "Pay Now" → Creates Stripe checkout session
2. User completes payment → Stripe sends webhook
3. Webhook updates commission status to "paid"
4. User sees "Payment Confirmed" page
5. Commission shows as paid in dashboard

### ✅ **Database Updates**
- `payment_status` → `'paid'`
- `paid_at` → timestamp of payment
- `stripe_session_id` → session ID for tracking

### ✅ **User Experience**
- Immediate status updates after payment
- Consistent payment confirmation
- No manual refresh needed

## Troubleshooting

### Webhook Not Receiving Events

1. **Check endpoint URL** - must be exactly correct
2. **Check events selected** - must include `checkout.session.completed`
3. **Check webhook secret** - must match in environment variables
4. **Check Edge Function logs** for errors

### Payment Status Not Updating

1. **Check webhook deliveries** in Stripe Dashboard
2. **Check Edge Function logs** for processing errors
3. **Verify database permissions** for service role key
4. **Check commission ID** in session metadata

### Common Issues

**"Invalid signature" error:**
- Webhook secret doesn't match
- Check environment variable is set correctly

**"Commission not found" error:**
- Commission ID not in session metadata
- Check checkout session creation

**"Database update failed" error:**
- Service role key not set
- Database permissions issue

## Production Considerations

### Security:
- ✅ Webhook signature verification implemented
- ✅ HTTPS endpoint required
- ✅ Service role key for database access

### Reliability:
- ✅ Retry logic for failed webhooks
- ✅ Event deduplication
- ✅ Error logging and monitoring

### Monitoring:
- ✅ Stripe Dashboard shows webhook status
- ✅ Edge Function logs show processing
- ✅ Database queries show payment status

## Success Criteria

After setup, you should see:

✅ **Webhook events** in Stripe Dashboard  
✅ **Commission status updates** automatically  
✅ **Payment confirmation** works immediately  
✅ **No manual refresh** needed  
✅ **Consistent user experience**  

---

**Next Steps**: Once webhook is configured, test the complete payment flow to ensure everything works end-to-end.
