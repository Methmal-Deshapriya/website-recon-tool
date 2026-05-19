# Recon Tool — Planned Improvements

## High Priority

### 1. Multi-Page Batch Runner

Run recon against all pages of a supplier in one command instead of running each URL manually.

Define pages in `sites.config.json` and run:

```bash
npm run recon -- --site axienta
```

The tool crawls every configured page (outstanding, deliveries, GRNs, collection form) and writes one output folder per page.

**Why it matters:** eliminates the repetitive manual loop of running recon per URL and stitching results together.

---

### 2. Connector Config Generator

After recon completes, automatically emit a `connector-config.suggestion.ts` alongside the other output files.

```typescript
// AUTO-GENERATED from recon output — review before using
export const SUPPLIER_CONFIG = {
  outstandingUrl: 'https://portal.com/outstanding',
  selectors: {
    outstandingTable: 'table#invoices',    // found: table with id="invoices"
    nextPageButton: 'button:text("Next")', // found: button with text "Next"
  },
  columns: {
    pharmacyId:  0,  // header: "Customer ID"
    invoiceRef:  1,  // header: "Invoice No"
    amount:      4,  // header: "Amount Due"
  },
}
```

**Why it matters:** right now you manually read `tables.json` and `dom.html` to figure out selectors and column indices. This generates a ready-to-edit starting point in seconds.

---

### 3. Stable Selector Suggestions

`extractButtons.ts` currently dumps all buttons with no ranking. It should emit multiple selector strategies per element, ranked by stability, so you immediately know which one to use in production.

```json
{
  "text": "Submit Collection",
  "selectors": {
    "recommended": "button:text('Submit Collection')",
    "byRole":      "[role='button']:text('Submit')",
    "byClass":     ".btn-primary.submit-col",
    "byPosition":  "form > div:nth-child(3) > button"
  },
  "stabilityWarning": "class-based selector detected — prefer text or role selector"
}
```

Stability tiers:

| Tier | Strategy | Risk |
|------|----------|------|
| Best | `text` / `role` | survives portal redesigns |
| OK | `id` / `data-*` attribute | survives visual redesigns |
| Fragile | class names | breaks on CSS refactor |
| Very fragile | positional (`nth-child`) | breaks on any DOM change |

**Why it matters:** maps directly to the SADD selector strategy and avoids brittle automation.

---

### 4. Full Table Extraction

`extractTables.ts` currently captures only 5 sample rows. Replace this with:

- All column headers with their exact zero-based index
- Column data-type detection (date, number/currency, string)
- Total row count (including paginated pages if detectable)
- Pagination detection and type

```json
{
  "headers": ["Customer ID", "Invoice No", "Date", "Due Date", "Amount"],
  "columnTypes": ["string", "string", "date", "date", "currency"],
  "totalRows": 248,
  "hasPagination": true,
  "paginationType": "button"
}
```

**Why it matters:** column indices and types are the first thing needed to write a connector — this eliminates a manual inspection step.

---

### 5. API Endpoint Highlight in network.json

`network.json` currently dumps every request. Add a `possibleDataApis` section that flags requests that look like internal data APIs (JSON response, structured URL pattern):

```json
{
  "possibleDataApis": [
    {
      "url": "/api/outstanding?page=1",
      "method": "GET",
      "responseType": "application/json",
      "recommendation": "Use secure-api connector instead of browser automation"
    }
  ]
}
```

**Why it matters:** if a supplier exposes an internal API, you can skip browser automation entirely — this is the highest-leverage finding from any recon run.

---

## Lower Priority

### 6. Pharma Portal Page Templates in sites.config.json

Add a standard template covering the four page types you always need to map for every supplier. New sites should be added by filling out this template.

```json
{
  "name": "axienta",
  "baseUrl": "https://axienta.com",
  "authFile": "auth/axienta.json",
  "pages": [
    { "name": "outstanding",    "url": "https://axienta.com/outstanding" },
    { "name": "deliveries",     "url": "https://axienta.com/deliveries" },
    { "name": "grns",           "url": "https://axienta.com/grn" },
    { "name": "collection-form","url": "https://axienta.com/post-payment" }
  ]
}
```

**Why it matters:** standardises site configuration and enables the batch runner (improvement #1) to work without extra setup per supplier.
