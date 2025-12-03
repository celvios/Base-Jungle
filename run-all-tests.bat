@echo off
echo Running Base Jungle Test Suite...
echo.

cd /d "%~dp0"

echo [1/4] Running Referral System Tests...
call npx hardhat test test/Phase5-Referral.test.js --config hardhat.config.cjs

echo.
echo [2/4] Running DeFi Strategy Tests...
call npx hardhat test test/Phase6-DeFi.test.js --config hardhat.config.cjs

echo.
echo [3/4] Running Automation Tests...
call npx hardhat test test/Phase7-Automation.test.js --config hardhat.config.cjs

echo.
echo [4/4] Running Vault Tests...
call npx hardhat test test/Phase8-Vaults.test.js --config hardhat.config.cjs

echo.
echo ========================================
echo Test Suite Complete!
echo ========================================
pause
