'use strict';

/* ==========================================================================
   MindSense AI — client logic
   Handles: nav, model status check, multi-step form + validation,
   submission to FastAPI /predict, results rendering, print/reset.
   ========================================================================== */

const API_URL = 'http://127.0.0.1:8000';

/* -------------------------------------------------------------------------
   Header / navigation
   ------------------------------------------------------------------------- */

const header = document.getElementById('site-header');
const navToggle = document.getElementById('nav-toggle');
const siteNav = document.getElementById('site-nav');
const navLinks = document.querySelectorAll('.nav-link');

navToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Highlight active nav link based on scroll position
const sections = ['home', 'assessment', 'about']
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.dataset.section === id);
        });
      }
    });
  },
  { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
);
sections.forEach((section) => sectionObserver.observe(section));

// Reveal-on-scroll for About cards (single orchestrated effect)
const revealTargets = document.querySelectorAll('[data-reveal]');
const revealObserver = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
revealTargets.forEach((el) => revealObserver.observe(el));

/* -------------------------------------------------------------------------
   Model status check (best-effort; does not block the form)
   ------------------------------------------------------------------------- */

const statusPill = document.getElementById('model-status');
const statusText = document.getElementById('model-status-text');

async function checkModelStatus() {
  statusPill.dataset.state = 'checking';
  statusText.textContent = 'Checking model...';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_URL}/`, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      statusPill.dataset.state = 'online';
      statusText.textContent = 'AI Model Online';
    } else {
      throw new Error('bad status');
    }
  } catch (err) {
    statusPill.dataset.state = 'offline';
    statusText.textContent = 'Model offline';
  }
}
checkModelStatus();

/* -------------------------------------------------------------------------
   Toasts
   ------------------------------------------------------------------------- */

const toastRegion = document.getElementById('toast-region');

function showToast({ title, message, type = 'error' }) {
  const toast = document.createElement('div');
  toast.className = `toast${type === 'success' ? ' toast-success' : ''}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <svg class="icon" aria-hidden="true"><use href="#${type === 'success' ? 'i-check' : 'i-alert'}"/></svg>
    <span class="toast-body"><strong></strong><p></p></span>
    <button class="toast-close" type="button" aria-label="Dismiss notification">
      <svg class="icon" aria-hidden="true"><use href="#i-close"/></svg>
    </button>
  `;
  toast.querySelector('strong').textContent = title;
  toast.querySelector('p').textContent = message;
  toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
  toastRegion.appendChild(toast);
  const timer = setTimeout(() => dismissToast(toast), 7000);
  toast._timer = timer;
}

function dismissToast(toast) {
  clearTimeout(toast._timer);
  toast.classList.add('toast-out');
  setTimeout(() => toast.remove(), 250);
}

/* -------------------------------------------------------------------------
   Multi-step form
   ------------------------------------------------------------------------- */

const form = document.getElementById('assessment-form');
const panels = Array.from(form.querySelectorAll('.step-panel'));
const stepItems = Array.from(document.querySelectorAll('.step-item'));
const stepButtons = Array.from(document.querySelectorAll('.step-btn'));
const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');
const btnSubmit = document.getElementById('btn-submit');
const stepCounter = document.getElementById('step-counter');
const TOTAL_STEPS = panels.length;
let currentStep = 0;
let highestStepReached = 0;

// Fields required per step, used for validation gating
const STEP_FIELDS = [
  ['age', 'gender', 'country'],
  ['academic_level', 'study_hours'],
  ['most_used_platform', 'purpose_of_use', 'avg_daily_usage_hours', 'daily_unlocks'],
  ['physical_activity_hours', 'sleep_hours_per_night'],
  ['stress_level'],
];

function renderStepper() {
  stepItems.forEach((item, i) => {
    const btn = stepButtons[i];
    let state = 'upcoming';
    if (i === currentStep) state = 'current';
    else if (i < currentStep || i <= highestStepReached) state = i < currentStep ? 'done' : 'upcoming';
    if (i < currentStep) state = 'done';
    item.dataset.state = state;
    btn.disabled = i > highestStepReached;
  });
  stepCounter.textContent = `Step ${currentStep + 1} of ${TOTAL_STEPS}`;
}

function goToStep(index, { focus = true, scroll = focus } = {}) {
  if (index < 0 || index >= TOTAL_STEPS) return;
  panels[currentStep].hidden = true;
  currentStep = index;
  panels[currentStep].hidden = false;
  highestStepReached = Math.max(highestStepReached, currentStep);

  btnBack.disabled = currentStep === 0;
  const isLast = currentStep === TOTAL_STEPS - 1;
  btnNext.hidden = isLast;
  btnSubmit.hidden = !isLast;

  renderStepper();

  if (focus) {
    const title = panels[currentStep].querySelector('.panel-title');
    if (title) title.focus({ preventScroll: true });
  }
  if (scroll) {
    panels[currentStep].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

stepButtons.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    if (!btn.disabled) goToStep(i);
  });
});

btnBack.addEventListener('click', () => goToStep(currentStep - 1));

btnNext.addEventListener('click', () => {
  if (validateStep(currentStep)) {
    goToStep(currentStep + 1);
  }
});

/* -------------------------------------------------------------------------
   Validation
   ------------------------------------------------------------------------- */

const VALIDATORS = {
  age: (v) => {
    if (v === '') return 'Age is required.';
    const n = Number(v);
    if (!Number.isFinite(n)) return 'Enter a valid age.';
    if (n < 10 || n > 100) return 'Age must be between 10 and 100.';
    return '';
  },
  gender: (v) => (v ? '' : 'Please select a gender.'),
  country: (v) => (v ? '' : 'Please select a country.'),
  country_other: (v) => {
    const countrySelect = document.getElementById('country');
    if (countrySelect.value === 'Other' && !v.trim()) return 'Please type your country.';
    return '';
  },
  academic_level: (v) => (v ? '' : 'Please select an academic level.'),
  study_hours: (v) => rangeError(v, 0, 24, 'Study hours'),
  most_used_platform: (v) => (v ? '' : 'Please select a platform.'),
  purpose_of_use: (v) => (v ? '' : 'Please select a purpose.'),
  avg_daily_usage_hours: (v) => rangeError(v, 0, 24, 'Average daily usage'),
  daily_unlocks: (v) => {
    if (v === '') return 'Daily unlocks is required.';
    const n = Number(v);
    if (!Number.isFinite(n)) return 'Enter a valid number.';
    if (n < 0) return 'Daily unlocks cannot be negative.';
    if (!Number.isInteger(n)) return 'Enter a whole number.';
    return '';
  },
  physical_activity_hours: (v) => rangeError(v, 0, 24, 'Physical activity'),
  sleep_hours_per_night: (v) => rangeError(v, 0, 24, 'Sleep'),
  stress_level: () => {
    const checked = form.querySelector('input[name="stress_level"]:checked');
    return checked ? '' : 'Please choose a stress level.';
  },
};

function rangeError(v, min, max, label) {
  if (v === '') return `${label} is required.`;
  const n = Number(v);
  if (!Number.isFinite(n)) return 'Enter a valid number.';
  if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
  return '';
}

function getFieldValue(name) {
  if (name === 'stress_level') {
    const checked = form.querySelector('input[name="stress_level"]:checked');
    return checked ? checked.value : '';
  }
  const el = document.getElementById(name);
  return el ? el.value : '';
}

function setFieldError(name, message) {
  const errorEl = document.getElementById(`${name}-error`);
  const fieldWrap = form.querySelector(`[data-field="${name}"]`);
  if (errorEl) errorEl.textContent = message;
  if (fieldWrap) fieldWrap.classList.toggle('invalid', Boolean(message));
}

function validateField(name) {
  const validator = VALIDATORS[name];
  if (!validator) return true;
  const value = getFieldValue(name);
  const message = validator(value);
  setFieldError(name, message);
  return !message;
}

function validateStep(stepIndex) {
  const fields = STEP_FIELDS[stepIndex];
  let firstInvalid = null;
  let valid = true;
  fields.forEach((name) => {
    // Skip country_other unless "Other" is selected
    if (name === 'country_other') return;
    const ok = validateField(name);
    if (!ok) {
      valid = false;
      if (!firstInvalid) firstInvalid = name;
    }
  });
  // Special case: country -> country_other
  if (fields.includes('country')) {
    const countrySelect = document.getElementById('country');
    if (countrySelect.value === 'Other') {
      const ok = validateField('country_other');
      if (!ok) {
        valid = false;
        firstInvalid = firstInvalid || 'country_other';
      }
    }
  }
  if (firstInvalid) {
    const el = document.getElementById(firstInvalid) || form.querySelector(`[data-field="${firstInvalid}"] input`);
    if (el) el.focus();
  }
  return valid;
}

function validateAllSteps() {
  let allValid = true;
  let firstBadStep = null;
  STEP_FIELDS.forEach((fields, i) => {
    const ok = validateStep(i) || fields.every((n) => n === 'country_other');
  });
  for (let i = 0; i < TOTAL_STEPS; i++) {
    const ok = stepIsValid(i);
    if (!ok && firstBadStep === null) firstBadStep = i;
    if (!ok) allValid = false;
  }
  return { allValid, firstBadStep };
}

function stepIsValid(stepIndex) {
  const fields = STEP_FIELDS[stepIndex].filter((f) => f !== 'country_other');
  let ok = fields.every((name) => !VALIDATORS[name](getFieldValue(name)));
  if (stepIndex === 0) {
    const countrySelect = document.getElementById('country');
    if (countrySelect.value === 'Other') {
      ok = ok && !VALIDATORS.country_other(getFieldValue('country_other'));
    }
  }
  return ok;
}

// Live-validate on blur/change for friendlier feedback
Object.keys(VALIDATORS).forEach((name) => {
  const el = name === 'stress_level' ? null : document.getElementById(name);
  if (el) {
    el.addEventListener('blur', () => validateField(name));
    el.addEventListener('input', () => {
      const fieldWrap = form.querySelector(`[data-field="${name}"]`);
      if (fieldWrap && fieldWrap.classList.contains('invalid')) validateField(name);
    });
  }
});
form.querySelectorAll('input[name="stress_level"]').forEach((radio) => {
  radio.addEventListener('change', () => validateField('stress_level'));
});

/* -------------------------------------------------------------------------
   Country "Other" reveal
   ------------------------------------------------------------------------- */

const countrySelect = document.getElementById('country');
const countryOtherField = document.getElementById('country-other-field');
const countryOtherInput = document.getElementById('country_other');

countrySelect.addEventListener('change', () => {
  const isOther = countrySelect.value === 'Other';
  countryOtherField.hidden = !isOther;
  if (isOther) {
    countryOtherInput.focus();
  } else {
    countryOtherInput.value = '';
    setFieldError('country_other', '');
  }
});

/* -------------------------------------------------------------------------
   Sliders: sync range <-> number, live readout
   ------------------------------------------------------------------------- */

document.querySelectorAll('[data-range]').forEach((wrap) => {
  const slider = wrap.querySelector('.range-slider');
  const number = wrap.querySelector('.range-number');
  if (!slider || !number) return;

  const sync = (source) => {
    if (source === 'slider') {
      number.value = slider.value;
    } else {
      let v = number.value;
      if (v !== '') {
        const clamped = Math.min(Number(number.max || slider.max), Math.max(Number(number.min || slider.min), Number(v)));
        if (Number(v) > Number(slider.max)) {
          // allow number to exceed slider max (e.g. daily unlocks) without forcing slider off-range
          slider.value = slider.max;
        } else {
          slider.value = clamped;
        }
      }
    }
  };

  slider.addEventListener('input', () => sync('slider'));
  number.addEventListener('input', () => sync('number'));
});

/* -------------------------------------------------------------------------
   Submit
   ------------------------------------------------------------------------- */

const assessmentFlow = document.getElementById('assessment-flow');
const loadingPanel = document.getElementById('loading-panel');
const resultsView = document.getElementById('results');

let lastSubmittedData = null;

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const { allValid, firstBadStep } = validateAllSteps();
  if (!allValid) {
    goToStep(firstBadStep);
    showToast({
      title: 'Check your answers',
      message: 'A few fields still need attention before we can continue.',
      type: 'error',
    });
    return;
  }

  const country = countrySelect.value === 'Other' ? countryOtherInput.value.trim() : countrySelect.value;

  const payload = {
    age: Number(document.getElementById('age').value),
    gender: document.getElementById('gender').value,
    country,
    academic_level: document.getElementById('academic_level').value,
    most_used_platform: document.getElementById('most_used_platform').value,
    purpose_of_use: document.getElementById('purpose_of_use').value,
    avg_daily_usage_hours: Number(document.getElementById('avg_daily_usage_hours').value),
    daily_unlocks: Number(document.getElementById('daily_unlocks').value),
    study_hours: Number(document.getElementById('study_hours').value),
    physical_activity_hours: Number(document.getElementById('physical_activity_hours').value),
    sleep_hours_per_night: Number(document.getElementById('sleep_hours_per_night').value),
    stress_level: form.querySelector('input[name="stress_level"]:checked').value,
  };

  lastSubmittedData = payload;
  await submitAssessment(payload);
});

async function submitAssessment(payload) {
  btnSubmit.disabled = true;
  btnSubmit.classList.add('is-loading');
  btnBack.disabled = true;

  form.hidden = true;
  loadingPanel.hidden = false;

  const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 900));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const fetchPromise = fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const [response] = await Promise.all([fetchPromise, minLoadingTime]);
    clearTimeout(timeout);

    if (!response.ok) {
      let detail = '';
      try {
        const errJson = await response.json();
        detail = typeof errJson.detail === 'string' ? errJson.detail : '';
      } catch (_) {
        /* ignore parse errors */
      }
      throw new HttpError(response.status, detail);
    }

    const data = await response.json();
    if (typeof data.predicted_mental_health_score !== 'number' || Number.isNaN(data.predicted_mental_health_score)) {
      throw new Error('invalid_response');
    }

    renderResults(data.predicted_mental_health_score, payload);
    statusPill.dataset.state = 'online';
    statusText.textContent = 'AI Model Online';
  } catch (err) {
    handleSubmitError(err);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.classList.remove('is-loading');
    btnBack.disabled = false;
    loadingPanel.hidden = true;
  }
}

class HttpError extends Error {
  constructor(status, detail) {
    super('http_error');
    this.status = status;
    this.detail = detail;
  }
}

function handleSubmitError(err) {
  form.hidden = false;

  if (err.name === 'AbortError') {
    showToast({
      title: 'Request timed out',
      message: 'The AI model took too long to respond. Please try again.',
    });
    return;
  }

  if (err instanceof HttpError) {
    if (err.status === 422) {
      showToast({
        title: 'Unable to connect to the AI model',
        message: err.detail || 'The server rejected the submitted data. Please review your answers and try again.',
      });
    } else if (err.status >= 500) {
      showToast({
        title: 'Unable to connect to the AI model',
        message: 'The prediction service ran into a problem. Please try again shortly.',
      });
    } else {
      showToast({
        title: 'Unable to connect to the AI model',
        message: err.detail || `The server responded with an error (status ${err.status}).`,
      });
    }
    return;
  }

  if (err instanceof TypeError || err.message === 'Failed to fetch') {
    showToast({
      title: 'Unable to connect to the AI model',
      message: `Please make sure the FastAPI backend is running at ${API_URL}.`,
    });
    statusPill.dataset.state = 'offline';
    statusText.textContent = 'Model offline';
    return;
  }

  showToast({
    title: 'Something went wrong',
    message: 'We could not process the response from the AI model. Please try again.',
  });
}

/* -------------------------------------------------------------------------
   Results rendering
   ------------------------------------------------------------------------- */

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 92; // r=92, matches SVG
const SCORE_MAX = 10; // model predicts a score on a 0–10 scale

function bandFor(score) {
  if (score < 4) return { key: 'lower', label: 'lower score range' };
  if (score < 6) return { key: 'moderate', label: 'moderate score range' };
  if (score < 8) return { key: 'higher', label: 'higher score range' };
  return { key: 'very-high', label: 'very high score range' };
}

function renderResults(rawScore, payload) {
  const score = Math.round(rawScore * 100) / 100;
  const clamped = Math.min(SCORE_MAX, Math.max(0, score));
  const outOfRange = score !== clamped;

  assessmentFlow.hidden = true;
  resultsView.hidden = false;

  const resultsTitle = document.getElementById('results-title');
  resultsTitle.focus({ preventScroll: false });
  resultsView.scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.getElementById('score-value').textContent = score.toFixed(2);
  document.getElementById('score-note').hidden = !outOfRange;

  const band = bandFor(clamped);
  const badge = document.getElementById('band-badge');
  const badgeLabels = { lower: 'Lower range', moderate: 'Moderate range', higher: 'Higher range', 'very-high': 'Very high range' };
  badge.textContent = badgeLabels[band.key];

  document.getElementById('score-text').textContent =
    `Your model-predicted score falls within the ${band.label}. This reflects the answers you gave and is not a clinical assessment.`;

  // Gauge fill animation
  const gaugeFill = document.getElementById('gauge-fill');
  gaugeFill.style.strokeDasharray = String(GAUGE_CIRCUMFERENCE);
  gaugeFill.style.strokeDashoffset = String(GAUGE_CIRCUMFERENCE);
  requestAnimationFrame(() => {
    const offset = GAUGE_CIRCUMFERENCE * (1 - clamped / SCORE_MAX);
    gaugeFill.style.strokeDashoffset = String(offset);
  });

  // Scale marker position + active band
  document.getElementById('scale-marker').style.left = `${(clamped / SCORE_MAX) * 100}%`;
  document.querySelectorAll('.band-list li').forEach((li) => {
    li.dataset.active = String(li.dataset.band === band.key);
  });

  // Summary cards
  document.getElementById('sum-digital').textContent = `${payload.avg_daily_usage_hours} hrs/day`;
  document.getElementById('sum-digital-meta').textContent = `${payload.most_used_platform} · ${payload.daily_unlocks} unlocks/day`;

  document.getElementById('sum-sleep').textContent = `${payload.sleep_hours_per_night} hrs/night`;
  document.getElementById('sum-sleep-meta').textContent = `${payload.physical_activity_hours} hrs/day activity`;

  document.getElementById('sum-study').textContent = `${payload.study_hours} hrs/day`;
  document.getElementById('sum-study-meta').textContent = payload.academic_level;

  document.getElementById('sum-stress').textContent = payload.stress_level;
  const stressLevels = { Low: 1, Medium: 2, High: 3, 'Very High': 4 };
  document.getElementById('sum-stress-meter').dataset.level = String(stressLevels[payload.stress_level] || 1);

  // Print metadata
  const printMeta = document.getElementById('print-meta');
  printMeta.textContent = `MindSense AI — assessment generated ${new Date().toLocaleString()}`;
}

/* -------------------------------------------------------------------------
   Result actions
   ------------------------------------------------------------------------- */

document.getElementById('btn-again').addEventListener('click', resetAssessment);
document.getElementById('btn-home').addEventListener('click', () => {
  resetAssessment();
  document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('btn-print').addEventListener('click', () => window.print());

function resetAssessment() {
  form.reset();
  form.hidden = false;
  resultsView.hidden = true;
  assessmentFlow.hidden = false;

  countryOtherField.hidden = true;
  countryOtherInput.value = '';

  form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
  form.querySelectorAll('.field.invalid').forEach((el) => el.classList.remove('invalid'));

  // Reset sliders to defaults matching HTML value attributes
  document.querySelectorAll('[data-range]').forEach((wrap) => {
    const slider = wrap.querySelector('.range-slider');
    const number = wrap.querySelector('.range-number');
    if (slider && number) {
      const defaultVal = number.getAttribute('value');
      number.value = defaultVal;
      slider.value = defaultVal;
    }
  });

  highestStepReached = 0;
  goToStep(0, { focus: false });
  document.getElementById('assessment').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* -------------------------------------------------------------------------
   Init
   ------------------------------------------------------------------------- */

goToStep(0, { focus: false });
