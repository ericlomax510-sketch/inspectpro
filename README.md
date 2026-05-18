# InspectPro 🔍

Professional vehicle inspection app for technicians and customers.

---

## What It Does

**For Technicians**
- Receive job requests from customers in your inbox
- Accept or decline jobs — $3.00 booking fee charged automatically on accept
- Run a full 5-step vehicle inspection linked to that customer
- Upload work photos to document completed jobs
- Send professional car reports as PDF to customers
- Manage service pricing
- Private work video vault per customer record

**For Customers**
- Create an account and find your technician by name
- Select services you need, upload photos and walk-around video
- Describe tire condition and add comments
- Submit directly to your chosen technician
- See your Car Report once the tech completes the inspection
- View submission status (pending / accepted / declined)

---

## How To Use

### Technician Login
- Default admin account: **admin / admin123**
- Create new tech accounts from the Accounts tab
- Techs can also self-register from the login screen

### Customer Login
- Customers create their own account from the login screen
- Or admin can create customer accounts from the Accounts tab

---

## Tech Stack

- HTML / CSS / JavaScript (no frameworks)
- Stripe — payments and subscriptions
- Supabase — backend and edge functions
- jsPDF — PDF report generation
- GitHub + Netlify — hosting and deployment

---

## Stripe Products

| Product | Amount | Type |
|---------|--------|------|
| Booking Fee | $3.00 | One-time (charged on job accept) |
| App Help Fee | $5.00 | One-time (charged per report sent) |
| Customer Premium | $9.99/mo or $95.99/yr | Recurring subscription |

---

## Files

| File | Purpose |
|------|---------|
| index.html | App structure and HTML |
| style.css | All styles and layout |
| app.js | All JavaScript and logic |
| payment.html | Stripe subscription and payment pages |

---

## Environment Setup

To run InspectPro locally, you'll need:

1. **Supabase Account** - Set up backend services
2. **Stripe Account** - Configure payment processing
3. **API Keys** - Add Supabase URL and Stripe keys to your environment

### Running Locally

1. Clone the repository
2. Set up your environment variables (Supabase and Stripe credentials)
3. Open `index.html` in your browser or use a local server
4. Log in with the default admin credentials or create a new account

---

## Deployment

This app is deployed on **Netlify** and integrates with **GitHub** for continuous deployment.

- Push to `main` branch to trigger automatic deployment
- Netlify builds and deploys the static site
- All backend logic runs on Supabase edge functions

---

## Support

For issues, questions, or feature requests, please open a GitHub issue in this repository.

---

**Built with 💙 by InspectPro Team**
