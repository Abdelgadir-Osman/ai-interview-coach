# Complete Test Checklist

Use this checklist to verify your AI Interview Coach is fully functional.

## 🧪 Test Categories

### 1. API Endpoints Testing

#### ✅ Test 1: Start Behavioral Interview
```powershell
$body = '{"sessionId":"test-1","message":"/start behavioral"}' | ConvertTo-Json -Compress
$response = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
$json = $response.Content | ConvertFrom-Json
# Expected: Should return a behavioral interview question
Write-Host "Question: $($json.reply)"
Write-Host "Session ID: $($json.sessionId)"
Write-Host "Mode: $($json.stats)"
```

**Verify:**
- [ ] Returns a behavioral interview question
- [ ] Session ID is returned
- [ ] Stats object is present
- [ ] Question is relevant to behavioral interviews

#### ✅ Test 2: Start Technical Interview
```powershell
$body = '{"sessionId":"test-2","message":"/start technical"}' | ConvertTo-Json -Compress
$response = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
$json = $response.Content | ConvertFrom-Json
# Expected: Should return a technical interview question
```

**Verify:**
- [ ] Returns a technical interview question
- [ ] Question asks about technical concepts (algorithms, system design, etc.)

#### ✅ Test 3: Answer a Question (Full Grading Flow)
```powershell
# First, get a question
$body1 = '{"sessionId":"test-3","message":"/start behavioral"}' | ConvertTo-Json -Compress
$response1 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body1 -ContentType 'application/json' -UseBasicParsing
$json1 = $response1.Content | ConvertFrom-Json
$question = $json1.reply

# Now answer it
$body2 = '{"sessionId":"test-3","message":"I once worked on a team project where we had to build a web application. My role was to implement the backend API using Node.js. I collaborated with frontend developers daily, used Git for version control, and we completed the project on time. The application now handles 10,000 requests per day."}' | ConvertTo-Json -Compress
$response2 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body2 -ContentType 'application/json' -UseBasicParsing
$json2 = $response2.Content | ConvertFrom-Json
```

**Verify:**
- [ ] Returns feedback with score
- [ ] Includes strengths
- [ ] Includes improvements
- [ ] Includes next question
- [ ] `lastGrade` object is present
- [ ] Stats are updated (questionsAnswered increased)
- [ ] Score is between 0-10

#### ✅ Test 4: Reset Session
```powershell
$body = '{"sessionId":"test-3"}' | ConvertTo-Json -Compress
$response = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/reset' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
$json = $response.Content | ConvertFrom-Json
# Expected: {"ok": true}
```

**Verify:**
- [ ] Returns `{"ok": true}`
- [ ] Session is cleared (test by getting summary after reset)

#### ✅ Test 5: Get Summary
```powershell
Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/summary?sessionId=test-3' -UseBasicParsing
```

**Verify:**
- [ ] Returns session summary
- [ ] Includes stats
- [ ] Includes currentFocus
- [ ] Includes topSignals

### 2. AI Functionality Testing

#### ✅ Test 6: AI Question Generation
```powershell
$body = '{"sessionId":"test-ai","message":"/start behavioral"}' | ConvertTo-Json -Compress
$response = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
$json = $response.Content | ConvertFrom-Json
```

**Verify:**
- [ ] Question is unique (not hardcoded fallback)
- [ ] Question is contextually appropriate
- [ ] Question varies on repeated requests

#### ✅ Test 7: AI Answer Grading
Answer a question and check the grade:

**Verify:**
- [ ] `overallScore` is a number (0-10)
- [ ] `star` object has situation, task, action, result scores
- [ ] `clarity` and `impact` scores are present
- [ ] `strengths` array has items
- [ ] `improvements` array has items
- [ ] `improvedAnswer` is provided (rewrite)
- [ ] `signalUpdates` object is present

#### ✅ Test 8: Adaptive Questioning (Weakness Tracking)
```powershell
# Answer with missing metrics
$body1 = '{"sessionId":"test-adaptive","message":"/start behavioral"}' | ConvertTo-Json -Compress
$r1 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body1 -ContentType 'application/json' -UseBasicParsing

$body2 = '{"sessionId":"test-adaptive","message":"I worked on a project. It was challenging. We finished it."}' | ConvertTo-Json -Compress
$r2 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body2 -ContentType 'application/json' -UseBasicParsing
$json2 = $r2.Content | ConvertFrom-Json

# Get next question (should adapt to weaknesses)
$body3 = '{"sessionId":"test-adaptive","message":"/start behavioral"}' | ConvertTo-Json -Compress
$r3 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body3 -ContentType 'application/json' -UseBasicParsing
$json3 = $r3.Content | ConvertFrom-Json
```

**Verify:**
- [ ] Next question mentions metrics/quantification
- [ ] `currentFocus` in stats reflects weakness
- [ ] Signals are updated (check summary)

### 3. State Persistence Testing

#### ✅ Test 9: Session Persistence
```powershell
# Create session and answer
$body1 = '{"sessionId":"test-persist","message":"/start behavioral"}' | ConvertTo-Json -Compress
$r1 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body1 -ContentType 'application/json' -UseBasicParsing

$body2 = '{"sessionId":"test-persist","message":"I led a team of 5 developers to build a mobile app. We used Agile methodology and completed it in 3 months. The app now has 50,000 downloads."}' | ConvertTo-Json -Compress
$r2 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body2 -ContentType 'application/json' -UseBasicParsing

# Wait a few seconds, then get summary
Start-Sleep -Seconds 2
$summary = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/summary?sessionId=test-persist' -UseBasicParsing
$summaryJson = $summary.Content | ConvertFrom-Json
```

**Verify:**
- [ ] Session data persists between requests
- [ ] Stats show questionsAnswered = 1
- [ ] lastScores array has one score
- [ ] avgScore is calculated
- [ ] Signals are updated

#### ✅ Test 10: Multiple Sessions (Isolation)
```powershell
# Session A
$bodyA = '{"sessionId":"session-a","message":"/start behavioral"}' | ConvertTo-Json -Compress
$rA = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $bodyA -ContentType 'application/json' -UseBasicParsing

# Session B
$bodyB = '{"sessionId":"session-b","message":"/start technical"}' | ConvertTo-Json -Compress
$rB = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $bodyB -ContentType 'application/json' -UseBasicParsing
```

**Verify:**
- [ ] Each session is independent
- [ ] Session A gets behavioral questions
- [ ] Session B gets technical questions
- [ ] Stats don't mix between sessions

### 4. Commands Testing

#### ✅ Test 11: Command System
```powershell
# Test /reset command
$body = '{"sessionId":"test-cmd","message":"/reset"}' | ConvertTo-Json -Compress
$response = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing

# Test /summary command
$body2 = '{"sessionId":"test-cmd","message":"/summary"}' | ConvertTo-Json -Compress
$response2 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body2 -ContentType 'application/json' -UseBasicParsing

# Test /focus command
$body3 = '{"sessionId":"test-cmd","message":"/focus metrics"}' | ConvertTo-Json -Compress
$response3 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body3 -ContentType 'application/json' -UseBasicParsing
```

**Verify:**
- [ ] `/reset` clears session
- [ ] `/summary` returns summary in chat
- [ ] `/focus metrics` adds to focus areas
- [ ] Commands work in chat flow

### 5. Edge Cases Testing

#### ✅ Test 12: Empty Message
```powershell
$body = '{"sessionId":"test-empty","message":""}' | ConvertTo-Json -Compress
$response = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
```

**Verify:**
- [ ] Returns a question (treats as "start")
- [ ] No errors

#### ✅ Test 13: Very Long Answer
```powershell
$longAnswer = "I worked on a project. " * 200  # Very long answer
$body = @{
    sessionId = "test-long"
    message = "/start behavioral"
} | ConvertTo-Json -Compress
$r1 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing

$body2 = @{
    sessionId = "test-long"
    message = $longAnswer
} | ConvertTo-Json -Compress
$r2 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body2 -ContentType 'application/json' -UseBasicParsing
```

**Verify:**
- [ ] Long answer is truncated (if >3000 chars)
- [ ] Warning message is included
- [ ] Still processes the answer

#### ✅ Test 14: Invalid JSON
```powershell
# Send malformed request
try {
    Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body "not json" -ContentType 'application/json' -UseBasicParsing
} catch {
    Write-Host "Error handled: $($_.Exception.Message)"
}
```

**Verify:**
- [ ] Returns error response (not crashes)
- [ ] Error message is clear

#### ✅ Test 15: Missing Session ID
```powershell
$body = '{"message":"/start behavioral"}' | ConvertTo-Json -Compress
$response = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
$json = $response.Content | ConvertFrom-Json
```

**Verify:**
- [ ] Generates new session ID
- [ ] Works without explicit sessionId

### 6. Full Interview Flow Testing

#### ✅ Test 16: Complete Interview Session
```powershell
$sessionId = "full-test-$(Get-Random)"

# 1. Start interview
$body1 = @{sessionId=$sessionId; message="/start behavioral"} | ConvertTo-Json -Compress
$r1 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body1 -ContentType 'application/json' -UseBasicParsing
$q1 = ($r1.Content | ConvertFrom-Json).reply
Write-Host "Q1: $q1"

# 2. Answer first question
$body2 = @{sessionId=$sessionId; message="I managed a team project where we had to migrate our database. My task was to coordinate the migration without downtime. I created a detailed plan, scheduled maintenance windows, and worked with the DBA team. We successfully migrated 2TB of data with zero downtime. The migration improved query performance by 40%."} | ConvertTo-Json -Compress
$r2 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body2 -ContentType 'application/json' -UseBasicParsing
$feedback1 = ($r2.Content | ConvertFrom-Json).reply
Write-Host "Feedback 1: $feedback1"

# 3. Answer second question (from feedback)
$body3 = @{sessionId=$sessionId; message="I faced a conflict when two team members disagreed on the architecture approach. I facilitated a meeting where we discussed pros and cons. We chose a hybrid approach that satisfied both concerns. The project was delivered on time."} | ConvertTo-Json -Compress
$r3 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body3 -ContentType 'application/json' -UseBasicParsing
$feedback2 = ($r3.Content | ConvertFrom-Json).reply
Write-Host "Feedback 2: $feedback2"

# 4. Get summary
$summary = Invoke-WebRequest -Uri "https://worker.o-abdelgadir32.workers.dev/api/summary?sessionId=$sessionId" -UseBasicParsing
$summaryJson = $summary.Content | ConvertFrom-Json
Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "Questions answered: $($summaryJson.stats.questionsAnswered)"
Write-Host "Average score: $($summaryJson.stats.avgScore)"
Write-Host "Current focus: $($summaryJson.currentFocus)"
```

**Verify:**
- [ ] Complete flow works end-to-end
- [ ] Questions adapt based on answers
- [ ] Scores accumulate correctly
- [ ] Focus areas update based on weaknesses
- [ ] Summary reflects all activity

### 7. Performance Testing

#### ✅ Test 17: Response Times
```powershell
Measure-Command {
    $body = '{"sessionId":"perf-test","message":"/start behavioral"}' | ConvertTo-Json -Compress
    Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
} | Select-Object TotalSeconds
```

**Verify:**
- [ ] Response time < 5 seconds (AI calls can be slow)
- [ ] No timeouts

#### ✅ Test 18: Concurrent Requests
```powershell
# Test multiple requests at once
1..5 | ForEach-Object -Parallel {
    $body = "{\"sessionId\":\"concurrent-$_\",\"message\":\"/start behavioral\"}" | ConvertTo-Json -Compress
    Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
} -ThrottleLimit 5
```

**Verify:**
- [ ] All requests complete
- [ ] No errors
- [ ] Each gets unique session

## 📊 Quick Test Script

Run this comprehensive test:

```powershell
# Quick comprehensive test
Write-Host "🧪 Testing AI Interview Coach..." -ForegroundColor Cyan

# Test 1: Start interview
Write-Host "`n1. Testing interview start..." -ForegroundColor Yellow
$body = '{"sessionId":"comprehensive-test","message":"/start behavioral"}' | ConvertTo-Json -Compress
$r = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
$json = $r.Content | ConvertFrom-Json
if ($json.reply) { Write-Host "✅ Interview started" -ForegroundColor Green } else { Write-Host "❌ Failed" -ForegroundColor Red }

# Test 2: Answer question
Write-Host "`n2. Testing answer grading..." -ForegroundColor Yellow
$body2 = '{"sessionId":"comprehensive-test","message":"I led a team of 5 to build a mobile app. We used Agile, completed in 3 months, and the app now has 50K downloads."}' | ConvertTo-Json -Compress
$r2 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body2 -ContentType 'application/json' -UseBasicParsing
$json2 = $r2.Content | ConvertFrom-Json
if ($json2.lastGrade) { Write-Host "✅ Answer graded: Score $($json2.lastGrade.overallScore)/10" -ForegroundColor Green } else { Write-Host "❌ Grading failed" -ForegroundColor Red }

# Test 3: Get summary
Write-Host "`n3. Testing summary..." -ForegroundColor Yellow
$summary = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/summary?sessionId=comprehensive-test' -UseBasicParsing
$summaryJson = $summary.Content | ConvertFrom-Json
if ($summaryJson.stats) { Write-Host "✅ Summary retrieved: $($summaryJson.stats.questionsAnswered) questions answered" -ForegroundColor Green } else { Write-Host "❌ Summary failed" -ForegroundColor Red }

Write-Host "`n✅ All tests complete!" -ForegroundColor Green
```

## ✅ Success Criteria

Your application is fully working if:

- [x] All API endpoints respond correctly
- [x] AI generates unique, relevant questions
- [x] AI grades answers with structured feedback
- [x] Sessions persist across requests
- [x] Stats update correctly
- [x] Commands work (`/start`, `/reset`, `/summary`, `/focus`)
- [x] Edge cases handled gracefully
- [x] Full interview flow works end-to-end
- [x] Adaptive questioning based on weaknesses
- [x] Response times are acceptable

## 🎯 Expected Results

**Working correctly:**
- Questions are unique and contextually appropriate
- Grades include scores, strengths, improvements, and rewrites
- Stats show accurate counts and averages
- Focus areas adapt to user weaknesses
- Sessions are isolated and persistent

**If something fails:**
- Check Worker logs in Cloudflare dashboard
- Verify AI binding is enabled
- Check Durable Objects are configured
- Review error messages in responses

---

**Run these tests to ensure your AI Interview Coach is production-ready! 🚀**

