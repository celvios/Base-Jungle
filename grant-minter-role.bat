@echo off
echo Setting up environment to grant MINTER_ROLE...
echo.

cd /d "%~dp0"

echo Installing necessary dependencies...
call npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv --force

echo.
echo Running Hardhat script...
call npx hardhat run contracts/grant-minter.js --network baseSepolia --config hardhat.config.cjs

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Success! You can now mint USDC.
    echo.
    echo Try the minting page again at your Vercel URL
) else (
    echo.
    echo ❌ Failed to grant minter role
    echo Check the error message above
)

pause
