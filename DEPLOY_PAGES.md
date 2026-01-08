# Deploy Pages Frontend

Your Pages app is built and ready in `apps/web/dist/`. Here's how to deploy it:

## ✅ Build Complete

The Pages app has been successfully built to `apps/web/dist/`.

## Option 1: Deploy via Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com/
   - Navigate to: **Workers & Pages** → **Create application** → **Pages** → **Upload assets**

2. **Upload the dist folder**
   - Project name: `interview-coach` (or any name you prefer)
   - Drag and drop the `apps/web/dist` folder or select it
   - Click **Deploy site**

3. **Set Environment Variable**
   - After deployment, go to your Pages project
   - Navigate to: **Settings** → **Environment Variables**
   - Add new variable:
     - **Variable name**: `VITE_API_URL`
     - **Value**: `https://worker.o-abdelgadir32.workers.dev/api`
   - Save and redeploy

4. **Your Pages URL**
   - Your app will be available at: `https://interview-coach.pages.dev` (or similar)

## Option 2: Deploy via Wrangler CLI

First, create the project in the dashboard (see Option 1, step 1-2), then:

```powershell
cd apps/web
npx wrangler pages deploy dist --project-name=interview-coach --commit-dirty=true
```

## Option 3: Connect Git Repository (For CI/CD)

1. Push your code to GitHub/GitLab
2. In Cloudflare Dashboard:
   - Go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
   - Select your repository
   - Build command: `cd apps/web && npm install && npm run build`
   - Build output directory: `apps/web/dist`
   - Root directory: `/` (or set to `apps/web` if needed)
3. Set environment variable `VITE_API_URL` as above

## Verify Deployment

After deployment, visit your Pages URL and test:
- Chat interface should load
- Sending a message should connect to your deployed Worker
- AI should generate questions

## Troubleshooting

**If the frontend can't connect to the Worker:**
- Check that `VITE_API_URL` environment variable is set correctly
- Verify the Worker URL: https://worker.o-abdelgadir32.workers.dev
- Check browser console for CORS errors (should be handled, but verify)

**If build fails:**
- Make sure you're in the `apps/web` directory
- Run `npm install` first
- Check TypeScript errors: `npm run build`

---

**Current Status:**
- ✅ Worker deployed: https://worker.o-abdelgadir32.workers.dev
- ✅ Pages app built: `apps/web/dist/`
- ⏳ Pages deployment: Use one of the options above

