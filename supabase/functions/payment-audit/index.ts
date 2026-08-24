import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const paymentEventId = body.paymentEventId;
    if (!paymentEventId || !body.eventType) {
      return new Response(JSON.stringify({ error: 'paymentEventId and eventType are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { error } = await supabase
      .from('payment_events')
      .upsert({
        payment_event_id: paymentEventId,
        profile_id: body.profileId || null,
        submission_index: Number.isInteger(body.submissionIndex) ? body.submissionIndex : null,
        event_type: body.eventType,
        amount_cents: body.amountCents || null,
        currency: body.currency || 'usd',
        stripe_payment_intent_id: body.stripePaymentIntentId || null,
        stripe_charge_id: body.stripeChargeId || null,
        stripe_refund_id: body.stripeRefundId || null,
        refund_type: body.refundType || null,
        reason: body.reason || null,
        metadata: body.metadata || {}
      }, { onConflict: 'payment_event_id' });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
