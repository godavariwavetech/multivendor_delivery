import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components';
import { DeliveryStoreProvider } from '@/data/deliveryStore';
import { SessionProvider, useSession } from '@/data/session';
import { SupportProvider } from '@/data/support';
import { VendorStoreProvider } from '@/data/vendorStore';
import { usePushRegistration } from '@/data/push';
import { RootNavigator } from '@/navigation/RootNavigator';

/**
 * Sits inside SessionProvider so the support details and the push registration
 * follow the signed-in account: both are fetched on sign-in and cleared on the
 * way out.
 */
function SignedInServices({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const signedIn = Boolean(session);
  usePushRegistration(signedIn);
  return <SupportProvider signedIn={signedIn}>{children}</SupportProvider>;
}

/**
 * Both role stores stay mounted, so a dual-role account can switch workspaces
 * without losing in-progress orders or trips. ToastProvider sits above them:
 * the stores surface API failures through it.
 */
export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <ToastProvider>
          <SessionProvider>
            <SignedInServices>
              <VendorStoreProvider>
                <DeliveryStoreProvider>
                  <RootNavigator />
                </DeliveryStoreProvider>
              </VendorStoreProvider>
            </SignedInServices>
          </SessionProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
