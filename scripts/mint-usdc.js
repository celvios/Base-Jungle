// Simple USDC minting script using ethers.js
// Usage: node mint-usdc.js <recipient> <amount>

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from contracts/.env
dotenv.config({ path: join(__dirname, '../contracts/.env') });

const USDC_ADDRESS = process.env.USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const RPC_URL = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY not found in contracts/.env');
    process.exit(1);
}

// Get command line arguments
const recipient = process.argv[2];
const amount = process.argv[3] || '10000';

if (!recipient) {
    console.log('Usage: node mint-usdc.js <recipient-address> [amount]');
    console.log('Example: node mint-usdc.js 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 10000');
    process.exit(1);
}

// Validate address
if (!ethers.isAddress(recipient)) {
    console.error('❌ Error: Invalid recipient address');
    process.exit(1);
}

// USDC ABI (only mint function)
const USDC_ABI = [
    {
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        name: 'mint',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    }
];

async function mintUSDC() {
    try {
        console.log('🌴 Base Jungle - USDC Minting Tool\n');
        console.log(`📍 Network: Base Sepolia`);
        console.log(`💰 USDC Contract: ${USDC_ADDRESS}`);
        console.log(`👤 Recipient: ${recipient}`);
        console.log(`💵 Amount: ${amount} USDC\n`);

        // Connect to provider
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log(`🔑 Using wallet: ${wallet.address}\n`);

        // Check ETH balance
        const balance = await provider.getBalance(wallet.address);
        console.log(`⛽ ETH Balance: ${ethers.formatEther(balance)} ETH`);

        if (balance === 0n) {
            console.error('\n❌ Error: No ETH for gas fees!');
            console.log('Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
            process.exit(1);
        }

        // Create contract instance
        const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);

        // Convert amount to 6 decimals (USDC standard)
        const amountWei = ethers.parseUnits(amount, 6);

        console.log('\n🔄 Sending transaction...');

        // Send mint transaction
        const tx = await usdcContract.mint(recipient, amountWei);

        console.log(`📝 Transaction hash: ${tx.hash}`);
        console.log('⏳ Waiting for confirmation...');

        // Wait for transaction to be mined
        const receipt = await tx.wait();

        if (receipt.status === 1) {
            console.log('\n✅ Success!');
            console.log(`🎉 Minted ${amount} USDC to ${recipient}`);
            console.log(`🔗 View on BaseScan: https://sepolia.basescan.org/tx/${tx.hash}`);
        } else {
            console.log('\n❌ Transaction failed');
            console.log(`🔗 View on BaseScan: https://sepolia.basescan.org/tx/${tx.hash}`);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.message.includes('insufficient funds')) {
            console.log('\n💡 You need more ETH for gas fees');
            console.log('Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
        } else if (error.message.includes('nonce')) {
            console.log('\n💡 Try again in a few seconds');
        }

        process.exit(1);
    }
}

mintUSDC();
