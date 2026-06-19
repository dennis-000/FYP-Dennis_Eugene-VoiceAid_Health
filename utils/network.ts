import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/config';

/**
 * Checks if the device has actual internet reachability by trying to contact
 * several servers in parallel (including the VoiceAid backend and Supabase).
 */
export async function checkOnlineStatus(): Promise<boolean> {
  // 1. Web browser quick check: if navigator explicitly says hardware is offline
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  // List of URLs to check in parallel
  const urlsToCheck = [
    `${API_BASE_URL}/health`,
    'https://iaelabsccjiuyndyhioc.supabase.co',
    'https://clients3.google.com/generate_204',
    'https://httpbin.org/status/200'
  ];

  // Create a ping helper for a single URL
  const ping = async (url: string): Promise<boolean> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      clearTimeout(timeoutId);
      // If we get any HTTP response back, we have internet connectivity
      return true;
    } catch (e) {
      clearTimeout(timeoutId);
      return false;
    }
  };

  try {
    // Run all checks in parallel. If any one succeeds, we are online!
    const results = await Promise.all(urlsToCheck.map(url => ping(url)));
    const isAnyOnline = results.some(r => r === true);
    
    if (isAnyOnline) {
      return true;
    }

    // Last resort fallback
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      return true;
    }
    return false;
  } catch (err) {
    // Last resort fallback
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      return true;
    }
    return false;
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
