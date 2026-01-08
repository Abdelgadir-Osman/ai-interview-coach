# How to Enable Workers AI

This guide explains how to enable Workers AI (Llama 3.3) for the AI Interview Coach application.

## Prerequisites

1. **Cloudflare Account**: Sign up at [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) if you don't have one
2. **Wrangler CLI**: Already included in the project dependencies - use `npm run` commands (no global install needed)

## Step-by-Step Instructions

### Option 1: Remote Development Mode (Recommended for AI)

This enables full AI functionality during development.

#### Step 1: Authenticate with Cloudflare

```bash
cd worker
npm run login
```

This will:
- Open your browser
- Ask you to log in to Cloudflare
- Authorize Wrangler to access your Cloudflare account

#### Step 2: Register a Workers.dev Subdomain

**Option A: Via Dashboard (Recommended)**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Overview**
3. Click **Get started** or **Create a Worker**
4. If prompted, register your `workers.dev` subdomain (e.g., `yourname.workers.dev`)

**Option B: Via Wrangler**

When you first run `wrangler dev` without `--local`, it may prompt you to register a subdomain, or you can do it manually:

1. Visit: [https://dash.cloudflare.com/workers/onboarding](https://dash.cloudflare.com/workers/onboarding)
2. Follow the prompts to register your `workers.dev` subdomain

#### Step 3: Start Worker in Remote Mode

```bash
cd worker
npm run dev:remote
```

**Note**: This uses remote mode which connects to Cloudflare's infrastructure where the AI binding is available.

### Option 2: Deploy to Cloudflare Workers (Best for Production)

Deploying makes the AI binding available in production.

#### Step 1: Authenticate with Cloudflare

```bash
cd worker
npm run login
```

#### Step 2: Deploy the Worker

```bash
npm run deploy
```

This will:
- Deploy your Worker to `https://worker.your-subdomain.workers.dev`
- Enable all bindings including the AI binding
- Make the AI functionality available via the deployed URL

#### Step 3: Update Pages Configuration

If you deploy the Worker, update the Pages app to point to the deployed Worker URL:

1. Go to Cloudflare Pages dashboard
2. Navigate to your Pages project
3. Go to **Settings** → **Environment Variables**
4. Add:
   ```
   VITE_API_URL=https://worker.your-subdomain.workers.dev
   ```
5. Redeploy the Pages app

### Option 3: Local Mode (Limited AI)

Local mode works for testing Durable Objects but has **limited AI functionality**.

```bash
cd worker
npm run dev  # Uses --local flag
```

**Limitations**:
- AI binding may not be fully available
- Falls back to hardcoded questions/grades
- Good for testing Worker logic, but not full AI functionality

## Verify AI is Working

Once enabled, test that AI is working:

### Test 1: Check Worker Logs

When you start the Worker, you should see:
```
Your Worker has access to the following bindings:
Binding                       Resource            Mode
env.MEMORY_DO (MemoryDO)      Durable Object      local/remote
env.AI                        AI                  remote
```

The `env.AI` binding should be listed.

### Test 2: Send a Chat Request

```bash
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-ai",
    "message": "/start behavioral"
  }'
```

**If AI is working**: You'll get a dynamically generated interview question tailored to the mode.

**If AI is not working**: You'll get a fallback question (hardcoded). Check the console for errors.

### Test 3: Check for AI Errors

Open the browser console or check Worker logs. Look for:
- ✅ No errors → AI is working
- ❌ "AI binding unavailable" → Need to enable remote mode or deploy
- ❌ "Model not found" → Check model name in `index.ts` (should be `@cf/meta/llama-3.3-70b-instruct-fp8-fast`)

## Troubleshooting

### Error: "You need to register a workers.dev subdomain"

**Solution**: Register a subdomain at [https://dash.cloudflare.com/workers/onboarding](https://dash.cloudflare.com/workers/onboarding)

### Error: "Failed to authenticate"

**Solution**: 
```bash
cd worker
npx wrangler logout
npm run login
```

### Error: "AI binding not available"

**Solutions**:
1. **Use remote mode**: `npm run dev:remote` instead of `npm run dev`
2. **Deploy the Worker**: `npm run deploy` (AI binding is always available in production)
3. **Check wrangler.jsonc**: Ensure `"ai": { "binding": "AI" }` is present

### Error: "Model not found" or "Model unavailable"

**Solution**: 
- Check that the model name in `worker/src/index.ts` is correct: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- Verify Workers AI is enabled for your account at [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Some models may require specific Cloudflare plans

### AI Returns Null or Fallback Responses

**Possible causes**:
1. **Local mode**: Switch to remote mode or deploy
2. **Rate limiting**: Cloudflare may rate limit AI requests
3. **Model unavailable**: The specific model may not be available in your region/plan

**Debug**:
- Check Worker logs in Cloudflare dashboard
- Verify the AI binding is listed when starting the Worker
- Try deploying to production where AI is always available

## Model Information

**Current Model**: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`

**Location**: `worker/src/index.ts` line 16

**Usage**:
- Question generation: Tailored interview questions based on mode and weaknesses
- Answer grading: Structured JSON scoring with STAR rubric

## Alternative: Use Different Model

To use a different Workers AI model, update `worker/src/index.ts`:

```typescript
// Change this line:
const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

// To another model, e.g.:
const MODEL = "@cf/meta/llama-3.1-8b-instruct";
```

See available models: [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)

## Quick Reference

| Mode | AI Available? | Command | Use Case |
|------|---------------|---------|----------|
| Local | ❌ Limited | `npm run dev` | Testing Worker logic |
| Remote | ✅ Yes | `npm run dev:remote` | Full AI during development |
| Deployed | ✅ Yes | `npm run deploy` | Production with full AI |

## Next Steps

Once AI is enabled:

1. **Test the full flow**: Start an interview and verify questions are generated dynamically
2. **Test grading**: Answer a question and verify AI provides structured feedback
3. **Check adaptation**: Answer multiple questions and verify next questions adapt to weaknesses
4. **Deploy to production**: Use `npm run deploy` for production deployment

---

**Note**: The application has fallback logic, so it will work even if AI is unavailable (using hardcoded questions/grades). However, enabling AI provides the full adaptive interview coaching experience.

