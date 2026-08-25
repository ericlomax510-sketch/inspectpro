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
- Stripe — payments and subscriptions (optional)
- jsPDF — PDF report generation
- GitHub + Netlify/Vercel — hosting and deployment

---

## Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/ericlomax510-sketch/inspectpro.git
cd inspectpro
```

### 2. Local Development
Pick one option:

**Option A: Python** (built-in)
```bash
python -m http.server 8000
```

**Option B: Node.js**
```bash
npx http-server
```

**Option C: VS Code Live Server**
- Right-click `index.html` → "Open with Live Server"

Then visit: **http://localhost:8000**

---

## Deployment

### Option A: GitHub Pages (Free ⭐ Easiest)
1. Go to Settings → Pages
2. Select "Deploy from branch"
3. Choose branch: `main`
4. Save

Your app will be live at: `https://ericlomax510-sketch.github.io/inspectpro`

### Option B: Netlify (Recommended)
1. Sign in to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repo
4. Deploy settings:
   - Base directory: `/` (root)
   - Build command: (leave blank)
   - Publish directory: `/` (root)
5. Click **Deploy**

### Option C: Vercel
1. Sign in to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Deploy

---

## Files

| File | Purpose |
|------|---------|
| index.html | App structure and HTML |
| style.css | All styles and layout |
| app.js | All JavaScript and logic |

---

## Features Included

✅ **Technician App**
- 5-step vehicle inspection workflow
- Photo & video capture
- PDF report generation
- Customer management
- Job inbox with status tracking
- Service pricing management
- Private work video vault

✅ **Customer Portal**
- Submit service requests
- Upload photos & walk-around video
- Receive inspection reports
- Track job status
- Rate mechanics

✅ **Admin Panel**
- Create technician accounts
- Create customer profiles
- Manage service prices
- View all records

---

## Environment Setup

No backend required! All data is stored locally in **browser localStorage**.

To enable **optional** Stripe payments:
- Get API keys from [stripe.com](https://stripe.com)
- Update `STRIPE_PK` in `app.js` line 1140

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## Troubleshooting

**Photos not saving**
→ Check browser privacy settings; localStorage must be enabled

**Video recording not working**
→ HTTPS required for camera access (Netlify/Vercel provide this automatically)

**Can't self-register**
→ Use default credentials first: `admin / admin123`

---

## Support

For issues, questions, or feature requests, please open a GitHub issue in this repository.

---

**Built with 💙 by InspectPro Team**
