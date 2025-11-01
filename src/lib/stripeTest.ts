/**
 * Stripe Integration Test
 * This file contains test functions to verify Stripe MCP tool integration
 */

import { createCommissionProduct, createCommissionPrice, createPaymentLink } from './stripe';
import { Commission } from '../types';

/**
 * Test function to verify Stripe MCP tools are working
 * Call this function to test the integration
 */
export async function testStripeIntegration() {
  console.log('🧪 Testing Stripe MCP Integration...');
  
  try {
    // Create a test commission
    const testCommission: Commission = {
      id: 'test-commission-123',
      userId: 'test-user-123',
      taskComplexity: 'medium',
      subject: 'Test Roblox Script',
      description: 'A test commission for Stripe integration',
      proposedAmount: 25.00,
      status: 'accepted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      referenceNumber: 'COM-TEST-001',
      tags: ['test'],
      paymentStatus: 'unpaid'
    };

    console.log('📦 Creating Stripe product...');
    const product = await createCommissionProduct(testCommission);
    console.log('✅ Product created:', product);

    console.log('💰 Creating Stripe price...');
    const price = await createCommissionPrice(product.id, testCommission.proposedAmount);
    console.log('✅ Price created:', price);

    console.log('🔗 Creating payment link...');
    const paymentLink = await createPaymentLink(price.id, testCommission.id);
    console.log('✅ Payment link created:', paymentLink);

    console.log('🎉 Stripe integration test completed successfully!');
    return {
      success: true,
      product,
      price,
      paymentLink
    };
  } catch (error) {
    console.error('❌ Stripe integration test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test function to verify environment variables are loaded
 */
export function testStripeConfig() {
  console.log('🔧 Testing Stripe Configuration...');
  
  const config = {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    secretKey: import.meta.env.STRIPE_SECRET_KEY,
    restrictedKey: import.meta.env.STRIPE_RESTRICTED_KEY,
  };

  console.log('📋 Configuration loaded:', {
    publishableKey: config.publishableKey ? '✅ Set' : '❌ Missing',
    secretKey: config.secretKey ? '✅ Set' : '❌ Missing',
    restrictedKey: config.restrictedKey ? '✅ Set' : '❌ Missing',
  });

  const allKeysPresent = config.publishableKey && config.secretKey && config.restrictedKey;
  
  if (allKeysPresent) {
    console.log('🎉 All Stripe keys are configured!');
  } else {
    console.warn('⚠️ Some Stripe keys are missing. Check your .env file.');
  }

  return {
    success: allKeysPresent,
    config
  };
}

// Export test functions for use in development
export default {
  testStripeIntegration,
  testStripeConfig
};
