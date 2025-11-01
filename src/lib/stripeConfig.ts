/**
 * Stripe Configuration
 * Environment variables for Stripe integration
 */

// Stripe API Keys
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  secretKey: import.meta.env.STRIPE_SECRET_KEY,
  restrictedKey: import.meta.env.STRIPE_RESTRICTED_KEY,
};

// Validate that we have the required keys
if (!STRIPE_CONFIG.publishableKey) {
  throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
}

if (!STRIPE_CONFIG.secretKey) {
  console.warn('STRIPE_SECRET_KEY is not set in environment variables');
}

export default STRIPE_CONFIG;