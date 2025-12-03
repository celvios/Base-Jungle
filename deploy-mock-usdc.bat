@echo off
echo Deploying MockERC20 USDC...
echo.

cd /d "%~dp0"

echo Running Hardhat deployment...
call npx hardhat run scripts/deploy-mock-usdc.cjs --network baseSepolia --config hardhat.config.cjs

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Deployment successful!
    echo.
    echo Remember to update your .env files with the new USDC address
) else (
    echo.
    echo ❌ Deployment failed
    echo Check the error message above
)

pause
