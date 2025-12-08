const https = require('https');

const USER_ADDRESS = '0x72377a60870E3d2493F871FA5792a1160518fcc6';
const CONSERVATIVE_VAULT = '0x986ca22e9f0A6104AAdea7C2698317A690045D13';
const USDC_ADDRESS = '0x634c1cf5129fC7bd49736b9684375E112e4000E1';

// BaseScan API (free tier)
const BASESCAN_API = 'https://api-sepolia.basescan.org/api';

async function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('🔍 Checking transactions for:', USER_ADDRESS);
    console.log('🏦 Conservative Vault:', CONSERVATIVE_VAULT);
    console.log('💰 USDC Address:', USDC_ADDRESS);
    console.log('');

    try {
        // Get recent transactions
        const txUrl = `${BASESCAN_API}?module=account&action=txlist&address=${USER_ADDRESS}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc`;
        const txResult = await fetchJSON(txUrl);
        
        if (txResult.status === '1' && txResult.result) {
            console.log('📋 Recent Transactions (last 20):');
            console.log('═'.repeat(80));
            
            for (const tx of txResult.result.slice(0, 20)) {
                const status = tx.isError === '0' ? '✅ Success' : '❌ Failed';
                const to = tx.to?.toLowerCase();
                let type = 'Unknown';
                
                if (to === CONSERVATIVE_VAULT.toLowerCase()) {
                    type = '🏦 VAULT DEPOSIT';
                } else if (to === USDC_ADDRESS.toLowerCase()) {
                    type = '💰 USDC (approve/transfer)';
                }
                
                console.log(`\n${status} | ${type}`);
                console.log(`  Hash: ${tx.hash}`);
                console.log(`  To: ${tx.to}`);
                console.log(`  Time: ${new Date(tx.timeStamp * 1000).toLocaleString()}`);
                
                if (tx.isError === '1') {
                    console.log(`  ⚠️  ERROR - Check on BaseScan for details`);
                }
            }
        } else {
            console.log('No transactions found or API error:', txResult.message);
        }
        
        console.log('\n');
        console.log('═'.repeat(80));
        console.log('🔗 View on BaseScan:');
        console.log(`   https://sepolia.basescan.org/address/${USER_ADDRESS}`);
        
    } catch (error) {
        console.error('Error fetching transactions:', error.message);
    }
}

main();

