-- Add payment_type column to commissions table
ALTER TABLE commissions 
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'full' 
CHECK (payment_type IN ('full', 'split'));

-- Add comment for documentation
COMMENT ON COLUMN commissions.payment_type IS 'Payment type: full (100% upfront) or split (50% upfront & 50% upon completion)';

