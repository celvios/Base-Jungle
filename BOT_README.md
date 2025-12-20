# Base Jungle 24/7 Bot System

A comprehensive automated bot system for managing Base Jungle protocol operations including allocation rebalancing and leveraged position monitoring.

## 🤖 Bot Components

### 1. AllocationBot
- **Purpose**: Listens for tier upgrade events and automatically rebalances user allocations
- **Triggers**: `TierUpgraded` events from the Referral Manager contract
- **Actions**: Calls `rebalance()` on the Strategy Controller

### 2. RebalanceKeeper
- **Purpose**: Monitors leveraged positions and rebalances when health factors drift
- **Monitoring**: Tracks health factors of leveraged positions
- **Thresholds**:
  - Emergency: < 1.2 (immediate rebalance)
  - Danger: < 1.3 (priority rebalance)
  - Inefficient: > 2.0 (optimization rebalance)

### 3. BotManager
- **Purpose**: Runs both AllocationBot and RebalanceKeeper 24/7
- **Features**:
  - AllocationBot: Event-driven tier upgrade handling
  - RebalanceKeeper: Interval-based position monitoring
  - Automatic startup and management

## 🚀 Quick Start (Render + Vercel)

### Backend on Render
1. Connect GitHub repo to Render
2. Create Web Service with:
   - Build: `cd backend && npm install && npm run build`
   - Start: `cd backend && node dist/index.js`
3. Add environment variables (see RENDER_VERCEL_DEPLOY.md)
4. Upgrade to Starter plan ($7/month) for 24/7 operation

### Frontend on Vercel
1. Connect GitHub repo to Vercel
2. Set root directory: `Base-Jungle-Ui/Base-Jungle`
3. Add `VITE_API_URL=https://your-render-backend.onrender.com`

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis (optional, for caching)
- Ethereum wallet with sufficient ETH for gas

### 1. Clone and Setup
```bash
git clone <your-repo>
cd Base-Jungle
chmod +x deploy-bot.sh
./deploy-bot.sh
```

### 2. Configure Environment
```bash
cp .env.production backend/.env
# Edit backend/.env with your configuration
```

### 3. Start the Bot System

#### Option A: Systemd (Recommended for Linux servers)
```bash
sudo systemctl start basejungle-bot
sudo systemctl enable basejungle-bot  # Auto-start on boot
```

#### Option B: PM2 (Cross-platform)
```bash
cd backend
pm2 start ecosystem.config.js
pm2 save  # Save PM2 configuration
pm2 startup  # Auto-start on boot
```

#### Option C: Docker
```bash
docker-compose up -d
```

#### Option D: Direct execution
```bash
cd backend
./start-bot.sh
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/api/status
```

### Real-time Monitoring
```bash
cd backend
./monitor-bot.sh
```

### View Logs
```bash
# Systemd
sudo journalctl -u basejungle-bot -f

# PM2
pm2 logs basejungle-bot

# Direct
tail -f backend/logs/*.log
```

## 🔧 Configuration

### Key Environment Variables

```bash
# Blockchain
RPC_URL=https://mainnet.base.org
KEEPER_PRIVATE_KEY=your_private_key

# Bot Settings
ALLOCATION_BOT_ENABLED=true
REBALANCE_KEEPER_ENABLED=true
TRACKED_USERS=0x123...,0x456...

# Intervals (milliseconds)
ALLOCATION_BOT_INTERVAL=30000    # 30 seconds
REBALANCE_KEEPER_INTERVAL=120000 # 2 minutes
HEALTH_CHECK_INTERVAL=60000      # 1 minute

# Gas Limits
MAX_GAS_PRICE_GWEI=100
EMERGENCY_GAS_PRICE_GWEI=200

# Retry Logic
MAX_RETRIES=3
RETRY_DELAY_MS=5000
```

### Contract Addresses
Update these in your `.env` file:
- `REFERRAL_MANAGER_ADDRESS`
- `STRATEGY_CONTROLLER_ADDRESS`
- `LEVERAGE_MANAGER_ADDRESS` (in keepers.json)

## 🛡️ Security Features

### Input Sanitization
- All user addresses are validated and sanitized before logging
- Protection against log injection attacks

### Error Handling
- Comprehensive try-catch blocks
- Specific error handling for different failure types
- Graceful degradation on RPC failures

### Resource Management
- Memory limits and monitoring
- Automatic cleanup of event listeners
- Connection pooling for database

### Access Control
- Private key validation
- IP whitelisting for admin endpoints
- Rate limiting on API endpoints

## 🔄 Operational Procedures

### Adding Users to Track
```javascript
// Via API (if implemented)
POST /api/admin/add-user
{
  "address": "0x1234567890123456789012345678901234567890"
}

// Via environment variable
TRACKED_USERS=0x123...,0x456...,0x789...
```

### Emergency Procedures

#### Stop All Bots
```bash
# Systemd
sudo systemctl stop basejungle-bot

# PM2
pm2 stop basejungle-bot

# Docker
docker-compose down
```

#### Restart with New Configuration
```bash
# Update .env file
vim backend/.env

# Restart service
sudo systemctl restart basejungle-bot
```

#### Manual Rebalance
```bash
cd scripts/keepers
node RebalanceKeeper.ts
```

## 📈 Performance Optimization

### Concurrent Operations
- Blockchain calls are made concurrently using `Promise.all`
- Reduces execution time for position monitoring

### Gas Optimization
- Dynamic gas estimation for transactions
- Gas price monitoring and limits
- Emergency gas price thresholds

### Precision Handling
- Uses `bigint` for financial calculations
- Prevents precision loss in health factor calculations

## 🚨 Alerting & Notifications

### Telegram Integration (Optional)
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### Discord Webhooks (Optional)
```bash
DISCORD_WEBHOOK_URL=your_webhook_url
```

### Log-based Monitoring
- Structured logging with timestamps
- Error categorization
- Health check results

## 🔍 Troubleshooting

### Common Issues

#### Bot Not Starting
1. Check `.env` file exists and is configured
2. Verify private key is valid
3. Check RPC URL is accessible
4. Ensure database is running

#### High Gas Prices
- Bot automatically skips operations when gas > threshold
- Adjust `MAX_GAS_PRICE_GWEI` if needed
- Monitor gas price trends

#### RPC Connection Issues
- Use reliable RPC providers (Alchemy, Infura)
- Configure backup RPC URLs
- Monitor RPC response times

#### Memory Issues
- Check logs for memory usage
- Restart service if memory usage is high
- Adjust memory limits in service configuration

### Debug Mode
```bash
NODE_ENV=development LOG_LEVEL=debug node dist/index.js
```

## 📋 Maintenance

### Log Rotation
```bash
# Manual backup
./backup-logs.sh

# Setup automatic rotation
sudo cp basejungle-logrotate /etc/logrotate.d/
```

### Database Maintenance
```bash
# Backup database
pg_dump basejungle > backup_$(date +%Y%m%d).sql

# Clean old bot activity records
DELETE FROM bot_activity WHERE created_at < NOW() - INTERVAL '30 days';
```

### Updates
```bash
# Pull latest code
git pull origin main

# Rebuild
cd backend
npm run build

# Restart service
sudo systemctl restart basejungle-bot
```

## 📊 Metrics & Analytics

### Key Metrics to Monitor
- Bot uptime and health check success rate
- Transaction success/failure rates
- Gas usage and costs
- Rebalance frequency and effectiveness
- RPC response times

### API Endpoints
- `GET /api/status` - Overall system status
- `GET /api/bot/health` - Detailed bot health
- `GET /api/bot/metrics` - Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues and support:
1. Check the troubleshooting section
2. Review logs for error messages
3. Open an issue on GitHub
4. Contact the development team

---

**⚠️ Important Security Notes:**
- Never commit private keys to version control
- Use environment variables for sensitive data
- Regularly rotate keeper wallet keys
- Monitor wallet balances and transaction activity
- Keep dependencies updated for security patches