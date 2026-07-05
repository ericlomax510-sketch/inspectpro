// ══════════════════════════════════════════
// MECHANIC RADIUS SEARCH (25-50 MILE FILTER)
// ══════════════════════════════════════════

// Simple geolocation distance calculation (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Store mechanic locations (would come from your backend)
function saveMechanicLocation(techUsername, latitude, longitude) {
  try {
    let locations = JSON.parse(localStorage.getItem('ip_mechanic_locations') || '{}');
    locations[techUsername] = { latitude, longitude, savedAt: new Date().toISOString() };
    localStorage.setItem('ip_mechanic_locations', JSON.stringify(locations));
  } catch(e) {
    console.error('Error saving mechanic location:', e);
  }
}

function getMechanicLocation(techUsername) {
  try {
    const locations = JSON.parse(localStorage.getItem('ip_mechanic_locations') || '{}');
    return locations[techUsername] || null;
  } catch(e) {
    return null;
  }
}

// Get customer's current location
function getCustomerLocation() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => {
          // Location access denied - use default or manual entry
          resolve(null);
        }
      );
    } else {
      resolve(null);
    }
  });
}

// Search mechanics within radius (25-50 miles)
async function searchMechanicsInRadius(radiusMiles = 25) {
  const custLocation = await getCustomerLocation();
  if (!custLocation) {
    toast('⚠ Enable location access or enter zip code to search nearby mechanics');
    return null;
  }

  const mechanicsInRadius = [];
  const locations = JSON.parse(localStorage.getItem('ip_mechanic_locations') || '{}');

  techAccounts.forEach(tech => {
    const techLocation = locations[tech.username];
    if (techLocation) {
      const distance = calculateDistance(
        custLocation.latitude, custLocation.longitude,
        techLocation.latitude, techLocation.longitude
      );
      if (distance <= radiusMiles) {
        mechanicsInRadius.push({
          ...tech,
          distance: Math.round(distance * 10) / 10,
          location: techLocation
        });
      }
    }
  });

  // Sort by distance
  return mechanicsInRadius.sort((a, b) => a.distance - b.distance);
}

// Render mechanics within radius in customer portal
async function renderMechanicsNearby(radiusMiles = 25) {
  const mechanics = await searchMechanicsInRadius(radiusMiles);
  const container = document.getElementById('nearby-mechanics-container');
  if (!container) return;

  if (!mechanics || !mechanics.length) {
    container.innerHTML = `
      <div style="background:rgba(255,184,0,.08);border:1px solid rgba(255,184,0,.25);border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:13px;color:rgba(255,255,255,.6)">
          No technicians found within ${radiusMiles} miles. Try expanding your search radius.
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div style="margin-bottom:12px;font-size:12px;color:rgba(255,255,255,.4)">
      Found ${mechanics.length} technician${mechanics.length !== 1 ? 's' : ''} within ${radiusMiles} miles
    </div>
  ` + mechanics.map(m => {
    const initials = m.name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
    return `
      <div onclick="selectMechanicFromRadius('${m.username}','${m.name}')" 
           style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.05);border:1px solid rgba(232,255,71,.15);border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;transition:all 0.2s">
        <div style="width:40px;height:40px;border-radius:10px;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;color:var(--accent)">${initials}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px;color:#fff">${m.name}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:2px">📍 ${m.distance} miles away · ${getPortalStars(m.username)}</div>
        </div>
        <div style="font-size:12px;font-weight:700;color:var(--accent);background:rgba(232,255,71,.08);padding:6px 12px;border-radius:20px">Select →</div>
      </div>`;
  }).join('');
}

function selectMechanicFromRadius(username, name) {
  setSendToTech(username, name);
  toast(`✓ Selected ${name}`);
}

// Allow customer to manually set search radius
function setRadiusSearchRange(miles) {
  const btn = document.getElementById('radius-range-display');
  if (btn) btn.textContent = `📍 Within ${miles} miles`;
  renderMechanicsNearby(miles);
}
