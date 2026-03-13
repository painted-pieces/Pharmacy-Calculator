/**
 * Painted Pieces Art — Pharmacy Costing Calculator
 * PDF Export using jsPDF + autoTable
 *
 * Requires:
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
 *
 * Uses globals from calculator.js:
 *   currentDocumentType, estimateData, fmtCurrency
 */

function exportToPDF(result, settings) {
  if (typeof window.jspdf === 'undefined') {
    showToast('PDF library not loaded. Check internet connection.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  const NAVY  = [30, 58, 95];
  const GOLD  = [200, 168, 130];
  const GRAY  = [74, 85, 104];
  const WHITE = [255, 255, 255];

  let y = 18;

  // ── Header bar ────────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 216, 28, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('PAINTED PIECES ART & GRAPHICS', 15, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 240);
  doc.text('Pharmacy Window Graphics — Costing Sheet', 15, 20);

  // Document type badge
  const docTypeText = (typeof currentDocumentType !== 'undefined' && currentDocumentType === 'actual')
    ? 'ACTUAL'
    : 'ESTIMATE';
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GOLD);
  doc.text(docTypeText, 200, 12, { align: 'right' });

  // Date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 220);
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.text('Generated: ' + today, 200, 20, { align: 'right' });

  y = 36;
  doc.setTextColor(0, 0, 0);

  // ── Client / Job Info Block ────────────────────────────────────────────────
  const client = (typeof getClientDetails === 'function') ? getClientDetails() : {};
  const hasClient = client.jobName || client.jobAddress || client.contactName || client.contactPhone || client.contactEmail;

  if (hasClient) {
    // Light background panel
    doc.setFillColor(247, 249, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(15, y, 185, 26, 3, 3, 'FD');

    // Left: job name + address
    let leftY = y + 8;
    if (client.jobName) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text(client.jobName, 20, leftY);
      leftY += 7;
    }
    if (client.jobAddress) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      doc.text(client.jobAddress, 20, leftY);
    }

    // Right: contact info
    let rightY = y + 8;
    if (client.contactName) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text(client.contactName, 195, rightY, { align: 'right' });
      rightY += 6;
    }
    if (client.contactPhone) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      doc.text(client.contactPhone, 195, rightY, { align: 'right' });
      rightY += 5;
    }
    if (client.contactEmail) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      doc.text(client.contactEmail, 195, rightY, { align: 'right' });
    }

    y += 32;
  }

  // ── Job Details Section ────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('JOB DETAILS', 15, y);

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(15, y + 2, 200, y + 2);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);

  const details = [
    ['Square Footage', `${result.squareFootage.toLocaleString()} sq ft`],
    ['Admin Hours',    `${result.adminHours} hrs @ $${settings.adminRate}/hr = ${fmtCurrency(result.adminCost)}`],
    ['Computer Hours', `${result.computerHours} hrs @ $${settings.computerRate}/hr = ${fmtCurrency(result.computerCost)}`],
    ['Vinyl Type',     result.usePerforated ? `Perforated @ $${result.activeVinylRate}/sq ft` : `Standard @ $${result.activeVinylRate}/sq ft`],
    ['Vinyl Cost',     `${result.squareFootage} sq ft × $${result.activeVinylRate.toFixed(2)} = ${fmtCurrency(result.vinylCost)}`],
  ];

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(label + ':', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(value, 65, y);
    y += 6;
  });

  y += 4;

  // ── Estimate vs Actual Comparison (Actual mode only) ──────────────────────
  if (typeof currentDocumentType !== 'undefined' && currentDocumentType === 'actual' && typeof estimateData !== 'undefined' && estimateData) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('ESTIMATE vs ACTUAL COMPARISON', 15, y);

    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.8);
    doc.line(15, y + 2, 200, y + 2);
    y += 8;

    const estimateTotal   = estimateData.result.finalCost;
    const actualTotal     = result.finalCost;
    const variance        = actualTotal - estimateTotal;
    const pct             = estimateTotal !== 0
      ? ((variance / estimateTotal) * 100).toFixed(1)
      : '0.0';
    const sign            = variance >= 0 ? '+' : '-';

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('Original Estimate: ' + fmtCurrency(estimateTotal), 15, y);
    y += 6;
    doc.text('Actual Final Cost: ' + fmtCurrency(actualTotal), 15, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    const varianceColor = variance >= 0 ? [231, 76, 60] : [39, 174, 96];
    doc.setTextColor(...varianceColor);
    doc.text(`Variance: ${sign}${fmtCurrency(Math.abs(variance))} (${sign}${Math.abs(parseFloat(pct))}%)`, 15, y);
    doc.setTextColor(0, 0, 0);
    y += 10;
  }

  // ── Cost Summary Section ───────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('COST SUMMARY', 15, y);

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(15, y + 2, 200, y + 2);
  y += 8;

  const summaryData = [
    ['Total Hours',     String(result.totalHours),                   false],
    ['Total Labor',     fmtCurrency(result.totalLabor),              false],
    ['Vinyl Cost',      fmtCurrency(result.vinylCost),               false],
    ['Estimated Cost',  fmtCurrency(result.estimatedCost),           true],
    ['Install Cost',    fmtCurrency(result.installCost),             false],
    ['Other Charges',   fmtCurrency(result.otherCharges),            false],
    ['Final Cost',      fmtCurrency(result.finalCost),               true],
  ];

  if (result.commission > 0) {
    summaryData.push(['Commission', fmtCurrency(result.commission), false]);
  }

  summaryData.forEach(([label, value, isBold]) => {
    doc.setFontSize(9);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
    }
    doc.text(label + ':', 15, y);
    doc.text(value, 80, y, { align: 'right' });
    y += 6;
  });

  y += 6;

  // ── Pricing Tiers Table ────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('PRICING TIERS', 15, y);

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(15, y + 2, 200, y + 2);
  y += 5;

  const headers = ['GM Tier', 'Retail w/Profit', 'Install', 'Other', 'Overhead', 'Sell Price', 'Net Profit'];
  if (result.ipaDiscount) headers.push('IPA Price (-10%)');

  const tableData = result.tiers.map((tier, idx) => {
    const row = [
      tier.label,
      fmtCurrency(tier.retailWithProfit),
      fmtCurrency(tier.installCost),
      fmtCurrency(tier.otherCharges),
      fmtCurrency(tier.overhead),
      fmtCurrency(tier.sellPrice),
      fmtCurrency(tier.netProfit),
    ];
    if (result.ipaDiscount) {
      row.push(tier.ipaPrice !== null ? fmtCurrency(tier.ipaPrice) : '—');
    }
    return row;
  });

  doc.autoTable({
    startY: y,
    head: [headers],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: GOLD,
      lineWidth: 0.5,
    },
    bodyStyles: {
      textColor: GRAY,
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: NAVY },
      5: { fontStyle: 'bold', textColor: [30, 90, 63] }, // sell price: dark green
      6: { textColor: [45, 90, 123] },                    // net profit: navy
    },
    willDrawCell: function(data) {
      // Highlight the 40% GM row (index 2)
      if (data.section === 'body' && data.row.index === 2) {
        doc.setFillColor(200, 168, 130, 0.15);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
      }
    },
    didParseCell: function(data) {
      // Bold all cells in the 40% GM row
      if (data.section === 'body' && data.row.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = NAVY;
      }
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── Note for 40% GM ────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GOLD);
  doc.text('★ 40% GM row is Steven\'s standard pricing tier', 15, y);
  y += 10;

  // ── IPA Discount Note ──────────────────────────────────────────────────────
  if (result.ipaDiscount) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GRAY);
    doc.text('IPA Member discount (10%) applied to sell prices', 15, y);
    y += 8;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...NAVY);
  doc.rect(0, pageH - 14, 216, 14, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('PAINTED PIECES ART & GRAPHICS', 108, pageH - 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 220);
  doc.text('MURALS  •  FAUX TECHNIQUES  •  HANDPAINTED BUILDINGS  •  WINDOW GRAPHICS  •  DESIGN & COLOR CONSULTING', 108, pageH - 4, { align: 'center' });

  // ── Save PDF ──────────────────────────────────────────────────────────────
  const dateStr  = new Date().toISOString().slice(0, 10);
  const sqFt     = result.squareFootage ? `_${result.squareFootage}sqft` : '';
  const docType  = (typeof currentDocumentType !== 'undefined' && currentDocumentType === 'actual')
    ? '_Actual'
    : '_Estimate';
  const pdfClient = (typeof getClientDetails === 'function') ? getClientDetails() : {};
  const jobSlug  = pdfClient.jobName
    ? '_' + pdfClient.jobName.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').substring(0, 30)
    : '';
  const filename = `PPAG_Pharmacy${jobSlug}${sqFt}${docType}_${dateStr}.pdf`;

  doc.save(filename);
  showToast(`Exported: ${filename}`);
}
