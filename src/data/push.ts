import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { apiClient, endpoints } from '@/api';
import { APP_VERSION } from '@config/constants';

/**
 * Device registration for push, against the backend's existing
 * /registerdevice and /unregisterdevice routes (partner_app_devices).
 *
 * The token itself has to come from Firebase Cloud Messaging. This project has
 * no Firebase app yet — no @react-native-firebase/messaging, no
 * google-services.json — and the server reports the same on its side
 * ("push not configured"), so `readToken` finds nothing and no device is
 * registered. Orders still arrive: both workspaces poll every 15 seconds.
 *
 * To turn push on, add the messaging package and google-services.json, and set
 * MV_FCM_PROJECT_ID / MV_FCM_CLIENT_EMAIL / MV_FCM_PRIVATE_KEY on the server.
 * Nothing below changes: `readToken` starts returning a token and registration
 * begins working on the next sign-in.
 */
const readToken = async (): Promise<string | null> => {
  try {
    // Resolved at runtime so the bundle does not require a package that is not
    // installed; when messaging is added this starts returning a real token.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const messaging = require('@react-native-firebase/messaging')?.default;
    if (!messaging) {
      return null;
    }
    const permission = await messaging().requestPermission();
    // 1 = AUTHORIZED, 2 = PROVISIONAL in the messaging enum.
    if (permission !== 1 && permission !== 2) {
      return null;
    }
    const token = await messaging().getToken();
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
};

/**
 * Registers the device when a workspace is signed in and removes it on the way
 * out, so a shared phone stops receiving the previous account's alerts.
 */
export function usePushRegistration(signedIn: boolean) {
  const registered = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const register = async () => {
      const token = await readToken();
      if (cancelled || !token) {
        return;
      }
      try {
        await apiClient.post(endpoints.auth.registerDevice, {
          token,
          device_type: Platform.OS,
          app_version: APP_VERSION,
        });
        registered.current = token;
      } catch {
        // A device that could not register still gets its orders by polling.
      }
    };

    const unregister = async () => {
      const token = registered.current;
      registered.current = null;
      if (!token) {
        return;
      }
      try {
        await apiClient.post(endpoints.auth.unregisterDevice, { token });
      } catch {
        // Signing out locally matters more than the server-side cleanup, which
        // the next registration of this token will correct anyway.
      }
    };

    if (signedIn) {
      register();
    } else {
      unregister();
    }

    return () => {
      cancelled = true;
    };
  }, [signedIn]);
}
