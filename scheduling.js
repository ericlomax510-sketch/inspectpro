// TECH SCHEDULING + CUSTOMER APPOINTMENT BOOKING

let techSchedules = JSON.parse(localStorage.getItem('ip_tech_schedules') || '{}');
let techAvailability = JSON.parse(localStorage.getItem('ip_tech_availability') || '{}');
let customerAppointments = JSON.parse(localStorage.getItem('ip_customer_appointments') || '[]');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};

function saveTechSchedules() { try { localStorage.setItem('ip_tech_schedules', JSON.stringify(techSchedules)); } catch (e) {} }
function saveTechAvailability() { try { localStorage.setItem('ip_tech_availability', JSON.stringify(techAvailability)); } catch (e) {} }
function saveCustomerAppointments() { try { localStorage.setItem('ip_customer_appointments', JSON.stringify(customerAppointments)); } catch (e) {} }

function formatTime12Hour(time24) {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const hour12 = h % 12 || 12;
  return `${hour12}:${mStr} ${h >= 12 ? 'PM' : 'AM'}`;
}

function getLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getThirtyMinuteTimes() {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      times.push({ value, label: formatTime12Hour(value) });
    }
  }
  return times;
}

function initTechAvailability(techUsername) {
  if (!techAvailability[techUsername]) {
    techAvailability[techUsername] = {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false, startTime: '10:00', endTime: '14:00' },
      sunday: { available: false, startTime: '10:00', endTime: '14:00' }
    };
    saveTechAvailability();
  }
}

function getTechAvailabilitySummaryText(techUsername) {
  initTechAvailability(techUsername);
  const availability = techAvailability[techUsername] || {};
  const onDays = DAYS.filter(day => availability[day]?.available);
  if (!onDays.length) return 'No availability set';
  const preview = onDays.slice(0, 2).map(day => {
    const d = availability[day];
    return `${DAY_LABELS[day]} ${formatTime12Hour(d.startTime)}-${formatTime12Hour(d.endTime)}`;
  }).join(' • ');
  const moreCount = onDays.length - 2;
  return moreCount > 0 ? `${preview} • +${moreCount} more day${moreCount > 1 ? 's' : ''}` : preview;
}

function renderTechScheduleSummary() {
  const container = document.getElementById('tech-schedule-summary');
  if (!container || !currentTechAccount) return;
  initTechAvailability(currentTechAccount.username);
  const availability = techAvailability[currentTechAccount.username];
  container.innerHTML = DAYS.map(day => {
    const d = availability[day];
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)">
      <div style="font-size:13px;font-weight:700">${DAY_LABELS[day]}</div>
      <div style="font-size:12px;color:${d.available ? '#e8ff47' : 'rgba(255,255,255,.4)'}">${d.available ? `${formatTime12Hour(d.startTime)} - ${formatTime12Hour(d.endTime)}` : 'OFF'}</div>
    </div>`;
  }).join('');
}

function renderTechScheduleScreen() {
  renderTechScheduleSummary();
}

function openTechAvailabilityModal() {
  const tech = currentTechAccount;
  if (!tech) return;
  initTechAvailability(tech.username);
  const availability = techAvailability[tech.username];
  const options = getThirtyMinuteTimes().map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:8500;padding:20px;overflow:auto';
  modal.innerHTML = `<div style="background:var(--card);border-radius:20px;padding:28px;width:100%;max-width:560px;border:1px solid var(--border)">
    <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800;margin-bottom:6px">⏰ Weekly Availability</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:20px">Set ON/OFF and working hours (30-minute intervals).</div>
    <div style="max-height:60vh;overflow-y:auto">${DAYS.map(day => {
      const d = availability[day];
      return `<div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <input type="checkbox" id="avail-${day}" ${d.available ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer">
          <label for="avail-${day}" style="flex:1;font-weight:700;cursor:pointer">${DAY_LABELS[day]}</label>
        </div>
        <div style="display:flex;gap:8px">
          <div style="flex:1">
            <label style="font-size:11px;color:var(--muted);font-weight:700;display:block;margin-bottom:5px">Start</label>
            <select id="start-${day}" style="width:100%;background:var(--dark);border:1px solid var(--border);border-radius:6px;padding:8px;color:var(--text);font-size:13px">${options}</select>
          </div>
          <div style="flex:1">
            <label style="font-size:11px;color:var(--muted);font-weight:700;display:block;margin-bottom:5px">End</label>
            <select id="end-${day}" style="width:100%;background:var(--dark);border:1px solid var(--border);border-radius:6px;padding:8px;color:var(--text);font-size:13px">${options}</select>
          </div>
        </div>
      </div>`;
    }).join('')}</div>
    <div style="display:flex;gap:8px;margin-top:20px">
      <button class="btn btn-ghost" style="flex:1" onclick="this.closest('[style*=fixed]').remove()">Cancel</button>
      <button class="btn btn-accent" style="flex:1" onclick="saveTechAvailabilityModal()">✓ Save</button>
    </div>
  </div>`;

  document.body.appendChild(modal);
  DAYS.forEach(day => {
    const d = availability[day];
    const startEl = document.getElementById(`start-${day}`);
    const endEl = document.getElementById(`end-${day}`);
    if (startEl) startEl.value = d.startTime;
    if (endEl) endEl.value = d.endTime;
  });
}

function saveTechAvailabilityModal() {
  const tech = currentTechAccount;
  if (!tech) return;
  initTechAvailability(tech.username);

  for (const day of DAYS) {
    const available = !!document.getElementById(`avail-${day}`)?.checked;
    const startTime = document.getElementById(`start-${day}`)?.value || '08:00';
    const endTime = document.getElementById(`end-${day}`)?.value || '17:00';
    if (available && startTime >= endTime) {
      toast(`Please set a later end time for ${DAY_LABELS[day]}.`);
      return;
    }
    techAvailability[tech.username][day] = { available, startTime, endTime };
  }

  saveTechAvailability();
  document.querySelector('[style*="fixed"]')?.remove();
  renderTechScheduleSummary();
  toast('✓ Availability updated!');
}

function updatePortalSelectedSlotSummary() {
  const slotEl = document.getElementById('portal-selected-slot');
  if (!slotEl) return;
  if (window.selectedScheduleDate && window.selectedScheduleTime) {
    const prettyDate = new Date(`${window.selectedScheduleDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    slotEl.style.display = 'block';
    slotEl.textContent = `Selected: ${prettyDate} at ${formatTime12Hour(window.selectedScheduleTime)}`;
  } else {
    slotEl.style.display = 'none';
    slotEl.textContent = '';
  }
  if (typeof updateSubmitBtn === 'function') updateSubmitBtn();
}

function updatePortalSchedulingCard() {
  const card = document.getElementById('portal-scheduling-card');
  const summary = document.getElementById('portal-scheduling-tech-summary');
  if (!card || !summary) return;
  if (!portalSelectedTech) {
    card.style.display = 'none';
    return;
  }
  card.style.display = 'block';
  summary.textContent = getTechAvailabilitySummaryText(portalSelectedTech.username);
  updatePortalSelectedSlotSummary();
}

function openSchedulingModal(techUsername, techName) {
  initTechAvailability(techUsername);
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:8500;padding:20px;overflow:auto';
  modal.innerHTML = `<div style="background:var(--card);border-radius:20px;padding:28px;width:100%;max-width:520px;border:1px solid var(--border)">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <div style="font-size:32px">📅</div>
      <div>
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800">Schedule Appointment</div>
        <div style="font-size:12px;color:var(--muted)">with ${techName}</div>
      </div>
    </div>
    <div style="margin-bottom:16px">
      <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:8px">Date</label>
      <input id="schedule-date-input" type="date" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--text)">
    </div>
    <div style="margin-bottom:16px">
      <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:8px">Available Time Slots</label>
      <select id="schedule-time-select" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--text)">
        <option value="">Select a date first</option>
      </select>
    </div>
    <div id="schedule-preview" style="display:none;margin-bottom:16px;padding:10px;border-radius:10px;background:rgba(34,214,122,.08);border:1px solid rgba(34,214,122,.2);font-size:12px;color:#fff"></div>
    <div style="margin-bottom:16px">
      <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:8px">Notes for Tech</label>
      <textarea id="scheduling-notes" placeholder="Any specific requests..." rows="3" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;font-size:12px;color:var(--text)"></textarea>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost" style="flex:1" onclick="this.closest('[style*=fixed]').remove()">Cancel</button>
      <button class="btn btn-accent" style="flex:1" id="schedule-confirm-btn" onclick="confirmAppointment('${techUsername}','${techName}')" disabled>Schedule</button>
    </div>
  </div>`;
  document.body.appendChild(modal);

  window.selectedScheduleDate = null;
  window.selectedScheduleTime = null;

  const today = new Date();
  const max = new Date(today);
  max.setDate(max.getDate() + 30);
  const dateInput = document.getElementById('schedule-date-input');
  if (dateInput) {
    dateInput.min = getLocalDateString(today);
    dateInput.max = getLocalDateString(max);
    dateInput.onchange = () => populateTimeDropdown(techUsername, dateInput.value);
  }
  const timeSelect = document.getElementById('schedule-time-select');
  if (timeSelect) {
    timeSelect.onchange = () => {
      window.selectedScheduleTime = timeSelect.value || null;
      const btn = document.getElementById('schedule-confirm-btn');
      if (btn) btn.disabled = !(window.selectedScheduleDate && window.selectedScheduleTime);
      const preview = document.getElementById('schedule-preview');
      if (preview && window.selectedScheduleDate && window.selectedScheduleTime) {
        const prettyDate = new Date(`${window.selectedScheduleDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        preview.style.display = 'block';
        preview.textContent = `Confirm: ${prettyDate} at ${formatTime12Hour(window.selectedScheduleTime)}`;
      } else if (preview) {
        preview.style.display = 'none';
      }
    };
  }
}

function populateTimeDropdown(techUsername, dateStr) {
  const select = document.getElementById('schedule-time-select');
  const preview = document.getElementById('schedule-preview');
  const btn = document.getElementById('schedule-confirm-btn');
  if (!select) return;

  window.selectedScheduleDate = dateStr || null;
  window.selectedScheduleTime = null;
  if (preview) preview.style.display = 'none';
  if (btn) btn.disabled = true;

  if (!dateStr) {
    select.innerHTML = '<option value="">Select a date first</option>';
    return;
  }

  const selectedDate = new Date(`${dateStr}T00:00:00`);
  const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][selectedDate.getDay()];
  const daySchedule = techAvailability[techUsername]?.[dayKey];
  if (!daySchedule || !daySchedule.available) {
    select.innerHTML = '<option value="">No availability on this day</option>';
    return;
  }

  const [sh, sm] = daySchedule.startTime.split(':').map(Number);
  const [eh, em] = daySchedule.endTime.split(':').map(Number);
  const startMinutes = (sh * 60) + sm;
  const endMinutes = (eh * 60) + em;
  const booked = customerAppointments
    .filter(a => a.techUsername === techUsername && a.date === dateStr && a.status !== 'cancelled')
    .map(a => a.timeSlot || a.time);

  const slotOptions = [];
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (!booked.includes(value)) {
      slotOptions.push(`<option value="${value}">${formatTime12Hour(value)}</option>`);
    }
  }

  if (!slotOptions.length) {
    select.innerHTML = '<option value="">No slots left for this day</option>';
    return;
  }

  select.innerHTML = `<option value="">Select a time slot</option>${slotOptions.join('')}`;
}

function confirmAppointment(techUsername, techName) {
  if (!window.selectedScheduleDate || !window.selectedScheduleTime) {
    toast('Please select date and time');
    return;
  }
  const profile = custProfiles.find(p => p.id === currentCustPortalId);
  if (!profile) return;

  const duplicate = customerAppointments.some(a =>
    a.techUsername === techUsername &&
    a.date === window.selectedScheduleDate &&
    (a.timeSlot || a.time) === window.selectedScheduleTime &&
    a.status !== 'cancelled'
  );
  if (duplicate) {
    toast('That time was just booked. Please choose another slot.');
    populateTimeDropdown(techUsername, window.selectedScheduleDate);
    return;
  }

  const prettyDate = new Date(`${window.selectedScheduleDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const prettyTime = formatTime12Hour(window.selectedScheduleTime);
  if (!confirm(`Confirm appointment with ${techName} on ${prettyDate} at ${prettyTime}?`)) return;

  const tech = techAccounts.find(t => t.username === techUsername);
  const appointment = {
    id: Date.now(),
    techId: tech?.id || null,
    techUsername,
    techName,
    customerId: currentCustPortalId,
    customerName: profile.name,
    date: window.selectedScheduleDate,
    time: window.selectedScheduleTime,
    timeSlot: window.selectedScheduleTime,
    notes: document.getElementById('scheduling-notes')?.value.trim() || '',
    createdAt: new Date().toISOString(),
    status: 'scheduled'
  };

  customerAppointments.push(appointment);
  saveCustomerAppointments();
  if (!techSchedules[techUsername]) techSchedules[techUsername] = [];
  techSchedules[techUsername].push(appointment);
  saveTechSchedules();

  const lastSubmission = profile.submissions?.[profile.submissions.length - 1];
  if (lastSubmission) {
    lastSubmission.appointmentId = appointment.id;
    lastSubmission.appointmentDate = appointment.date;
    lastSubmission.appointmentTime = appointment.time;
    saveCustProfiles();
  }

  document.querySelector('[style*="fixed"]')?.remove();
  updatePortalSelectedSlotSummary();
  if (typeof addNotification === 'function') addNotification(`✓ Appointment with ${techName} on ${prettyDate} at ${prettyTime}`, 'success');
  toast('✓ Appointment confirmed!');
}

function openTechScheduleView() {
  const tech = currentTechAccount;
  if (!tech) return;
  const techAppts = techSchedules[tech.username] || [];
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:8500;padding:20px;overflow:auto';
  modal.innerHTML = `<div style="background:var(--card);border-radius:20px;padding:28px;width:100%;max-width:700px;border:1px solid var(--border);max-height:90vh;overflow:auto">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <div>
        <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:800">📅 My Appointments</div>
        <div style="font-size:12px;color:var(--muted);margin-top:6px">${techAppts.length} appointments</div>
      </div>
      <button onclick="this.closest('[style*=fixed]').remove()" style="background:none;border:none;cursor:pointer;font-size:24px">✕</button>
    </div>
    ${techAppts.length === 0 ? `<div style="text-align:center;padding:40px 20px;color:var(--muted)"><div style="font-size:32px;margin-bottom:10px">📭</div><div>No appointments scheduled yet.</div></div>` : `<div>${techAppts.map((apt, i) => `<div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <div>
          <div style="font-weight:700">${apt.customerName}</div>
          <div style="font-size:12px;color:var(--muted)">${apt.date} at ${formatTime12Hour(apt.timeSlot || apt.time)}</div>
        </div>
        <span style="background:${apt.status === 'scheduled' ? 'rgba(232,255,71,.15)' : 'rgba(34,214,122,.15)'};color:${apt.status === 'scheduled' ? '#e8ff47' : '#22d67a'};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700">${(apt.status || 'scheduled').toUpperCase()}</span>
      </div>
      ${apt.notes ? `<div style="font-size:12px;color:var(--muted);background:rgba(255,255,255,.02);padding:8px;border-radius:6px;margin-bottom:10px">📝 ${apt.notes}</div>` : ''}
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" style="flex:1;font-size:11px;padding:6px" onclick="updateAppointmentStatus(${i},'confirmed')">✓ Confirm</button>
        <button class="btn btn-ghost" style="flex:1;font-size:11px;color:var(--red);border-color:var(--red);padding:6px" onclick="cancelAppointment(${i})">✕ Cancel</button>
      </div>
    </div>`).join('')}</div>`}
  </div>`;
  document.body.appendChild(modal);
}

function updateAppointmentStatus(index, status) {
  const tech = currentTechAccount;
  if (!tech) return;
  const techAppts = techSchedules[tech.username] || [];
  if (techAppts[index]) {
    techAppts[index].status = status;
    saveTechSchedules();
    const custApt = customerAppointments.find(a => a.id === techAppts[index].id);
    if (custApt) {
      custApt.status = status;
      saveCustomerAppointments();
    }
    openTechScheduleView();
    toast(`✓ Appointment ${status}`);
  }
}

function cancelAppointment(index) {
  if (!confirm('Cancel this appointment?')) return;
  const tech = currentTechAccount;
  if (!tech) return;
  const techAppts = techSchedules[tech.username] || [];
  if (techAppts[index]) {
    const aptId = techAppts[index].id;
    techAppts.splice(index, 1);
    saveTechSchedules();
    const custIdx = customerAppointments.findIndex(a => a.id === aptId);
    if (custIdx >= 0) {
      customerAppointments[custIdx].status = 'cancelled';
      saveCustomerAppointments();
    }
    openTechScheduleView();
    toast('✓ Cancelled');
  }
}

function initSchedulingSystem() {
  (techAccounts || []).forEach(t => {
    if (t.role === 'tech') initTechAvailability(t.username);
  });
}

initSchedulingSystem();
