/**
 * Mobile wallet detection and connection utilities
 */

// Detect if user is on mobile device
export function isMobile(): boolean {
    if (typeof window === 'undefined') return false;

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
}

// Detect if user is on iOS
export function isIOS(): boolean {
    if (typeof window === 'undefined') return false;

    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

// Detect if user is on Android
export function isAndroid(): boolean {
    if (typeof window === 'undefined') return false;

    return /Android/i.test(navigator.userAgent);
}

// Check if MetaMask mobile app is installed
export function isMetaMaskMobileInstalled(): boolean {
    if (typeof window === 'undefined') return false;

    const { ethereum } = window as any;
    return Boolean(ethereum && ethereum.isMetaMask);
}

// Check if Coinbase Wallet mobile app is installed
export function isCoinbaseWalletMobileInstalled(): boolean {
    if (typeof window === 'undefined') return false;

    const { ethereum } = window as any;
    return Boolean(ethereum && ethereum.isCoinbaseWallet);
}

// Check if any wallet is installed on mobile
export function isMobileWalletInstalled(): boolean {
    return isMetaMaskMobileInstalled() || isCoinbaseWalletMobileInstalled();
}

// Get deep link for wallet app
export function getWalletDeepLink(walletName: string, uri: string): string {
    const encodedUri = encodeURIComponent(uri);

    switch (walletName.toLowerCase()) {
        case 'metamask':
            return `https://metamask.app.link/wc?uri=${encodedUri}`;
        case 'coinbase':
        case 'coinbase wallet':
            return `https://go.cb-w.com/wc?uri=${encodedUri}`;
        case 'trust':
        case 'trust wallet':
            return `https://link.trustwallet.com/wc?uri=${encodedUri}`;
        case 'rainbow':
            return `https://rnbwapp.com/wc?uri=${encodedUri}`;
        default:
            return uri;
    }
}

// Open wallet app on mobile
export function openMobileWallet(walletName: string, uri: string): void {
    if (!isMobile()) {
        console.warn('openMobileWallet called on non-mobile device');
        return;
    }

    const deepLink = getWalletDeepLink(walletName, uri);

    // Try to open the wallet app
    window.location.href = deepLink;

    // Fallback: if wallet doesn't open, show instructions
    setTimeout(() => {
        console.log(`If ${walletName} didn't open, please install it from your app store`);
    }, 1000);
}

// Get recommended wallets for current platform
export function getRecommendedWallets(): string[] {
    if (isIOS()) {
        return ['MetaMask', 'Coinbase Wallet', 'Rainbow', 'Trust Wallet'];
    } else if (isAndroid()) {
        return ['MetaMask', 'Coinbase Wallet', 'Trust Wallet', 'Rainbow'];
    } else {
        return ['MetaMask', 'Coinbase Wallet', 'WalletConnect', 'Rainbow'];
    }
}

// Check if in-app browser (some wallets use in-app browsers)
export function isInAppBrowser(): boolean {
    if (typeof window === 'undefined') return false;

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Check for common in-app browser patterns
    return (
        /FBAN|FBAV|Instagram|Twitter|Line|Snapchat|WeChat|MicroMessenger/i.test(ua)
    );
}

// Get connection instructions for mobile
export function getMobileConnectionInstructions(): string {
    if (isMobileWalletInstalled()) {
        return 'Tap "Connect Wallet" to connect with your installed wallet app.';
    } else if (isIOS()) {
        return 'Install MetaMask or Coinbase Wallet from the App Store, then return here to connect.';
    } else if (isAndroid()) {
        return 'Install MetaMask or Coinbase Wallet from Google Play, then return here to connect.';
    } else {
        return 'Please use a mobile wallet app to connect.';
    }
}

// Log mobile wallet connection attempt for debugging
export function logMobileConnection(action: string, details?: any): void {
    if (isMobile()) {
        console.log(`[Mobile Wallet] ${action}`, {
            platform: isIOS() ? 'iOS' : isAndroid() ? 'Android' : 'Unknown',
            walletInstalled: isMobileWalletInstalled(),
            inAppBrowser: isInAppBrowser(),
            ...details,
        });
    }
}
