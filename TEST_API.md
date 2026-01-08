# Testing Your Deployed Worker API

## ✅ Your Worker is Working!

The Worker is deployed and responding correctly. The "Not found" error you saw is because the API endpoints require specific HTTP methods and request bodies.

## API Endpoints

### POST /api/chat

**Required**: POST method with JSON body

**Test with PowerShell:**
```powershell
$body = '{"sessionId":"test","message":"/start behavioral"}' | ConvertTo-Json -Compress
Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' `
    -Method POST `
    -Body $body `
    -ContentType 'application/json' `
    -UseBasicParsing
```

**Test with curl:**
```bash
curl -X POST https://worker.o-abdelgadir32.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","message":"/start behavioral"}'
```

### POST /api/reset

```powershell
$body = '{"sessionId":"test"}' | ConvertTo-Json -Compress
Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/reset' `
    -Method POST `
    -Body $body `
    -ContentType 'application/json' `
    -UseBasicParsing
```

### GET /api/summary

**This one works in browser!**

Visit in browser:
```
https://worker.o-abdelgadir32.workers.dev/api/summary?sessionId=test
```

Or with PowerShell:
```powershell
Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/summary?sessionId=test' -UseBasicParsing
```

## Why "Not found" in Browser?

When you visit `/api/chat` in a browser, it sends a **GET** request, but the endpoint only accepts **POST** requests. That's why you see "Not found".

## Quick Test

Run this in PowerShell to verify everything works:

```powershell
$body = '{"sessionId":"test","message":"/start behavioral"}' | ConvertTo-Json -Compress
$response = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
$json = $response.Content | ConvertFrom-Json
Write-Host "✅ Worker is working!" -ForegroundColor Green
Write-Host "Reply: $($json.reply)" -ForegroundColor Cyan
Write-Host "Session ID: $($json.sessionId)" -ForegroundColor Yellow
```

## Expected Response

```json
{
  "sessionId": "test",
  "reply": "Tell me about a project you worked on...",
  "stats": {
    "avgScore": 0,
    "lastScores": [],
    "currentFocus": "General improvement",
    "questionsAnswered": 0
  }
}
```

---

**Your Worker is fully functional!** The "Not found" error is just because browsers send GET requests by default, but your API requires POST for `/api/chat`.

