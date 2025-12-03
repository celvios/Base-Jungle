// Simple script to grant minter role via API
// Uses native fetch (Node.js 18+)

const url = 'https://base-jungle.onrender.com/api/admin/grant-minter';
const body = {
    address: '0x72377a60870E3d2493F871FA5792a1160518fcc6'
};

console.log(`🔑 Granting MINTER_ROLE to ${body.address}...`);
console.log(`📡 Calling ${url}\n`);

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
})
    .then(response => {
        return response.json().then(data => ({ status: response.status, data }));
    })
    .then(({ status, data }) => {
        if (status === 200) {
            console.log('✅ Success!');
            console.log(data);
            if (data.transactionHash) {
                console.log(`\n🔗 Transaction: https://sepolia.basescan.org/tx/${data.transactionHash}`);
            }
        } else {
            console.log('❌ Error:');
            console.log(data);
        }
    })
    .catch(error => {
        console.error('❌ Network Error:', error.message);
    });
