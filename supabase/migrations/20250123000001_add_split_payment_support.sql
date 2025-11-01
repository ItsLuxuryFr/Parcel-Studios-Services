-- Add payment_started status and second payment tracking fields

-- Update payment_status CHECK constraint to include 'payment_started'
ALTER TABLE commissions DROP CONSTRAINT IF EXISTS commissions_payment_status_check;
ALTER TABLE commissions ADD CONSTRAINT commissions_payment_status_check 
CHECK (payment_status IN ('unpaid', 'pending', 'payment_started', 'completed'));

-- Add second payment tracking fields
ALTER TABLE commissions 
ADD COLUMN IF NOT EXISTS second_payment_stripe_price_id text,
ADD COLUMN IF NOT EXISTS second_payment_link_url text,
ADD COLUMN IF NOT EXISTS second_payment_completed_at timestamptz;

-- Add comments for documentation
COMMENT ON COLUMN commissions.second_payment_stripe_price_id IS 'Stripe price ID for the second half payment (50% on completion)';
COMMENT ON COLUMN commissions.second_payment_link_url IS 'Stripe payment link URL for the second half payment';
COMMENT ON COLUMN commissions.second_payment_completed_at IS 'Timestamp when the second payment was completed';

