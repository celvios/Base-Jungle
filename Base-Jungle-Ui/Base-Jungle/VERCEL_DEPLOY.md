# Vercel Production Deployment Guide

## 1. Add Environment Variables to Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these:

```
KEEPER_PRIVATE_KEY=<deployer-wallet-private-key>
CRON_SECRET=<random-secret-string>
BASE_SEPOLIA_RPC=https://sepolia.base.org
VITE_CONSERVATIVE_VAULT_ADDRESS=0x80d31cD5196F443291814e3c355Bd8f8245582bd
VITE_AGGRESSIVE_VAULT_ADDRESS=0x2C46a76883ff3acAc3ed7479c259f81eCe15E7a8
```

## 2. Deploy Frontend + Cron

```bash
cd Base-Jungle-Ui/Base-Jungle
git add .
git commit -m "feat: Add pending yield display + Vercel cron harvester"
git push
```

Vercel will auto-deploy.

## 3. Verify Cron is Running

After deployment:
1. Go to Vercel Dashboard → Deployments → Functions
2. Check **Cron Jobs** tab
3. Should see: `harvest` running every hour

## 4. Test Manually

```bash
curl -X POST https://your-app.vercel.app/api/cron/harvest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "timestamp": "2026-01-08T11:30:00Z",
  "results": [
    {
      "vault": "Conservative",
      "status": "success",
      "tx": "0x...",
      "gasUsed": "150000"
    }
  ]
}
```

## Production Checklist

- [ ] Keeper wallet has `KEEPER_ROLE` on vaults
- [ ] Keeper wallet has 0.01+ ETH for gas
- [ ] All env vars added to Vercel
- [ ] Cron SECRET is strong (use: `openssl rand -hex 32`)
- [ ] Frontend deployed and showing pending yield
- [ ] Cron running (check Vercel logs after 1 hour)
