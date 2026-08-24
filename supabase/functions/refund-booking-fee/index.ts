import Stripe from 'https://esm.sh/stripe@16.10.0?target=deno';
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
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');

    const chargeId = body.chargeId;
    const paymentIntentId = body.paymentIntentId;
    const idempotencyKey = body.idempotencyKey;
    if ((!chargeId && !paymentIntentId) || !idempotencyKey || !body.paymentEventId) {
      return new Response(JSON.stringify({ error: 'chargeId or paymentIntentId, paymentEventId, and idempotencyKey are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { data: existingRefund } = await supabase
      .from('refund_events')
      .select('id, status, stripe_refund_id, created_at')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existingRefund?.stripe_refund_id) {
      return new Response(JSON.stringify({
        status: existingRefund.status,
        refundId: existingRefund.stripe_refund_id,
        refundedAt: existingRefund.created_at
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const refundParams: Stripe.RefundCreateParams = {
      amount: body.amountCents || undefined,
      reason: 'requested_by_customer',
      metadata: {
        paymentEventId: body.paymentEventId,
        refundType: body.refundType || 'manual',
        reason: body.reason || 'not-specified',
        initiatedBy: body.initiatedBy || 'system'
      }
    };

    if (chargeId) refundParams.charge = chargeId;
    if (!chargeId && paymentIntentId) refundParams.payment_intent = paymentIntentId;

    const refund = await stripe.refunds.create(refundParams, {
      idempotencyKey
    });

    const status = refund.status === 'succeeded' ? 'succeeded' : 'pending';

    const { error: refundError } = await supabase
      .from('refund_events')
      .upsert({
        payment_event_id: body.paymentEventId,
        stripe_charge_id: chargeId || null,
        stripe_refund_id: refund.id,
        amount_cents: body.amountCents || 300,
        currency: body.currency || 'usd',
        reason: body.reason || null,
        refund_type: body.refundType || 'manual',
        status,
        initiated_by: body.initiatedBy || 'system',
        idempotency_key: idempotencyKey,
        metadata: body.metadata || {}
      }, { onConflict: 'idempotency_key' });

    if (refundError) throw refundError;

    return new Response(JSON.stringify({
      status,
      refundId: refund.id,
      refundedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
