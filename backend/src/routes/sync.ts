import express from 'express';
import { ethers } from 'ethers';

const router = express.Router();

const POINTS_TRACKER_ABI = [
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'userPoints',
        outputs: [
            { name: 'points', type: 'uint256' },
            { name: 'lastUpdated', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const RPC_URL = process.env.RPC_URL || process.env.BASE_SEPOLIA_RPC;
const POINTS_TRACKER_ADDRESS = process.env.POINTS_TRACKER_ADDRESS;

// Trigger sync endpoint
router.post('/trigger', async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid wallet address' });
        }

        if (!POINTS_TRACKER_ADDRESS) {
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'POINTS_TRACKER_ADDRESS not configured'
            });
        }

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const pointsContract = new ethers.Contract(
            POINTS_TRACKER_ADDRESS,
            POINTS_TRACKER_ABI,
            provider
        );

        console.log(`🔄 Fetching points for ${address}...`);

        const pointsData = await pointsContract.userPoints(address);
        const points = Number(pointsData[0]) / 1e18; // Convert from wei

        console.log(`✅ Fetched ${points} points for ${address}`);

        res.json({
            success: true,
            address,
            points: Math.floor(points),
            message: `Successfully fetched ${Math.floor(points)} points`
        });

    } catch (error: any) {
        console.error('❌ Error fetching points:', error);

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch points',
        });
    }
});

// Simple web interface
router.get('/trigger', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Base Jungle - Sync Points</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        p {
            color: #666;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            color: #333;
            font-weight: 600;
            margin-bottom: 8px;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        button:active {
            transform: translateY(0);
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        .result {
            margin-top: 20px;
            padding: 16px;
            border-radius: 8px;
            display: none;
        }
        .result.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .result.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .result.show {
            display: block;
        }
        .loading {
            display: none;
            text-align: center;
            margin-top: 20px;
        }
        .loading.show {
            display: block;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Sync Points</h1>
        <p>Fetch latest points from blockchain</p>
        
        <form id="syncForm">
            <div class="form-group">
                <label for="address">Wallet Address</label>
                <input 
                    type="text" 
                    id="address" 
                    name="address" 
                    placeholder="0x..." 
                    required
                    pattern="^0x[a-fA-F0-9]{40}$"
                >
            </div>
            
            <button type="submit" id="submitBtn">Sync Points</button>
        </form>

        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Fetching points...</p>
        </div>
        
        <div class="result" id="result"></div>
    </div>

    <script>
        document.getElementById('syncForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            const address = document.getElementById('address').value;
            
            // Show loading
            submitBtn.disabled = true;
            loading.classList.add('show');
            result.classList.remove('show');
            
            try {
                const response = await fetch('/api/sync/trigger', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ address }),
                });
                
                const data = await response.json();
                
                loading.classList.remove('show');
                result.classList.add('show');
                
                if (data.success) {
                    result.className = 'result success show';
                    result.innerHTML = '<strong>✅ Success!</strong><br>' +
                        'Fetched ' + data.points.toLocaleString() + ' points for ' + address;
                } else {
                    result.className = 'result error show';
                    result.innerHTML = '<strong>❌ Error</strong><br>' + data.error;
                }
            } catch (error) {
                loading.classList.remove('show');
                result.className = 'result error show';
                result.classList.add('show');
                result.innerHTML = '<strong>❌ Error</strong><br>Failed to connect to server';
            } finally {
                submitBtn.disabled = false;
            }
        });
    </script>
</body>
</html>
    `);
});

export default router;
