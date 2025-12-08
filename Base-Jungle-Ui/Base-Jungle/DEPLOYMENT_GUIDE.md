# Deployment Guide

## Architecture

- **Frontend (React App)**: Deployed on **Vercel**
- **Backend (Express API)**: Deployed on **Render**

## Frontend Deployment (Vercel)

### Automatic Deployment
Vercel should auto-deploy when you push to GitHub `main` branch.

### Manual Deployment Steps

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Find your "Base Jungle" project

2. **Manual Redeploy**
   - Click on your project
   - Go to "Deployments" tab
   - Find the latest deployment
   - Click the "..." menu (three dots)
   - Click "Redeploy"
   - Confirm the redeploy

3. **Check Deployment Settings**
   - Go to Project Settings → Git
   - Verify:
     - ✅ Repository is connected: `celvios/Base-Jungle`
     - ✅ Production Branch: `main`
     - ✅ Auto-deploy: Enabled

4. **Check Build Settings**
   - Go to Project Settings → General
   - Verify:
     - **Root Directory**: `Base-Jungle-Ui/Base-Jungle`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

### Environment Variables (Vercel)

Make sure these are set in Vercel:
- `VITE_REOWN_PROJECT_ID`
- `VITE_USDC_ADDRESS`
- `VITE_CONSERVATIVE_VAULT_ADDRESS`
- `VITE_AGGRESSIVE_VAULT_ADDRESS`
- Any other `VITE_*` variables

**To set/update:**
1. Go to Project Settings → Environment Variables
2. Add or update variables
3. Redeploy after adding new variables

## Backend Deployment (Render)

The backend is separate and only needs updates if you change:
- Backend API code (`server/` folder)
- Database schema
- Backend environment variables

**You don't need to redeploy Render for frontend changes.**

## Troubleshooting

### Vercel Not Auto-Deploying

1. **Check GitHub Integration**
   - Vercel Dashboard → Project Settings → Git
   - Disconnect and reconnect GitHub if needed

2. **Check Webhook**
   - GitHub → Repository → Settings → Webhooks
   - Verify Vercel webhook is active

3. **Manual Trigger**
   - Always use "Redeploy" button as backup

### Changes Not Showing

1. **Clear Browser Cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

2. **Check Build Logs**
   - Vercel Dashboard → Deployments → Click deployment → View logs
   - Look for build errors

3. **Verify Environment Variables**
   - Check if all `VITE_*` variables are set correctly

### Build Fails

1. **Check Build Logs** for specific errors
2. **Verify Node Version** (should be 18+)
3. **Check Dependencies** - ensure `package.json` is correct

## Quick Deploy Command

If you have Vercel CLI installed:
```bash
cd "C:\Users\toluk\Desktop\Base Jungle\Base-Jungle-Ui\Base-Jungle"
vercel --prod
```

## Summary

- ✅ **Frontend changes** → Deploy on **Vercel only**
- ✅ **Backend changes** → Deploy on **Render only**
- ✅ **Current changes** (deposit modal, allowance fix) → **Vercel only**

