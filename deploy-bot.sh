#!/bin/bash

# Base Jungle 24/7 Bot Deployment Script
# This script sets up the bot system for continuous operation

set -e

echo "🚀 Base Jungle 24/7 Bot Deployment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check system requirements
print_status "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_status "Node.js $(node -v) and npm $(npm -v) found"

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    print_warning ".env file not found. Creating from example..."
    cp backend/.env.example backend/.env
    print_warning "Please edit backend/.env with your configuration before continuing"
    read -p "Press Enter to continue after editing .env file..."
fi

# Install dependencies
print_status "Installing dependencies..."
cd backend
npm install

# Build the project
print_status "Building project..."
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    print_error "Build failed - dist/index.js not found"
    exit 1
fi

print_status "Build completed successfully"

# Create logs directory
mkdir -p logs
print_status "Created logs directory"

# Setup systemd service (if on Linux with systemd)
if command -v systemctl &> /dev/null; then
    print_status "Setting up systemd service..."
    
    # Copy service file
    sudo cp ../basejungle-bot.service /etc/systemd/system/
    
    # Update service file with correct paths
    sudo sed -i "s|/home/ubuntu/Base-Jungle|$(pwd)|g" /etc/systemd/system/basejungle-bot.service
    sudo sed -i "s|User=ubuntu|User=$(whoami)|g" /etc/systemd/system/basejungle-bot.service
    
    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable basejungle-bot
    
    print_status "Systemd service configured"
    print_status "Use 'sudo systemctl start basejungle-bot' to start the service"
    print_status "Use 'sudo systemctl status basejungle-bot' to check status"
    print_status "Use 'sudo journalctl -u basejungle-bot -f' to view logs"
fi

# Setup PM2 (alternative process manager)
if command -v pm2 &> /dev/null; then
    print_status "PM2 detected. Setting up PM2 configuration..."
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'basejungle-bot',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF
    
    print_status "PM2 configuration created"
    print_status "Use 'pm2 start ecosystem.config.js' to start with PM2"
    print_status "Use 'pm2 monit' to monitor the application"
fi

# Create startup script
cat > start-bot.sh << 'EOF'
#!/bin/bash

# Base Jungle Bot Startup Script
cd "$(dirname "$0")"

echo "🤖 Starting Base Jungle Bot..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Check if built
if [ ! -f "dist/index.js" ]; then
    echo "🔨 Building project..."
    npm run build
fi

# Start the bot
echo "🚀 Launching bot manager..."
NODE_ENV=production node dist/index.js
EOF

chmod +x start-bot.sh
print_status "Created start-bot.sh script"

# Create monitoring script
cat > monitor-bot.sh << 'EOF'
#!/bin/bash

# Base Jungle Bot Monitoring Script
API_URL="http://localhost:3001/api/status"
LOG_FILE="logs/monitor.log"

echo "🔍 Bot Health Monitor"
echo "===================="

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check API health
    if curl -s -f "$API_URL" > /dev/null; then
        echo "[$TIMESTAMP] ✅ Bot is healthy" | tee -a "$LOG_FILE"
    else
        echo "[$TIMESTAMP] ❌ Bot is not responding" | tee -a "$LOG_FILE"
        
        # Optional: Restart bot if using PM2
        if command -v pm2 &> /dev/null; then
            echo "[$TIMESTAMP] 🔄 Restarting bot with PM2..." | tee -a "$LOG_FILE"
            pm2 restart basejungle-bot
        fi
    fi
    
    sleep 60  # Check every minute
done
EOF

chmod +x monitor-bot.sh
print_status "Created monitor-bot.sh script"

# Create backup script
cat > backup-logs.sh << 'EOF'
#!/bin/bash

# Base Jungle Bot Log Backup Script
BACKUP_DIR="logs/backups"
DATE=$(date '+%Y%m%d_%H%M%S')

mkdir -p "$BACKUP_DIR"

# Compress and backup logs
if [ -d "logs" ]; then
    tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" logs/*.log 2>/dev/null || true
    
    # Keep only last 7 days of backups
    find "$BACKUP_DIR" -name "logs_*.tar.gz" -mtime +7 -delete
    
    echo "📦 Logs backed up to $BACKUP_DIR/logs_$DATE.tar.gz"
fi
EOF

chmod +x backup-logs.sh
print_status "Created backup-logs.sh script"

# Setup log rotation
if command -v logrotate &> /dev/null; then
    cat > basejungle-logrotate << EOF
logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $(whoami) $(whoami)
    postrotate
        # Restart the service to reopen log files
        if systemctl is-active --quiet basejungle-bot; then
            systemctl reload basejungle-bot
        fi
    endscript
}
EOF
    
    print_status "Created logrotate configuration"
    print_warning "Add 'basejungle-logrotate' to your system's logrotate.d directory"
fi

cd ..

print_status "Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Edit backend/.env with your configuration"
echo "2. Start the bot using one of these methods:"
echo "   • Systemd: sudo systemctl start basejungle-bot"
echo "   • PM2: cd backend && pm2 start ecosystem.config.js"
echo "   • Direct: cd backend && ./start-bot.sh"
echo ""
echo "📊 Monitoring:"
echo "• Check status: curl http://localhost:3001/api/status"
echo "• Monitor health: cd backend && ./monitor-bot.sh"
echo "• View logs: tail -f backend/logs/*.log"
echo ""
echo "🔧 Management:"
echo "• Backup logs: cd backend && ./backup-logs.sh"
echo "• Stop service: sudo systemctl stop basejungle-bot (systemd)"
echo "• Stop PM2: pm2 stop basejungle-bot (PM2)"
echo ""
print_status "Your 24/7 Base Jungle Bot is ready! 🚀"