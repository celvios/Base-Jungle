import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import fs from "fs";

// Example usage:
// node scripts/generateMerkle.js

async function main() {
    // 1. Get data from somewhere (e.g. database dump of user points)
    // Format: [ [address, points], ... ]
    const values = [
        ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "1000"],
        ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "5000"],
        // ...
    ];

    // 2. Build Tree
    const tree = StandardMerkleTree.of(values, ["address", "uint256"]);

    // 3. Print Root
    console.log('Merkle Root:', tree.root);

    // 4. Save tree to file
    fs.writeFileSync("merkle-tree.json", JSON.stringify(tree.dump()));

    // 5. Generate Proof for a user
    // const user = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    // for (const [i, v] of tree.entries()) {
    //   if (v[0] === user) {
    //     const proof = tree.getProof(i);
    //     console.log('Proof for', user, ':', proof);
    //   }
    // }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
