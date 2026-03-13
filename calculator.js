/**
 * Painted Pieces Art - Pharmacy Costing Calculator
 * Core calculation logic + UI wiring
 *
 * Verified formulas (matching Excel output & test cases):
 *   Retail w/Profit = Estimated Cost / (1 - gmPercent)
 *   Sell Price      = Retail + Install Cost + Other Charges + Overhead
 *   Net Profit      = Retail - Estimated Cost
 */

// ─────────────────────────────────────────────
//  Default Settings
// ─────────────────────────────────────────────
const DEFAULTS = {
  vinylCostPerSqFt: 7.65,
  perforatedVinylCost: 9.50,
  adminRate: 50,
  computerRate: 35,
};

// GM Tiers: { label, gmPercent, overheadMultiplier }
// All tiers use overheadMultiplier: 90 (matching Chet's formula: Total Hours × $90)
const GM_TIERS = [
  { label: '20% GM', gmPercent: 0.20, overheadMultiplier: 90 },
  { label: '30% GM', gmPercent: 0.30, overheadMultiplier: 90 },
  { label: '40% GM', gmPercent: 0.40, overheadMultiplier: 90 },  // default / highlighted
  { label: '50% GM', gmPercent: 0.50, overheadMultiplier: 90 },
  { label: '60% GM', gmPercent: 0.60, overheadMultiplier: 90 },
];

// ─────────────────────────────────────────────
//  Settings persistence (localStorage)
// ─────────────────────────────────────────────
function loadSettings() {
  try {
    const saved = localStorage.getItem('ppag_settings');
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem('ppag_settings', JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

// ─────────────────────────────────────────────
//  Core Calculations
// ─────────────────────────────────────────────

/**
 * Main calculation function.
 * @param {object} inputs  - user inputs
 * @param {object} settings - rate settings
 * @returns {object} full result object
 */
function calculate(inputs, settings) {
  const {
    squareFootage = 0,
    adminHours = 1,
    computerHours = 6,
    installCost = 0,
    otherCharges = 0,
    commission = 0,
    ipaDiscount = false,
    usePerforated = false,
  } = inputs;

  const {
    vinylCostPerSqFt = DEFAULTS.vinylCostPerSqFt,
    perforatedVinylCost = DEFAULTS.perforatedVinylCost,
    adminRate = DEFAULTS.adminRate,
    computerRate = DEFAULTS.computerRate,
  } = settings;

  // Step 1 – Labor
  const adminCost    = adminHours * adminRate;
  const computerCost = computerHours * computerRate;
  const totalLabor   = adminCost + computerCost;
  const totalHours   = adminHours + computerHours;

  // Step 2 – Vinyl
  const activeVinylRate = usePerforated ? perforatedVinylCost : vinylCostPerSqFt;
  const vinylCost = squareFootage * activeVinylRate;

  // Step 3 – Estimated Cost (base for all tier calculations)
  const estimatedCost = totalLabor + vinylCost;

  // Step 4 – Non-Profit Total (Install + Other Charges)
  const nonProfitTotal = installCost + otherCharges;

  // Step 5 – Final Cost (display only)
  const finalCost = estimatedCost + nonProfitTotal;

  // Step 6 & 7 – Per-tier pricing
  const tiers = GM_TIERS.map((tier) => {
    const gmRate           = 1 - tier.gmPercent;           // e.g. 0.60 for 40% GM
    const retailWithProfit = estimatedCost / gmRate;        // verified against test cases
    const overhead         = totalHours * tier.overheadMultiplier;
    const sellPrice        = retailWithProfit + installCost + otherCharges + overhead;
    const netProfit        = retailWithProfit - estimatedCost;
    const ipaPrice         = ipaDiscount ? sellPrice * 0.9 : null;

    return {
      label:           tier.label,
      gmPercent:       tier.gmPercent,
      retailWithProfit,
      installCost,
      otherCharges,
      overhead,
      sellPrice,
      netProfit,
      ipaPrice,
    };
  });

  return {
    // Inputs echo
    squareFootage,
    adminHours,
    computerHours,
    installCost,
    otherCharges,
    commission,
    ipaDiscount,
    usePerforated,

    // Intermediates
    adminCost,
    computerCost,
    totalLabor,
    totalHours,
    activeVinylRate,
    vinylCost,
    estimatedCost,
    nonProfitTotal,
    finalCost,

    // Pricing tiers
    tiers,
  };
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function fmt(n, decimals = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCurrency(n) {
  return '$' + fmt(n);
}

// ─────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────
let currentSettings      = loadSettings();
let currentResult        = null;
let currentDocumentType  = 'estimate';  // 'estimate' or 'actual'
let estimateData         = null;        // Stored estimate for comparison
let changeTracking       = {};          // Track field changes vs estimate

// ─────────────────────────────────────────────
//  Input Reading
// ─────────────────────────────────────────────
function getInputs() {
  return {
    squareFootage:  parseFloat(document.getElementById('squareFootage').value)  || 0,
    adminHours:     parseFloat(document.getElementById('adminHours').value)     || 0,
    computerHours:  parseFloat(document.getElementById('computerHours').value)  || 0,
    installCost:    parseFloat(document.getElementById('installCost').value)    || 0,
    otherCharges:   parseFloat(document.getElementById('otherCharges').value)   || 0,
    commission:     parseFloat(document.getElementById('commission').value)     || 0,
    ipaDiscount:    document.getElementById('ipaMember').checked,
    usePerforated:  document.getElementById('usePerforated') ? document.getElementById('usePerforated').checked : false,
  };
}

// ─────────────────────────────────────────────
//  Rendering
// ─────────────────────────────────────────────
function renderSummary(result) {
  document.getElementById('sum-totalHours').textContent    = result.totalHours;
  document.getElementById('sum-squareFt').textContent      = result.squareFootage.toLocaleString();
  document.getElementById('sum-vinylCost').textContent     = fmtCurrency(result.vinylCost);
  document.getElementById('sum-adminCost').textContent     = fmtCurrency(result.adminCost);
  document.getElementById('sum-computerCost').textContent  = fmtCurrency(result.computerCost);
  document.getElementById('sum-totalLabor').textContent    = fmtCurrency(result.totalLabor);
  document.getElementById('sum-estimatedCost').textContent = fmtCurrency(result.estimatedCost);
  document.getElementById('sum-otherCharges').textContent  = fmtCurrency(result.otherCharges);
  document.getElementById('sum-finalCost').textContent     = fmtCurrency(result.finalCost);
  document.getElementById('sum-commission').textContent    = fmtCurrency(result.commission);
}

function renderTiers(result) {
  const tbody = document.getElementById('tiersTableBody');
  tbody.innerHTML = '';

  result.tiers.forEach((tier) => {
    const isDefault = tier.gmPercent === 0.40;
    const tr = document.createElement('tr');
    if (isDefault) tr.classList.add('tier-highlight');

    const ipaSuffix = tier.ipaPrice !== null
      ? ` <span class="ipa-price">(${fmtCurrency(tier.ipaPrice)})</span>`
      : '';

    tr.innerHTML = `
      <td class="tier-label">${tier.label}</td>
      <td>${fmtCurrency(tier.retailWithProfit)}</td>
      <td>${fmtCurrency(tier.installCost)}</td>
      <td>${fmtCurrency(tier.otherCharges)}</td>
      <td>${fmtCurrency(tier.overhead)}</td>
      <td class="sell-price">${fmtCurrency(tier.sellPrice)}${ipaSuffix}</td>
      <td class="net-profit">${fmtCurrency(tier.netProfit)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function runCalculation() {
  const inputs = getInputs();
  currentResult = calculate(inputs, currentSettings);
  renderSummary(currentResult);
  renderTiers(currentResult);

  // Show results section if sq footage entered
  const resultsEl = document.getElementById('resultsSection');
  if (inputs.squareFootage > 0) {
    resultsEl.classList.add('visible');
  } else {
    resultsEl.classList.remove('visible');
  }

  // Update variance if in actual mode
  if (currentDocumentType === 'actual' && estimateData) {
    updateVarianceSummary();
  }
}

// ─────────────────────────────────────────────
//  Client Details
// ─────────────────────────────────────────────
function getClientDetails() {
  return {
    jobName:      (document.getElementById('jobName')?.value      || '').trim(),
    jobAddress:   (document.getElementById('jobAddress')?.value   || '').trim(),
    contactName:  (document.getElementById('contactName')?.value  || '').trim(),
    contactPhone: (document.getElementById('contactPhone')?.value || '').trim(),
    contactEmail: (document.getElementById('contactEmail')?.value || '').trim(),
  };
}

function loadClientDetails(client) {
  if (!client) return;
  document.getElementById('jobName').value      = client.jobName      || '';
  document.getElementById('jobAddress').value   = client.jobAddress   || '';
  document.getElementById('contactName').value  = client.contactName  || '';
  document.getElementById('contactPhone').value = client.contactPhone || '';
  document.getElementById('contactEmail').value = client.contactEmail || '';
}

function clearClientDetails() {
  ['jobName', 'jobAddress', 'contactName', 'contactPhone', 'contactEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

// ─────────────────────────────────────────────
//  Reset
// ─────────────────────────────────────────────
function resetForm() {
  document.getElementById('squareFootage').value = '';
  document.getElementById('adminHours').value    = 1;
  document.getElementById('computerHours').value = 6;
  document.getElementById('installCost').value   = '';
  document.getElementById('otherCharges').value  = '';
  document.getElementById('commission').value    = '';
  document.getElementById('ipaMember').checked   = false;
  if (document.getElementById('usePerforated')) {
    document.getElementById('usePerforated').checked = false;
  }
  clearClientDetails();
  document.getElementById('resultsSection').classList.remove('visible');
  currentResult = null;
  currentDocumentType = 'estimate';
  estimateData = null;
  changeTracking = {};
  removeAllChangeIndicators();
  document.getElementById('varianceSection').style.display = 'none';

  // Reset toggle buttons
  document.getElementById('btnEstimate').classList.add('active');
  document.getElementById('btnActual').classList.remove('active');
}

// ─────────────────────────────────────────────
//  Settings
// ─────────────────────────────────────────────
function initSettings() {
  document.getElementById('setting-vinyl').value      = currentSettings.vinylCostPerSqFt;
  document.getElementById('setting-perforated').value = currentSettings.perforatedVinylCost;
  document.getElementById('setting-adminRate').value  = currentSettings.adminRate;
  document.getElementById('setting-compRate').value   = currentSettings.computerRate;
}

function applySettings() {
  currentSettings = {
    vinylCostPerSqFt:    parseFloat(document.getElementById('setting-vinyl').value)      || DEFAULTS.vinylCostPerSqFt,
    perforatedVinylCost: parseFloat(document.getElementById('setting-perforated').value) || DEFAULTS.perforatedVinylCost,
    adminRate:           parseFloat(document.getElementById('setting-adminRate').value)  || DEFAULTS.adminRate,
    computerRate:        parseFloat(document.getElementById('setting-compRate').value)   || DEFAULTS.computerRate,
  };
  saveSettings(currentSettings);

  // Update rate labels in the form
  document.getElementById('label-adminRate').textContent    = `@ $${currentSettings.adminRate}/hr`;
  document.getElementById('label-computerRate').textContent = `@ $${currentSettings.computerRate}/hr`;

  showToast('Settings saved!');
  runCalculation();
}

// ─────────────────────────────────────────────
//  Toast
// ─────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ─────────────────────────────────────────────
//  Save Job
// ─────────────────────────────────────────────
function saveJob() {
  const inputs = getInputs();

  if (inputs.squareFootage === 0) {
    showToast('Enter square footage first.');
    return;
  }

  const client = getClientDetails();

  const jobData = {
    version: '1.0',
    documentType: currentDocumentType,
    timestamp: new Date().toISOString(),
    client: client,
    inputs: inputs,
    settings: currentSettings,
  };

  // If this is an actual with loaded estimate, include estimate data
  if (currentDocumentType === 'actual' && estimateData) {
    jobData.estimateData = {
      inputs: estimateData.inputs,
    };
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const sqFt = inputs.squareFootage ? `_${inputs.squareFootage}sqft` : '';
  const docType = currentDocumentType === 'actual' ? '_Actual' : '_Estimate';
  // Use job name in filename if present (sanitised)
  const jobSlug = client.jobName
    ? '_' + client.jobName.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').substring(0, 30)
    : '';
  const filename = `PPAG_Pharmacy${jobSlug}${sqFt}${docType}_${dateStr}.json`;

  const blob = new Blob([JSON.stringify(jobData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  showToast(`Saved: ${filename}`);
}

// ─────────────────────────────────────────────
//  Load Job
// ─────────────────────────────────────────────
function loadJob() {
  document.getElementById('fileInput').click();
}

function handleFileLoad(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const jobData = JSON.parse(e.target.result);

      // Check if this is an estimate file being loaded while in estimate mode
      if (jobData.documentType === 'estimate') {
        showConversionModal(jobData);
      } else {
        // Actual file or unknown — just load it
        loadJobData(jobData);
        if (jobData.documentType === 'actual') {
          // Restore estimate data if present
          if (jobData.estimateData) {
            estimateData = {
              inputs: jobData.estimateData.inputs,
              result: calculate(jobData.estimateData.inputs, jobData.settings || currentSettings),
            };
            switchDocumentType('actual');
          }
        }
      }
    } catch (err) {
      showToast('Error loading file: ' + err.message);
    }
  };
  reader.readAsText(file);

  // Reset file input so same file can be reloaded
  event.target.value = '';
}

function loadJobData(jobData) {
  const inputs = jobData.inputs;

  // Populate form fields
  document.getElementById('squareFootage').value = inputs.squareFootage || '';
  document.getElementById('adminHours').value    = inputs.adminHours    !== undefined ? inputs.adminHours    : 1;
  document.getElementById('computerHours').value = inputs.computerHours !== undefined ? inputs.computerHours : 6;
  document.getElementById('installCost').value   = inputs.installCost   || '';
  document.getElementById('otherCharges').value  = inputs.otherCharges  || '';
  document.getElementById('commission').value    = inputs.commission    || '';
  document.getElementById('ipaMember').checked   = inputs.ipaDiscount   || false;
  if (document.getElementById('usePerforated')) {
    document.getElementById('usePerforated').checked = inputs.usePerforated || false;
  }

  // Load client details if present
  if (jobData.client) {
    loadClientDetails(jobData.client);
  }

  // Load settings if included
  if (jobData.settings) {
    currentSettings = { ...DEFAULTS, ...jobData.settings };
    initSettings();
    document.getElementById('label-adminRate').textContent    = `@ $${currentSettings.adminRate}/hr`;
    document.getElementById('label-computerRate').textContent = `@ $${currentSettings.computerRate}/hr`;
  }

  // Trigger calculation
  runCalculation();

  showToast('Job loaded successfully!');
}

// ─────────────────────────────────────────────
//  Document Type Toggle
// ─────────────────────────────────────────────
function switchDocumentType(type) {
  currentDocumentType = type;

  const btnEstimate = document.getElementById('btnEstimate');
  const btnActual   = document.getElementById('btnActual');

  if (type === 'estimate') {
    btnEstimate.classList.add('active');
    btnActual.classList.remove('active');

    // Hide variance section
    document.getElementById('varianceSection').style.display = 'none';

    // Clear estimate tracking
    estimateData = null;
    changeTracking = {};
    removeAllChangeIndicators();

  } else {
    // Switching to Actual mode — requires estimate data
    if (!estimateData) {
      showToast('Load an estimate file first to create an actual.');
      // Revert toggle
      setTimeout(() => {
        currentDocumentType = 'estimate';
        btnEstimate.classList.add('active');
        btnActual.classList.remove('active');
      }, 100);
      return;
    }

    btnEstimate.classList.remove('active');
    btnActual.classList.add('active');

    // Show variance section
    document.getElementById('varianceSection').style.display = 'block';

    // Enable change tracking
    enableChangeTracking();
    updateVarianceSummary();
  }
}

// ─────────────────────────────────────────────
//  Conversion Modal
// ─────────────────────────────────────────────
function showConversionModal(jobData) {
  const modal = document.getElementById('conversionModal');
  modal.style.display = 'flex';
  window._pendingJobData = jobData;
}

function closeConversionModal() {
  document.getElementById('conversionModal').style.display = 'none';
  window._pendingJobData = null;
}

function convertToActual(jobData) {
  // 1. Store estimate data for comparison
  estimateData = {
    inputs: { ...jobData.inputs },
    result: calculate(jobData.inputs, jobData.settings || currentSettings),
  };

  // 2. Load the estimate values (including client details) into form
  loadJobData(jobData);

  // 3. Switch to Actual mode
  switchDocumentType('actual');

  showToast('Loaded estimate. Update fields to create actual costs.');
}

// ─────────────────────────────────────────────
//  Change Tracking
// ─────────────────────────────────────────────
const TRACKED_FIELDS = [
  'squareFootage',
  'adminHours',
  'computerHours',
  'installCost',
  'otherCharges',
  'commission',
];

const TRACKED_CHECKBOXES = ['ipaMember', 'usePerforated'];

function enableChangeTracking() {
  if (!estimateData) return;

  TRACKED_FIELDS.forEach(fieldId => {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.addEventListener('input', () => {
      trackFieldChange(fieldId);
      updateVarianceSummary();
    });
  });

  TRACKED_CHECKBOXES.forEach(fieldId => {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.addEventListener('change', () => {
      trackFieldChange(fieldId);
      updateVarianceSummary();
    });
  });
}

function getFieldValue(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return null;
  if (input.type === 'checkbox') return input.checked;
  return parseFloat(input.value) || 0;
}

function trackFieldChange(fieldId) {
  if (!estimateData) return;

  const currentValue  = getFieldValue(fieldId);
  const estimateValue = estimateData.inputs[fieldId];

  if (currentValue !== estimateValue) {
    changeTracking[fieldId] = {
      estimated: estimateValue,
      actual:    currentValue,
      field:     fieldId,
    };
    markFieldAsChanged(fieldId);
  } else {
    delete changeTracking[fieldId];
    removeFieldChangeIndicator(fieldId);
  }
}

function markFieldAsChanged(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  const wrapper = input.closest('.input-wrap') || input.closest('.field');
  if (!wrapper) return;

  // Remove existing indicator first
  const existing = wrapper.querySelector('.change-indicator') ||
                   (wrapper.parentElement && wrapper.parentElement.querySelector('.change-indicator'));
  if (existing) existing.remove();

  wrapper.classList.add('field-changed');

  const change    = changeTracking[fieldId];
  const indicator = document.createElement('div');
  indicator.className = 'change-indicator';

  let changeText = '';
  if (typeof change.estimated === 'boolean') {
    changeText = `Was: ${change.estimated ? 'Yes' : 'No'}`;
    indicator.classList.add('over');
  } else {
    const diff = change.actual - change.estimated;
    const sign = diff > 0 ? '+' : '';
    changeText = `Est: ${change.estimated} → Act: ${change.actual} (${sign}${diff.toFixed(2)})`;
    indicator.classList.add(diff > 0 ? 'over' : 'under');
  }

  indicator.textContent = changeText;

  // Append indicator after the wrapper
  if (wrapper.classList.contains('input-wrap')) {
    wrapper.parentElement.appendChild(indicator);
  } else {
    wrapper.appendChild(indicator);
  }
}

function removeFieldChangeIndicator(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  const wrapper = input.closest('.input-wrap') || input.closest('.field');
  if (!wrapper) return;

  wrapper.classList.remove('field-changed');

  // Remove from wrapper and its parent
  [wrapper, wrapper.parentElement].forEach(el => {
    if (!el) return;
    el.querySelectorAll('.change-indicator').forEach(ind => ind.remove());
  });
}

function removeAllChangeIndicators() {
  document.querySelectorAll('.field-changed').forEach(el => el.classList.remove('field-changed'));
  document.querySelectorAll('.change-indicator').forEach(el => el.remove());
}

// ─────────────────────────────────────────────
//  Variance Summary
// ─────────────────────────────────────────────
function updateVarianceSummary() {
  if (currentDocumentType !== 'actual' || !estimateData) {
    document.getElementById('varianceSection').style.display = 'none';
    return;
  }

  document.getElementById('varianceSection').style.display = 'block';

  const currentInputs = getInputs();
  const actualResult  = calculate(currentInputs, currentSettings);

  const estimateTotal = estimateData.result.finalCost;
  const actualTotal   = actualResult.finalCost;
  const variance      = actualTotal - estimateTotal;
  const pct           = estimateTotal !== 0
    ? ((variance / estimateTotal) * 100).toFixed(1)
    : '0.0';

  document.getElementById('varianceEstimate').textContent = fmtCurrency(estimateTotal);
  document.getElementById('varianceActual').textContent   = fmtCurrency(actualTotal);

  const sign = variance >= 0 ? '+' : '-';
  document.getElementById('varianceAmount').innerHTML =
    `${sign}${fmtCurrency(Math.abs(variance))} <span class="variance-percent">(${sign}${Math.abs(pct)}%)</span>`;

  updateChangesList(currentInputs);
}

function updateChangesList(currentInputs) {
  const changesListEl = document.getElementById('changesList');
  changesListEl.innerHTML = '';

  const fieldLabels = {
    squareFootage:  'Square Footage',
    adminHours:     'Admin Hours',
    computerHours:  'Computer Hours',
    installCost:    'Install Cost',
    otherCharges:   'Other Charges',
    commission:     'Commission',
    ipaDiscount:    'IPA Member',
    usePerforated:  'Perforated Vinyl',
  };

  let hasChanges = false;

  // Rebuild change tracking based on current field values
  [...TRACKED_FIELDS, ...TRACKED_CHECKBOXES].forEach(fieldId => {
    const currentValue  = getFieldValue(fieldId);
    const estimateValue = estimateData.inputs[fieldId];
    if (currentValue !== estimateValue) {
      changeTracking[fieldId] = { estimated: estimateValue, actual: currentValue, field: fieldId };
    } else {
      delete changeTracking[fieldId];
    }
  });

  Object.keys(changeTracking).forEach(fieldId => {
    const change = changeTracking[fieldId];
    hasChanges = true;

    const changeItem = document.createElement('div');
    const direction  = change.actual > change.estimated ? 'over' : 'under';
    changeItem.className = `change-item ${direction}`;

    let valueText  = '';
    let impactText = '';

    if (typeof change.estimated === 'boolean') {
      valueText  = `${change.estimated ? 'Yes' : 'No'} → ${change.actual ? 'Yes' : 'No'}`;
      impactText = 'Changed';
    } else {
      const diff = change.actual - change.estimated;
      const sign = diff > 0 ? '+' : '';
      valueText = `${change.estimated} → ${change.actual}`;

      // Calculate cost impact
      let costImpact = 0;
      if (fieldId === 'adminHours') {
        costImpact = diff * currentSettings.adminRate;
      } else if (fieldId === 'computerHours') {
        costImpact = diff * currentSettings.computerRate;
      } else if (fieldId === 'squareFootage') {
        const vinylRate = currentInputs.usePerforated
          ? currentSettings.perforatedVinylCost
          : currentSettings.vinylCostPerSqFt;
        costImpact = diff * vinylRate;
      } else if (['installCost', 'otherCharges', 'commission'].includes(fieldId)) {
        costImpact = diff;
      }

      impactText = `${sign}${fmtCurrency(Math.abs(costImpact))}`;
    }

    changeItem.innerHTML = `
      <span class="change-field">${fieldLabels[fieldId] || fieldId}</span>
      <span class="change-est">Est: ${change.estimated}</span>
      <span class="change-arrow">→</span>
      <span class="change-act">Act: ${change.actual}</span>
      <span class="change-impact">${impactText}</span>
    `;

    changesListEl.appendChild(changeItem);
  });

  if (!hasChanges) {
    changesListEl.innerHTML = '<p class="no-changes">No changes from estimate</p>';
  }
}

// ─────────────────────────────────────────────
//  DOM Ready
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSettings();

  // Wire all inputs for real-time calculation
  const inputIds = [
    'squareFootage', 'adminHours', 'computerHours',
    'installCost', 'otherCharges', 'commission',
    'ipaMember', 'usePerforated',
  ];
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input',  runCalculation);
    el.addEventListener('change', runCalculation);
  });

  // Settings
  document.getElementById('btnSaveSettings').addEventListener('click', applySettings);
  document.getElementById('settingsToggle').addEventListener('click', () => {
    const panel  = document.getElementById('settingsPanel');
    const icon   = document.getElementById('settingsIcon');
    const isOpen = panel.classList.toggle('open');
    icon.textContent = isOpen ? '▲' : '▼';
  });

  // Reset
  document.getElementById('btnReset').addEventListener('click', resetForm);

  // Save / Load Job
  document.getElementById('btnSaveJob').addEventListener('click', saveJob);
  document.getElementById('btnLoadJob').addEventListener('click', loadJob);
  document.getElementById('fileInput').addEventListener('change', handleFileLoad);

  // Export Excel
  document.getElementById('btnExportExcel').addEventListener('click', () => {
    if (!currentResult) { showToast('Enter square footage first.'); return; }
    exportToExcel(currentResult, currentSettings);
  });

  // Export PDF
  document.getElementById('btnExportPDF').addEventListener('click', () => {
    if (!currentResult) { showToast('Enter square footage first.'); return; }
    exportToPDF(currentResult, currentSettings);
  });

  // Document Type Toggle
  document.getElementById('btnEstimate').addEventListener('click', () => switchDocumentType('estimate'));
  document.getElementById('btnActual').addEventListener('click',   () => switchDocumentType('actual'));

  // Conversion Modal buttons
  document.getElementById('btnLoadAsEstimate').addEventListener('click', () => {
    if (window._pendingJobData) {
      loadJobData(window._pendingJobData);
      switchDocumentType('estimate');
    }
    closeConversionModal();
  });

  document.getElementById('btnConvertToActual').addEventListener('click', () => {
    if (window._pendingJobData) {
      convertToActual(window._pendingJobData);
    }
    closeConversionModal();
  });

  // Initial render with defaults
  runCalculation();
});
