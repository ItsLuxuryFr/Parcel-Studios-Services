-- Add Stripe session tracking and product archival columns
-- This migration adds additional fields for tracking Stripe checkout sessions and product lifecycle

-- Add checkout session tracking
ALTER TABLE commissions 
ADD COLUMN stripe_checkout_session_id text,
ADD COLUMN payment_abandoned_at timestamptz,
ADD COLUMN product_archived_at timestamptz;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_commissions_stripe_session_id ON commissions(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_commissions_paid_at ON commissions(paid_at);
CREATE INDEX IF NOT EXISTS idx_commissions_product_archived_at ON commissions(product_archived_at);

-- Add comments for documentation
COMMENT ON COLUMN commissions.stripe_checkout_session_id IS 'Stripe checkout session ID for tracking payment sessions';
COMMENT ON COLUMN commissions.payment_abandoned_at IS 'Timestamp when payment was abandoned (session expired)';
COMMENT ON COLUMN commissions.product_archived_at IS 'Timestamp when Stripe product was archived (3 days after payment)';
