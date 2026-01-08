# Quick Test Script for AI Interview Coach
# Run this to verify basic functionality

Write-Host "`n🧪 Testing AI Interview Coach..." -ForegroundColor Cyan

# Test 1: Start Interview
Write-Host "`n1. Testing interview start..." -ForegroundColor Yellow
$body1 = '{"sessionId":"test-' + (Get-Random) + '","message":"/start behavioral"}' | ConvertTo-Json -Compress
try {
    $r1 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body1 -ContentType 'application/json' -UseBasicParsing
    $json1 = $r1.Content | ConvertFrom-Json
    Write-Host "   ✅ Interview started" -ForegroundColor Green
    Write-Host "   Question: $($json1.reply.Substring(0, [Math]::Min(80, $json1.reply.Length)))..." -ForegroundColor Gray
    $sessionId = $json1.sessionId
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Test 2: Answer Question
Write-Host "`n2. Testing answer grading..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
$body2 = @{
    sessionId = $sessionId
    message = "I led a team of 5 developers to build a mobile app. We used Agile methodology, completed it in 3 months, and the app now has 50,000 downloads with a 4.5-star rating."
} | ConvertTo-Json -Compress
try {
    $r2 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/chat' -Method POST -Body $body2 -ContentType 'application/json' -UseBasicParsing
    $json2 = $r2.Content | ConvertFrom-Json
    if ($json2.lastGrade) {
        Write-Host "   ✅ Answer graded: Score $($json2.lastGrade.overallScore)/10" -ForegroundColor Green
        Write-Host "   Stats: $($json2.stats.questionsAnswered) questions, Avg: $($json2.stats.avgScore)" -ForegroundColor Gray
        Write-Host "   Focus: $($json2.stats.currentFocus)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  No grade returned (check reply for feedback)" -ForegroundColor Yellow
        Write-Host "   Reply: $($json2.reply.Substring(0, [Math]::Min(150, $json2.reply.Length)))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get Summary
Write-Host "`n3. Testing summary endpoint..." -ForegroundColor Yellow
try {
    $summary = Invoke-WebRequest -Uri "https://worker.o-abdelgadir32.workers.dev/api/summary?sessionId=$sessionId" -UseBasicParsing
    $summaryJson = $summary.Content | ConvertFrom-Json
    Write-Host "   ✅ Summary retrieved" -ForegroundColor Green
    Write-Host "   Questions: $($summaryJson.stats.questionsAnswered)" -ForegroundColor Gray
    Write-Host "   Avg Score: $($summaryJson.stats.avgScore)" -ForegroundColor Gray
    Write-Host "   Focus: $($summaryJson.currentFocus)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Test Reset
Write-Host "`n4. Testing reset..." -ForegroundColor Yellow
$body3 = @{
    sessionId = $sessionId
} | ConvertTo-Json -Compress
try {
    $r3 = Invoke-WebRequest -Uri 'https://worker.o-abdelgadir32.workers.dev/api/reset' -Method POST -Body $body3 -ContentType 'application/json' -UseBasicParsing
    $json3 = $r3.Content | ConvertFrom-Json
    if ($json3.ok) {
        Write-Host "   ✅ Reset successful" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Reset response: $($json3 | ConvertTo-Json)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Quick test complete!" -ForegroundColor Green
Write-Host "`nSee TEST_CHECKLIST.md for comprehensive testing (18 test cases)" -ForegroundColor Cyan

