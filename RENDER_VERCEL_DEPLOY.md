# Render + Vercel Deployment Guide

## 🚀 Quick Deploy

### 1. Backend on Render
1. Connect your GitHub repo to Render
2. Create a new Web Service
3. Use these settings:
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && node dist/index.js`
   - **Environment**: Node.js

### 2. Frontend on Vercel
1. Connect your GitHub repo to Vercel
2. Set root directory to `Base-Jungle-Ui/Base-Jungle`
3. Framework preset: React/Vite

## 🔧 Environment Variables

### Render (Backend)
Create an Environment Group called `basejungle-secrets`:

```bash
# Blockchain
RPC_URL=https://mainnet.base.org
KEEPER_PRIVATE_KEY=your_keeper_private_key

# Contracts
REFERRAL_MANAGER_ADDRESS=0xc8A84e0BF9a4C213564e858A89c8f14738aD0f15
STRATEGY_CONTROLLER_ADDRESS=0x65CD6764A4f574c1F6154518519925277C6CFF81

# Bot Configuration
REBALANCE_KEEPER_INTERVAL=120000
TRACKED_USERS=0x123...,0x456...

# Security
JWT_SECRET=your-super-secret-jwt-key
```

### Vercel (Frontend)
```bash
VITE_API_URL=https://your-render-backend.onrender.com
```

## 📊 Monitoring on Render

### View Logs
1. Go to your Render service dashboard
2. Click "Logs" tab
3. Monitor bot activity in real-time

### Health Check
```bash
curl https://your-render-backend.onrender.com/api/status
```

## 🔄 Auto-Deploy Setup

### GitHub Actions (Optional)
Both Render and Vercel auto-deploy on git push, but you can add health checks:

```yaml
# .github/workflows/deploy.yml
name: Deploy Check
on:
  push:
    branches: [main]
jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Wait for deployment
        run: sleep 60
      - name: Check backend health
        run: curl -f https://your-render-backend.onrender.com/api/status
```

## ⚠️ Important Notes

### Render Limitations
- Free tier sleeps after 15 minutes of inactivity
- Use **Starter plan ($7/month)** for 24/7 operation
- Database included with paid plans

### Keep Alive (Free Tier Workaround)
If using free tier, add this to keep service awake:

```javascript
// Add to BotManager.ts
setInterval(() => {
  fetch(`${process.env.RENDER_EXTERNAL_URL}/api/status`)
    .catch(() => {}); // Keep service alive
}, 14 * 60 * 1000); // Every 14 minutes
```

## 🚀 Deploy Commands

### Deploy Backend to Render
```bash
git add .
git commit -m "Deploy bot system"
git push origin main
```

### Deploy Frontend to Vercel
```bash
# Vercel auto-deploys on push to main
git push origin main
```

## 📋 Post-Deployment Checklist

1. ✅ Backend health check passes
2. ✅ Database connected
3. ✅ Bot logs show "Both bots running 24/7"
4. ✅ Frontend connects to backend API
5. ✅ Environment variables set correctly
6. ✅ Upgrade to paid plan for 24/7 operation

## 🔍 Troubleshooting

### Backend Not Starting
- Check Render logs for errors
- Verify all environment variables are set
- Ensure database is connected

### Frontend API Errors
- Check VITE_API_URL points to Render backend
- Verify CORS settings in backend
- Check network tab for failed requests

### Bots Not Running
- Check logs for "Both bots running 24/7" message
- Verify KEEPER_PRIVATE_KEY is valid
- Check RPC_URL is accessible

## 💰 Costs

### Render
- **Free**: Limited, sleeps after 15min
- **Starter ($7/month)**: 24/7 operation
- **Database**: Included with paid plans

### Vercel
- **Free**: Perfect for frontend
- **Pro**: Only needed for high traffic

**Total for 24/7 operation: ~$7/month**