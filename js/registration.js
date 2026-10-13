/**
 * REGISTRATION MODULE
 * Input validation, participant session creation, and error display
 */
import { App } from './state.js';
import { saveSession } from './utils/storage.js';
import { generateId, showToast } from './utils/dom.js';
import { openDashboard } from './dashboard.js';

export function initRegistration() {
  const regForm = document.getElementById('registration-form');
  if (!regForm) return;

  const regFields = {
    name: document.getElementById('reg-name'),
    phone: document.getElementById('reg-phone'),
    email: document.getElementById('reg-email'),
    consent: document.getElementById('reg-consent')
  };

  const touched = { name: false, phone: false, email: false, consent: false };

  function validateName(v) {
    if (!v || v.trim().length === 0) return 'Name is required.';
    if (v.trim().length < 2) return 'Name must be at least 2 characters.';
    return '';
  }

  function validatePhone(v) {
    if (!v || v.trim().length === 0) return 'Phone number is required.';
    const digits = v.replace(/[\s\-()]/g, '');
    if (!/^\d{7,15}$/.test(digits)) return 'Enter a valid phone number (7-15 digits).';
    return '';
  }

  function validateEmail(v) {
    if (!v || v.trim().length === 0) return ''; // Email is optional
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(v.trim())) return 'Enter a valid email address.';
    return '';
  }

  function showFieldError(field, msg) {
    const errEl = document.getElementById('err-' + field);
    const inputEl = regFields[field];
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.toggle('visible', !!msg);
    }
    if (inputEl && inputEl.type !== 'checkbox') {
      inputEl.classList.toggle('error', !!msg);
    }
  }

  function validateField(field) {
    if (!regFields[field]) return true;
    let err = '';
    const v = regFields[field].value;

    if (field === 'name') err = validateName(v);
    else if (field === 'phone') err = validatePhone(v);
    else if (field === 'email') err = validateEmail(v);
    else if (field === 'consent') {
      if (!regFields.consent.checked) err = 'You must agree to the terms to proceed.';
    }

    if (touched[field]) {
      showFieldError(field, err);
    }
    return !err;
  }

  // Real-time validation listeners
  ['name', 'phone', 'email'].forEach(f => {
    const el = regFields[f];
    if (!el) return;
    el.addEventListener('blur', () => {
      touched[f] = true;
      validateField(f);
    });
    el.addEventListener('input', () => {
      if (touched[f]) validateField(f);
    });
  });

  if (regFields.consent) {
    regFields.consent.addEventListener('change', () => {
      touched.consent = true;
      validateField('consent');
    });
  }

  // Form submission
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    Object.keys(touched).forEach(k => { touched[k] = true; });

    const valid =
      validateField('name') &&
      validateField('phone') &&
      validateField('email') &&
      validateField('consent');

    if (!valid) {
      const btn = regForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 500);
      }
      return;
    }

    const fullName = regFields.name.value.trim();
    const countryCode = document.getElementById('reg-country-code')?.value || '+91';
    const phone = regFields.phone.value.trim();
    const email = regFields.email.value.trim();

    App.participant = {
      id: generateId(),
      name: fullName,
      phone: countryCode + ' ' + phone,
      email: email || 'N/A',
      consent: true,
      registeredAt: new Date().toISOString()
    };

    saveSession();
    showToast(`Welcome, ${fullName}! Registration complete.`, 'success');
    openDashboard();
  });
}
