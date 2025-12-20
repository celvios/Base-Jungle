import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.deployment') });

const RPC_URL = 'https://sepolia.base.org';
const WAULT_ADDR = "0xf1Dc3E955feCE6AFb82F527636da9aD235D05dd4";

async function main() {
    process.stdout.write("Checking Bytecode...\n");
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // 1e12 = 0xE8D4A51000
    // 1e6 = 0xF4240

    const code = await provider.getCode(WAULT_ADDR);

    // Check for 1e12
    // Note: PUSH numbers in EVM might be packed. 
    // PUSH5 0xE8D4A51000 -> 64E8D4A51000
    // 1e6 (0x0F4240) -> PUSH3 0x0F4240 -> 620F4240

    // We check for the raw bytes of the number
    const hasNew = code.indexOf("e8d4a51000") !== -1;
    const hasOld = code.indexOf("0f4240") !== -1; // 1e6 might appear elsewhere too, but likely here

    console.log(`Has 1e12 (New Fix): ${hasNew ? '✅ YES' : '❌ NO'}`);
    console.log(`Has 1e6 (Old Divisor): ${hasOld ? '✅ YES' : '❌ NO'}`);

    if (!hasNew && hasOld) {
        console.log("CONCLUSION: Deployed contract represents OLD logic (no fix).");
    } else if (hasNew) {
        console.log("CONCLUSION: Deployed contract HAS the fix.");
    }
}
main();
