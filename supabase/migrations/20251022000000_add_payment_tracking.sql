-- Add payment status enum type
CREATE TYPE payment_status AS ENUM ('unpaid', 'pending', 'paid');

-- Add payment tracking columns to commissions table
ALTER TABLE commissions 
ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS stripe_product_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_link_url text,
ADD COLUMN IF NOT EXISTS paid_at timestamptz,
ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- Add indexes for performance on payment status queries
CREATE INDEX IF NOT EXISTS idx_commissions_payment_status ON commissions(payment_status);

-- Add index for Stripe product ID lookups
CREATE INDEX IF NOT EXISTS idx_commissions_stripe_product_id ON commissions(stripe_product_id);

-- Add index for Stripe session ID lookups
CREATE INDEX IF NOT EXISTS idx_commissions_stripe_session_id ON commissions(stripe_session_id);

-- Add comments for documentation
COMMENT ON COLUMN commissions.payment_status IS 'Current payment status: unpaid, pending, or paid';
COMMENT ON COLUMN commissions.stripe_product_id IS 'Stripe product ID for this commission';
COMMENT ON COLUMN commissions.stripe_price_id IS 'Stripe price ID for this commission';
COMMENT ON COLUMN commissions.stripe_payment_link_url IS 'Stripe payment link URL for checkout';
COMMENT ON COLUMN commissions.paid_at IS 'Timestamp when payment was completed';
COMMENT ON COLUMN commissions.stripe_session_id IS 'Stripe checkout session ID';

