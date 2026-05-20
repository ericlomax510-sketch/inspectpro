// ══════════════════════════════════════════════════════════════════
// AGENT FEATURES - TECH RATINGS, EARNINGS, SEARCH, NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════

// Data stores for agent features
let techRatings = JSON.parse(localStorage.getItem('ip_tech_ratings') || '{}');
let notifications = JSON.parse(localStorage.getItem('ip_notifications') || '[]');
let recordFilters = { search:'', status:'all', fromDate:'', toDate:'', sortBy:'date-desc' };

function saveTechRatings() { try { localStorage.setItem('ip_tech_ratings', JSON.stringify(techRatings)); } catch(e){} }
function saveNotifications() { try { localStorage.setItem('ip_notifications', JSON.stringify(notifications)); } catch(e){} }

// ══════════════════════════════════════════════════════════════════
// 1. CUSTOMER RATING - Rate tech after job completion
// ══════════════════════════════════════════════════════════════════

function openTechRatingModal(customerId, techUsername) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:8500;padding:20px';
  modal.innerHTML = `
    <div style="background:var(--card);border-radius:20px;padding:28px;width:100%;max-width:420px;border:1px solid var(--border)">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:48px;margin-bottom:12px">⭐</div>
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800">Rate Your Technician</div>
        <div style="font-size:13px;color:var(--muted);margin-top:8px;line-height:1.6">How would you rate your experience with this technician?</div>
      </div>
      
      <div id="rating-stars" style="display:flex;justify-content:center;gap:10px;margin-bottom:20px">
        ${[1,2,3,4,5].map(n=>`
          <div onclick="setRatingModal(${n})" style="font-size:32px;cursor:pointer;opacity:0.3;transition:all 0.2s" id="rating-star-${n}">★</div>
        `).join('')}
      </div>
      
      <div style="margin-bottom:16px">
        <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:8px">Comments (optional)</label>
        <textarea id="rating-comment" placeholder="Share your feedback..." rows="3"
          style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;font-size:12px;color:var(--text);font-family:'Mulish',sans-serif"></textarea>
      </div>
      
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" style="flex:1" onclick="this.closest('[style*=fixed]').remove()">Skip</button>
        <button class="btn btn-accent" style="flex:1" onclick="submitTechRating('${techUsername}', '${customerId}')">Submit Rating</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  window.currentRatingModal = { rating: 0, techUsername, customerId };
}

let currentRating = 0;
function setRatingModal(rating) {
  currentRating = rating;
  [1,2,3,4,5].forEach(i => {
    const s = document.getElementById('rating-star-'+i);
    if (s) {
      s.style.opacity = i <= rating ? '1' : '0.3';
      s.style.transform = i <= rating ? 'scale(1.1)' : 'scale(1)';
      s.style.color = i <= rating ? '#ffb800' : 'rgba(255,255,255,.2)';
    }
  });
}

function submitTechRating(techUsername, customerId) {
  if (currentRating === 0) { toast('Please select a rating'); return; }
  
  const comment = document.getElementById('rating-comment')?.value.trim() || '';
  
  if (!techRatings[techUsername]) {
    techRatings[techUsername] = [];
  }
  
  techRatings[techUsername].push({
    rating: currentRating,
    comment,
    customerId,
    date: new Date().toISOString()
  });
  
  saveTechRatings();
  
  // Update tech account rating
  const tech = techAccounts.find(a => a.username === techUsername);
  if (tech) {
    const allRatings = techRatings[techUsername] || [];
    const avgRating = Math.round(allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length);
    tech.rating = avgRating;
    saveTechAccounts();
  }
  
  document.querySelector('[style*="fixed"]').remove();
  addNotification(`✓ You rated your technician ${currentRating}/5`, 'success');
  toast('✓ Rating submitted! Thank you');
}

// ══════════════════════════════════════════════════════════════════
// 2. TECH EARNINGS DASHBOARD
// ══════════════════════════════════════════════════════════════════

function openTechEarningsDashboard() {
  const tech = currentTechAccount;
  if (!tech) return;
  
  const earnings = calculateTechEarnings(tech.username);
  
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:8500;padding:20px;overflow:auto';
  modal.innerHTML = `
    <div style="background:var(--card);border-radius:20px;padding:28px;width:100%;max-width:600px;border:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <div style="font-size:40px;cursor:pointer" onclick="this.closest('[style*=fixed]').remove()">✕</div>
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800">💰 Your Earnings</div>
          <div style="font-size:12px;color:var(--muted)">Period: ${new Date(earnings.periodStart).toLocaleDateString()} - ${new Date().toLocaleDateString()}</div>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
        <div class="earning-card">
          <div class="label">Total Earnings</div>
          <div class="value">$${earnings.totalEarnings.toFixed(2)}</div>
        </div>
        <div class="earning-card">
          <div class="label">Jobs Completed</div>
          <div class="value">${earnings.jobsCompleted}</div>
        </div>
        <div class="earning-card">
          <div class="label">Average per Job</div>
          <div class="value">$${earnings.avgPerJob.toFixed(2)}</div>
        </div>
        <div class="earning-card">
          <div class="label">Pending</div>
          <div class="value">$${earnings.pendingEarnings.toFixed(2)}</div>
        </div>
      </div>
      
      <div class="section-heading">Monthly Breakdown</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;margin-bottom:20px">
        ${earnings.monthlyBreakdown.map(m => `
          <div class="earning-card" style="padding:12px">
            <div class="label">${m.month}</div>
            <div class="value" style="font-size:18px">$${m.amount.toFixed(2)}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="section-heading">Your Rating</div>
      <div style="display:flex;align-items:center;gap:16px;background:rgba(255,184,0,.08);border:1px solid rgba(255,184,0,.2);border-radius:12px;padding:16px">
        <div>
          <div style="font-size:32px">${'★'.repeat(tech.rating)}</div>
        </div>
        <div>
          <div style="font-weight:700;font-size:16px">${tech.rating || 0}/5</div>
          <div style="font-size:12px;color:var(--muted)">Based on ${techRatings[tech.username]?.length || 0} customer reviews</div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function calculateTechEarnings(techUsername) {
  const BOOKING_FEE = 3.00;
  
  let totalEarnings = 0;
  let jobsCompleted = 0;
  let pendingEarnings = 0;
  const monthlyData = {};
  
  // Scan all customer profiles for completed jobs
  custProfiles.forEach(profile => {
    (profile.submissions || []).forEach(sub => {
      if (sub.sentToTech === techUsername) {
        if (sub.jobStatus === 'accepted') {
          totalEarnings += BOOKING_FEE;
          jobsCompleted++;
          
          const monthKey = new Date(sub.date).toLocaleDateString('en-US', { month:'short', year:'2-digit' });
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + BOOKING_FEE;
        } else if (sub.jobStatus === 'pending') {
          pendingEarnings += BOOKING_FEE;
        }
      }
    });
  });
  
  return {
    totalEarnings,
    jobsCompleted,
    avgPerJob: jobsCompleted > 0 ? totalEarnings / jobsCompleted : 0,
    pendingEarnings,
    periodStart: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
    monthlyBreakdown: Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }))
  };
}

// ══════════════════════════════════════════════════════════════════
// 3. SEARCH & FILTER RECORDS
// ══════════════════════════════════════════════════════════════════

function toggleRecordsFilter() {
  const panel = document.getElementById('records-filter-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
}

function applyRecordFilter(search, status, fromDate, toDate) {
  recordFilters = { search, status, fromDate, toDate, sortBy: recordFilters.sortBy };
  renderFilteredRecords();
}

function renderFilteredRecords() {
  const { search, status, fromDate, toDate, sortBy } = recordFilters;
  
  let filtered = customers.filter(c => {
    // Text search
    if (search) {
      const q = search.toLowerCase();
      const matchesText = c.name.toLowerCase().includes(q) || 
                         c.vehicle.toLowerCase().includes(q) || 
                         c.phone.toLowerCase().includes(q);
      if (!matchesText) return false;
    }
    
    // Date range filter
    if (fromDate) {
      const cDate = new Date(c.date);
      const fDate = new Date(fromDate);
      if (cDate < fDate) return false;
    }
    if (toDate) {
      const cDate = new Date(c.date);
      const tDate = new Date(toDate);
      if (cDate > tDate) return false;
    }
    
    return true;
  });
  
  // Sort
  if (sortBy === 'date-desc') filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  else if (sortBy === 'date-asc') filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  else if (sortBy === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
  
  // Render
  const list = document.getElementById('customer-list-view');
  if (!list) return;
  
  const countEl = document.getElementById('filter-results-count');
  if (countEl) countEl.textContent = `${filtered.length} Records`;
  
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><div class="es-icon">🔍</div><h3>No Records Found</h3><p>Try adjusting your filters.</p></div>`;
    return;
  }
  
  list.innerHTML = filtered.map((c, i) => {
    const reds = Object.entries(c.checklist || {}).filter(([,v]) => v === 'r').length;
    const yels = Object.entries(c.checklist || {}).filter(([,v]) => v === 'y').length;
    const init = c.name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0,2) || '?';
    return `<div class="customer-card" onclick="openCustomer(${customers.indexOf(c)})">
      <div class="cust-avatar">${init}</div>
      <div class="cust-info"><div class="cname">${c.name}</div><div class="cveh">${c.vehicle}</div></div>
      <div class="cust-chips">
        ${reds ? `<span class="chip chip-red">🔴 ${reds}</span>` : ''}
        ${yels ? `<span class="chip chip-yellow">🟡 ${yels}</span>` : ''}
        <span class="chip chip-date">${new Date(c.date).toLocaleDateString()}</span>
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════════
// 4. JOB HISTORY PER CUSTOMER
// ══════════════════════════════════════════════════════════════════

function renderCustomerJobHistory(profile) {
  if (!profile || !profile.submissions) return '';
  
  const jobHistory = profile.submissions.map((sub, i) => ({
    ...sub,
    index: i,
    formattedDate: new Date(sub.date).toLocaleDateString(),
    formattedTime: new Date(sub.date).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  })).reverse();
  
  if (jobHistory.length === 0) return '';
  
  return `
    <div class="card">
      <div class="card-title">📋 Job History (${jobHistory.length} total)</div>
      <table class="job-history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Tech</th>
            <th>Status</th>
            <th>Services</th>
          </tr>
        </thead>
        <tbody>
          ${jobHistory.map(job => `
            <tr>
              <td>${job.formattedDate}<br><span style="color:var(--muted);font-size:11px">${job.formattedTime}</span></td>
              <td><span style="font-weight:700">${job.sentToTechName || '—'}</span></td>
              <td>
                ${job.jobStatus === 'accepted' ? '<span class="tech-stat-badge" style="background:rgba(34,214,122,.2);color:#22d67a;border-left:3px solid #22d67a">✓ Accepted</span>'
                : job.jobStatus === 'declined' ? '<span class="tech-stat-badge" style="background:rgba(255,59,59,.2);color:#ff3b3b;border-left:3px solid #ff3b3b">✕ Declined</span>'
                : '<span class="tech-stat-badge" style="background:rgba(255,184,0,.2);color:#ffb800;border-left:3px solid #ffb800">⏳ Pending</span>'}
              </td>
              <td>${job.requestedServices?.length || 0} services</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

// ══════════════════════════════════════════════════════════════════
// 5. NOTIFICATIONS & BADGE
// ══════════════════════════════════════════════════════════════════

function addNotification(message, type = 'info') {
  notifications.unshift({
    id: Date.now(),
    message,
    type, // 'info', 'success', 'warning', 'error'
    date: new Date().toISOString(),
    read: false
  });
  
  // Keep only last 50
  if (notifications.length > 50) notifications.pop();
  saveNotifications();
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const badge = document.getElementById('notification-badge');
  const unread = notifications.filter(n => !n.read).length;
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
  }
}

function renderNotificationCenter() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:flex-start;justify-content:flex-end;z-index:8500;padding:20px';
  modal.innerHTML = `
    <div style="background:var(--card);border-radius:16px;width:100%;max-width:380px;max-height:80vh;overflow:auto;border:1px solid var(--border)">
      <div style="padding:16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div style="font-weight:700;font-size:14px">🔔 Notifications</div>
        <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;cursor:pointer;font-size:18px">✕</button>
      </div>
      
      <div style="padding:12px">
        ${notifications.length === 0 ? `
          <div style="text-align:center;padding:24px 12px;color:var(--muted);font-size:13px">No notifications yet</div>
        ` : `
          ${notifications.map(n => {
            const bgColor = n.type === 'success' ? 'rgba(34,214,122,.1)' : n.type === 'error' ? 'rgba(255,59,59,.1)' : 'rgba(59,130,246,.1)';
            const borderColor = n.type === 'success' ? 'rgba(34,214,122,.2)' : n.type === 'error' ? 'rgba(255,59,59,.2)' : 'rgba(59,130,246,.2)';
            return `
              <div class="notification-item ${n.read ? 'read' : ''}" style="background:${bgColor};border-left-color:${borderColor};cursor:pointer" 
                onclick="markNotificationRead(${n.id})">
                <div style="font-weight:600;margin-bottom:4px">${n.message}</div>
                <div style="font-size:11px;color:var(--muted)">${new Date(n.date).toLocaleString()}</div>
              </div>
            `;
          }).join('')}
        `}
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function markNotificationRead(id) {
  const notif = notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveNotifications();
    updateNotificationBadge();
  }
}

// ══════════════════════════════════════════════════════════════════
// 6. ADMIN TECH RECORDS DASHBOARD
// ══════════════════════════════════════════════════════════════════

function openAdminTechRecords() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:8500;padding:20px;overflow:auto';
  
  const techStats = techAccounts.filter(a => a.role === 'tech').map(tech => {
    const earnings = calculateTechEarnings(tech.username);
    const ratings = techRatings[tech.username] || [];
    const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) : '—';
    
    return { tech, ...earnings, avgRating, ratingCount: ratings.length };
  });
  
  modal.innerHTML = `
    <div style="background:var(--card);border-radius:20px;padding:28px;width:100%;max-width:900px;border:1px solid var(--border);max-height:90vh;overflow:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800">👨‍💼 All Technicians</div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px">${techStats.length} active technicians</div>
        </div>
        <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;cursor:pointer;font-size:24px">✕</button>
      </div>
      
      <table class="job-history-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Jobs</th>
            <th>Earnings</th>
            <th>Rating</th>
            <th>Reviews</th>
            <th>Avg/Job</th>
          </tr>
        </thead>
        <tbody>
          ${techStats.map(stat => `
            <tr style="cursor:pointer" onclick="viewTechDetail('${stat.tech.username}', '${stat.tech.name}')">
              <td><strong>${stat.tech.name}</strong></td>
              <td><strong>${stat.jobsCompleted}</strong></td>
              <td style="color:#22d67a;font-weight:700">$${stat.totalEarnings.toFixed(2)}</td>
              <td>${stat.avgRating === '—' ? '—' : `${stat.avgRating} ⭐`}</td>
              <td>${stat.ratingCount}</td>
              <td>$${stat.avgPerJob.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target.style.position === 'fixed') modal.remove(); };
}

function viewTechDetail(username, name) {
  const tech = techAccounts.find(a => a.username === username);
  const earnings = calculateTechEarnings(username);
  const ratings = techRatings[username] || [];
  
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:8500;padding:20px;overflow:auto';
  modal.innerHTML = `
    <div style="background:var(--card);border-radius:20px;padding:28px;width:100%;max-width:600px;border:1px solid var(--border)">
      <button onclick="this.closest('[style*=fixed]').remove();openAdminTechRecords()" style="background:none;border:none;cursor:pointer;font-size:18px;margin-bottom:16px">← Back</button>
      
      <div style="text-align:center;margin-bottom:24px">
        <div style="width:60px;height:60px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:24px;font-weight:800">${name.split(' ').map(w=>w[0]).join('')}</div>
        <div style="font-size:20px;font-weight:800">${name}</div>
        <div style="font-size:12px;color:var(--muted)">@${username}</div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div class="earning-card">
          <div class="label">Total Earnings</div>
          <div class="value">$${earnings.totalEarnings.toFixed(2)}</div>
        </div>
        <div class="earning-card">
          <div class="label">Jobs Completed</div>
          <div class="value">${earnings.jobsCompleted}</div>
        </div>
      </div>
      
      ${ratings.length > 0 ? `
        <div class="section-heading">Recent Reviews (${ratings.length})</div>
        <div style="max-height:300px;overflow-y:auto">
          ${ratings.slice(0,5).map(r => `
            <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="font-size:14px">${'★'.repeat(r.rating)}</span>
                <span style="font-size:12px;color:var(--muted)">${r.rating}/5</span>
              </div>
              ${r.comment ? `<div style="font-size:12px;color:var(--muted);font-style:italic">"${r.comment}"</div>` : ''}
              <div style="font-size:10px;color:var(--muted);margin-top:6px">${new Date(r.date).toLocaleDateString()}</div>
            </div>
          `).join('')}
        </div>
      ` : '<div style="color:var(--muted);font-size:13px;text-align:center;padding:20px">No reviews yet</div>'}
    </div>`;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target.style.position === 'fixed') modal.remove(); };
}

// ══════════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════════

function initAgentFeatures() {
  updateNotificationBadge();
  
  // Hook into customer detail to show job history
  const originalOpenCustomer = window.openCustomer;
  window.openCustomer = function(i) {
    originalOpenCustomer(i);
    const c = customers[i];
    const profile = c.linkedCustProfileId ? custProfiles.find(p => p.id === c.linkedCustProfileId) : null;
    if (profile) {
      const historyWidget = document.getElementById('job-history-widget');
      if (historyWidget) {
        historyWidget.innerHTML = renderCustomerJobHistory(profile);
        historyWidget.style.display = 'block';
      }
    }
  };
  
  // Add tech dashboard to screens
  if (currentTechAccount?.role === 'admin') {
    const tabsNav = document.querySelector('[id*="ttab"]')?.parentElement;
    if (tabsNav) {
      const btn = document.createElement('button');
      btn.id = 'ttab-tech-dashboard';
      btn.className = 'tab';
      btn.textContent = '📊 Tech Dashboard';
      btn.onclick = () => gotoScreen('tech-dashboard');
      tabsNav.appendChild(btn);
    }
  }
}

// Add filter button to customers screen
const originalRenderCustomers = window.renderCustomers;
window.renderCustomers = function() {
  originalRenderCustomers();
  const filterBtn = document.createElement('button');
  filterBtn.className = 'btn btn-dark';
  filterBtn.style.marginBottom = '12px';
  filterBtn.textContent = '🔍 Filter Records';
  filterBtn.onclick = toggleRecordsFilter;
  const list = document.getElementById('customer-list-view');
  if (list) list.parentElement.insertBefore(filterBtn, list);
};
