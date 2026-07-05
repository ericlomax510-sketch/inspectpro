// ══════════════════════════════════════════
// FLEXIBLE CHECKOUT — MULTI-SERVICE SUPPORT
// ══════════════════════════════════════════

// Store customer subscriptions with service combos
function saveCustomerSubscription(profileId, services, recurringInterval = 'monthly') {
  try {
    let subscriptions = JSON.parse(localStorage.getItem('ip_subscriptions') || '[]');
    
    const existingIdx = subscriptions.findIndex(s => s.profileId === profileId);
    const subscription = {
      id: Date.now(),
      profileId,
      services: services || [],
      recurringInterval, // 'once', 'monthly', 'quarterly', 'yearly'
      status: 'active', // active, paused, cancelled
      startDate: new Date().toISOString(),
      renewalDate: calculateNextRenewalDate(recurringInterval),
      price: calculateServicePrice(services),
      notifications: { email: true, sms: true }
    };

    if (existingIdx >= 0) {
      subscriptions[existingIdx] = subscription;
    } else {
      subscriptions.push(subscription);
    }

    localStorage.setItem('ip_subscriptions', JSON.stringify(subscriptions));
    return subscription;
  } catch(e) {
    console.error('Error saving subscription:', e);
    return null;
  }
}

function calculateNextRenewalDate(interval) {
  const now = new Date();
  const next = new Date(now);

  switch(interval) {
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'quarterly': next.setMonth(next.getMonth() + 3); break;
    case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
    default: return null;
  }

  return next.toISOString();
}

function calculateServicePrice(services) {
  const prices = getServicePrices();
  let total = 0;
  
  services.forEach(serviceName => {
    const serviceObj = prices.find(p => p.name === serviceName);
    if (serviceObj) total += serviceObj.price;
  });

  return total;
}

// Generate checkout screen for service combination
function generateCheckoutScreen(selectedServices) {
  const total = calculateServicePrice(selectedServices);
  const profile = custProfiles.find(p => p.id === currentCustPortalId);

  return `
    <div style="max-width:500px;margin:0 auto;padding:20px">
      <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;margin-bottom:6px;color:#fff">Order Summary</div>
      <div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:24px">Review your service selections</div>

      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:20px;margin-bottom:20px">
        <div style="font-weight:700;font-size:13px;margin-bottom:12px;text-transform:uppercase;color:rgba(255,255,255,.4)">Services Selected</div>
        ${selectedServices.map((service, i) => {
          const priceObj = getServicePrices().find(p => p.name === service);
          const price = priceObj?.price || 0;
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)">
              <div style="font-size:13px;color:#fff">${service}</div>
              <div style="font-weight:700;color:var(--accent)">$${price.toFixed(2)}</div>
            </div>`;
        }).join('')}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:2px solid rgba(255,255,255,.08);margin-top:8px;font-weight:800;font-size:15px">
          <span>Total</span>
          <span style="color:var(--accent);font-size:18px">$${total.toFixed(2)}</span>
        </div>
      </div>

      <div style="background:rgba(255,255,255,.02);border:1px solid rgba(232,255,71,.15);border-radius:12px;padding:16px;margin-bottom:20px">
        <div style="font-weight:700;font-size:12px;margin-bottom:10px;text-transform:uppercase;color:rgba(232,255,71,.7)">Billing Details</div>
        <div style="font-size:13px;color:rgba(255,255,255,.6);line-height:1.6">
          <div style="margin-bottom:8px">
            <span style="color:rgba(255,255,255,.4)">Account:</span> ${profile?.name || 'Customer'}
          </div>
          <div style="margin-bottom:8px">
            <span style="color:rgba(255,255,255,.4)">Card:</span> ${profile?.cardBrand || 'Visa'} ending in ${profile?.cardLast4 || '••••'}
          </div>
          <div>
            <span style="color:rgba(255,255,255,.4)">Next Billing:</span> ${new Date(calculateNextRenewalDate('monthly')).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div style="display:flex;gap:10px">
        <button onclick="cancelCheckout()" class="portal-btn portal-btn-ghost" style="flex:1">Cancel</button>
        <button onclick="confirmCheckout('${selectedServices.join(',')}')" class="portal-btn" style="flex:1;background:var(--accent);color:var(--dark);font-weight:800">Confirm & Pay $${total.toFixed(2)}</button>
      </div>
    </div>`;
}

function cancelCheckout() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.remove();
  enterCustomerPortal(custProfiles.find(p => p.id === currentCustPortalId));
}

function confirmCheckout(servicesStr) {
  const services = servicesStr.split(',');
  const profile = custProfiles.find(p => p.id === currentCustPortalId);
  
  if (!profile) {
    toast('⚠ Profile error.');
    return;
  }

  const subscription = saveCustomerSubscription(profile.id, services, 'monthly');
  if (!subscription) {
    toast('⚠ Error creating subscription.');
    return;
  }

  toast(`✓ Subscription created! Services: ${services.join(', ')}`);
  
  // Send confirmation email/SMS
  sendSubscriptionConfirmation(profile, subscription);
  
  // Close checkout modal
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.remove();
  
  // Show confirmation
  setTimeout(() => {
    showSubscriptionConfirmationScreen(profile, subscription);
  }, 800);
}

function showSubscriptionConfirmationScreen(profile, subscription) {
  const total = subscription.price;
  const content = document.getElementById('portal-content');
  if (!content) return;

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;padding:64px 24px;text-align:center">
      <div style="font-size:64px;margin-bottom:18px">✅</div>
      <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:#fff;margin-bottom:8px">Subscription Active!</div>
      <div style="font-size:14px;color:rgba(255,255,255,.5);max-width:340px;line-height:1.8;margin-bottom:24px">
        Your subscription for <strong style="color:#e8ff47">${subscription.services.length} service${subscription.services.length !== 1 ? 's' : ''}</strong> is now active.
        <br>Next billing: ${new Date(subscription.renewalDate).toLocaleDateString()}
      </div>
      <div style="background:rgba(232,255,71,.08);border:1.5px solid rgba(232,255,71,.3);border-radius:12px;padding:18px;margin-bottom:24px;max-width:100%">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:rgba(232,255,71,.7);margin-bottom:8px">Billing Amount</div>
        <div style="font-size:28px;font-weight:800;color:var(--accent)">$${total.toFixed(2)}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:6px">Charged ${subscription.recurringInterval}</div>
      </div>
      <div style="background:rgba(34,214,122,.08);border:1px solid rgba(34,214,122,.2);border-radius:10px;padding:14px;font-size:12px;color:var(--green);margin-bottom:24px;width:100%">
        📧 Confirmation sent to ${profile.email || profile.username}
        <br>📱 Text notification sent to ${profile.phone || 'your phone'}
      </div>
      <button onclick="goToSubscriptions()" style="background:var(--accent);color:var(--dark);border:none;border-radius:10px;padding:12px 24px;font-family:'Syne',sans-serif;font-weight:800;cursor:pointer;font-size:14px">Manage Subscription</button>
    </div>`;
}

function goToSubscriptions() {
  enterCustomerPortal(custProfiles.find(p => p.id === currentCustPortalId));
}
