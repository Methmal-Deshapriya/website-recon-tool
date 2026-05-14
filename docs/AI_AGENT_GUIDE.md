# Website Recon Tool MVP — AI Agent Development Guide

## Project Identity

This project is a lightweight browser reconnaissance utility for analyzing modern JS-heavy authenticated websites before building scraping or automation systems.

**The system is NOT:**
- A production scraper
- A website cloning system
- An AI agent platform
- A distributed crawler
- An anti-bot bypass framework

**The system IS:**
- A browser recon utility
- A structured browser analysis tool
- A Playwright-based inspection/export system
- A research tool for future automation decisions

---

## Primary Engineering Goal

The goal is to understand:
- Rendered DOM structures
- Forms, buttons, inputs, and tables
- Workflows
- Network/API traffic
- GraphQL usage
- Authentication/session behavior

The system must export structured browser intelligence for engineering analysis.

---

## Core Philosophy

### MOST IMPORTANT RULE

**DO NOT OVERENGINEER.**

This project must remain lightweight, modular, understandable, fast to iterate, and easy to debug.

**Avoid:**
- Enterprise architecture
- Unnecessary abstractions
- Complex patterns
- Premature optimization

---

## Engineering Priorities

```text
1. Reliability
2. Simplicity
3. Maintainability
4. Structured output
5. Developer clarity
6. Extensibility
7. Performance
```

---

## Scope Control Rules

**NEVER ADD THESE UNLESS EXPLICITLY REQUESTED:**
- Proxy rotation
- CAPTCHA bypassing
- AI agents / LLM integrations
- Database systems
- Dashboard frontend
- Distributed workers / queue systems
- Automatic crawling
- Asset downloading
- Full website mirroring
- Browser fingerprint spoofing / anti-detection systems

---

## Expected Architecture Style

The architecture must remain simple, modular, functional, and explicit.

**Prefer:**
- Small reusable functions
- Explicit flows
- Direct implementations
- Readable code

**Avoid:**
- Deeply nested abstractions
- Overuse of classes
- Excessive dependency injection
- Unnecessary design patterns

---

## Technology Constraints

### Allowed Core Technologies
- Node.js
- TypeScript
- Playwright
- Cheerio
- fs-extra
- dotenv
- zod
- p-limit

> Do NOT introduce large frameworks unless explicitly approved.

### TypeScript Standards

- Strict typing enabled
- No `any` unless absolutely unavoidable
- Prefer explicit interfaces/types
- Keep types readable
- Avoid overly complex generics

### File Organization Rules

Each file should have one clear responsibility, minimal side effects, and explicit exports.

**Avoid:** giant utility files, god modules, mixed responsibilities.

---

## Output Philosophy

**The most valuable outputs are:**
- `network.json`
- `forms.json`
- `buttons.json`
- `tables.json`
- `metadata.json`
- `summary.json`

**NOT:** CSS, fonts, JS bundles, or static assets.

Focus on browser intelligence.

---

## Development Approach

### CRITICAL RULE

**Implement ONE MODULE AT A TIME.**

Do NOT attempt to build the entire system in one pass.

### Recommended Development Order

#### Phase 1 — Foundation

**Goals:** Browser launch, auth saving, auth loading, config loading

**Files:**
```
src/auth/saveAuth.ts
src/auth/loadAuth.ts
src/browser/browserFactory.ts
```

#### Phase 2 — Basic Recon

**Goals:** Open pages, wait for rendering, save HTML, save text, save screenshots

**Files:**
```
src/crawler/pageRunner.ts
src/storage/outputWriter.ts
```

#### Phase 3 — Network Intelligence

**Goals:** Record network requests, detect APIs, detect GraphQL, export structured network data

**Files:**
```
src/network/networkRecorder.ts
```

#### Phase 4 — DOM Intelligence

**Goals:** Extract buttons, forms, inputs, links, and tables

**Files:**
```
src/extractors/*
```

#### Phase 5 — Metadata + Summary

**Goals:** Generate metadata, generate summaries, improve exports

---

## Browser Automation Rules

**Use Playwright Chromium.** Do NOT use Selenium, Puppeteer, or Cypress unless explicitly requested.

### Authentication Rules

Authentication is **MANUAL** for MVP.

**Flow:**
1. Open browser
2. User logs in manually
3. User presses ENTER
4. Save storage state

**Do NOT implement:** automatic login flows, MFA bypassing, or credential management systems — unless explicitly requested.

### Page Navigation Rules

This project uses **manually configured pages**, NOT recursive crawling. Do not implement automatic website crawling in MVP.

Pages come from `configs/sites.config.json`.

### Waiting Strategy Rules

Modern websites are JS-heavy. Always wait properly before extraction.

**Preferred approach:**
```ts
waitUntil: "networkidle"
```

Additional stabilization helpers are allowed. Avoid arbitrary long sleeps and unstable timing hacks.

### Network Intelligence Rules

**Capture:** method, URL, resource type, status, content type

**Detect:** APIs, GraphQL, fetch/XHR traffic

**Do NOT save:** sensitive auth tokens, cookies, or private request bodies — unless explicitly requested.

---

## DOM Extraction Philosophy

The system should identify automation targets, workflow structures, and business-relevant elements.

The goal is **NOT** pixel-perfect DOM reconstruction.

---

## Error Handling Rules

**Requirements:** graceful failures, meaningful logs, explicit error messages, no silent failures.

**Use:** `try/catch`, structured logs

**Avoid:** swallowed errors, unclear console spam

---

## Logging Philosophy

Logs should help engineers understand:
- What page opened
- What extraction started
- What failed
- What was exported

Avoid excessive noisy logs.

---

## Output Structure Rules

Every page must generate its own folder:

```
output/site-name/page-name/
```

Outputs must remain deterministic, organized, and human-readable.

---

## Coding Style Rules

**Prefer:** descriptive naming, short functions, pure utilities, straightforward logic

**Avoid:** clever code, unnecessary abstractions, premature optimization

---

## Performance Rules

For MVP: **correctness > speed**

Avoid concurrency complexity, browser pooling, and clustering — unless explicitly requested later.

---

## Important Recon Philosophy

This project exists to help answer:

> Can future automation use direct APIs? DOM scraping? Browser automation? GraphQL interception? Workflow simulation?

The recon data should help engineers make those decisions.

---

## AI Agent Behavioral Rules

### DO ✔
- Work incrementally
- Keep architecture clean
- Maintain strict scope control
- Prioritize maintainability
- Write readable TypeScript
- Keep modules focused
- Ask for clarification when scope changes
- Preserve project simplicity

### DO NOT ✘
- Overengineer
- Introduce unnecessary frameworks
- Add hidden complexity
- Build future systems prematurely
- Create giant abstractions
- Add AI features or distributed systems
- Implement unsupported scope

### IMPORTANT IMPLEMENTATION RULE

After implementing **each** module:

1. Ensure it works independently
2. Ensure outputs are correct
3. Keep architecture clean
4. Only then move to the next module

---

## Expected MVP Result

At MVP completion the system should:

- ✔ Open authenticated browser sessions
- ✔ Visit configured pages
- ✔ Capture rendered DOMs
- ✔ Capture visible text
- ✔ Capture screenshots
- ✔ Extract important elements
- ✔ Record network/API traffic
- ✔ Save structured recon outputs
- ✔ Work across multiple websites

---

## Final Engineering Reminder

This project is intentionally **SMALL**.

The biggest risk is overengineering, scope explosion, and turning recon into a full scraping platform.

Keep the system **lightweight, focused, reliable, and understandable.**

That is the correct engineering direction for this project.
