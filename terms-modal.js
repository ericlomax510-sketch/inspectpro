// ══════════════════════════════════════════
// PRIVACY POLICY & TERMS MODAL FUNCTIONS
// ══════════════════════════════════════════

let currentUserType = null; // 'tech' or 'customer'

function showTechnicianTerms() {
  currentUserType = 'tech';
  const modal = document.getElementById('terms-modal');
  const title = document.getElementById('terms-modal-title');
  const content = document.getElementById('terms-modal-content');
  
  title.textContent = '🔧 Technician Terms & Agreement';
  
  content.innerHTML = `
    <h4 style="color:var(--accent);margin-top:0">Professional Technician Agreement</h4>
    
    <p><strong>1. Professional Standards</strong></p>
    <p>As a technician on InspectPro, you agree to:</p>
    <ul style="margin-left:16px">
      <li>Provide honest, accurate vehicle inspections</li>
      <li>Follow safety and industry best practices</li>
      <li>Maintain professional conduct at all times</li>
      <li>Respect customer privacy and confidentiality</li>
      <li>Document work accurately with photos and reports</li>
    </ul>
    
    <p><strong>2. Booking Fee</strong></p>
    <p>Customers pay a $3.00 booking fee when you accept their job. If you decline after a charge, InspectPro triggers an automatic refund and logs the refund event.</p>
    
    <p><strong>3. Data & Photos</strong></p>
    <p>All inspection photos, videos, and customer information is protected and stored securely on your device. You agree not to share customer data with third parties.</p>
    
    <p><strong>4. PDF Reports</strong></p>
    <p>You agree to generate professional, accurate PDF reports that clearly document:</p>
    <ul style="margin-left:16px">
      <li>Vehicle inspection findings</li>
      <li>Work completed</li>
      <li>Recommended services</li>
      <li>Professional recommendations</li>
    </ul>
    
    <p><strong>5. Liability</strong></p>
    <p>InspectPro is a platform for documentation. You are responsible for the quality and accuracy of your inspections. Inspection results are professional opinions only.</p>
    
    <p><strong>6. Compliance</strong></p>
    <p>You are responsible for maintaining any necessary licenses and certifications required in your area.</p>
    
    <p style="font-size:12px;color:rgba(255,255,255,.5);margin-top:20px">By proceeding, you accept these terms and our general Terms of Service & Privacy Policy.</p>
  `;
  
  modal.style.display = 'flex';
}

function showCustomerTerms() {
  currentUserType = 'customer';
  const modal = document.getElementById('terms-modal');
  const title = document.getElementById('terms-modal-title');
  const content = document.getElementById('terms-modal-content');
  
  title.textContent = '🚗 Customer Terms & Privacy Agreement';
  
  content.innerHTML = `
    <h4 style="color:var(--blue);margin-top:0">Customer Terms of Service & Privacy</h4>
    
    <p><strong>1. Booking Fee</strong></p>
    <p>When you submit an inspection request and a technician accepts, a $3.00 booking fee will be charged to your payment method. If the technician declines the job after charge, InspectPro automatically starts a refund to the same payment method.</p>
    
    <p><strong>2. Your Data & Privacy</strong></p>
    <p>We respect your privacy. Your personal data (name, phone, email, vehicle info) is:</p>
    <ul style="margin-left:16px">
      <li>Stored locally on your device</li>
      <li>Never sold to third parties</li>
      <li>Protected with encryption</li>
      <li>Deletable at any time</li>
    </ul>
    
    <p><strong>3. Photos & Videos</strong></p>
    <p>Any photos or videos you upload are for the technician to review. They remain your property and are stored securely.</p>
    
    <p><strong>4. Payment Processing</strong></p>
    <p>Payment is handled by Stripe, a PCI-compliant payment processor. We do not store your full credit card number. Only the last 4 digits are saved for reference.</p>
    
    <p><strong>5. Inspection Reports</strong></p>
    <p>After the technician completes your inspection, you'll receive a professional PDF report with findings and recommendations. This is for informational purposes only.</p>
    
    <p><strong>6. Account Termination</strong></p>
    <p>You can delete your account anytime. All your data will be permanently removed from the app within 30 days.</p>
    
    <p><strong>7. No Warranty</strong></p>
    <p>InspectPro connects you with technicians but does not guarantee the quality of their work. Consult qualified professionals for major decisions.</p>
    
    <p style="font-size:12px;color:rgba(255,255,255,.5);margin-top:20px">By proceeding, you agree to these terms, our full Terms of Service, and Privacy Policy.</p>
  `;
  
  modal.style.display = 'flex';
}

function closeTermsModal() {
  document.getElementById('terms-modal').style.display = 'none';
}

function agreeToTerms() {
  if (currentUserType === 'tech') {
    const checkbox = document.getElementById('tech-agree-checkbox');
    if (checkbox) checkbox.checked = true;
    closeTermsModal();
  } else if (currentUserType === 'customer') {
    const checkbox = document.getElementById('cust-agree-checkbox');
    if (checkbox) checkbox.checked = true;
    closeTermsModal();
  }
}

// Override techRegister to check agreement
const originalTechRegister = techRegister;
function techRegister() {
  const agreeCheckbox = document.getElementById('tech-agree-checkbox');
  if (!agreeCheckbox || !agreeCheckbox.checked) {
    document.getElementById('tr-error').textContent = 'You must agree to the Technician Terms to proceed.';
    return;
  }
  originalTechRegister();
}

// Override custRegister to check agreement
const originalCustRegister = custRegister;
function custRegister() {
  const agreeCheckbox = document.getElementById('cust-agree-checkbox');
  if (!agreeCheckbox || !agreeCheckbox.checked) {
    document.getElementById('cr-error').textContent = 'You must agree to the Terms of Service & Privacy Policy to proceed.';
    return;
  }
  originalCustRegister();
}
