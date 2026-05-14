# Website Recon Tool — How to Use

A practical guide to using the Website Recon Tool for analyzing websites.

## Prerequisites

- Node.js 16+ installed
- npm or yarn
- A website to analyze

## 1. Setup

### Clone/Initialize Project

```bash
cd web-recon-tool
npm install
npx playwright install chromium
```

## 2. Configure Your Target Website

Edit `configs/sites.config.json`:

```json
{
  "sites": [
    {
      "name": "myapp",
      "baseUrl": "https://myapp.com",
      "pages": [
        {
          "name": "login",
          "url": "https://myapp.com/login"
        },
        {
          "name": "dashboard",
          "url": "https://myapp.com/dashboard"
        },
        {
          "name": "users",
          "url": "https://myapp.com/users"
        }
      ]
    }
  ]
}
```

**Note:** For authenticated sites, add `"authFile": "auth/myapp-auth.json"` to the site config.

## 3. Optional: Save Authentication

If the website requires login:

```bash
npm run auth auth/myapp-auth.json
```

This will:
1. Open a browser window
2. Allow you to log in manually
3. Save your session (cookies + localStorage)
4. Use this session for all subsequent reconnaissance runs

**The login is manual** — you control the browser and log in yourself. Once you press ENTER in the terminal, the session is saved.

## 4. Run Reconnaissance

```bash
npm run recon
```

The tool will:
1. Load your config
2. For each site and page:
   - Navigate to the URL
   - Wait for the page to fully render
   - Capture HTML, text, and screenshot
   - Extract all elements (buttons, forms, inputs, links, tables)
   - Record all network requests
   - Generate a summary
3. Save all outputs to `output/{site}/{page}/`

## 5. Review Results

Navigate to the output folder:

```
output/
  myapp/
    login/
      dom.html          ← Rendered HTML after JS
      text.txt          ← Visible page text
      screenshot.png    ← Full-page screenshot
      forms.json        ← Login form structure
      inputs.json       ← Input fields
      buttons.json      ← Buttons on page
      links.json        ← Links
      network.json      ← API calls, fetch requests
      metadata.json     ← Page stats
      summary.json      ← Quick overview
    dashboard/
      [same files]
    users/
      [same files]
```

## 6. Understanding the Output Files

### dom.html
The final rendered HTML after JavaScript executes. Open in a browser to inspect the structure.

### text.txt
Visible page text extracted for quick review.

### screenshot.png
Visual reference of how the page looks.

### forms.json
Form structures with fields, actions, and methods:
```json
[
  {
    "action": "/api/login",
    "method": "POST",
    "fields": [
      { "name": "email", "type": "email", "required": true },
      { "name": "password", "type": "password", "required": true }
    ]
  }
]
```

### inputs.json
All input fields on the page with their attributes.

### buttons.json
All buttons with text, type, and state:
```json
[
  { "text": "Login", "type": "submit", "disabled": false },
  { "text": "Forgot Password?", "role": "button" }
]
```

### links.json
All links classified as internal or external:
```json
[
  { "text": "Dashboard", "href": "/dashboard", "isInternal": true },
  { "text": "Help", "href": "https://help.example.com", "isExternal": true }
]
```

### tables.json
Table data with headers, row count, and sample rows:
```json
[
  {
    "headers": ["Name", "Email", "Role"],
    "rowCount": 42,
    "sampleRows": [["John Doe", "john@example.com", "Admin"]],
    "hasPagination": true
  }
]
```

### network.json
All HTTP requests captured:
```json
[
  {
    "url": "https://api.example.com/users",
    "method": "GET",
    "status": 200,
    "contentType": "application/json",
    "isAPI": true,
    "isGraphQL": false
  }
]
```

### metadata.json
Page-level statistics:
```json
{
  "url": "https://myapp.com/dashboard",
  "title": "Dashboard",
  "htmlLength": 45234,
  "hasForm": true,
  "hasTable": true,
  "headingsCount": 5,
  "imagesCount": 12,
  "linksCount": 23
}
```

### summary.json
Quick overview:
```json
{
  "page": "dashboard",
  "url": "https://myapp.com/dashboard",
  "timestamp": "2026-05-14T10:30:00Z",
  "network": {
    "totalRequests": 45,
    "apiRequests": 12,
    "graphqlRequests": 0,
    "uniqueAPIEndpoints": 5
  }
}
```

## Common Use Cases

### Use Case 1: Analyze a Public Website

1. Edit `configs/sites.config.json` with the site URL
2. Run `npm run recon`
3. Check `output/` for results

No auth needed!

### Use Case 2: Analyze an Authenticated Web App

1. Edit `configs/sites.config.json` with the site URL and add `"authFile": "auth/myapp-auth.json"`
2. Run `npm run auth auth/myapp-auth.json`
3. Log in when the browser opens
4. Press ENTER to save the session
5. Run `npm run recon`
6. Check `output/` for results (now with authenticated content)

### Use Case 3: Analyze Multiple Pages on the Same Site

Configure multiple pages in `sites.config.json`:

```json
{
  "sites": [
    {
      "name": "myapp",
      "baseUrl": "https://myapp.com",
      "authFile": "auth/myapp-auth.json",
      "pages": [
        { "name": "dashboard", "url": "https://myapp.com/dashboard" },
        { "name": "users", "url": "https://myapp.com/users" },
        { "name": "settings", "url": "https://myapp.com/settings" },
        { "name": "reports", "url": "https://myapp.com/reports" }
      ]
    }
  ]
}
```

Run `npm run recon` once, and it will analyze all 4 pages.

### Use Case 4: Analyze Multiple Websites

```json
{
  "sites": [
    {
      "name": "app1",
      "baseUrl": "https://app1.com",
      "authFile": "auth/app1-auth.json",
      "pages": [{ "name": "home", "url": "https://app1.com" }]
    },
    {
      "name": "app2",
      "baseUrl": "https://app2.com",
      "authFile": "auth/app2-auth.json",
      "pages": [{ "name": "dashboard", "url": "https://app2.com/dashboard" }]
    }
  ]
}
```

Run `npm run recon` once, and it will analyze all sites.

## Troubleshooting

### "Config file not found"

Make sure `configs/sites.config.json` exists and is valid JSON.

### Page times out waiting for networkidle

The tool waits up to 30 seconds for the page to stabilize. If it times out:
- The page was still captured (DOM, text, screenshot)
- Network requests were still recorded
- The tool continues to the next page

This is normal for pages with continuous background requests.

### No buttons.json or forms.json in output

The page doesn't have buttons or forms. Only files with content are created.

### Screenshot is blank or broken

The page may have rendering issues. Check `dom.html` and `text.txt` to see if content was captured.

### Network.json shows only 1 request

The page may not have made API calls. Check `metadata.json` to see how many total network requests were captured.

## Tips

- **Review the screenshot first** to understand the page visually
- **Check metadata.json** to see page statistics
- **Look at network.json** to find APIs your app uses
- **Review forms.json** to understand login/submission flows
- **Use text.txt** for quick content inspection
- **Open dom.html in a browser** to inspect the full structure

## Next Steps

After gathering recon data:
- Decide if you can use APIs directly (check network.json)
- Plan DOM scraping strategy (check buttons, forms, links)
- Design authentication handling (check forms.json for login)
- Evaluate pagination (check tables.json)

## Getting Help

For issues, check:
1. Config syntax in `configs/sites.config.json`
2. URLs are correct and accessible
3. Authentication file exists if using auth
4. Permissions to write to `output/` directory

---

**Need help?** Review the detailed implementation guide in `docs/website-recon-tool.md` or the AI agent guide in `docs/AI_AGENT_GUIDE.md`
