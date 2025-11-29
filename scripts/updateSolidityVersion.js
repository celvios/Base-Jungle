const fs = require('fs');
const path = require('path');

function updateSolidityVersion(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            updateSolidityVersion(fullPath);
        } else if (file.name.endsWith('.sol')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const updated = content.replace(/pragma solidity 0\.8\.20;/g, 'pragma solidity 0.8.24;');

            if (content !== updated) {
                fs.writeFileSync(fullPath, updated, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

updateSolidityVersion('./contracts');
console.log('Done updating Solidity versions');
