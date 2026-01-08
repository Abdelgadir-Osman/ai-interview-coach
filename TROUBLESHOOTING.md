# Troubleshooting Connection Errors

## Error: "Sorry, I encountered an error. Please try again."

This error means the frontend can't connect to the Worker. Here's how to fix it:

### Step 1: Check Browser Console

1. **Open Developer Tools**
   - Press `F12` or right-click → "Inspect"
   - Go to **Console** tab

2. **Look for errors**
   - Red error messages will show what's wrong
   - Common errors:
     - `Failed to fetch` - CORS or network issue
     - `404 Not Found` - Wrong API URL
     - `CORS policy` - CORS configuration issue

### Step 2: Verify Environment Variable

1. **Go to Cloudflare Dashboard**
   - Navigate to: **Workers & Pages** → **interview-coach**
   - Go to: **Settings** → **Environment Variables**

2. **Check the variable**
   - **Name**: `VITE_API_URL`
   - **Value**: `https://worker.o-abdelgadir32.workers.dev/api`
   - **Environment**: Production (must be checked)

3. **If missing or wrong:**
   - Add/update it
   - Redeploy (see REDEPLOY_PAGES.md)

### Step 3: Check Network Tab

1. **Open Developer Tools** (F12)
2. **Go to Network tab**
3. **Click "Start Interview" again**
4. **Look for the API request:**
   - Should see a request to `/api/chat`
   - Check the **Request URL** - should be: `https://worker.o-abdelgadir32.workers.dev/api/chat`
   - If it shows `http://localhost:8787/api/chat` or just `/api/chat`, the environment variable isn't set

### Step 4: Test Worker Directly

Verify your Worker is accessible:

```powershell
$body = '{"sessionId":"test","message":"/start mixed"}' | ConvertTo-Json -Compress
Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
```

If this works, the Worker is fine - the issue is the frontend connection.

### Step 5: Common Fixes

#### Fix 1: Environment Variable Not Applied
- **Solution**: Redeploy Pages after setting the variable
- See: REDEPLOY_PAGES.md

#### Fix 2: Wrong API URL Format
- **Wrong**: `https://worker.o-abdelgadir32.workers.dev` (missing `/api`)
- **Correct**: `https://worker.o-abdelgadir32.workers.dev/api`

#### Fix 3: CORS Error
- Worker already has CORS configured
- If you see CORS errors, check that Worker URL is correct
- Verify Worker is deployed and accessible

#### Fix 4: Hard Refresh Browser
- Clear cache: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or clear browser cache completely

### Step 6: Verify Deployment

1. **Check Pages deployment**
   - Go to: **Deployments** tab
   - Latest deployment should show green checkmark
   - Should be from after you set the environment variable

2. **Check Worker deployment**
   - Go to: **Workers & Pages** → **worker**
   - Verify it's deployed and accessible

### Quick Diagnostic Script

Run this to test everything:

```powershell
# Test Worker
Write-Host "Testing Worker..." -ForegroundColor Yellow
$body = '{"sessionId":"test","message":"/start mixed"}' | ConvertTo-Json -Compress
try {
    $r = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
    Write-Host "✅ Worker is working" -ForegroundColor Green
} catch {
    Write-Host "❌ Worker error: $($_.Exception.Message)" -ForegroundColor Red
}

# Check environment variable (if you can access it)
Write-Host "`nCheck Pages environment variable:" -ForegroundColor Yellow
Write-Host "VITE_API_URL should be: https://worker.o-abdelgadir32.workers.dev/api" -ForegroundColor Cyan
```

## Still Not Working?

1. **Check browser console** - Most errors will be there
2. **Verify Worker URL** - Test it directly (see Step 4)
3. **Redeploy Pages** - After setting environment variable
4. **Clear browser cache** - Hard refresh the page
5. **Check Network tab** - See what URL the frontend is trying to use

---

**Most common issue**: Environment variable not set or not applied after redeployment.

