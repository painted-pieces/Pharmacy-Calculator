/**
 * Painted Pieces Art — Pharmacy Costing Calculator
 * Excel export — MINIMAL, plain values only.
 *
 * NO styles, NO number formats, NO formulas, NO embedded objects.
 * Only {t, v} on every cell — guaranteed clean open in Excel.
 *
 * CRITICAL cell: F30 must contain the 40% GM Sell Price as a plain number.
 * The Proposal Generator reads F30 to extract pricing for PDF generation.
 *
 * Cell map (matches Chet's VINYL_2024_COSTING_SHEET layout):
 *   B4  = Admin Hours        F4  = Admin Cost
 *   B5  = Computer Hours     F5  = Computer Cost
 *   B11 = Total Hours
 *   F14 = Total Labor
 *   D16 = Square Footage     F16 = Vinyl Cost
 *   F22 = Estimated Cost
 *   F23 = Install Cost
 *   F24 = Other Charges      (NEW — was empty row)
 *   F25 = Final Cost         (shifted from F24)
 *   F28 = 20% GM Sell Price
 *   F29 = 30% GM Sell Price
 *   F30 = 40% GM Sell Price  ← Proposal Generator reads this
 *   F31 = 50% GM Sell Price
 *   F32 = 60% GM Sell Price
 *   H28-H32 = Other Charges per tier (info column)
 *   M31 = Commission
 */

function exportToExcel(result, settings) {
  if (typeof XLSX === 'undefined') {
    alert('Excel export library is not loaded. Please check your internet connection and try again.');
    return;
  }

  const wb = XLSX.utils.book_new();
  const ws = {};

  // ── Plain string cell ──────────────────────────────────────────────────────
  function s(ref, v) {
    ws[ref] = { t: 's', v: String(v) };
  }

  // ── Plain number cell — raw value, no formatting ───────────────────────────
  function n(ref, v) {
    ws[ref] = { t: 'n', v: Math.round(Number(v) * 100) / 100 };
  }

  // ── Convenience: extract the five tiers in order ───────────────────────────
  const tier20 = result.tiers[0];
  const tier30 = result.tiers[1];
  const tier40 = result.tiers[2]; // 40% GM — sell price MUST land in F30
  const tier50 = result.tiers[3];
  const tier60 = result.tiers[4];

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // ── Client / Job details (columns I–J, rows 1–7) — non-disruptive ─────────
  // getClientDetails() is defined in calculator.js (same page scope)
  const client = (typeof getClientDetails === 'function') ? getClientDetails() : {};
  s('I1', 'CLIENT / JOB DETAILS');
  if (client.jobName)      { s('I2', 'Job Name:');  s('J2', client.jobName); }
  if (client.jobAddress)   { s('I3', 'Address:');   s('J3', client.jobAddress); }
  if (client.contactName)  { s('I4', 'Contact:');   s('J4', client.contactName); }
  if (client.contactPhone) { s('I5', 'Phone:');     s('J5', client.contactPhone); }
  if (client.contactEmail) { s('I6', 'Email:');     s('J6', client.contactEmail); }

  // ── Row 1: title ──────────────────────────────────────────────────────────
  s('A1', 'PAINTED PIECES ART - Pharmacy Costing Calculator');
  s('G1', 'Generated: ' + today);

  // ── Rows 2-3: HRS column headers (Chet format) ───────────────────────────
  s('B2', 'HRS');
  s('B3', 'HRS');

  // ── Row 4: Admin labor ────────────────────────────────────────────────────
  s('A4', 'Ad Min');
  n('B4', result.adminHours);      // B4 = Admin Hours
  s('C4', 'CS & SB');
  n('D4', settings.adminRate);
  n('F4', result.adminCost);       // F4 = Admin Cost

  // ── Row 5: Computer/design labor ─────────────────────────────────────────
  s('A5', 'Computer time HRS');
  n('B5', result.computerHours);   // B5 = Computer Hours
  n('D5', settings.computerRate);
  n('F5', result.computerCost);    // F5 = Computer Cost

  // ── Row 11: Total hours ───────────────────────────────────────────────────
  s('A11', 'TOTAL HRS PLANNED');
  n('B11', result.totalHours);     // B11 = Total Hours

  // ── Row 14: Total labor pay ───────────────────────────────────────────────
  s('A14', 'TOTAL PAY');
  n('F14', result.totalLabor);     // F14 = Total Labor

  // ── Row 15: Vinyl section headers ────────────────────────────────────────
  s('A15', 'VINYL COST');
  s('B15', 'Cost SQ FT');
  s('D15', 'Total SQ ft');

  // ── Row 16: 1st Surface vinyl (active line) ───────────────────────────────
  s('A16', '1st Surface - EXT Instl');
  n('B16', settings.vinylCostPerSqFt);
  s('C16', 'X');
  n('D16', result.squareFootage);  // D16 = Square Footage
  n('F16', result.vinylCost);      // F16 = Vinyl Cost

  // ── Row 17: 2nd Surface (zeros) ──────────────────────────────────────────
  s('A17', '2nd Surface-Inside Instl');
  n('B17', settings.vinylCostPerSqFt);
  s('C17', 'X');
  n('D17', 0);
  n('F17', 0);

  // ── Row 18: Perforated (zeros) ────────────────────────────────────────────
  s('A18', 'Perforated-Ext install');
  n('B18', settings.perforatedVinylCost);
  s('C18', 'X');
  n('D18', 0);
  n('F18', 0);

  // ── Row 22: Estimated Cost ────────────────────────────────────────────────
  s('A22', 'ESTIMATED COST');
  n('F22', result.estimatedCost);  // F22 = Estimated Cost

  // ── Row 23: Install Cost ──────────────────────────────────────────────────
  s('A23', 'Install Cost');
  n('F23', result.installCost);    // F23 = Install Cost

  // ── Row 24: Other Charges (NEW) ───────────────────────────────────────────
  s('A24', 'Other Charges');
  n('F24', result.otherCharges);   // F24 = Other Charges

  // ── Row 25: Final Cost (shifted from row 24) ──────────────────────────────
  s('A25', 'plus non');
  s('B25', 'A');
  n('F25', result.finalCost);      // F25 = Final Cost

  // ── Row 26: Pricing tier column headers ───────────────────────────────────
  s('A26', 'GM Tier');
  s('B26', 'Formula');
  s('C26', 'Retail w');
  s('D26', 'Install');
  s('E26', 'Overhead');
  s('F26', 'Sell Price');
  s('G26', 'Net Profit');
  s('H26', 'Other Charges');
  if (result.ipaDiscount) {
    s('I26', 'IPA Price (-10%)');
  }

  // ── Rows 28-32: Pricing tiers ─────────────────────────────────────────────
  // F column holds the Sell Price for every tier.
  // F30 (40% GM row) is what the Proposal Generator reads.
  [
    { row: 28, tier: tier20, label: 'Retail w/ 20% GM', formula: 'cost / .8' },
    { row: 29, tier: tier30, label: 'Retail w/ 30% GM', formula: 'cost / .7' },
    { row: 30, tier: tier40, label: 'Retail w / 40% GM', formula: 'cost / .6' }, // F30 ← CRITICAL
    { row: 31, tier: tier50, label: 'Retail w / 50% GM', formula: 'cost / .5' },
    { row: 32, tier: tier60, label: 'Retail w / 60% GM', formula: 'cost / .4' },
  ].forEach(function(item) {
    s('A' + item.row, item.label);
    s('B' + item.row, item.formula);
    n('C' + item.row, item.tier.retailWithProfit);
    n('D' + item.row, item.tier.installCost);
    n('E' + item.row, item.tier.overhead);
    n('F' + item.row, item.tier.sellPrice);    // F30 = 40% GM sell price ← CRITICAL
    n('G' + item.row, item.tier.netProfit);
    n('H' + item.row, item.tier.otherCharges); // Other Charges info column
    if (item.tier.ipaPrice !== null) {
      n('I' + item.row, item.tier.ipaPrice);
    }
  });

  // ── M31: Commission ───────────────────────────────────────────────────────
  s('L31', 'Commission:');
  n('M31', result.commission);     // M31 = Commission

  // ── Worksheet range ───────────────────────────────────────────────────────
  ws['!ref'] = 'A1:M32';

  // ── Column widths (display hint only, no effect on data) ──────────────────
  ws['!cols'] = [
    { wch: 26 }, // A
    { wch: 12 }, // B
    { wch: 14 }, // C
    { wch: 12 }, // D
    { wch: 12 }, // E
    { wch: 14 }, // F  ← sell price column (F30 = 40% GM sell price, read by Proposal Generator)
    { wch: 12 }, // G
    { wch: 14 }, // H  ← other charges
    { wch: 14 }, // I  ← client detail labels / IPA price
    { wch: 30 }, // J  ← client detail values
    { wch: 4  }, // K
    { wch: 12 }, // L
    { wch: 12 }, // M
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Costing');

  // ── Filename ──────────────────────────────────────────────────────────────
  var dateStr  = new Date().toISOString().slice(0, 10);
  var sqFt     = result.squareFootage ? '_' + result.squareFootage + 'sqft' : '';
  var filename = 'PPAG_Pharmacy_Costing' + sqFt + '_' + dateStr + '.xlsx';

  XLSX.writeFile(wb, filename);
  showToast('Exported: ' + filename);
}
