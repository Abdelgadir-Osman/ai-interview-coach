# GitHub Repository Setup Guide

This guide will help you set up this project as a GitHub repository.

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `ai-interview-coach` (or your preferred name)
4. Description: "AI-powered interview coaching application built on Cloudflare"
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 2: Connect Local Repository

Run these commands in the project directory:

```bash
cd cf_ai_interview_coach

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: AI Interview Coach application"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ai-interview-coach.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 3: Configure GitHub Secrets (for CI/CD)

If you want to use GitHub Actions for automatic deployment:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

   - **Name**: `CLOUDFLARE_API_TOKEN`
     - **Value**: Get from [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
     - Create token with: `Account.Cloudflare Workers.Edit` and `Zone.Cloudflare Pages.Edit` permissions

   - **Name**: `CLOUDFLARE_ACCOUNT_ID`
     - **Value**: Found in Cloudflare Dashboard → Right sidebar → Account ID

## Step 4: Update README Badge (Optional)

Edit `README.md` and replace `yourusername` in the badge URL:

```markdown
[![Deploy to Cloudflare](https://github.com/YOUR_USERNAME/ai-interview-coach/actions/workflows/deploy.yml/badge.svg)]
```

## Step 5: Enable GitHub Actions

1. Go to **Actions** tab in your repository
2. Click **I understand my workflows, go ahead and enable them**
3. Workflows will run automatically on push to `main` branch

## Step 6: Configure Pages Deployment (Optional)

You can also connect Cloudflare Pages to your GitHub repo:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. Click **Create application** → **Pages** → **Connect to Git**
3. Select your repository
4. Configure:
   - **Project name**: `interview-coach`
   - **Production branch**: `main`
   - **Build command**: `cd apps/web && npm install && npm run build`
   - **Build output directory**: `apps/web/dist`
5. Add environment variable:
   - **Variable name**: `VITE_API_URL`
   - **Value**: Your Worker URL (e.g., `https://worker.your-subdomain.workers.dev`)

## Repository Structure

Your repository is now set up with:

- ✅ `.gitignore` - Excludes node_modules, build files, etc.
- ✅ `LICENSE` - MIT License
- ✅ `README.md` - Comprehensive documentation
- ✅ `CONTRIBUTING.md` - Contribution guidelines
- ✅ `.github/workflows/` - CI/CD workflows
- ✅ `.github/ISSUE_TEMPLATE/` - Issue templates

## Next Steps

- Update the README badge URL with your username
- Add topics/tags to your repository (Cloudflare, AI, Interview, Workers, etc.)
- Consider adding a repository description
- Star your own repo! ⭐

## Troubleshooting

**If git push fails:**
- Make sure you've authenticated: `git config --global user.name "Your Name"` and `git config --global user.email "your.email@example.com"`
- Check remote URL: `git remote -v`
- Try: `git push -u origin main --force` (only if you're sure)

**If GitHub Actions fail:**
- Check that secrets are set correctly
- Verify Cloudflare API token has correct permissions
- Check Actions tab for detailed error messages

---

Your repository is ready! 🎉

