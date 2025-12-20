import { ethers } from 'ethers';

const errorSelector = "0xe2517014";

// Common errors in our contracts
const errors = [
    "InsufficientAmount(uint256,uint256)",
    "AmountTooSmall(address,uint256)",
    "BelowTierMinimum()",
    "InvalidReceiver()",
    "ZeroShares()",
    "ReferralAlreadyActive()"
];

console.log(`Searching for selector: ${errorSelector}\n`);

for (const error of errors) {
    const hash = ethers.id(error).slice(0, 10);
    console.log(`${hash} : ${error}`);

    if (hash === errorSelector) {
        console.log(`\n🎉 MATCH FOUND: ${error}`);
    }
}
