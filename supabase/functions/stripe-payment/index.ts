import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, data } = await req.json()
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    switch (action) {
      case 'create-product':
        return await createProduct(stripe, data)
      case 'create-price':
        return await createPrice(stripe, data)
      case 'create-payment-link':
        return await createPaymentLink(stripe, data)
      case 'create-checkout-session':
        return await createCheckoutSession(stripe, data)
      case 'verify-session':
        return await verifySession(stripe, data)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function createProduct(stripe: Stripe, data: { name: string; description: string; commission_id?: string; reference_number?: string }) {
  try {
    // First, check if a product with this commission_id already exists
    if (data.commission_id) {
      const existingProducts = await stripe.products.list({
        limit: 100,
        active: true
      })

      // Look for existing product with matching commission_id in metadata
      const existingProduct = existingProducts.data.find(product => 
        product.metadata.commission_id === data.commission_id
      )

      if (existingProduct) {
        console.log(`Found existing product for commission ${data.commission_id}: ${existingProduct.id}`)
        return new Response(
          JSON.stringify({
            id: existingProduct.id,
            name: existingProduct.name,
            description: existingProduct.description,
            active: existingProduct.active,
            existing: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Create new product only if none exists
    const product = await stripe.products.create({
      name: data.name,
      description: data.description,
      type: 'good',
      metadata: {
        commission_id: data.commission_id || '',
        reference_number: data.reference_number || ''
      }
    })

    console.log(`Created new product for commission ${data.commission_id}: ${product.id}`)
    return new Response(
      JSON.stringify({
        id: product.id,
        name: product.name,
        description: product.description,
        active: product.active,
        existing: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating product:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create product' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function createPrice(stripe: Stripe, data: { product: string; unit_amount: number; currency: string }) {
  try {
    // First, check if a price with the same product, amount, and currency already exists
    const existingPrices = await stripe.prices.list({
      product: data.product,
      limit: 100,
      active: true
    })

    // Look for existing price with matching amount and currency
    const existingPrice = existingPrices.data.find(price => 
      price.unit_amount === data.unit_amount && 
      price.currency === data.currency
    )

    if (existingPrice) {
      console.log(`Found existing price for product ${data.product}: ${existingPrice.id}`)
      return new Response(
        JSON.stringify({
          id: existingPrice.id,
          product: existingPrice.product,
          unit_amount: existingPrice.unit_amount,
          currency: existingPrice.currency,
          active: existingPrice.active,
          existing: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create new price only if none exists
    const price = await stripe.prices.create({
      product: data.product,
      unit_amount: data.unit_amount,
      currency: data.currency,
    })

    console.log(`Created new price for product ${data.product}: ${price.id}`)
    return new Response(
      JSON.stringify({
        id: price.id,
        product: price.product,
        unit_amount: price.unit_amount,
        currency: price.currency,
        active: price.active,
        existing: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating price:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create price' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function createPaymentLink(stripe: Stripe, data: { price: string; quantity: number; redirect_url?: string; commission_id?: string }) {
  try {
    // First, check if a payment link with this commission_id already exists
    if (data.commission_id) {
      const existingPaymentLinks = await stripe.paymentLinks.list({
        limit: 100,
        active: true
      })

      // Look for existing payment link with matching commission_id in metadata
      const existingPaymentLink = existingPaymentLinks.data.find(link => 
        link.metadata.commission_id === data.commission_id
      )

      if (existingPaymentLink) {
        console.log(`Found existing payment link for commission ${data.commission_id}: ${existingPaymentLink.id}`)
        return new Response(
          JSON.stringify({
            id: existingPaymentLink.id,
            url: existingPaymentLink.url,
            active: existingPaymentLink.active,
            existing: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Create new payment link only if none exists
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: data.price,
          quantity: data.quantity,
        },
      ],
      metadata: {
        commission_id: data.commission_id || ''
      }
    })

    console.log(`Created new payment link for commission ${data.commission_id}: ${paymentLink.id}`)
    return new Response(
      JSON.stringify({
        id: paymentLink.id,
        url: paymentLink.url,
        active: paymentLink.active,
        existing: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating payment link:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create payment link' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function createCheckoutSession(stripe: Stripe, data: {
  commission_id: string;
  subject: string;
  amount: number;
  reference_number: string;
  success_url: string;
  cancel_url: string;
  payment_type?: string;
  is_second_payment?: boolean;
}) {
  try {
    console.log('[DEBUG] createCheckoutSession received data:', {
      commission_id: data.commission_id,
      amount: data.amount,
      payment_type: data.payment_type,
      is_second_payment: data.is_second_payment,
      is_second_payment_typeof: typeof data.is_second_payment
    })
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Roblox Commission - ${data.subject}`,
              description: `This product represents payment of $${data.amount} for a custom Roblox commission titled "${data.subject}" (Reference: ${data.reference_number}). The payment covers the agreed-upon work and services related to the commission request.`,
            },
            unit_amount: Math.round(data.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: data.success_url,
      cancel_url: data.cancel_url,
      metadata: {
        commission_id: data.commission_id,
        reference_number: data.reference_number,
        payment_type: data.payment_type || 'full',
        is_second_payment: data.is_second_payment ? 'true' : 'false',
      },
    })
    
    console.log('[DEBUG] Created checkout session with metadata:', {
      sessionId: session.id,
      metadata: session.metadata
    })

    return new Response(
      JSON.stringify({
        id: session.id,
        url: session.url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function verifySession(stripe: Stripe, data: { session_id: string; commission_id: string }) {
  try {
    // Create Supabase client with service role for database updates
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(data.session_id)
    
    console.log('[VERIFY] Retrieved session:', session.id, 'Status:', session.payment_status, 'Metadata:', session.metadata)
    
    // Check if payment was successful
    if (session.payment_status === 'paid') {
      console.log('[VERIFY] Session is paid, updating commission in database')
      
      const paymentType = session.metadata?.payment_type || 'full'
      const isSecondPayment = session.metadata?.is_second_payment === 'true'
      const amountTotal = typeof session.amount_total === 'number' ? session.amount_total : 0
      const amountPaid = Math.max(0, amountTotal / 100)

      console.log('[VERIFY] Payment details:', {
        commission_id: data.commission_id,
        paymentType,
        isSecondPayment,
        amountPaid
      })

      // Get current commission data to check payment type and preserve existing data
      const { data: commission, error: fetchError } = await supabaseClient
        .from('commissions')
        .select('payment_type, payment_status, stripe_product_id, stripe_price_id, amount_paid')
        .eq('id', data.commission_id)
        .single()
      
      console.log('[VERIFY] Retrieved commission data:', {
        payment_type: commission?.payment_type,
        payment_status: commission?.payment_status,
        stripe_product_id: commission?.stripe_product_id,
        stripe_price_id: commission?.stripe_price_id,
        amount_paid: commission?.amount_paid
      })

      let updateData: any = {
        stripe_session_id: session.id
      }
      
      // Preserve existing product and price IDs if they exist
      if (commission?.stripe_product_id) {
        updateData.stripe_product_id = commission.stripe_product_id
        console.log('[VERIFY] Preserving existing product ID:', commission.stripe_product_id)
      }
      
      if (commission?.stripe_price_id) {
        updateData.stripe_price_id = commission.stripe_price_id
        console.log('[VERIFY] Preserving existing price ID:', commission.stripe_price_id)
      }

      if (fetchError) {
        console.error('[VERIFY] Error fetching commission:', fetchError)
        return new Response(
          JSON.stringify({ 
            payment_status: 'paid',
            session_id: session.id,
            error: `Could not fetch commission: ${fetchError.message}`,
            updated: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        const actualPaymentType = commission?.payment_type || paymentType
        console.log('[VERIFY] Commission payment details:', {
          actualPaymentType,
          currentPaymentStatus: commission?.payment_status
        })

        // FALLBACK: If metadata says false but commission is already payment_started for split type, it's actually the second payment
        let actualIsSecondPayment = isSecondPayment
        if (!actualIsSecondPayment && actualPaymentType === 'split' && commission?.payment_status === 'payment_started') {
          console.log('[VERIFY] FALLBACK: Treating as second payment because commission is already payment_started')
          actualIsSecondPayment = true
        }

        // Update database based on payment type
        if (actualIsSecondPayment) {
          console.log('[VERIFY] Processing second payment completion (detected by fallback if needed)')
          
          // For second payment, add to existing amount_paid
          const existingAmountPaid = commission?.amount_paid || 0
          const totalAmountPaid = existingAmountPaid + amountPaid
          
          console.log('[VERIFY] Second payment amount calculation:', {
            existingAmountPaid,
            newPaymentAmount: amountPaid,
            totalAmountPaid: totalAmountPaid
          })
          
          updateData.payment_status = 'completed'
          updateData.amount_paid = totalAmountPaid
          updateData.second_payment_completed_at = new Date().toISOString()
          console.log('[VERIFY] Setting payment_status to completed for second payment')
        } else if (actualPaymentType === 'full') {
          console.log('[VERIFY] Processing full payment completion')
          updateData.payment_status = 'completed'
          updateData.amount_paid = amountPaid
          updateData.paid_at = new Date().toISOString()
        } else if (actualPaymentType === 'split' || actualPaymentType === 'half') {
          console.log('[VERIFY] Processing first payment for split payment type')
          updateData.payment_status = 'payment_started'
          updateData.amount_paid = amountPaid
          updateData.paid_at = new Date().toISOString()
        }

        console.log('[VERIFY] Update data:', updateData)
        
        const { data: updatedData, error: updateError } = await supabaseClient
          .from('commissions')
          .update(updateData)
          .eq('id', data.commission_id)
          .select()

        if (updateError) {
          console.error('[VERIFY] Error updating commission:', updateError)
          return new Response(
            JSON.stringify({ 
              payment_status: 'paid',
              session_id: session.id,
              error: `Database update failed: ${updateError.message}`,
              updated: false
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          console.log('[VERIFY] Commission updated successfully:', updatedData)
          console.log('[VERIFY] Updated payment_status:', updatedData?.[0]?.payment_status)
          console.log('[VERIFY] Updated amount_paid:', updatedData?.[0]?.amount_paid)
        }
      }

      return new Response(
        JSON.stringify({ 
          payment_status: 'paid',
          session_id: session.id,
          amount_total: session.amount_total,
          currency: session.currency,
          updated: true,
          updateData: updateData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          payment_status: session.payment_status || 'unpaid',
          session_id: session.id,
          updated: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('[VERIFY] Error verifying session:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to verify session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
