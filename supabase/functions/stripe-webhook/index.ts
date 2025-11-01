import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Load env
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 })
    }

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Invalid signature', { status: 400 })
    }

    console.log('Processing webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabaseClient)
        break
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session, supabaseClient)
        break
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabaseClient)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  try {
    const commissionId = session.metadata?.commission_id
    if (!commissionId) {
      console.error('[WEBHOOK] No commission_id in session metadata')
      return
    }

    const paymentType = session.metadata?.payment_type || 'full'
    const isSecondPayment = session.metadata?.is_second_payment === 'true'
    const amountTotal = typeof session.amount_total === 'number' ? session.amount_total : 0
    const amountPaid = Math.max(0, amountTotal / 100)

    console.log('[WEBHOOK] Payment completed for commission:', {
      commissionId,
      paymentType,
      isSecondPayment,
      amountPaid,
      sessionId: session.id,
      metadata: session.metadata
    })
    
    console.log('[WEBHOOK] isSecondPayment check:', {
      rawMetadataValue: session.metadata?.is_second_payment,
      comparison: session.metadata?.is_second_payment === 'true',
      isSecondPayment: isSecondPayment
    })
    
    // Store the original value for logging
    const originalIsSecondPayment = isSecondPayment

    // Get current commission data to check payment type and preserve existing IDs
    const { data: commission, error: fetchError } = await supabase
      .from('commissions')
      .select('payment_type, payment_status, stripe_product_id, stripe_price_id, amount_paid')
      .eq('id', commissionId)
      .single()

    if (fetchError) {
      console.error('[WEBHOOK] Error fetching commission:', fetchError)
      throw fetchError
    }

    const actualPaymentType = commission?.payment_type || paymentType
    console.log('[WEBHOOK] Commission payment details:', {
      actualPaymentType,
      currentPaymentStatus: commission?.payment_status,
      stripe_product_id: commission?.stripe_product_id
    })

    // FALLBACK: If metadata says false but commission is already payment_started for split type, it's actually the second payment
    let actualIsSecondPayment = isSecondPayment
    if (!actualIsSecondPayment && actualPaymentType === 'split' && commission?.payment_status === 'payment_started') {
      console.log('[WEBHOOK] FALLBACK: Treating as second payment because commission is already payment_started')
      actualIsSecondPayment = true
    }

    // Preserve existing product and price IDs
    const updateData: any = { stripe_session_id: session.id }
    
    if (commission?.stripe_product_id) {
      updateData.stripe_product_id = commission.stripe_product_id
    }
    if (commission?.stripe_price_id) {
      updateData.stripe_price_id = commission.stripe_price_id
    }

    // Determine payment status based on payment type and whether this is the second payment
    if (actualIsSecondPayment) {
      // Second payment completed - set status to 'completed'
      console.log('[WEBHOOK] Processing second payment completion (original metadata:', originalIsSecondPayment, ', corrected:', actualIsSecondPayment, ')')
      
      // For second payment, add to existing amount_paid
      const existingAmountPaid = commission?.amount_paid || 0
      const totalAmountPaid = existingAmountPaid + amountPaid
      
      console.log('[WEBHOOK] Second payment amount calculation:', {
        existingAmountPaid,
        newPaymentAmount: amountPaid,
        totalAmountPaid: totalAmountPaid
      })
      
      const { error } = await supabase
        .from('commissions')
        .update({
          payment_status: 'completed',
          amount_paid: totalAmountPaid,
          second_payment_completed_at: new Date().toISOString(),
          ...updateData
        })
        .eq('id', commissionId)

      if (error) {
        console.error('[WEBHOOK] Error updating commission for second payment:', error)
        throw error
      }
      console.log('[WEBHOOK] Commission second payment completed and status updated to completed')
    } else if (actualPaymentType === 'full') {
      // Full payment completed - set status to 'completed'
      console.log('[WEBHOOK] Processing full payment completion')
      const { error } = await supabase
        .from('commissions')
        .update({
          payment_status: 'completed',
          amount_paid: amountPaid,
          paid_at: new Date().toISOString(),
          ...updateData
        })
        .eq('id', commissionId)

      if (error) {
        console.error('[WEBHOOK] Error updating commission:', error)
        throw error
      }
      console.log('[WEBHOOK] Commission full payment completed and status updated to completed')
    } else if (actualPaymentType === 'split' || actualPaymentType === 'half') {
      // First payment of split type - always set status to 'payment_started'
      console.log('[WEBHOOK] Processing first payment for split payment type')
      const { error } = await supabase
        .from('commissions')
        .update({
          payment_status: 'payment_started',
          amount_paid: amountPaid,
          paid_at: new Date().toISOString(),
          ...updateData
        })
        .eq('id', commissionId)

      if (error) {
        console.error('[WEBHOOK] Error updating commission for split first payment:', error)
        throw error
      }
      console.log('[WEBHOOK] Commission first payment completed and status updated to payment_started')
      console.log('[WEBHOOK] Remaining 50% will be payable when commission is marked as completed')
    }
  } catch (error) {
    console.error('[WEBHOOK] Error handling checkout session completed:', error)
    throw error
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session, supabase: any) {
  try {
    const commissionId = session.metadata?.commission_id
    if (!commissionId) {
      console.error('No commission_id in session metadata')
      return
    }

    console.log('Payment session expired for commission:', commissionId)

    // Get the commission to find the product ID
    const { data: commission, error: fetchError } = await supabase
      .from('commissions')
      .select('stripe_product_id')
      .eq('id', commissionId)
      .single()

    if (fetchError) {
      console.error('Error fetching commission:', fetchError)
      return
    }

    if (commission?.stripe_product_id) {
      // Delete the Stripe product since payment was abandoned
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
        apiVersion: '2023-10-16',
      })

      try {
        await stripe.products.del(commission.stripe_product_id)
        console.log('Deleted abandoned product:', commission.stripe_product_id)
      } catch (stripeError) {
        console.error('Error deleting Stripe product:', stripeError)
      }
    }

    // Update commission to mark as abandoned
    const { error } = await supabase
      .from('commissions')
      .update({
        payment_status: 'unpaid',
        payment_abandoned_at: new Date().toISOString()
      })
      .eq('id', commissionId)

    if (error) {
      console.error('Error updating commission:', error)
      throw error
    }

    console.log('Commission marked as abandoned')
  } catch (error) {
    console.error('Error handling checkout session expired:', error)
    throw error
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  try {
    console.log('Payment intent succeeded:', paymentIntent.id)
    
    // Additional payment confirmation logic can be added here
    // This is a backup to ensure payment status is updated
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error)
    throw error
  }
}
