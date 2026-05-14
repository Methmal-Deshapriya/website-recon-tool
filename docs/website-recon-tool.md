# Website Recon Tool MVP — Full Implementation Plan

## Project Overview

The Website Recon Tool is a lightweight browser-based reconnaissance utility built for analyzing modern JS-heavy authenticated websites before designing scraping or automation systems.

**The tool is NOT intended to:**
- Fully mirror websites
- Download all assets
- Build a production scraper
- Bypass anti-bot systems

**Instead, it is designed to:**
- Inspect website structures
- Understand rendered DOMs
- Identify selectors and workflows
- Inspect network/API traffic
- Analyze forms, tables, and buttons
- Export structured browser intelligence
- Help engineering teams decide future automation strategies

---

## Core Objective

For each target website/page, the system should:

1. Open authenticated browser session
2. Navigate to configured pages
3. Wait for JS rendering
4. Capture rendered HTML
5. Capture visible text
6. Capture screenshots
7. Extract important DOM elements
8. Record network/API requests
9. Save structured analysis output

---

## Technology Stack

### Runtime

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| TypeScript | Type safety and maintainability |
| Playwright | Browser automation |
| Cheerio | HTML parsing |
| fs-extra | File operations |
| dotenv | Environment configuration |
| zod | Config validation |
| p-limit | Concurrency control |

---

## Cost Analysis

### MVP Cost
**$0** — All tools are open-source and can run locally.

### Possible Future Costs

| Service | Required? | Purpose |
|---|---|---|
| Proxy provider | Optional | Avoid rate limiting |
| Cloud server | Optional | Remote execution |
| Database | Optional | Centralized storage |
| AI APIs | Optional | AI summaries |
| CAPTCHA solving | Optional | Anti-bot bypass |

---

## System Architecture

```
Config File
    ↓
Playwright Browser
    ↓
Authentication Loader
    ↓
Page Runner
    ↓
Recon Modules
    ├── DOM Snapshot
    ├── Text Snapshot
    ├── Screenshot
    ├── Network Recorder
    ├── Element Extractors
    └── Metadata Extractor
    ↓
Structured Output Writer
```

---

## Final Folder Structure

```
website-recon-tool/
│
├── package.json
├── tsconfig.json
├── .env
├── README.md
│
├── configs/
│   └── sites.config.json
│
├── auth/
│
├── output/
│
├── src/
│   ├── main.ts
│   │
│   ├── auth/
│   │   ├── saveAuth.ts
│   │   └── loadAuth.ts
│   │
│   ├── browser/
│   │   └── browserFactory.ts
│   │
│   ├── crawler/
│   │   └── pageRunner.ts
│   │
│   ├── extractors/
│   │   ├── extractButtons.ts
│   │   ├── extractForms.ts
│   │   ├── extractInputs.ts
│   │   ├── extractLinks.ts
│   │   ├── extractTables.ts
│   │   └── extractMetadata.ts
│   │
│   ├── network/
│   │   └── networkRecorder.ts
│   │
│   ├── storage/
│   │   └── outputWriter.ts
│   │
│   └── utils/
│       ├── logger.ts
│       ├── sanitizeFileName.ts
│       └── waitForStablePage.ts
```

---

## Dependency Installation

### Runtime Dependencies
```bash
npm install playwright cheerio fs-extra dotenv zod p-limit
```

### Development Dependencies
```bash
npm install -D typescript ts-node @types/node
```

### Install Playwright Chromium
```bash
npx playwright install chromium
```

> Playwright officially supports Chromium automation and browser state management.

---

## TypeScript Configuration

Replace the generated `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

## Package Scripts

```json
{
  "scripts": {
    "auth": "ts-node src/auth/saveAuth.ts",
    "recon": "ts-node src/main.ts",
    "build": "tsc"
  }
}
```

---

## Config System

**File:** `configs/sites.config.json`

```json
{
  "sites": [
    {
      "name": "example-site",
      "baseUrl": "https://example.com",
      "authFile": "auth/example-site-auth.json",
      "pages": [
        {
          "name": "dashboard",
          "url": "https://example.com/dashboard"
        },
        {
          "name": "customers",
          "url": "https://example.com/customers"
        }
      ]
    }
  ]
}
```

---

## Module 1 — Authentication System

**Purpose:** Allow manual login once and reuse authenticated session later.

### Workflow
1. Launch headed browser
2. User manually logs in
3. User presses ENTER in terminal
4. Save Playwright storage state
5. Future runs reuse saved auth

### Saved Data
- Cookies
- localStorage
- sessionStorage (when available)

**Output:** `auth/example-site-auth.json`

> Playwright officially supports persistent authentication state using `storageState`.

---

## Module 2 — Browser Factory

**Purpose:** Centralized browser/context creation.

### Responsibilities
- Launch Chromium
- Apply auth state
- Configure viewport
- Configure timeout
- Configure headless/headed mode

### Default Settings
- `headless: true`
- `viewport: 1440x900`
- `timeout: 60000`

---

## Module 3 — Page Runner

**Purpose:** Control complete recon workflow for each page.

### Workflow
1. Open page
2. Attach network listeners
3. Navigate
4. Wait for rendering
5. Capture recon data
6. Save outputs
7. Close page

---

## Module 4 — DOM Snapshot Exporter

**Output:** `dom.html`

**Purpose:** Capture final rendered DOM after JS execution.

> This captures hydrated React DOMs, rendered Vue pages, and loaded dynamic content — NOT initial server HTML.

---

## Module 5 — Text Snapshot Exporter

**Output:** `text.txt`

**Purpose:** Capture visible business data quickly.

Useful for understanding content, verifying page state, and rapid inspection.

---

## Module 6 — Screenshot Exporter

**Output:** `screenshot.png`

**Purpose:** Visual debugging and review. Use full-page screenshots.

> Playwright officially supports screenshots and full-page captures.

---

## Module 7 — Network Recorder

> **MOST IMPORTANT MODULE** — This is where future automation intelligence is discovered.

**Purpose:** Capture APIs, GraphQL, XHR/fetch requests, JSON endpoints, failed requests, and pagination patterns.

### Capture Fields

```json
{
  "url": "",
  "method": "",
  "resourceType": "",
  "status": 200,
  "contentType": ""
}
```

### Important Detection Rules

Mark likely APIs when URL contains:
- `/api/`
- `/graphql`
- `.json`

OR content type contains:
- `application/json`

---

## Module 8 — Element Extractors

### Buttons Extractor
Captures: text, aria-label, role, id, class, disabled status

### Inputs Extractor
Captures: type, name, placeholder, label, required, selector suggestion

### Links Extractor
Captures: text, href, internal/external flag

### Forms Extractor
Captures: action, method, fields, submit buttons

### Tables Extractor
Captures: headers, row count, sample rows, pagination detection

---

## Module 9 — Metadata Extractor

**Output:** `metadata.json`

```json
{
  "url": "",
  "title": "",
  "timestamp": "",
  "htmlLength": 0,
  "textLength": 0,
  "hasForms": true,
  "hasTables": true,
  "apiCallCount": 0,
  "possibleGraphQL": false
}
```

---

## Module 10 — Output Writer

**Purpose:** Store structured analysis data.

### Output Structure

```
output/
  example-site/
    dashboard/
      dom.html
      text.txt
      screenshot.png
      buttons.json
      forms.json
      inputs.json
      tables.json
      links.json
      network.json
      metadata.json
      summary.json
```

---

## Module 11 — Summary Generator

**Purpose:** Provide quick human-readable findings.

```json
{
  "page": "customers",
  "importantFindings": {
    "forms": 2,
    "tables": 1,
    "apiCalls": 12,
    "graphqlDetected": true
  },
  "recommendation": "Investigate API usage before DOM scraping."
}
```

---

## MVP Scope Boundary

### Included ✔
- Auth persistence
- Browser automation
- HTML export
- Text export
- Screenshots
- Element extraction
- Network recording
- Structured outputs

### Excluded ✘
- Full website crawling
- Asset downloading
- Proxy rotation
- CAPTCHA solving
- AI agents
- Dashboard UI
- Database storage
- Anti-bot bypass
- Distributed workers

---

## Recommended Development Order

### Phase 1
- Project setup
- Playwright verification
- Auth saving
- Auth loading

### Phase 2
- Browser factory
- Page navigation
- HTML export
- Text export
- Screenshots

### Phase 3
- Network recorder
- Link extractor
- Button extractor
- Form extractor
- Input extractor

### Phase 4
- Table extraction
- Metadata extraction
- Summary generation
- Better folder organization
