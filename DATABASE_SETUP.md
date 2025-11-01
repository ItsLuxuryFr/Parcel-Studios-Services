# Database Setup Instructions

## Applying the Images Migration

To enable image uploads for commissions, you need to apply the database migration that adds the `images` column to the `commissions` table.

### Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Link your project to Supabase:
   ```bash
   npx supabase link --project-ref kbzbwlwzwwurlplhtgnu
   ```

3. Apply the migration:
   ```bash
   npx supabase db push
   ```

### Option 2: Manual SQL Execution

If you can't use the CLI, you can run the migration SQL directly in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL:

```sql
-- Add images column to commissions table
ALTER TABLE commissions 
ADD COLUMN images text[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN commissions.images IS 'Array of image URLs uploaded with the commission';
```

### Option 3: The App Will Work Without Images

The application has been designed to work gracefully even if the images column doesn't exist yet. Users can still create commissions, but image uploads will be disabled until the migration is applied.

## Verification

After applying the migration, you should be able to:
- Upload images when creating new commissions
- See image previews in commission cards
- View full image galleries in the admin panel

## Troubleshooting

If you encounter issues:
1. Check the browser console for error messages
2. Verify the migration was applied by checking if the `images` column exists in the `commissions` table
3. Make sure your Supabase project is properly configured with the correct environment variables
