# Quick USDC Minting Script for Windows
# Usage: .\mint-usdc.ps1

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Base Jungle - Quick USDC Minter" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Prompt for wallet address
$recipient = Read-Host "Enter your wallet address"

# Validate address format
if ($recipient -notmatch "^0x[a-fA-F0-9]{40}$") {
    Write-Host "Error: Invalid Ethereum address format" -ForegroundColor Red
    exit 1
}

# Prompt for amount
$amount = Read-Host "Enter amount to mint (default: 10000)"
if ([string]::IsNullOrWhiteSpace($amount)) {
    $amount = "10000"
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Recipient: $recipient"
Write-Host "  Amount: $amount USDC"
Write-Host ""

# You'll need to fill these in from your .env file:
Write-Host "IMPORTANT: You need to set these environment variables:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1 - Set them in this session:" -ForegroundColor Cyan
Write-Host '  $env:USDC_ADDRESS = "0xYourUSDCAddress"' -ForegroundColor Gray
Write-Host '  $env:PRIVATE_KEY = "your_private_key"' -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2 - Run the cast command directly:" -ForegroundColor Cyan
Write-Host ""

# Calculate amount with 6 decimals
$amountWei = [decimal]$amount * 1000000

$castCommand = @"
cast send `$env:USDC_ADDRESS \
  "mint(address,uint256)" \
  $recipient \
  $amountWei \
  --rpc-url https://sepolia.base.org \
  --private-key `$env:PRIVATE_KEY
"@

Write-Host $castCommand -ForegroundColor Gray
Write-Host ""
Write-Host "After setting the environment variables, run:" -ForegroundColor Yellow
Write-Host "  Invoke-Expression `"$castCommand`"" -ForegroundColor Cyan
