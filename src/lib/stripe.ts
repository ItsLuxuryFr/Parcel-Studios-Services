import { Commission } from '../types';
import { supabase } from './supabase';

/**
 * Stripe service module for handling commission payments
 * Uses Stripe API directly for product and payment link creation
 * 
 * Note: This file requires supabase import for database lookups in initiateSecondPayment
 */

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
}

export interface StripePrice {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
}

export interface StripePaymentLink {
  id: string;
  url: string;
}

/**
 * Creates a Stripe product for a commission
 */
export async function createCommissionProduct(commission: Commission): Promise<StripeProduct> {
  const productName = `Roblox Commission - ${commission.subject}`;
  const productDescription = `This product represents payment of $${commission.proposedAmount} for a custom Roblox commission titled "${commission.subject}" (Reference: ${commission.referenceNumber}). The payment covers the agreed-upon work and services related to the commission request.`;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        action: 'create-product',
        data: {
          name: productName,
          description: productDescription,
          commission_id: commission.id,
          reference_number: commission.referenceNumber
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Stripe Edge Function error:', errorData);
      
      // Check if it's a 500 error (likely missing environment variable)
      if (response.status === 500) {
        throw new Error('Stripe service is not properly configured. Please contact support.');
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Log whether we found an existing product or created a new one
    if (result.existing) {
      console.log(`Using existing Stripe product: ${result.id}`);
    } else {
      console.log(`Created new Stripe product: ${result.id}`);
    }
    
    return {
      id: result.id,
      name: result.name,
      description: result.description
    };
  } catch (error) {
    console.error('Error creating Stripe product:', error);
    throw new Error('Failed to create Stripe product');
  }
}

/**
 * Creates a Stripe price for a commission product
 */
export async function createCommissionPrice(productId: string, amount: number): Promise<StripePrice> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        action: 'create-price',
        data: {
          product: productId,
          unit_amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd'
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Log whether we found an existing price or created a new one
    if (result.existing) {
      console.log(`Using existing Stripe price: ${result.id}`);
    } else {
      console.log(`Created new Stripe price: ${result.id}`);
    }
    
    return {
      id: result.id,
      product: result.product,
      unit_amount: result.unit_amount,
      currency: 'usd'
    };
  } catch (error) {
    console.error('Error creating Stripe price:', error);
    throw new Error('Failed to create Stripe price');
  }
}

/**
 * Creates a Stripe checkout session for a commission
 * @param commission The commission to create a session for
 * @param isSecondPayment Whether this is the second payment for split payment type
 */
export async function createCheckoutSession(commission: Commission, isSecondPayment: boolean = false): Promise<StripePaymentLink> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        action: 'create-checkout-session',
        data: {
          commission_id: commission.id,
          subject: commission.subject,
          amount: isSecondPayment ? commission.proposedAmount * 0.5 : 
                   commission.paymentType === 'split' ? commission.proposedAmount * 0.5 : commission.proposedAmount,
          reference_number: commission.referenceNumber,
          success_url: `${window.location.origin}/payment-confirmation?commission=${commission.id}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/payment?commission=${commission.id}`,
          payment_type: commission.paymentType || 'full',
          is_second_payment: isSecondPayment
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log(`Created Stripe checkout session: ${result.id}`);
    
    return {
      id: result.id,
      url: result.url
    };
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw new Error('Failed to create Stripe checkout session');
  }
}

/**
 * Creates a Stripe payment link for a commission
 */
export async function createPaymentLink(priceId: string, commissionId: string): Promise<StripePaymentLink> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        action: 'create-payment-link',
        data: {
          price: priceId,
          quantity: 1,
          redirect_url: `${window.location.origin}/payment-confirmation?commission=${commissionId}`,
          commission_id: commissionId
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Log whether we found an existing payment link or created a new one
    if (result.existing) {
      console.log(`Using existing Stripe payment link: ${result.id}`);
    } else {
      console.log(`Created new Stripe payment link: ${result.id}`);
    }
    
    return {
      id: result.id,
      url: result.url
    };
  } catch (error) {
    console.error('Error creating Stripe payment link:', error);
    throw new Error('Failed to create Stripe payment link');
  }
}

/**
 * Archives a Stripe product (for 3-day archival)
 */
export async function archiveProduct(productId: string): Promise<void> {
  try {
    // Use Stripe MCP tool to archive product
    // Note: This would require a product update function in the MCP tools
    // For now, we'll log the archival request
    
    // In a real implementation, you would:
    // 1. Use Stripe API to update product to inactive
    // 2. Or use a webhook to handle product lifecycle
    // 3. Or implement a scheduled job to archive products
    
    console.log(`Product ${productId} scheduled for archival`);
  } catch (error) {
    console.error('Error archiving Stripe product:', error);
    throw new Error('Failed to archive Stripe product');
  }
}

/**
 * Initiates payment for a commission by creating Stripe checkout session
 */
export async function initiateCommissionPayment(commission: Commission): Promise<{
  productId: string;
  priceId: string;
  paymentLinkUrl: string;
}> {
  try {
    console.log('[DEBUG] initiateCommissionPayment called for commission:', commission.id);
    console.log('[DEBUG] Commission details:', {
      paymentType: commission.paymentType,
      proposedAmount: commission.proposedAmount
    });

    // Create Stripe product
    console.log('[DEBUG] Creating Stripe product...');
    const product = await createCommissionProduct(commission);
    console.log('[DEBUG] Stripe product created:', product.id);
    
    // Calculate amount based on payment type
    const amount = commission.paymentType === 'split' 
      ? commission.proposedAmount * 0.5 
      : commission.proposedAmount;
    
    console.log('[DEBUG] Calculated payment amount:', { 
      isSplit: commission.paymentType === 'split',
      proposedAmount: commission.proposedAmount,
      actualAmount: amount
    });
    
    // Create Stripe price for the product
    console.log('[DEBUG] Creating Stripe price...');
    const price = await createCommissionPrice(product.id, amount);
    console.log('[DEBUG] Stripe price created:', price.id);
    
    // Create checkout session instead of payment link for better webhook integration
    console.log('[DEBUG] Creating checkout session...');
    const checkoutSession = await createCheckoutSession(commission, false);
    console.log('[DEBUG] Checkout session created:', checkoutSession.id);
    
    return {
      productId: product.id,
      priceId: price.id,
      paymentLinkUrl: checkoutSession.url
    };
  } catch (error) {
    console.error('[DEBUG] Error initiating commission payment:', error);
    throw new Error('Failed to initiate payment for commission');
  }
}

/**
 * Initiates the second payment (remaining 50%) for split payment type commissions
 */
export async function initiateSecondPayment(commission: Commission): Promise<{
  priceId: string;
  paymentLinkUrl: string;
}> {
  try {
    console.log('[DEBUG] initiateSecondPayment called for commission:', commission.id);
    console.log('[DEBUG] Commission details:', {
      paymentType: commission.paymentType,
      paymentStatus: commission.paymentStatus,
      status: commission.status,
      stripeProductId: commission.stripeProductId,
      proposedAmount: commission.proposedAmount
    });

    if (commission.paymentType !== 'split') {
      console.error('[DEBUG] Second payment error: not a split payment type');
      throw new Error('Second payment is only available for split payment type commissions');
    }
    
    if (!commission.paymentStatus || commission.paymentStatus !== 'payment_started') {
      console.error('[DEBUG] Second payment error: first payment not completed. Current status:', commission.paymentStatus);
      throw new Error('First payment must be completed before initiating second payment');
    }

    let productId = commission.stripeProductId;
    
    if (!productId) {
      console.error('[DEBUG] Second payment error: no product ID found. Commission:', commission);
      
      // Fetch ALL columns from database including stripe_product_id
      console.log('[DEBUG] Attempting to fetch commission from database to get product ID');
      
      const { data: dbCommission, error: fetchError } = await supabase
        .from('commissions')
        .select('stripe_product_id, stripe_price_id, stripe_payment_link_url')
        .eq('id', commission.id)
        .single();
      
      if (fetchError || !dbCommission) {
        console.error('[DEBUG] Could not fetch commission from database:', fetchError);
        throw new Error('Product ID not found for this commission. Please contact support.');
      }
      
      console.log('[DEBUG] Database commission data:', dbCommission);
      
      if (!dbCommission.stripe_product_id) {
        console.error('[DEBUG] Commission in database also has no product ID');
        console.log('[DEBUG] Creating new product for second payment');
        
        // Create a new product since the first payment didn't save the product ID
        // This is a workaround for commissions where the product ID wasn't saved
        const product = await createCommissionProduct(commission);
        productId = product.id;
        commission.stripeProductId = productId;
        
        console.log('[DEBUG] Created new product for second payment:', productId);
        
        // Save the product ID to database for future reference
        await supabase
          .from('commissions')
          .update({ stripe_product_id: productId })
          .eq('id', commission.id);
        
        console.log('[DEBUG] Saved product ID to database');
      } else {
        console.log('[DEBUG] Found product ID in database:', dbCommission.stripe_product_id);
        productId = dbCommission.stripe_product_id;
        commission.stripeProductId = productId;
      }
    }

    // Create Stripe price for the remaining 50%
    const amount = commission.proposedAmount * 0.5;
    console.log('[DEBUG] Creating second payment price:', { amount, productId });
    
    // At this point productId is guaranteed to be defined due to checks above
    if (!productId) {
      throw new Error('Product ID is required for second payment');
    }
    
    const price = await createCommissionPrice(productId, amount);
    console.log('[DEBUG] Second payment price created:', price.id);
    
    // Create checkout session for the second payment
    console.log('[DEBUG] Creating checkout session for second payment');
    console.log('[DEBUG] Calling createCheckoutSession with isSecondPayment=true');
    const checkoutSession = await createCheckoutSession(commission, true);
    console.log('[DEBUG] Second payment checkout session created:', checkoutSession.id);
    console.log('[DEBUG] Second payment checkout session URL:', checkoutSession.url);
    
    return {
      priceId: price.id,
      paymentLinkUrl: checkoutSession.url
    };
  } catch (error: any) {
    console.error('[DEBUG] Error initiating second payment:', error);
    console.error('[DEBUG] Error details:', {
      message: error.message,
      stack: error.stack,
      commissionId: commission.id
    });
    throw error; // Re-throw with original error message
  }
}

/**
 * Schedules product archival for 3 days after payment
 * This is a placeholder - in a real implementation, this would be handled
 * by a scheduled job or webhook
 */
export function scheduleProductArchival(productId: string, paidAt: string): void {
  const paidDate = new Date(paidAt);
  const archiveDate = new Date(paidDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days later
  
  console.log(`Product ${productId} scheduled for archival on ${archiveDate.toISOString()}`);
  
  // In a real implementation, this would:
  // 1. Store the archival task in a database
  // 2. Use a cron job or scheduled function to check and archive products
  // 3. Or use Stripe webhooks to handle the archival automatically
}
