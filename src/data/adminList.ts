// List of admin user IDs
// These are the user IDs from the Supabase database that have admin privileges
export const ADMIN_USER_IDS = [
  '76f20fd1-8de8-48b3-a3eb-0b8d7b5b7acf'
];

// Helper function to check if a user ID is an admin
export const isAdmin = (userId: string | undefined): boolean => {
  if (!userId) return false;
  return ADMIN_USER_IDS.includes(userId);
};
