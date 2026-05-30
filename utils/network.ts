import { useState, useEffect } from 'react';

/**
 * Checks if the device has actual internet reachability by pinging google.com
 */
export async function checkOnlineStatus(): Promise<boolean> {
  // 1. Web browser check: if navigator says hardware is offline, instantly return false
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    // Ping CORS-safe status endpoint
    const response = await fetch('https://httpbin.org/status/200', {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timeoutId);
    return response.ok || response.status < 400;
  } catch (e) {
    // 2. Fallback: browser CORS-friendly fetch using opaque 'no-cors' mode
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      await fetch('https://clients3.google.com/generate_204', {
        method: 'GET',
        signal: controller.signal,
        mode: 'no-cors', // Bypasses browser CORS restrictions completely
        headers: {
          'Cache-Control': 'no-cache',
        }
      });

      clearTimeout(timeoutId);
      return true; // Connection was reachable
    } catch (err) {
      // 3. Last resort: trust navigator if present
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        return true;
      }
      return false;
    }
  }
}

/**
 * React hook to listen to network reachability dynamically
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Initial check
    checkOnlineStatus().then(setIsOnline);

    // Dynamic polling every 10 seconds to check actual connection
    const interval = setInterval(() => {
      checkOnlineStatus().then(setIsOnline);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return isOnline;
}
