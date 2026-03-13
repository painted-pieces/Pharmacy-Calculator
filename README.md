# Pharmacy Costing Calculator
**Painted Pieces Art — Internal Tool**

Instant pharmacy window graphics pricing. Replaces the 5-minute manual Excel process with a 30-second web form.

---

## How to Use

1. **Double-click `index.html`** to open in your browser
   *(No installation required — works offline after first load)*

2. **Enter job details:**
   - Total Square Footage (the main driver)
   - Admin Hours (default: 1 hr)
   - Computer/Design Hours (default: 6 hrs)
   - Install Cost from printer
   - Commission amount
   - Check "IPA Member" for 10% discount

3. **Read the pricing table** — all 5 GM tiers calculate instantly
   The **40% GM row is highlighted** — this is the standard quoting tier

4. **Export to Excel** — generates a `.xlsx` file for your records

---

## Formulas Used

```
Vinyl Cost       = Square Footage × $7.65/sq ft
Admin Cost       = Admin Hours × $50/hr
Computer Cost    = Computer Hours × $35/hr
Estimated Cost   = Vinyl Cost + Total Labor
Final Cost       = Estimated Cost + Install Cost  (display only)

For each GM tier:
  Retail w/Profit = Estimated Cost ÷ (1 − GM%)
  Overhead        = Total Hours × rate (varies by tier)
  Sell Price      = Retail + Install Cost + Overhead
  Net Profit      = Retail − Estimated Cost

Overhead multipliers:
  20% GM → hours × $73
  30% GM → hours × $80
  40% GM → hours × $90   ← default
  50% GM → hours × $80
  60% GM → hours × $80

IPA discount: Sell Price × 0.90
```

---

## Settings

Click ⚙️ **Settings** to change rates. Settings are saved automatically and persist between sessions.

| Setting | Default |
|---------|---------|
| Standard Vinyl / sq ft | $7.65 |
| Perforated Vinyl / sq ft | $9.50 |
| Admin Rate / hr | $50 |
| Computer Rate / hr | $35 |

---

## Verified Test Cases

| Job | Sq Ft | Admin | Computer | Install | 40% GM Sell Price |
|-----|-------|-------|----------|---------|-------------------|
| Healthy Corner | 82 | 1 hr | 6 hrs | $0 | ~$2,109 ✅ |
| Sky RX | 100 | 1 hr | 5 hrs | $525 | ~$2,715 |
| Rex RX | 146 | 1 hr | 8 hrs | $900 | ~$4,122 ✅ |

---

## Files

```
pharmacy-costing-calculator/
  ├── index.html      Main interface
  ├── calculator.js   All calculation logic
  ├── styles.css      Painted Pieces branding
  ├── export.js       Excel export (requires internet for SheetJS CDN)
  └── README.md       This file
```

---

*Painted Pieces Art — 680 E Jericho Tpke, Huntington Station, NY 11746*
*paintedpiecesart.com*
