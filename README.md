# Website Recon Tool MVP

A lightweight browser-based reconnaissance utility for analyzing modern JS-heavy authenticated websites before designing scraping or automation systems.

## Purpose

This tool helps you understand:
- **Rendered DOM structures** — capture final HTML after JavaScript execution
- **Forms, buttons, inputs, and tables** — identify automation targets
- **Workflows and user interactions** — understand page structure
- **Network/API traffic** — discover API endpoints, GraphQL usage
- **Authentication behavior** — understand session and cookie management

## What This Tool IS NOT

- A production web scraper
- A website cloning system
- An AI agent platform
- A distributed crawler
- An anti-bot bypass framework

## Quick Start

### 1. Installation

```bash
npm install
npx playwright install chromium
```

### 2. Configure Sites

Edit `configs/sites.config.json`:

```json
{
  "sites": [
    {
      "name": "my-app",
      "baseUrl": "https://myapp.example.com",
      "authFile": "auth/my-app-auth.json",
      "pages": [
        {
          "name": "dashboard",
          "url": "https://myapp.example.com/dashboard"
        },
        {
          "name": "users",
          "url": "https://myapp.example.com/users"
        }
      ]
    }
  ]
}
```

### 3. Save Authentication (Optional)

If your site requires login:

```bash
npm run auth auth/my-app-auth.json
```

This will:
1. Open a headed browser
2. Allow you to log in manually
3. Save your session cookies/storage state

### 4. Run Reconnaissance

```bash
npm run recon
```

The tool will visit each configured page and generate:

```
output/
  my-app/
    dashboard/
      dom.html              # Rendered HTML after JS execution
      text.txt              # Visible page text
      screenshot.png        # Full-page screenshot
      buttons.json          # Button elements
      forms.json            # Form structures
      inputs.json           # Input fields
      links.json            # Links
      tables.json           # Table data
      network.json          # Network requests (APIs, fetch calls)
      metadata.json         # Page metadata
      summary.json          # Quick overview
    users/
      [same structure]
```

## Output Formats

### buttons.json
```json
[
  {
    "text": "Submit",
    "ariaLabel": null,
    "role": "button",
    "id": "submit-btn",
    "disabled": false,
    "type": "submit"
  }
]
```

### forms.json
```json
[
  {
    "action": "/api/login",
    "method": "POST",
    "id": "login-form",
    "fieldCount": 3,
    "fields": [
      {
        "name": "email",
        "type": "email",
        "required": true,
        "placeholder": "you@example.com"
      }
    ]
  }
]
```

### network.json
```json
[
  {
    "url": "https://api.example.com/users",
    "method": "GET",
    "resourceType": "xhr",
    "status": 200,
    "contentType": "application/json",
    "isAPI": true,
    "isGraphQL": false
  }
]
```

### metadata.json
```json
{
  "url": "https://myapp.example.com/dashboard",
  "title": "Dashboard",
  "timestamp": "2026-05-14T15:30:00.000Z",
  "htmlLength": 45234,
  "textLength": 8932,
  "hasForm": true,
  "hasTable": true,
  "headingsCount": 5,
  "imagesCount": 12,
  "linksCount": 23
}
```

## Architecture

### Core Modules

- **auth/** — Save and load authenticated sessions
- **browser/** — Create browser contexts with auth
- **crawler/** — Orchestrate page recon workflow
- **extractors/** — Extract DOM elements (buttons, forms, tables, etc.)
- **network/** — Record and analyze network requests
- **storage/** — Write outputs to organized folder structure
- **utils/** — Logging, config validation, page waiting

### Workflow

```
Config → Browser → Auth Loading → Page Navigation
  ↓
Wait for rendering → Capture snapshots (HTML, text, screenshot)
  ↓
Extract elements → Record network → Write outputs
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run auth <path>` | Save authenticated session |
| `npm run recon` | Run reconnaissance on all configured sites/pages |
| `npm run build` | Compile TypeScript |

## Configuration

### Environment Variables

None required for MVP. Authentication is handled via saved storage state.

### Config Schema

```typescript
interface Page {
  name: string;        // Identifier (dashboard, users, etc.)
  url: string;         // Full URL to visit
}

interface Site {
  name: string;        // Identifier (my-app, another-site, etc.)
  baseUrl: string;     // Base domain
  authFile?: string;   // Path to saved auth (optional)
  pages: Page[];       // List of pages to visit
}

interface Config {
  sites: Site[];       // List of sites to recon
}
```

## Design Principles

1. **Lightweight** — No unnecessary abstractions or frameworks
2. **Modular** — Each module has one clear responsibility
3. **Simple** — Readable code, explicit logic
4. **Reliable** — Graceful error handling, meaningful logging
5. **Maintainable** — Strict TypeScript, no `any` (when possible)

## Troubleshooting

### Page times out waiting for networkidle

The page stabilization waits up to 30 seconds for network idle. If pages have constant background requests:
- Results are still captured (dom, text, screenshot)
- Network requests are still recorded
- The tool continues to the next page

### Authentication not loading

Verify the auth file path in `sites.config.json` matches the actual saved file path.

### No output files generated

Check `output/` directory structure. Each site/page combination creates its own folder. Files are only written if they have content (e.g., no buttons.json if no buttons found).

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Screenshots are always full-page
- HTML capture is rendered DOM (after JavaScript execution)
- Network recording captures all HTTP requests including images, CSS, JS
- No sensitive data (auth tokens, passwords) is captured
- Limited to 20 top API endpoint samples in summary

## Future Enhancements (Out of MVP Scope)

- Proxy rotation
- CAPTCHA solving
- Recursive crawling
- Database storage
- Dashboard UI
- Distributed workers
- Performance optimization
