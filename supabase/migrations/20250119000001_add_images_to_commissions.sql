-- Add images column to commissions table
ALTER TABLE commissions 
ADD COLUMN images text[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN commissions.images IS 'Array of image URLs uploaded with the commission';
