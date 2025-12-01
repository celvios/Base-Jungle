# ============================================
# Test USDC Minting Script for Base Sepolia (PowerShell)
# ============================================
# This script mints test USDC tokens to a specified address
# for testing the Base Jungle DeFi platform.

param(
    [string]$Recipient = "",
    [decimal]$Amount = 1000
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Base Jungle - Test USDC Minter" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
$envPath = "contracts\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "Error: contracts\.env file not found!" -ForegroundColor Red
    Write-Host "Please create a contracts\.env file with the following variables:"
    Write-Host "  PRIVATE_KEY=your_private_key"
    Write-Host "  USDC_ADDRESS=deployed_mock_usdc_address"
    Write-Host "  BASE_SEPOLIA_RPC=https://sepolia.base.org"
    exit 1
}

# Load environment variables from .env file
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
        $name = $matches[1]
        $value = $matches[2]
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

# Check required variables
if (-not $USDC_ADDRESS) {
    Write-Host "Error: USDC_ADDRESS not set in contracts\.env" -ForegroundColor Red
    exit 1
}

if (-not $PRIVATE_KEY) {
    Write-Host "Error: PRIVATE_KEY not set in contracts\.env" -ForegroundColor Red
    exit 1
}

# Default RPC URL
if (-not $BASE_SEPOLIA_RPC) {
    $BASE_SEPOLIA_RPC = "https://sepolia.base.org"
}

# Prompt for recipient if not provided
if ([string]::IsNullOrEmpty($Recipient)) {
    $Recipient = Read-Host "Enter recipient address"
}

# Validate recipient address
if ($Recipient -notmatch '^0x[a-fA-F0-9]{40}$') {
    Write-Host "Error: Invalid Ethereum address" -ForegroundColor Red
    exit 1
}

# Convert amount to 6 decimals (USDC standard)
$AmountWei = [math]::Floor($Amount * 1000000)

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  USDC Contract: $USDC_ADDRESS"
Write-Host "  Recipient: $Recipient"
Write-Host "  Amount: $Amount USDC ($AmountWei with 6 decimals)"
Write-Host "  RPC URL: $BASE_SEPOLIA_RPC"
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "Proceed with minting? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Cancelled."
    exit 0
}

Write-Host ""
Write-Host "Minting test USDC..." -ForegroundColor Green

# Use cast to mint tokens
$castArgs = @(
    "send",
    $USDC_ADDRESS,
    "mint(address,uint256)",
    $Recipient,
    $AmountWei,
    "--rpc-url", $BASE_SEPOLIA_RPC,
    "--private-key", $PRIVATE_KEY
)

try {
    & cast $castArgs
    
    Write-Host ""
    Write-Host "✅ Successfully minted $Amount USDC to $Recipient" -ForegroundColor Green
    Write-Host ""
    
    # Check balance
    Write-Host "Checking balance..." -ForegroundColor Yellow
    $balance = & cast call $USDC_ADDRESS "balanceOf(address)(uint256)" $Recipient --rpc-url $BASE_SEPOLIA_RPC
    $balanceHuman = [math]::Round([decimal]$balance / 1000000, 2)
    Write-Host "Current balance: $balanceHuman USDC" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to mint USDC" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
