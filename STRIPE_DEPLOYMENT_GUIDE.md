# Stripe Integration Deployment Guide

## Overview
This guide walks through deploying the complete Stripe payment integration to production.

## Prerequisites

- Supabase project with Edge Functions enabled
- Stripe account with API keys
- Domain configured for webhook endpoints

## Step 1: Deploy Edge Functions

### Deploy All Functions

```bash
# Deploy payment processing function
supabase functions deploy stripe-payment

# Deploy webhook handler
supabase functions deploy stripe-webhook

# Deploy product archival function
supabase functions deploy archive-products
```

### Verify Deployment

```bash
# Check function status
supabase functions list

# Test function endpoints
curl -X POST https://your-project.supabase.co/functions/v1/stripe-payment \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "create-product", "data": {"name": "Test", "description": "Test"}}'
```

## Step 2: Configure Environment Variables

### Add to Supabase Edge Function Secrets

```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_live_secret_key

# Set webhook secret (get from Stripe Dashboard)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Set service role key for database access
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Verify Secrets

```bash
# List all secrets
supabase secrets list
```

## Step 3: Configure Stripe Webhooks

### Create Webhook Endpoint

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Click "Add endpoint"**
3. **Set endpoint URL**: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. **Select events**:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
5. **Copy webhook signing secret** and add to Supabase secrets

### Test Webhook

```bash
# Use Stripe CLI to test webhook
stripe listen --forward-to https://your-project.supabase.co/functions/v1/stripe-webhook
```

## Step 4: Run Database Migrations

### Apply Migrations

```bash
# Apply payment tracking migration
supabase db push

# Verify new columns exist
supabase db diff
```

### Verify Schema

```sql
-- Check payment tracking columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'commissions' 
AND column_name LIKE '%stripe%' OR column_name LIKE '%payment%';
```

## Step 5: Set Up Product Archival

### Create Cron Job

Set up a daily cron job to run the archival function:

```bash
# Add to your server's crontab
0 2 * * * curl -X POST https://your-project.supabase.co/functions/v1/archive-products \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Alternative: Use Supabase Cron

If using Supabase Pro, set up a database cron job:

```sql
-- Create function to call archival endpoint
CREATE OR REPLACE FUNCTION archive_products()
RETURNS void AS $$
BEGIN
  -- This would call the Edge Function
  -- Implementation depends on your setup
END;
$$ LANGUAGE plpgsql;

-- Schedule to run daily at 2 AM
SELECT cron.schedule('archive-products', '0 2 * * *', 'SELECT archive_products();');
```

## Step 6: Update Client Configuration

### Update Stripe Keys

In your production environment, update the Stripe configuration:

```typescript
// src/lib/stripeConfig.ts
export const STRIPE_CONFIG = {
  publishableKey: 'pk_live_your_live_publishable_key',
  secretKey: 'sk_live_your_live_secret_key', // Only used server-side
  restrictedKey: 'rk_live_your_live_restricted_key',
};
```

### Update Environment Variables

```bash
# Set production environment variables
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Step 7: Test Production Flow

### Test with Small Amounts

1. **Use live Stripe keys** (but test with small amounts)
2. **Test complete payment flow**:
   - Create commission
   - Accept commission
   - Initiate payment
   - Complete payment with real card
   - Verify webhook processing
   - Check product archival

### Monitor for Issues

```bash
# Monitor function logs
supabase functions logs stripe-payment --follow
supabase functions logs stripe-webhook --follow
supabase functions logs archive-products --follow
```

## Step 8: Production Monitoring

### Set Up Alerts

1. **Stripe Dashboard**: Set up alerts for failed payments
2. **Supabase**: Monitor function execution and errors
3. **Database**: Set up alerts for payment processing failures

### Key Metrics to Monitor

- **Payment success rate**
- **Webhook processing time**
- **Product archival completion**
- **Error rates in Edge Functions**

## Step 9: Security Considerations

### API Key Security

- **Never expose secret keys** in client-side code
- **Use restricted keys** where possible
- **Rotate keys regularly**
- **Monitor key usage**

### Webhook Security

- **Verify webhook signatures** (implemented in Edge Function)
- **Use HTTPS** for all webhook endpoints
- **Validate event data** before processing

### Database Security

- **Use Row Level Security** (RLS) policies
- **Limit service role key access**
- **Audit database changes**

## Step 10: Backup & Recovery

### Database Backups

```bash
# Create database backup
supabase db dump > backup_$(date +%Y%m%d).sql

# Restore from backup if needed
supabase db reset --db-url postgresql://...
```

### Stripe Data Backup

- **Export customer data** regularly
- **Backup product information**
- **Document payment flows**

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**:
   - Check endpoint URL
   - Verify webhook secret
   - Check Stripe Dashboard for delivery attempts

2. **Products not archiving**:
   - Check cron job execution
   - Verify Edge Function logs
   - Check database for proper timestamps

3. **Payment status not updating**:
   - Check webhook event processing
   - Verify database permissions
   - Check Edge Function error logs

### Debug Commands

```bash
# Check function status
supabase functions list

# View recent logs
supabase functions logs stripe-payment --limit 50

# Test webhook locally
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

## Success Verification

After deployment, verify:

✅ **Edge Functions deployed successfully**  
✅ **Webhook endpoint receiving events**  
✅ **Products created in Stripe Dashboard**  
✅ **Payments processing correctly**  
✅ **Commission status updating automatically**  
✅ **Product archival working**  
✅ **Error handling functioning**  
✅ **Monitoring and alerts configured**

## Support

For issues during deployment:

1. **Check Supabase documentation** for Edge Functions
2. **Review Stripe webhook documentation**
3. **Check function logs** for detailed error messages
4. **Test with Stripe CLI** for webhook debugging

## Next Steps

After successful deployment:

1. **Monitor performance** for the first week
2. **Test edge cases** thoroughly
3. **Set up automated backups**
4. **Document any customizations**
5. **Plan for scaling** as usage grows
