import Stripe from 'https://esm.sh/stripe@16.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

Deno.serve(async (req) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!stripeKey || !webhookSecret) throw new Error('Missing Stripe environment variables');

    const signature = req.headers.get('stripe-signature') || '';
    const payload = await req.text();

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
    const event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentEventId = charge.metadata?.paymentEventId;
      if (paymentEventId) {
        const refunds = charge.refunds?.data || [];
        const matchedRefund = refunds.find(r => r.metadata?.paymentEventId === paymentEventId)
          || refunds.slice().sort((a, b) => b.created - a.created)[0];

        const { data: currentRow } = await supabase
          .from('payment_events')
          .select('metadata')
          .eq('payment_event_id', paymentEventId)
          .maybeSingle();

        const mergedMetadata = {
          ...(currentRow?.metadata || {}),
          webhookEvent: event.id
        };

        await supabase
          .from('payment_events')
          .update({
            event_type: 'refund_succeeded',
            stripe_refund_id: matchedRefund?.id || null,
            metadata: mergedMetadata
          })
          .eq('payment_event_id', paymentEventId);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentEventId = paymentIntent.metadata?.paymentEventId;
      if (paymentEventId) {
        const { data: currentRow } = await supabase
          .from('payment_events')
          .select('metadata')
          .eq('payment_event_id', paymentEventId)
          .maybeSingle();

        const mergedMetadata = {
          ...(currentRow?.metadata || {}),
          webhookEvent: event.id,
          lastPaymentError: paymentIntent.last_payment_error?.message || null
        };

        await supabase
          .from('payment_events')
          .update({
            event_type: 'charge_failed',
            stripe_payment_intent_id: paymentIntent.id,
            metadata: mergedMetadata
          })
          .eq('payment_event_id', paymentEventId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'webhook error' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
