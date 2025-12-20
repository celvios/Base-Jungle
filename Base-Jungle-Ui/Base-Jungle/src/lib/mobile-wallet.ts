/**
 * Mobile wallet detection utilities
 * Deep linking is handled by AppKit automatically
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

// Check if in-app browser (some wallets use in-app browsers)
export function isInAppBrowser(): boolean {
    if (typeof window === 'undefined') return false;

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Check for common in-app browser patterns
    return (
        /FBAN|FBAV|Instagram|Twitter|Line|Snapchat|WeChat|MicroMessenger/i.test(ua)
    );
}

// Log mobile wallet connection attempt for debugging
export function logMobileConnection(action: string, details?: any): void {
    if (isMobile()) {
        console.log(`[Mobile Wallet] ${action}`, {
            platform: isIOS() ? 'iOS' : isAndroid() ? 'Android' : 'Unknown',
            inAppBrowser: isInAppBrowser(),
            ...details,
        });
    }
}
