// runtime-config.js — runtime config placeholder for InspectPro
// NOTE: This file is safe to commit (no secrets). Overwrite in CI/build with real values.

window.INSPECTPRO_CONFIG = window.INSPECTPRO_CONFIG || {
  // STRIPE_PK should be a publishable key (pk_live_... or pk_test_...); do NOT put secret keys here.
  STRIPE_PK: '',
  // Server-side endpoint that charges a payment method (must be implemented on your server using Stripe secret key)
  BOOKING_ENDPOINT: '',
  BOOKING_PRICE_ID: '',
  BOOKING_FEE_LABEL: '$3.00 booking fee'
};
