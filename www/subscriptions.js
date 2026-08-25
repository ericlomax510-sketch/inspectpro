// ══════════════════════════════════════════
// SUBSCRIPTION MANAGEMENT & CANCELLATION
// ══════════════════════════════════════════

function getCustomerSubscriptions(profileId) {
  try {
    const subscriptions = JSON.parse(localStorage.getItem('ip_subscriptions') || '[]');
    return subscriptions.filter(s => s.profileId === profileId);
  } catch(e) {
    return [];
  }
}

function renderSubscriptionManagementScreen() {
  const profile = custProfiles.find(p => p.id === currentCustPortalId);
  if (!profile) return;

  const subscriptions = getCustomerSubscriptions(profile.id);
  const content = document.getElementById('portal-content');
  if (!content) return;

  if (!subscriptions.length) {
    content.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;padding:48px 24px;text-align:center;color:rgba(255,255,255,.5)">
        <div style="font-size:48px;margin-bottom:12px">📋</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:6px;color:#fff">No Active Subscriptions</div>
        <div style="font-size:13px;margin-bottom:24px">Start a subscription to access services.</div>
        <button onclick="showServiceSelectionScreen()" class="portal-btn" style="background:var(--accent);color:var(--dark)">Start Subscription →</button>
      </div>`;
    return;
  }

  content.innerHTML = `
    <div style="padding:20px 24px">
      <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;margin-bottom:4px;color:#fff">My Subscriptions</div>
      <div style="font-size:13px;color:rgba(255,255,255,.4);margin-bottom:24px">${subscriptions.length} active subscription${subscriptions.length !== 1 ? 's' : ''}</div>
      
      ${subscriptions.map((sub, idx) => renderSubscriptionCard(sub, idx, profile)).join('')}
    </div>`;
}

function renderSubscriptionCard(subscription, index, profile) {
  const nextRenewal = new Date(subscription.renewalDate);
  const daysUntilRenewal = Math.ceil((nextRenewal - new Date()) / (1000 * 60 * 60 * 24));
  
  return `
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(232,255,71,.2);border-radius:14px;padding:20px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div>
          <div style="font-weight:800;font-size:15px;color:#fff;margin-bottom:4px">
            ${subscription.services.length} Service${subscription.services.length !== 1 ? 's' : ''}
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,.4)">
            ${subscription.recurringInterval.charAt(0).toUpperCase() + subscription.recurringInterval.slice(1)} subscription
          </div>
        </div>
        <div style="font-size:18px;font-weight:800;color:var(--accent)">$${subscription.price.toFixed(2)}</div>
      </div>

      <div style="background:rgba(255,255,255,.02);border-radius:10px;padding:12px;margin-bottom:14px;font-size:12px">
        <div style="margin-bottom:6px">
          <span style="color:rgba(255,255,255,.4)">Services:</span>
          <span style="color:#fff">${subscription.services.join(', ')}</span>
        </div>
        <div style="margin-bottom:6px">
          <span style="color:rgba(255,255,255,.4)">Status:</span>
          <span style="color:var(--green);font-weight:700">● ${subscription.status}</span>
        </div>
        <div>
          <span style="color:rgba(255,255,255,.4)">Next Renewal:</span>
          <span style="color:#fff">${nextRenewal.toLocaleDateString()} (${daysUntilRenewal} days)</span>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button onclick="pauseSubscription(${index})" class="portal-btn portal-btn-ghost" style="flex:1;min-width:120px;font-size:12px">⏸ Pause</button>
        <button onclick="openCancellationModal(${index})" class="portal-btn portal-btn-ghost" style="flex:1;min-width:120px;font-size:12px;border-color:rgba(255,59,59,.3);color:rgba(255,59,59,.8)">🗑 Cancel</button>
      </div>
    </div>`;
}

function openCancellationModal(subscriptionIndex) {
  const subscriptions = getCustomerSubscriptions(currentCustPortalId);
  if (subscriptionIndex < 0 || subscriptionIndex >= subscriptions.length) return;

  const subscription = subscriptions[subscriptionIndex];
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:9000;padding:20px';
  modal.id = 'cancellation-modal';

  modal.innerHTML = `
    <div style="background:var(--card);border:1.5px solid rgba(255,59,59,.2);border-radius:20px;padding:28px;width:100%;max-width:460px">
      <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#ff6b6b;margin-bottom:6px">Cancel Subscription?</div>
      <div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:18px;line-height:1.6">
        You're about to cancel your subscription for <strong style="color:#fff">${subscription.services.length} service${subscription.services.length !== 1 ? 's' : ''}</strong> 
        (${subscription.services.join(', ')}).
        <br><br>Your access will end on <strong style="color:#fff">${new Date(subscription.renewalDate).toLocaleDateString()}</strong>.
      </div>

      <div style="background:rgba(255,59,59,.08);border:1px solid rgba(255,59,59,.2);border-radius:12px;padding:12px;margin-bottom:18px;font-size:12px;color:rgba(255,255,255,.6)">
        <div style="margin-bottom:6px;color:rgba(255,255,255,.7)"><strong>Why are you cancelling?</strong></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" name="cancel-reason" value="too-expensive" style="cursor:pointer">
            <span>Too expensive</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" name="cancel-reason" value="not-using" style="cursor:pointer">
            <span>Not using it</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="radio" name="cancel-reason" value="other" style="cursor:pointer">
            <span>Other reason</span>
          </label>
        </div>
      </div>

      <div style="margin-bottom:16px">
        <label style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.35);display:block;margin-bottom:6px">Notification Preferences</label>
        <label style="display:flex;align-items:center;gap:10px;font-size:13px;margin-bottom:6px;cursor:pointer">
          <input type="checkbox" id="cancel-email-notify" checked style="cursor:pointer"> Email confirmation
        </label>
        <label style="display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="cancel-sms-notify" checked style="cursor:pointer"> Text notification
        </label>
      </div>

      <div style="display:flex;gap:8px">
        <button onclick="document.getElementById('cancellation-modal').remove()" class="portal-btn portal-btn-ghost" style="flex:1">Keep It</button>
        <button onclick="confirmCancellation(${subscriptionIndex})" class="portal-btn" style="flex:1;background:rgba(255,59,59,.2);color:#ff6b6b;border:1px solid rgba(255,59,59,.4);font-weight:800">✓ Cancel Subscription</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

function confirmCancellation(subscriptionIndex) {
  const profile = custProfiles.find(p => p.id === currentCustPortalId);
  const subscriptions = getCustomerSubscriptions(profile.id);
  
  if (subscriptionIndex < 0 || subscriptionIndex >= subscriptions.length) return;

  const subscription = subscriptions[subscriptionIndex];
  const cancelReason = document.querySelector('input[name="cancel-reason"]:checked')?.value || 'not-specified';
  const emailNotify = document.getElementById('cancel-email-notify')?.checked;
  const smsNotify = document.getElementById('cancel-sms-notify')?.checked;

  // Update subscription status
  subscription.status = 'cancelled';
  subscription.cancelledAt = new Date().toISOString();
  subscription.cancelReason = cancelReason;

  // Save updated subscription
  let allSubs = JSON.parse(localStorage.getItem('ip_subscriptions') || '[]');
  const idx = allSubs.findIndex(s => s.id === subscription.id);
  if (idx >= 0) {
    allSubs[idx] = subscription;
    localStorage.setItem('ip_subscriptions', JSON.stringify(allSubs));
  }

  // Send notifications
  if (emailNotify) {
    sendCancellationEmail(profile, subscription);
  }
  if (smsNotify) {
    sendCancellationSMS(profile, subscription);
  }

  // Close modal and show confirmation
  const modal = document.getElementById('cancellation-modal');
  if (modal) modal.remove();

  showCancellationConfirmation(profile, subscription);
  toast('✓ Subscription cancelled');
}

function showCancellationConfirmation(profile, subscription) {
  const content = document.getElementById('portal-content');
  if (!content) return;

  const endDate = new Date(subscription.renewalDate).toLocaleDateString();
  const emailSent = document.getElementById('cancel-email-notify')?.checked;
  const smsSent = document.getElementById('cancel-sms-notify')?.checked;

  content.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;padding:64px 24px;text-align:center">
      <div style="font-size:56px;margin-bottom:18px">👋</div>
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;margin-bottom:8px">Subscription Cancelled</div>
      <div style="font-size:13px;color:rgba(255,255,255,.5);max-width:340px;line-height:1.8;margin-bottom:24px">
        Your subscription ends on <strong style="color:#e8ff47">${endDate}</strong>.
        <br>You'll have access until then.
      </div>

      <div style="background:rgba(34,214,122,.08);border:1px solid rgba(34,214,122,.2);border-radius:12px;padding:16px;margin-bottom:24px;width:100%;max-width:340px;font-size:12px">
        ${emailSent ? `<div style="margin-bottom:8px;color:var(--green)">✓ Confirmation email sent to ${profile.email || profile.username}</div>` : ''}
        ${smsSent ? `<div style="color:var(--green)">✓ Text notification sent to ${profile.phone}</div>` : ''}
        ${(!emailSent && !smsSent) ? '<div style="color:rgba(255,255,255,.5)">No notifications sent</div>' : ''}
      </div>

      <div style="display:flex;gap:10px;width:100%;max-width:320px">
        <button onclick="renderSubscriptionManagementScreen()" style="flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-family:'Mulish',sans-serif;font-size:13px;padding:12px;cursor:pointer;font-weight:700">Back</button>
        <button onclick="logout()" style="flex:1;background:var(--accent);color:var(--dark);border:none;border-radius:10px;font-family:'Syne',sans-serif;font-size:13px;padding:12px;cursor:pointer;font-weight:800">Exit</button>
      </div>
    </div>`;
}

function pauseSubscription(subscriptionIndex) {
  const subscriptions = getCustomerSubscriptions(currentCustPortalId);
  if (subscriptionIndex < 0 || subscriptionIndex >= subscriptions.length) return;

  const subscription = subscriptions[subscriptionIndex];
  subscription.status = subscription.status === 'paused' ? 'active' : 'paused';

  // Save updated subscription
  let allSubs = JSON.parse(localStorage.getItem('ip_subscriptions') || '[]');
  const idx = allSubs.findIndex(s => s.id === subscription.id);
  if (idx >= 0) {
    allSubs[idx] = subscription;
    localStorage.setItem('ip_subscriptions', JSON.stringify(allSubs));
  }

  renderSubscriptionManagementScreen();
  toast(`✓ Subscription ${subscription.status === 'paused' ? 'paused' : 'resumed'}`);
}

// ──── NOTIFICATION FUNCTIONS ────
function sendCancellationEmail(profile, subscription) {
  // In production, this would integrate with your email service (SendGrid, etc.)
  const emailData = {
    to: profile.email || profile.username,
    subject: '✓ Subscription Cancelled - InspectPro',
    body: `
      Hi ${profile.name},

      Your subscription has been successfully cancelled.
      
      Cancellation Details:
      - Services: ${subscription.services.join(', ')}
      - Access Until: ${new Date(subscription.renewalDate).toLocaleDateString()}
      - Billing Amount: $${subscription.price.toFixed(2)} (not charged)

      If you change your mind, you can restart your subscription anytime from your account.

      Need help? Contact us at support@inspectpro.com

      Best regards,
      The InspectPro Team
    `
  };

  // Log for development (in production, use real email service)
  console.log('📧 Cancellation email would be sent:', emailData);
  saveNotificationLog('email', emailData, profile.id);
}

function sendCancellationSMS(profile, subscription) {
  // In production, this would integrate with Twilio or similar
  const smsData = {
    to: profile.phone,
    body: `✓ Your InspectPro subscription has been cancelled. Access until ${new Date(subscription.renewalDate).toLocaleDateString()}. Restart anytime from your account.`
  };

  // Log for development (in production, use real SMS service)
  console.log('📱 Cancellation SMS would be sent:', smsData);
  saveNotificationLog('sms', smsData, profile.id);
}

function saveNotificationLog(type, data, profileId) {
  try {
    let logs = JSON.parse(localStorage.getItem('ip_notification_logs') || '[]');
    logs.push({
      id: Date.now(),
      type, // 'email', 'sms', 'in-app'
      profileId,
      data,
      sentAt: new Date().toISOString(),
      status: 'sent'
    });
    localStorage.setItem('ip_notification_logs', JSON.stringify(logs));
  } catch(e) {
    console.error('Error saving notification log:', e);
  }
}

function showServiceSelectionScreen() {
  const content = document.getElementById('portal-content');
  if (!content) return;

  const services = getServicePrices();
  
  content.innerHTML = `
    <div style="padding:20px 24px;max-width:600px;margin:0 auto">
      <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;margin-bottom:6px;color:#fff">Select Services</div>
      <div style="font-size:13px;color:rgba(255,255,255,.4);margin-bottom:24px">Choose 1 or more services to start your subscription.</div>
      
      <div id="service-selection-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px">
        ${services.map((s, i) => `
          <div class="service-selection-btn" id="svc-${i}" 
               onclick="toggleServiceSelection(${i})" 
               style="background:rgba(255,255,255,.05);border:2px solid rgba(232,255,71,.15);border-radius:12px;padding:16px;cursor:pointer;transition:all 0.2s;text-align:center">
            <div style="font-size:24px;margin-bottom:8px">${s.icon}</div>
            <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:6px">${s.name}</div>
            <div style="font-size:13px;color:var(--accent);font-weight:800">$${s.price}</div>
          </div>
        `).join('')}
      </div>

      <div id="selection-total" style="background:rgba(232,255,71,.08);border:1.5px solid rgba(232,255,71,.3);border-radius:12px;padding:16px;margin-bottom:20px;text-align:center">
        <div style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:6px">Total Monthly</div>
        <div style="font-size:28px;font-weight:800;color:var(--accent)">$0.00</div>
      </div>

      <div style="display:flex;gap:10px">
        <button onclick="renderSubscriptionManagementScreen()" class="portal-btn portal-btn-ghost" style="flex:1">Cancel</button>
        <button onclick="proceedToCheckout()" id="proceed-checkout-btn" class="portal-btn" style="flex:1;background:rgba(255,255,255,.1);color:rgba(255,255,255,.3);cursor:not-allowed" disabled>Proceed to Checkout</button>
      </div>
    </div>`;
}

let selectedServicesForCheckout = [];

function toggleServiceSelection(serviceIndex) {
  const services = getServicePrices();
  const service = services[serviceIndex];
  const btn = document.getElementById(`svc-${serviceIndex}`);

  if (selectedServicesForCheckout.includes(service.name)) {
    selectedServicesForCheckout = selectedServicesForCheckout.filter(s => s !== service.name);
    if (btn) btn.style.borderColor = 'rgba(232,255,71,.15)';
  } else {
    selectedServicesForCheckout.push(service.name);
    if (btn) btn.style.borderColor = 'var(--accent)';
  }

  // Update total and button state
  const total = calculateServicePrice(selectedServicesForCheckout);
  const totalEl = document.getElementById('selection-total');
  const checkoutBtn = document.getElementById('proceed-checkout-btn');

  if (totalEl) {
    totalEl.innerHTML = `
      <div style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:6px">Total Monthly (${selectedServicesForCheckout.length} service${selectedServicesForCheckout.length !== 1 ? 's' : ''})</div>
      <div style="font-size:28px;font-weight:800;color:var(--accent)">$${total.toFixed(2)}</div>`;
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = selectedServicesForCheckout.length === 0;
    checkoutBtn.style.background = selectedServicesForCheckout.length === 0 ? 'rgba(255,255,255,.08)' : 'var(--accent)';
    checkoutBtn.style.color = selectedServicesForCheckout.length === 0 ? 'rgba(255,255,255,.25)' : 'var(--dark)';
    checkoutBtn.style.cursor = selectedServicesForCheckout.length === 0 ? 'not-allowed' : 'pointer';
  }
}

function proceedToCheckout() {
  if (selectedServicesForCheckout.length === 0) {
    toast('⚠ Select at least one service');
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'checkout-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:8999;padding:20px;overflow-y:auto';
  modal.innerHTML = generateCheckoutScreen(selectedServicesForCheckout);
  document.body.appendChild(modal);
}
