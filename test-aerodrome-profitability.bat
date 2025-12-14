@echo off
echo ========================================
echo  Aerodrome Profitability Test
echo  (SSL Bypass Mode for Windows)
echo ========================================
echo.
echo Step 1: Starting Hardhat fork node...
echo (Bypassing SSL certificate verification)
echo.

REM Kill any existing node on port 8545
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8545') do taskkill /F /PID %%a 2>nul

REM Set environment variable to bypass SSL verification (Windows workaround)
set NODE_TLS_REJECT_UNAUTHORIZED=0

REM Start fork node in a new window
start "Hardhat Fork Node" cmd /k "set NODE_TLS_REJECT_UNAUTHORIZED=0 && npx hardhat node --fork https://base-mainnet.g.alchemy.com/v2/demo"

echo Waiting for node to initialize (30 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo Step 2: Testing connection to fork...
curl http://127.0.0.1:8545 >nul 2>&1
if errorlevel 1 (
    echo ERROR: Fork node is not responding!
    echo.
    echo Troubleshooting:
    echo 1. Check the "Hardhat Fork Node" window for errors
    echo 2. Make sure you have internet connection
    echo 3. Try running manually: npx hardhat node --fork https://base-mainnet.g.alchemy.com/v2/demo
    echo.
    pause
    exit /b 1
)

echo ✓ Fork node is running!
echo.
echo Step 3: Running profitability test...
echo.

REM Run test with SSL bypass
set NODE_TLS_REJECT_UNAUTHORIZED=0
npx hardhat run scripts/test-aerodrome-fork.cjs --network localhost

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
pause
