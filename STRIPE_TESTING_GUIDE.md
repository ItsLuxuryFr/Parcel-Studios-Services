# Stripe Integration Testing Guide

## Overview
This guide explains how to test the complete Stripe payment integration for commission payments.

## Prerequisites

1. **Stripe Test Mode**: Ensure you're using test keys (starts with `pk_test_` and `sk_test_`)
2. **Supabase Edge Functions**: Deploy the Edge Functions to your Supabase project
3. **Environment Variables**: Configure Stripe keys in Supabase Edge Function secrets

## Test Cards

Use these Stripe test card numbers for testing:

### Successful Payments
- **Visa**: `4242 4242 4242 4242`
- **Visa (debit)**: `4000 0566 5566 5556`
- **Mastercard**: `5555 5555 5555 4444`
- **American Express**: `3782 822463 10005`

### Failed Payments
- **Declined**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **Expired card**: `4000 0000 0000 0069`

### 3D Secure Authentication
- **Requires authentication**: `4000 0025 0000 3155`
- **Authentication fails**: `4000 0000 0000 3178`

## Testing Steps

### 1. Test Product Creation

1. **Navigate to Commissions page**
2. **Find an accepted commission** (status: "accepted")
3. **Click "Pay Now" button**
4. **Verify in Stripe Dashboard**:
   - Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/test/products)
   - Look for product named "Roblox Commission - {subject}"
   - Verify description matches commission details

### 2. Test Payment Flow

1. **Click payment link** on payment page
2. **Use test card**: `4242 4242 4242 4242`
3. **Fill in test details**:
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
4. **Complete payment**
5. **Verify redirect** to confirmation page
6. **Check commission status** updated to "paid"

### 3. Test Payment Abandonment

1. **Start payment process** (click "Pay Now")
2. **Navigate away** without completing payment
3. **Wait for session to expire** (24 hours for test mode)
4. **Verify in Stripe Dashboard**:
   - Product should be deleted automatically
   - Commission status should remain "unpaid"

### 4. Test Product Archival

1. **Complete a payment** using test card
2. **Wait 3 days** (or manually trigger archival function)
3. **Verify in Stripe Dashboard**:
   - Product should be archived (inactive)
   - Commission should have `product_archived_at` timestamp

## Edge Function Testing

### Test Edge Functions Locally

```bash
# Deploy Edge Functions
supabase functions deploy stripe-payment
supabase functions deploy stripe-webhook
supabase functions deploy archive-products

# Test payment function
curl -X POST https://your-project.supabase.co/functions/v1/stripe-payment \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create-product",
    "data": {
      "name": "Test Product",
      "description": "Test Description",
      "commission_id": "test-123",
      "reference_number": "COM-TEST-001"
    }
  }'
```

### Test Webhook Endpoint

1. **Configure webhook in Stripe Dashboard**:
   - URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`

2. **Test webhook locally**:
   ```bash
   # Use Stripe CLI to forward events
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```

## Database Verification

### Check Commission Updates

```sql
-- Check payment status updates
SELECT id, reference_number, payment_status, paid_at, stripe_product_id 
FROM commissions 
WHERE payment_status = 'paid';

-- Check product archival
SELECT id, reference_number, product_archived_at 
FROM commissions 
WHERE product_archived_at IS NOT NULL;
```

### Check Stripe Integration

```sql
-- Check Stripe IDs are populated
SELECT id, reference_number, stripe_product_id, stripe_price_id, stripe_payment_link_url
FROM commissions 
WHERE stripe_product_id IS NOT NULL;
```

## Common Issues & Solutions

### Issue: "Edge Function not available"
**Solution**: Deploy Edge Functions to Supabase
```bash
supabase functions deploy stripe-payment
```

### Issue: "Invalid signature" in webhook
**Solution**: Check webhook secret configuration in Supabase environment variables

### Issue: Products not appearing in Stripe Dashboard
**Solution**: 
1. Verify Stripe secret key is correct
2. Check Edge Function logs for errors
3. Ensure test mode is enabled

### Issue: Payment not updating commission status
**Solution**:
1. Check webhook endpoint configuration
2. Verify webhook events are enabled
3. Check Edge Function logs for processing errors

## Monitoring & Logs

### Supabase Edge Function Logs
```bash
# View function logs
supabase functions logs stripe-payment
supabase functions logs stripe-webhook
supabase functions logs archive-products
```

### Stripe Dashboard Monitoring
1. **Events**: Monitor webhook events in Stripe Dashboard
2. **Logs**: Check function logs for errors
3. **Products**: Verify product lifecycle in Products section

## Production Checklist

Before going live:

- [ ] Replace test keys with live keys
- [ ] Update webhook endpoint to production URL
- [ ] Test with real payment methods (small amounts)
- [ ] Verify product archival works correctly
- [ ] Set up monitoring and alerting
- [ ] Test error scenarios thoroughly

## Support

If you encounter issues:

1. **Check Edge Function logs** for detailed error messages
2. **Verify Stripe Dashboard** for product/payment status
3. **Test with different card numbers** to isolate issues
4. **Check database** for proper status updates

## Success Criteria

✅ **Products appear in Stripe Dashboard**  
✅ **Payment links work and process payments**  
✅ **Commission status updates automatically**  
✅ **Products archive after 3 days**  
✅ **Abandoned payments cleanup properly**  
✅ **All error scenarios handled gracefully**
