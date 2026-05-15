# Auto-Crawl Feature Guide

The auto-crawl feature automatically discovers pages on a website instead of requiring manual configuration. It uses two strategies:

1. **Sitemap-based discovery** (if available)
2. **Breadth-First Search (BFS)** crawler (fallback)

## Quick Start

### Enable Auto-Crawl

Instead of manually listing pages:

```json
{
  "sites": [
    {
      "name": "my-site",
      "baseUrl": "https://mysite.com",
      "authFile": "auth/my-site-auth.json",
      "autoCrawl": {
        "enabled": true
      }
    }
  ]
}
```

Run:
```bash
npm run recon
```

The tool will:
1. Check for `sitemap.xml`
2. If no sitemap, use BFS to discover pages
3. Run recon on all discovered pages

---

## Configuration Options

```json
{
  "autoCrawl": {
    "enabled": true,                    // Required: enable auto-crawl
    "maxPages": 50,                     // Max pages to discover (default: 50)
    "maxDepth": 3,                      // Max link depth (default: 3)
    "excludePatterns": [                // URL patterns to skip
      "/admin",
      "/logout", 
      "/settings",
      "/help"
    ],
    "delayMs": 500,                     // Delay between requests (default: 500ms)
    "respectRobotsTxt": true,           // Check robots.txt (default: true)
    "minContentLength": 100,            // Skip pages with < 100 chars (default: 100)
    "prioritizeByContent": true         // Visit content-rich pages first (default: true)
  }
}
```

---

## How It Works

### Step 1: Sitemap Discovery

If the site has `sitemap.xml`:
- Checks `robots.txt` for sitemap URL
- Tries common locations: `/sitemap.xml`, `/sitemap_index.xml`
- Extracts all URLs from sitemap
- **Fastest method** ⚡

Output:
```
📋 Using sitemap for page discovery
✓ Sitemap found: 247 URLs discovered
```

### Step 2: BFS Crawler (Fallback)

If no sitemap found:
- Starts from `baseUrl`
- Extracts links from each page
- Visits pages breadth-first (level by level)
- Respects `maxPages` and `maxDepth` limits
- Skips excluded patterns
- Waits `delayMs` between requests

Output:
```
🔍 No sitemap found, using BFS crawler
🔍 Starting BFS crawler...
   Base URL: https://mysite.com
   Max pages: 50
   Max depth: 3
✓ BFS complete: discovered 45 pages
```

---

## Limiting Crawl Scope

### Exclude Patterns

Skip specific paths:
```json
"excludePatterns": [
  "/admin",           // Admin pages
  "/api/",            // API endpoints
  "/logout",          // Logout page
  "/settings",        // Settings
  "/help",            // Help/FAQ
  "/search",          // Search pages
  "/404"              // Error pages
]
```

### Max Pages

Limit total pages discovered (this increases as pages are visited):
```json
"maxPages": 20  // Visit at most 20 pages
```

### Max Depth

Limit URL path depth (number of path segments):
```json
"maxDepth": 3  // Only crawl URLs with 3 or fewer path segments
```

Example:
- `https://mysite.com/` → depth 0 ✓
- `https://mysite.com/products` → depth 1 ✓
- `https://mysite.com/products/category` → depth 2 ✓
- `https://mysite.com/products/category/item` → depth 3 ✓
- `https://mysite.com/products/category/item/details` → depth 4 ✗ (exceeds maxDepth: 3)

### Rate Limiting

Control request frequency:
```json
"delayMs": 1000  // Wait 1 second between requests (respectful crawling)
```

Recommended:
- 500ms: Fast crawling, use for small sites
- 1000ms: Standard, balanced crawling
- 2000ms: Slow crawling, be extra respectful

---

## Excluding Content-Less Pages

Skip pages with minimal content:
```json
"minContentLength": 100  // Skip pages with < 100 characters
```

This filters out:
- Redirect pages
- Error pages
- Nearly empty pages

---

## Combining Manual & Auto

You can use both manual pages AND auto-crawl:

```json
{
  "sites": [
    {
      "name": "my-site",
      "baseUrl": "https://mysite.com",
      "authFile": "auth/my-site-auth.json",
      "pages": [
        {
          "name": "homepage",
          "url": "https://mysite.com"
        }
      ],
      "autoCrawl": {
        "enabled": true,
        "maxPages": 25
      }
    }
  ]
}
```

- Manual pages are discovered first
- Auto-crawl discovers additional pages
- Total pages = manual + auto-discovered

---

## Real-World Examples

### Example 1: E-Commerce Site

```json
{
  "name": "shop",
  "baseUrl": "https://myshop.com",
  "authFile": "auth/shop-auth.json",
  "autoCrawl": {
    "enabled": true,
    "maxPages": 100,
    "maxDepth": 4,
    "excludePatterns": [
      "/admin",
      "/checkout",
      "/cart",
      "/account/settings"
    ],
    "delayMs": 500
  }
}
```

### Example 2: SaaS Dashboard

```json
{
  "name": "dashboard",
  "baseUrl": "https://app.company.com",
  "authFile": "auth/dashboard-auth.json",
  "autoCrawl": {
    "enabled": true,
    "maxPages": 50,
    "maxDepth": 3,
    "excludePatterns": [
      "/api",
      "/admin",
      "/help",
      "/logout"
    ],
    "delayMs": 1000
  }
}
```

### Example 3: Content Site

```json
{
  "name": "blog",
  "baseUrl": "https://blog.example.com",
  "autoCrawl": {
    "enabled": true,
    "maxPages": 200,
    "maxDepth": 2,
    "excludePatterns": [
      "/archive",
      "/search",
      "/category/uncategorized"
    ],
    "delayMs": 500
  }
}
```

---

## Disabling Auto-Crawl

Use manual pages mode:

```json
{
  "sites": [
    {
      "name": "my-site",
      "baseUrl": "https://mysite.com",
      "pages": [
        {"name": "home", "url": "https://mysite.com"},
        {"name": "products", "url": "https://mysite.com/products"}
      ]
    }
  ]
}
```

Or explicitly disable:

```json
{
  "autoCrawl": {
    "enabled": false
  }
}
```

---

## Troubleshooting

### "No sitemap found, using BFS crawler" takes too long

**Solution:** Lower `maxPages` and `maxDepth`

```json
"maxPages": 20,    // Visit fewer pages
"maxDepth": 2      // Don't go as deep
```

### Crawler is visiting unimportant pages

**Solution:** Add exclude patterns

```json
"excludePatterns": [
  "/search",
  "/404", 
  "/error",
  "/help"
]
```

### Crawler is too slow

**Solution:** Increase `delayMs` or add include patterns

```json
"delayMs": 250,    // Faster requests (less respectful)
```

Or be more selective:

```json
"includePatterns": ["/products", "/articles"],  // Only these paths
"maxPages": 20
```

### Getting blocked by server

**Solution:** Increase delay

```json
"delayMs": 2000    // Wait 2 seconds between requests
```

Or lower `maxPages`:

```json
"maxPages": 10     // Visit fewer pages total
```

---

## Best Practices

1. **Start conservative:**
   ```json
   "maxPages": 20,
   "maxDepth": 2,
   "delayMs": 1000
   ```

2. **Exclude unnecessary paths:**
   ```json
   "excludePatterns": ["/admin", "/api", "/help", "/search"]
   ```

3. **Respect the server:**
   - Use reasonable `delayMs` (500-2000ms)
   - Honor `robots.txt`
   - Don't set `maxPages` too high

4. **Test before running:**
   - Set `maxPages: 5` first
   - Check output
   - Increase limits after validating

5. **Use manual mode for critical pages:**
   - Ensure important pages are always visited
   - Combine with auto-crawl for additional discovery

---

## Performance Notes

### Sitemap Mode

- ⚡ **Fast:** 100+ pages in <30 seconds
- ✅ Best: Use when sitemap available
- Most modern sites have sitemaps

### BFS Mode

- 🐢 **Slower:** 1-5 seconds per page
- 50 pages with 500ms delay = ~40 seconds
- 50 pages with 1000ms delay = ~80 seconds

### Recommendations

| Scenario | Settings |
|----------|----------|
| Small site (<50 pages) | `maxPages: 50, maxDepth: 3, delayMs: 500` |
| Medium site (50-500 pages) | `maxPages: 100, maxDepth: 4, delayMs: 1000` |
| Large site (1000+ pages) | Use sitemap, or `maxPages: 50, maxDepth: 2` |
| Rate-limited site | `delayMs: 2000, maxPages: 20` |

---

## Advanced: Custom Include Patterns

(Future enhancement - not yet implemented)

Only visit URLs matching patterns:

```json
"includePatterns": [
  "/products.*",
  "/articles.*",
  "/dashboard.*"
]
```

This would skip everything except URLs matching these patterns.

---

## FAQ

**Q: Will auto-crawl break my existing configuration?**  
A: No! Auto-crawl is optional. Existing manual pages still work. Enable it only when you want auto-discovery.

**Q: Can I use sitemap + manual pages?**  
A: If you have manual pages, they're used instead of sitemap. Either use one or the other.

**Q: Does auto-crawl respect authentication?**  
A: Yes! Crawled pages use the same `authFile` as configured.

**Q: What if a page fails during crawl?**  
A: The crawler skips it and continues with other pages. No total failure.

**Q: How do I crawl behind authentication?**  
A: Configure `authFile` in your site config. Auto-crawl will use it for all discovered pages.
