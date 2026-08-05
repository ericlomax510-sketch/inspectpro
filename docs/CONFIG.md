# Runtime configuration for InspectPro

This project no longer hardcodes payment keys or booking endpoints in source. Instead, configure runtime values using one of these approaches:

1) Add a small <script> tag to your index.html before loading app.js (easy for static hosting):

<script>
  window.INSPECTPRO_CONFIG = {
    STRIPE_PK: 'pk_live_or_test_here',
    BOOKING_ENDPOINT: 'https://your-backend.example.com/charge-booking-fee',
    BOOKING_PRICE_ID: 'price_xxx',
    BOOKING_FEE_LABEL: '$3.00 booking fee'
  };
</script>
<script src="/app.js"></script>

2) Inject during your CI build (recommended for production):
- Use your CI to write a tiny JSON or JS file that sets window.INSPECTPRO_CONFIG from environment variables, then include that file in the built www/ directory. Example (GitHub Actions):

- name: Create runtime config
  run: |
    cat > www/runtime-config.js <<EOF
    window.INSPECTPRO_CONFIG = {
      STRIPE_PK: "${{ secrets.INSPECTPRO_STRIPE_PK }}",
      BOOKING_ENDPOINT: "${{ secrets.INSPECTPRO_BOOKING_ENDPOINT }}",
      BOOKING_PRICE_ID: "${{ secrets.INSPECTPRO_BOOKING_PRICE_ID }}",
      BOOKING_FEE_LABEL: "${{ secrets.INSPECTPRO_BOOKING_FEE_LABEL }}"
    };
    EOF

Then include `<script src="/runtime-config.js"></script>` before your app bundle in index.html.

Security notes:
- Never put secret (server-side) Stripe keys in client code or commit them to the repo.
- The booking endpoint should be a server-side function that uses your Stripe secret key to create charges.

