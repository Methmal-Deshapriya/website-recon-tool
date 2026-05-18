# Authentication Troubleshooting Guide

If your authenticated website reconnaissance is landing on the login page instead of your target page, this guide will help you diagnose and fix the issue.

## Quick Diagnosis

Run this command to verify your auth file:

```bash
npm run verify-auth auth/your-site-auth.json
```

This will show:
- ✓ If the auth file exists
- ✓ How many cookies are saved
- ✓ If any cookies are expired
- ✓ localStorage data
- ⚠️ Warnings if auth data looks invalid

## Common Issues & Solutions

### Issue 1: Auth File Doesn't Exist

**Symptom:** 
```
✗ No authentication loaded (file not found or invalid)
```

**Cause:** 
You haven't created the auth file, or the path is wrong.

**Solution:**

1. Create the auth file:
```bash
npm run auth auth/your-site-auth.json
```

2. Verify it was created:
```bash
npm run verify-auth auth/your-site-auth.json
```

3. Make sure the path in `configs/sites.config.json` matches:
```json
{
  "name": "my-site",
  "authFile": "auth/my-site-auth.json",
  "pages": [...]
}
```

---

### Issue 2: Cookies Are Expired

**Symptom:**
```
❌ EXPIRED (shown next to cookie names)
⚠️ WARNING: All cookies are expired!
```

**Cause:** 
The saved cookies have expired. This happens when:
- Too much time has passed since you saved auth
- Session timeout on the website
- The website invalidated old sessions

**Solution:**

Re-save your authentication:
```bash
npm run auth auth/your-site-auth.json
```

This will overwrite the old auth file with fresh cookies.

---

### Issue 3: No Cookies Saved

**Symptom:**
```
• 0 cookies
⚠️ WARNING: No cookies saved!
```

**Cause:**
The authentication wasn't actually saved during login.

**Possible reasons:**
1. The website doesn't use cookies (it might use tokens in localStorage or headers)
2. Browser was closed before pressing ENTER
3. Login failed but you pressed ENTER anyway

**Solution:**

1. Try saving auth again, but this time:
   ```bash
   npm run auth auth/your-site-auth.json
   ```

2. Make sure you actually logged in successfully before pressing ENTER

3. If cookies still aren't saved, check if the website uses localStorage instead:
   - The auth file should show "localStorage" items
   - If it shows localStorage items, the website likely uses token-based auth

---

### Issue 4: Website Uses Token-Based Auth (Not Cookies)

**Symptom:**
```
✓ File is valid JSON
✓ 0 cookies
• 2 origins with localStorage
  - https://your-site.com (2 items)
    - authToken: "..."
    - sessionId: "..."
```

**Cause:**
Your website stores auth in localStorage/sessionStorage instead of cookies.

**Status:** ✓ This is fine! Playwright will restore these tokens.

**If still failing:**
- The tokens might be expired
- The tokens might be invalidated by the server
- Try re-saving auth: `npm run auth auth/your-site-auth.json`

---

### Issue 5: Auth File Looks Valid But Still Lands on Login

**Symptom:**
```
✓ Auth data looks valid!
```

But when running `npm run recon`, it still reads the login page.

**Possible causes:**

1. **Server-side session validation is strict**
   - The server validates the cookie/token in ways beyond what Playwright can restore
   - Example: IP address checking, user agent validation, request headers

2. **Session requires additional headers**
   - Some sites require CSRF tokens or other headers in requests
   - Playwright doesn't restore these automatically

3. **Cookie has specific domain/path requirements**
   - The cookie might be set for a specific subdomain
   - The cookie might have path restrictions

4. **Redirect issue**
   - After loading the auth, the site redirects to login anyway
   - This might be intentional security behavior

**Debugging steps:**

1. **Check the auth file path** — Make sure it's correct:
   ```bash
   npm run verify-auth auth/your-site-auth.json
   ```

2. **Try a fresh auth save:**
   ```bash
   npm run auth auth/your-site-auth.json
   ```

3. **Check the config path** — Make sure sites.config.json has correct authFile:
   ```json
   {
     "sites": [{
       "name": "my-site",
       "authFile": "auth/my-site-auth.json",
       "pages": [{
         "name": "dashboard",
         "url": "https://my-site.com/dashboard"
       }]
     }]
   }
   ```

4. **Enable debug logging** to see more details:
   ```bash
   DEBUG=true npm run recon
   ```

---

### Issue 6: Browser Opens, But Login Doesn't Work

**Symptom:**
When running `npm run auth`, the browser opens but you can't log in.

**Possible causes:**

1. **Website is slow or not loading**
   - The page might take longer to load
   - Try refreshing the page manually

2. **JavaScript isn't fully loaded**
   - Some websites require all JS to load before you can interact
   - Wait a few seconds before trying to log in

3. **Form elements aren't findable**
   - Your browser automation tool needs time to render
   - Click slowly and deliberately

**Solution:**
- Make sure to wait for the page to fully load before logging in
- If the page is very slow, click and wait a few seconds before typing
- Close the browser (don't press ENTER) and try again

---

## Advanced Debugging

### Enable Verbose Logging

```bash
DEBUG=true npm run recon
```

This will show:
- `[DEBUG]` messages for auth loading
- Network request details
- Page navigation events

### Manually Check the Auth File

Open the auth file directly:

```bash
cat auth/your-site-auth.json | jq .
```

You should see:
```json
{
  "cookies": [
    {
      "name": "session_id",
      "value": "abc123...",
      "domain": "your-site.com",
      "path": "/",
      "expires": 1234567890,
      "httpOnly": true,
      "secure": true,
      "sameSite": "Lax"
    }
  ],
  "origins": [...]
}
```

### Check Expiration Times

Cookies have an `expires` field (Unix timestamp). To check if a cookie is expired:

```bash
node -e "console.log(new Date(1234567890 * 1000))"
```

If the date is in the past, the cookie is expired.

---

## When Authentication Can't Be Fixed

Some websites intentionally make browser automation difficult:

1. **Anti-bot systems** (Cloudflare, reCAPTCHA, etc.)
   - These detect and block automation
   - Solution: Not available in this MVP tool

2. **Strict server-side validation**
   - The server validates more than just cookies
   - Solution: Manual HTTP requests + custom headers

3. **Rotating tokens**
   - Tokens are regenerated with every request
   - Solution: Custom authentication logic

---

## Still Not Working?

1. ✓ Run `npm run verify-auth auth/your-site-auth.json`
2. ✓ Check that the auth file path in config matches
3. ✓ Try re-saving with `npm run auth auth/your-site-auth.json`
4. ✓ Run with `DEBUG=true npm run recon` to see detailed logs
5. ✓ Check if cookies are expired (re-save if they are)

If none of these work, the website might use advanced anti-automation techniques beyond MVP scope.
