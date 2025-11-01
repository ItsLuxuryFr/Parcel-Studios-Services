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
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Starting product archival process...')

    // Query commissions that are paid and older than 3 days
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: commissions, error: queryError } = await supabaseClient
      .from('commissions')
      .select('id, stripe_product_id, reference_number, paid_at')
      .eq('payment_status', 'paid')
      .not('stripe_product_id', 'is', null)
      .not('product_archived_at', 'is', null) // Only get products that haven't been archived yet
      .lt('paid_at', threeDaysAgo.toISOString())

    if (queryError) {
      console.error('Error querying commissions:', queryError)
      throw queryError
    }

    if (!commissions || commissions.length === 0) {
      console.log('No products to archive')
      return new Response(
        JSON.stringify({ message: 'No products to archive', archived: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${commissions.length} products to archive`)

    let archivedCount = 0
    const errors: string[] = []

    // Archive each product
    for (const commission of commissions) {
      try {
        if (!commission.stripe_product_id) {
          console.log(`Skipping commission ${commission.id} - no product ID`)
          continue
        }

        // Archive the Stripe product
        await stripe.products.update(commission.stripe_product_id, {
          active: false
        })

        // Update commission to mark product as archived
        const { error: updateError } = await supabaseClient
          .from('commissions')
          .update({
            product_archived_at: new Date().toISOString()
          })
          .eq('id', commission.id)

        if (updateError) {
          console.error(`Error updating commission ${commission.id}:`, updateError)
          errors.push(`Failed to update commission ${commission.id}: ${updateError.message}`)
        } else {
          console.log(`Archived product for commission ${commission.id} (${commission.reference_number})`)
          archivedCount++
        }
      } catch (stripeError) {
        console.error(`Error archiving product for commission ${commission.id}:`, stripeError)
        errors.push(`Failed to archive product for commission ${commission.id}: ${stripeError.message}`)
      }
    }

    const result = {
      message: `Archived ${archivedCount} products`,
      archived: archivedCount,
      total: commissions.length,
      errors: errors.length > 0 ? errors : undefined
    }

    console.log('Product archival completed:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Archive products error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
