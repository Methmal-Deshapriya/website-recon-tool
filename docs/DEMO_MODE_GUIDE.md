# Live Demo & Debug Mode Guide

Enable live visualization of the web scraping process! See exactly what the tool is doing in real-time.

## Quick Start: Demo Mode

Run with the browser visible and slow motion effects:

```bash
DEMO=true npm run recon
```

This enables:
- ✅ Browser window visible (headed mode)
- ✅ 1 second delay between actions
- ✅ Full visual feedback

---

## Individual Feature Controls

### 1. **Headed Mode (Browser GUI Visible)**

Show the browser window while crawling:

```bash
HEADED=true npm run recon
```

Or use the DEMO flag (which includes headed mode):

```bash
DEMO=true npm run recon
```

**Use case:** Watch the tool interact with the website in real-time.

---

### 2. **Slow Motion (Slow Down Actions)**

Slow down all browser interactions so you can see what's happening:

```bash
SLOW_MO=1000 npm run recon
```

Where `1000` = milliseconds delay. Options:
- `500` - Half second delays (fast)
- `1000` - 1 second delays (medium) 
- `2000` - 2 second delays (very slow)

**Use case:** Debug crawling behavior, see page transitions clearly.

---

### 3. **Video Recording**

Record the entire crawling session as a video:

```bash
RECORD_VIDEO=true npm run recon
```

**Output:** Videos saved to `output/videos/` folder (`.webm` format)

**Use case:** Share scraping process with stakeholders, debug sessions, documentation.

---

### 4. **Debug Browser Mode**

Enable interactive browser debugging:

```bash
DEBUG_BROWSER=true npm run recon
```

Then when the tool runs:
- Browser will pause on breakpoints
- You can inspect elements interactively
- Use DevTools (F12) to interact manually

**Use case:** Deep debugging, understanding page interactions.

---

## Combinations: Full Demo Experience

Combine features for maximum visibility:

```bash
# Demo mode with 2-second slow motion
DEMO=true SLOW_MO=2000 npm run recon

# All features enabled (demo + video recording)
DEMO=true RECORD_VIDEO=true SLOW_MO=1000 npm run recon

# Headless with video recording (no GUI, just record)
RECORD_VIDEO=true npm run recon

# Interactive debugging with slow motion
DEBUG_BROWSER=true SLOW_MO=1500 npm run recon
```

---

## Environment Variables Reference

| Variable | Value | Effect |
|----------|-------|--------|
| `DEMO` | `true` | Headed mode + 1s slow motion |
| `HEADED` | `true` | Show browser GUI |
| `SLOW_MO` | `500-2000` | Milliseconds delay between actions |
| `RECORD_VIDEO` | `true` | Record session to WebM video |
| `DEBUG_BROWSER` | `true` | Enable interactive debugging |
| `DEBUG` | `true` | Enable debug logging (existing feature) |

---

## Example Workflows

### Workflow 1: Watch a Single Page Crawl
```bash
DEMO=true SLOW_MO=1500 npm run recon
```
Perfect for understanding the scraping process visually.

### Workflow 2: Record for Presentation
```bash
RECORD_VIDEO=true npm run recon
```
Video saves to `output/videos/` - share with team or stakeholders.

### Workflow 3: Debug Failing Page
```bash
DEBUG_BROWSER=true SLOW_MO=2000 npm run recon
```
See exactly where it fails, interact manually with DevTools.

### Workflow 4: Full Transparency
```bash
DEMO=true RECORD_VIDEO=true SLOW_MO=1000 DEBUG=true npm run recon
```
Maximum visibility - visual + video + debug logs.

---

## What You'll See

### In Headed Mode (DEMO=true)
1. Browser window opens showing target website
2. Tool navigates to pages
3. Auto-scrolling happens (to trigger lazy-loading)
4. Screenshots and snapshots are captured
5. Browser closes when done

### Video Recording (RECORD_VIDEO=true)
1. Entire session recorded as WebM video
2. Saved to `output/videos/` 
3. No audio, just visual capture
4. Can be played in any video player
5. Useful for documentation/training

### Debug Mode (DEBUG_BROWSER=true)
1. Browser opens and pauses
2. You can manually interact with page
3. Use DevTools (F12) to inspect
4. Resume automated crawling anytime
5. See network activity in DevTools

---

## Performance Notes

- **Demo mode** slows down execution (intended for visibility)
- **Video recording** adds minimal overhead
- **Debug mode** pauses execution (interactive)
- **Slow motion** is cumulative with actual page load times

**Typical execution times:**
- Normal (headless): 5-10 seconds per page
- Demo (headed + slow): 20-30 seconds per page
- With video: Similar to demo (recording is background process)

---

## Troubleshooting

**Browser window doesn't show?**
- Make sure `DEMO=true` or `HEADED=true` is set
- Some Linux systems may require display server (X11/Wayland)

**Video file is empty?**
- Recording requires HEADED mode (not needed anymore - fixed)
- Videos save after browser closes
- Check `output/videos/` folder

**Slow motion not working?**
- Ensure `SLOW_MO` is set before running
- Value must be a number in milliseconds
- Works only with browser interactions, not page load time

**Debug mode not pausing?**
- Requires `DEBUG_BROWSER=true`
- DevTools opens automatically (F12 in headed mode)
- Some pages may load before you can interact

---

## Tips for Best Results

1. **For Learning:** `DEMO=true SLOW_MO=1500`
   - See exactly what the tool does step-by-step

2. **For Recording:** `RECORD_VIDEO=true`
   - Clean output without visual clutter
   - Perfect for documentation

3. **For Debugging:** `DEBUG_BROWSER=true SLOW_MO=2000`
   - Pause when needed with DevTools
   - Inspect page state live

4. **For Production:** No flags
   - Fastest execution
   - Headless mode, minimal resources

---

## Next Steps

Once you understand the scraping flow with demo mode, you can:
- Adjust `maxDepth`, `maxPages` based on what you see
- Fine-tune `excludePatterns` for unwanted pages
- Optimize `delayMs` between requests
- Add manual pages for hidden content
