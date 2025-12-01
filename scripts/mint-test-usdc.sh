#!/bin/bash

# ============================================
# Test USDC Minting Script for Base Sepolia
# ============================================
# This script mints test USDC tokens to a specified address
# for testing the Base Jungle DeFi platform.

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Base Jungle - Test USDC Minter${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f "contracts/.env" ]; then
    echo -e "${RED}Error: contracts/.env file not found!${NC}"
    echo "Please create a contracts/.env file with the following variables:"
    echo "  PRIVATE_KEY=your_private_key"
    echo "  USDC_ADDRESS=deployed_mock_usdc_address"
    echo "  BASE_SEPOLIA_RPC=https://sepolia.base.org"
    exit 1
fi

# Load environment variables
source contracts/.env

# Check required variables
if [ -z "$USDC_ADDRESS" ]; then
    echo -e "${RED}Error: USDC_ADDRESS not set in contracts/.env${NC}"
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not set in contracts/.env${NC}"
    exit 1
fi

# Default values
RPC_URL="${BASE_SEPOLIA_RPC:-https://sepolia.base.org}"
RECIPIENT="${1:-}"
AMOUNT="${2:-1000}" # Default 1000 USDC

# Prompt for recipient if not provided
if [ -z "$RECIPIENT" ]; then
    echo -e "${YELLOW}Enter recipient address:${NC}"
    read RECIPIENT
fi

# Validate recipient address
if [[ ! "$RECIPIENT" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
    echo -e "${RED}Error: Invalid Ethereum address${NC}"
    exit 1
fi

# Convert amount to 6 decimals (USDC standard)
AMOUNT_WEI=$(echo "$AMOUNT * 1000000" | bc)

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  USDC Contract: $USDC_ADDRESS"
echo "  Recipient: $RECIPIENT"
echo "  Amount: $AMOUNT USDC ($AMOUNT_WEI with 6 decimals)"
echo "  RPC URL: $RPC_URL"
echo ""

# Confirm before proceeding
echo -e "${YELLOW}Proceed with minting? (y/n)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}Minting test USDC...${NC}"

# Use cast to mint tokens
cast send $USDC_ADDRESS \
    "mint(address,uint256)" \
    $RECIPIENT \
    $AMOUNT_WEI \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Successfully minted $AMOUNT USDC to $RECIPIENT${NC}"
    echo ""
    
    # Check balance
    echo -e "${YELLOW}Checking balance...${NC}"
    BALANCE=$(cast call $USDC_ADDRESS "balanceOf(address)(uint256)" $RECIPIENT --rpc-url $RPC_URL)
    BALANCE_HUMAN=$(echo "scale=2; $BALANCE / 1000000" | bc)
    echo -e "${GREEN}Current balance: $BALANCE_HUMAN USDC${NC}"
else
    echo -e "${RED}❌ Failed to mint USDC${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Done!${NC}"
