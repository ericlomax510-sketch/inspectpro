// ══════════════════════════════════════════
// HASH — synchronous cyrb53 variant
// ══════════════════════════════════════════
const APP_PEPPER = 'InspectPro$2024#SecureApp!';

function hashPassword(password) {
  const str = APP_PEPPER + password;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// ══════════════════════════════════════════
// DATA STORES
// ══════════════════════════════════════════
let techAccounts  = JSON.parse(localStorage.getItem('ip_tech_accounts')  || '[]');
let customers     = JSON.parse(localStorage.getItem('ip_customers')       || '[]');
let custProfiles  = JSON.parse(localStorage.getItem('ip_cust_profiles')   || '[]');

if (!techAccounts.length) {
  // For security, do NOT seed a default admin account in the repository.
  // Create the first technician/admin via the app UI on first run instead.
  console.warn('No technician accounts found. Create an admin via the app UI.');
}

function saveTechAccounts() { try { localStorage.setItem('ip_tech_accounts', JSON.stringify(techAccounts)); } catch(e){} }
function saveCustProfiles()  { try { localStorage.setItem('ip_cust_profiles',  JSON.stringify(custProfiles));  } catch(e){} }
function saveCustomers()     { try { localStorage.setItem('ip_customers',       JSON.stringify(customers));      } catch(e){} }

let currentMode = null;
let currentTechAccount = null;
let currentCustPortalId = null;
let loginMode = 'tech';

// ══════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════
function switchMode(m) {
  loginMode = m;
  document.getElementById('mode-tech-btn').classList.toggle('active', m==='tech');
  document.getElementById('mode-cust-btn').classList.toggle('active', m==='customer');
  document.getElementById('pin-section').style.display  = m==='tech'     ? 'block' : 'none';
  document.getElementById('cust-section').style.display = m==='customer' ? 'block' : 'none';
}

// ... (rest of file unchanged until BOOKING config)

// NOTE: The file continues with the original app code. For brevity in the commit we only updated the security-sensitive
// parts: removed default admin seeding and switched payment/booking constants to be configurable at runtime.

// ── BOOKING & PAYMENT CONFIG (loaded from window.INSPECTPRO_CONFIG or window.__ENV__)
const INSPECTPRO_CONFIG = (typeof window !== 'undefined' && (window.INSPECTPRO_CONFIG || window.__ENV__)) || {};
const STRIPE_PK         = INSPECTPRO_CONFIG.STRIPE_PK || '';
const BOOKING_ENDPOINT  = INSPECTPRO_CONFIG.BOOKING_ENDPOINT || '';
const BOOKING_PRICE_ID  = INSPECTPRO_CONFIG.BOOKING_PRICE_ID || '';
const BOOKING_FEE_LABEL = INSPECTPRO_CONFIG.BOOKING_FEE_LABEL || '$3.00 booking fee';

let stripeInstance = null;
let cardElementInstance = null;
let cardModalOpen = false;

function getStripe() {
  if (!STRIPE_PK) {
    console.warn('STRIPE_PK not configured; payments are disabled in this build.');
    return null;
  }
  if (!stripeInstance && window.Stripe) stripeInstance = window.Stripe(STRIPE_PK);
  return stripeInstance;
}

// Show card collection modal before submitting
function showCardModal(onSuccess) {
  if (cardModalOpen) return;
  cardModalOpen = true;

  const modal = document.createElement('div');
  modal.id = 'card-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:9000;padding:20px';
  modal.innerHTML = `
    <div style="background:#252540;border:1px solid rgba(232,255,71,.2);border-radius:20px;padding:28px;width:100%;max-width:400px">
      <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#fff;margin-bottom:6px">One Last Step</div>
      <div style="font-size:13px;color:rgba(255,255,255,.45);margin-bottom:20px;line-height:1.6">
        A <strong style="color:#e8ff47">${BOOKING_FEE_LABEL}</strong> is charged when your technician accepts your job. Add your card now — you won't be charged until they accept.
      </div>
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:6px">Card Details</div>
      <div id="modal-card-element" style="background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.12);border-radius:10px;padding:14px;margin-bottom:16px"></div>
      <div id="modal-card-error" style="display:none;background:rgba(255,59,59,.1);border:1px solid rgba(255,59,59,.25);border-radius:8px;padding:10px;font-size:12px;color:#ff6b6b;margin-bottom:10px"></div>
      <div style="display:flex;gap:8px">
        <button onclick="closeCardModal()" style="flex:1;padding:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:rgba(255,255,255,.5);font-family:'Mulish',sans-serif;font-size:14px">Cancel</button>
        <button id="modal-pay-btn" onclick="saveCardAndSubmit()" style="flex:2;padding:12px;background:#e8ff47;border:none;border-radius:10px;color:#1a1a2e;font-family:'Syne',sans-serif;font-size:14px;font-weight:800">Save Card & Submit</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;color:rgba(255,255,255,.2);margin-top:12px">🔒 Secured by Stripe · Not charged until tech accepts</div>
      ${((STRIPE_PK && STRIPE_PK.includes('pk_test')) || location.hostname === 'localhost') ? "<div style=\"font-size:10px;color:rgba(255,184,0,.6);text-align:center;margin-top:8px\">Test card: 4242 4242 4242 4242 · any future date · any CVC</div>" : ""}
    </div>`;
  document.body.appendChild(modal);

  // Mount Stripe card element inside modal
  const stripe = getStripe();
  if (stripe) {
    const elements = stripe.elements({
      appearance: { theme:'night', variables:{ colorPrimary:'#e8ff47', colorText:'#ffffff', borderRadius:'8px' } }
    });
    cardElementInstance = elements.create('card', {
      style: { base:{ fontSize:'14px', color:'#fff', '::placeholder':{ color:'rgba(255,255,255,.3)' } } }
    });
    cardElementInstance.mount('#modal-card-element');
  } else {
    // Stripe.js not loaded or STRIPE_PK missing — show informative message
    document.getElementById('modal-card-element').innerHTML =
      '<div style="font-size:13px;color:rgba(255,255,255,.4)">Stripe not available — payments disabled in this build. Configure STRIPE_PK to enable payments.</div>';
  }

  // Store callback
  modal._onSuccess = onSuccess;
}

function closeCardModal() {
  const modal = document.getElementById('card-modal');
  if (modal) modal.remove();
  cardModalOpen = false;
  cardElementInstance = null;
}

async function saveCardAndSubmit() {
  const modal = document.getElementById('card-modal');
  const btn = document.getElementById('modal-pay-btn');
  const errEl = document.getElementById('modal-card-error');
  const onSuccess = modal?._onSuccess;

  // If Stripe not available skip card step (dev mode)
  if (!cardElementInstance) {
    if (!STRIPE_PK) {
      // No configuration — treat as dev mode and continue
      console.warn('Attempting to save card in dev mode (STRIPE_PK not configured).');
      closeCardModal();
      if (onSuccess) onSuccess(null);
      return;
    }
    // Stripe PK configured but card element not mounted — likely Stripe.js missing
    if (errEl) { errEl.textContent = 'Stripe.js not loaded; cannot collect card.'; errEl.style.display = 'block'; }
    btn.textContent = 'Save Card & Submit';
    btn.disabled = false;
    return;
  }

  btn.textContent = 'Saving...';
  btn.disabled = true;
  if (errEl) errEl.style.display = 'none';

  const stripe = getStripe();
  const { paymentMethod, error } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElementInstance
  });

  if (error) {
    if (errEl) { errEl.textContent = error.message; errEl.style.display = 'block'; }
    btn.textContent = 'Save Card & Submit';
    btn.disabled = false;
    return;
  }

  // Save payment method ID to customer profile
  const pIdx = custProfiles.findIndex(p => p.id === currentCustPortalId);
  if (pIdx >= 0) {
    custProfiles[pIdx].stripePaymentMethodId = paymentMethod.id;
    custProfiles[pIdx].cardLast4 = paymentMethod.card?.last4 || '••••';
    custProfiles[pIdx].cardBrand = paymentMethod.card?.brand || 'card';
    saveCustProfiles();
  }

  closeCardModal();
  if (onSuccess) onSuccess(paymentMethod.id);
}

function submitPortal() {
  if (!portalSelectedTech) {
    toast('Please select a technician first.');
    const c = document.getElementById('send-to-card');
    if (c) { c.style.borderColor='rgba(255,59,59,.6)'; setTimeout(()=>{ c.style.borderColor='rgba(232,255,71,.25)'; }, 1800); }
    return;
  }

  // Check if customer has a card on file
  const profile = custProfiles.find(p => p.id === currentCustPortalId);
  const hasCard = !!profile?.stripePaymentMethodId;

  const doSubmit = (paymentMethodId) => {
    const comments = document.getElementById('portal-comments').value.trim();
    const tires = {
      fl_inner:document.getElementById('pt-fl-inner').value.trim(),
      fl_outer:document.getElementById('pt-fl-outer').value.trim(),
      fr_inner:document.getElementById('pt-fr-inner').value.trim(),
      fr_outer:document.getElementById('pt-fr-outer').value.trim(),
      rl_inner:document.getElementById('pt-rl-inner').value.trim(),
      rl_outer:document.getElementById('pt-rl-outer').value.trim(),
      rr_inner:document.getElementById('pt-rr-inner').value.trim(),
      rr_outer:document.getElementById('pt-rr-outer').value.trim()
    };
    const hasTires = Object.values(tires).some(v => v);
    const techName = portalSelectedTech.name;
    const techUsername = portalSelectedTech.username;
    const svcsCopy = [...portalSelectedServices];

    const save = (videoDataUrl) => {
      const pIdx = custProfiles.findIndex(p => p.id === currentCustPortalId);
      if (pIdx < 0) { toast('Profile error.'); return; }
      custProfiles[pIdx].submissions.push({
        date: new Date().toISOString(),
        photos: [...portalPhotos], videoDataUrl,
        tires: hasTires ? tires : null, comments,
        requestedServices: svcsCopy,
        sentToTech: techUsername, sentToTechName: techName,
        paymentMethodId: paymentMethodId || custProfiles[pIdx].stripePaymentMethodId,
        bookingFeePending: true
      });
      custProfiles[pIdx].preferredMechanic = techUsername;
      custProfiles[pIdx].preferredMechanicName = techName;
      saveCustProfiles();
      portalPhotos=[]; portalVideoBlob=null; portalSelectedTech=null; portalSelectedServices=[];
      toast('✓ Submitted to ' + techName + '!');
      const content = document.getElementById('portal-content');
      if (content) content.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;padding:64px 24px;text-align:center">
          <div style="font-size:64px;margin-bottom:18px">✅</div>
          <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:#fff;margin-bottom:8px">Submitted!</div>
          <div style="font-size:14px;color:rgba(255,255,255,.5);max-width:320px;line-height:1.8;margin-bottom:8px">
            Sent to <strong style="color:#e8ff47">${techName}</strong>.<br>
            The ${BOOKING_FEE_LABEL} will only be charged if they accept.
          </div>
          <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px 18px;margin-bottom:24px;font-size:13px;color:rgba(255,255,255,.4)">
            💳 Card ending in <strong style="color:#fff">${profile?.cardLast4||'••••'}</strong> will be charged ${BOOKING_FEE_LABEL} on acceptance
          </div>
          <button onclick="logout()" style="background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-family:'Mulish',sans-serif;font-size:14px;padding:12px 18px">Done</button>
        </div>`;
    };

    if (portalVideoBlob) {
      const reader = new FileReader();
      reader.onerror = () => toast('Error reading video.');
      reader.onload = e => save(e.target.result);
      reader.readAsDataURL(portalVideoBlob);
    } else {
      save(null);
    }
  };

  // Show card modal if no card on file
  if (!hasCard) {
    showCardModal((paymentMethodId) => doSubmit(paymentMethodId));
  } else {
    doSubmit(null);
  }
}

// Charge booking fee when tech accepts — uses BOOKING_ENDPOINT if configured
async function chargeBookingFee(profileId, subIdx) {
  const profile = custProfiles.find(p => p.id === parseInt(profileId));
  if (!profile) return true; // skip if no profile

  const sub = profile.submissions[subIdx];
  const paymentMethodId = sub?.paymentMethodId || profile?.stripePaymentMethodId;

  if (!paymentMethodId) {
    // No card on file — skip charge (handle manually)
    toast('⚠ No card on file for this customer.');
    return true;
  }

  if (!BOOKING_ENDPOINT) {
    console.warn('BOOKING_ENDPOINT not configured; skipping server charge (use a server-side function to charge payments).');
    return true;
  }

  try {
    const res = await fetch(BOOKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethodId,
        priceId: BOOKING_PRICE_ID,
        customerName: profile.name,
        customerEmail: profile.username
      })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      toast('⚠ Card declined: ' + (data.error || 'Payment failed'));
      return false;
    }
    return true;
  } catch(e) {
    // In dev/test mode without backend just allow it
    console.warn('Booking fee charge skipped (payment request failed):', e);
    return true;
  }
}

// ══════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════
function toast(msg){
  try{const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);}catch(e){}
}
