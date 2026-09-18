import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Bell, House, Package, ReceiptText, Scooter, User, Wallet } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { TabBar } from '@/components';
import { useSession } from '@/data/session';
import { ActiveScreen } from '@/features/delivery/active/ActiveScreen';
import { DeliveryFailedScreen, DeliveryOtpScreen, PickupCodeScreen, ProofPhotoScreen } from '@/features/delivery/active/TripScreens';
import { HistoryScreen, PartnerEarningsScreen, StatementScreen, TripDetailScreen } from '@/features/delivery/earnings/EarningsScreens';
import { PartnerHomeScreen } from '@/features/delivery/home/PartnerHomeScreen';
import { KycScreen, PartnerProfileScreen, VehicleScreen, ZoneShiftScreen } from '@/features/delivery/profile/ProfileScreens';
import { IncomingRequestScreen } from '@/features/delivery/requests/IncomingRequestScreen';
import { RequestsScreen } from '@/features/delivery/requests/RequestsScreen';
import { ForgotPasswordScreen } from '@/features/auth/ForgotPasswordScreen';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { OtpScreen } from '@/features/auth/OtpScreen';
import { ResetPasswordScreen } from '@/features/auth/ResetPasswordScreen';
import { ServerAddressScreen } from '@/features/auth/ServerAddressScreen';
import { BankAccountScreen } from '@/features/shared/BankAccountScreen';
import {
  HelpScreen,
  NotificationsScreen,
  PrivacyScreen,
  ReportProblemScreen,
} from '@/features/shared/SharedScreens';
import { CouponEditScreen } from '@/features/vendor/coupons/CouponEditScreen';
import { CouponsScreen } from '@/features/vendor/coupons/CouponsScreen';
import { EarningsScreen } from '@/features/vendor/earnings/EarningsScreen';
import { ReportsScreen } from '@/features/vendor/earnings/ReportsScreen';
import { SettlementDetailScreen } from '@/features/vendor/earnings/SettlementDetailScreen';
import { VendorHomeScreen } from '@/features/vendor/home/VendorHomeScreen';
import { MenuScreen } from '@/features/vendor/menu/MenuScreen';
import { OutOfStockScreen } from '@/features/vendor/menu/OutOfStockScreen';
import { ProductEditScreen } from '@/features/vendor/menu/ProductEditScreen';
import { RateSheetScreen } from '@/features/vendor/menu/RateSheetScreen';
import { TimingsScreen } from '@/features/vendor/menu/TimingsScreen';
import { AcceptOrderScreen } from '@/features/vendor/orders/AcceptOrderScreen';
import { HandoverScreen } from '@/features/vendor/orders/HandoverScreen';
import { OrderDetailScreen } from '@/features/vendor/orders/OrderDetailScreen';
import { OrdersScreen } from '@/features/vendor/orders/OrdersScreen';
import { RejectOrderScreen } from '@/features/vendor/orders/RejectOrderScreen';
import { DocumentsScreen, StoreDetailsScreen } from '@/features/vendor/profile/StoreScreens';
import { VendorProfileScreen } from '@/features/vendor/profile/VendorProfileScreen';
import { ThemeProvider, palette } from '@/theme';

import type { AuthParams, DeliveryParams, DeliveryTabParams, VendorParams, VendorTabParams } from './types';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: palette.cream, card: palette.paper, text: palette.ink, border: palette.lineSoft },
};

const stackOptions = { headerShown: false, contentStyle: { backgroundColor: palette.cream } } as const;

// ─── Auth ─────────────────────────────────────────────────────────────────────

const AuthStack = createNativeStackNavigator<AuthParams>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={stackOptions}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Otp" component={OtpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <AuthStack.Screen name="ServerAddress" component={ServerAddressScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Vendor: Home · Orders · Menu · Earnings · Profile ────────────────────────

const VendorTab = createBottomTabNavigator<VendorTabParams>();
const VENDOR_ICONS = { Home: House, Orders: ReceiptText, Menu: Package, Earnings: Wallet, Profile: User };
const vendorTabBar = (props: BottomTabBarProps) => <TabBar {...props} icons={VENDOR_ICONS} />;

function VendorTabs() {
  return (
    <VendorTab.Navigator screenOptions={{ headerShown: false }} tabBar={vendorTabBar}>
      <VendorTab.Screen name="Home" component={VendorHomeScreen} options={{ title: 'Home' }} />
      <VendorTab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
      <VendorTab.Screen name="Menu" component={MenuScreen} options={{ title: 'Menu' }} />
      <VendorTab.Screen name="Earnings" component={EarningsScreen} options={{ title: 'Earnings' }} />
      <VendorTab.Screen name="Profile" component={VendorProfileScreen} options={{ title: 'Profile' }} />
    </VendorTab.Navigator>
  );
}

const VendorStack = createNativeStackNavigator<VendorParams>();

function VendorNavigator() {
  return (
    <VendorStack.Navigator screenOptions={stackOptions}>
      <VendorStack.Screen name="VendorTabs" component={VendorTabs} />
      <VendorStack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <VendorStack.Screen name="AcceptOrder" component={AcceptOrderScreen} />
      <VendorStack.Screen name="RejectOrder" component={RejectOrderScreen} />
      <VendorStack.Screen name="Handover" component={HandoverScreen} />
      <VendorStack.Screen name="ProductEdit" component={ProductEditScreen} />
      <VendorStack.Screen name="RateSheet" component={RateSheetScreen} />
      <VendorStack.Screen name="OutOfStock" component={OutOfStockScreen} />
      <VendorStack.Screen name="Timings" component={TimingsScreen} />
      <VendorStack.Screen name="Coupons" component={CouponsScreen} />
      <VendorStack.Screen name="CouponEdit" component={CouponEditScreen} />
      <VendorStack.Screen name="Reports" component={ReportsScreen} />
      <VendorStack.Screen name="SettlementDetail" component={SettlementDetailScreen} />
      <VendorStack.Screen name="StoreDetails" component={StoreDetailsScreen} />
      <VendorStack.Screen name="Documents" component={DocumentsScreen} />
      <VendorStack.Screen name="BankAccount" component={BankAccountScreen} />
      <VendorStack.Screen name="Notifications" component={NotificationsScreen} />
      <VendorStack.Screen name="Help" component={HelpScreen} />
      <VendorStack.Screen name="ReportProblem" component={ReportProblemScreen} />
      <VendorStack.Screen name="Privacy" component={PrivacyScreen} />
    </VendorStack.Navigator>
  );
}

// ─── Delivery: Home · Requests · Active · Earnings · Profile ──────────────────

const DeliveryTab = createBottomTabNavigator<DeliveryTabParams>();
const DELIVERY_ICONS = { Home: House, Requests: Bell, Active: Scooter, Earnings: Wallet, Profile: User };
const deliveryTabBar = (props: BottomTabBarProps) => <TabBar {...props} icons={DELIVERY_ICONS} />;

function DeliveryTabs() {
  return (
    <DeliveryTab.Navigator screenOptions={{ headerShown: false }} tabBar={deliveryTabBar}>
      <DeliveryTab.Screen name="Home" component={PartnerHomeScreen} options={{ title: 'Home' }} />
      <DeliveryTab.Screen name="Requests" component={RequestsScreen} options={{ title: 'Requests' }} />
      <DeliveryTab.Screen name="Active" component={ActiveScreen} options={{ title: 'Active' }} />
      <DeliveryTab.Screen name="Earnings" component={PartnerEarningsScreen} options={{ title: 'Earnings' }} />
      <DeliveryTab.Screen name="Profile" component={PartnerProfileScreen} options={{ title: 'Profile' }} />
    </DeliveryTab.Navigator>
  );
}

const DeliveryStack = createNativeStackNavigator<DeliveryParams>();

function DeliveryNavigator() {
  return (
    <DeliveryStack.Navigator screenOptions={stackOptions}>
      <DeliveryStack.Screen name="DeliveryTabs" component={DeliveryTabs} />
      <DeliveryStack.Screen
        name="IncomingRequest"
        component={IncomingRequestScreen}
        options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
      />
      <DeliveryStack.Screen name="PickupCode" component={PickupCodeScreen} />
      <DeliveryStack.Screen name="DeliveryOtp" component={DeliveryOtpScreen} />
      <DeliveryStack.Screen name="ProofPhoto" component={ProofPhotoScreen} />
      <DeliveryStack.Screen name="DeliveryFailed" component={DeliveryFailedScreen} />
      <DeliveryStack.Screen name="Statement" component={StatementScreen} />
      <DeliveryStack.Screen name="TripDetail" component={TripDetailScreen} />
      <DeliveryStack.Screen name="History" component={HistoryScreen} />
      <DeliveryStack.Screen name="Vehicle" component={VehicleScreen} />
      <DeliveryStack.Screen name="Kyc" component={KycScreen} />
      <DeliveryStack.Screen name="BankAccount" component={BankAccountScreen} />
      <DeliveryStack.Screen name="ZoneShift" component={ZoneShiftScreen} />
      <DeliveryStack.Screen name="Notifications" component={NotificationsScreen} />
      <DeliveryStack.Screen name="Help" component={HelpScreen} />
      <DeliveryStack.Screen name="ReportProblem" component={ReportProblemScreen} />
      <DeliveryStack.Screen name="Privacy" component={PrivacyScreen} />
    </DeliveryStack.Navigator>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

/**
 * Board 1d: "Nothing role-specific is decided in the app." The session carries the
 * role; this picks the matching shell and accent. Switching role remounts the tree.
 */
export function RootNavigator() {
  const { session, restoring, branding } = useSession();
  const role = session?.activeRole;

  // A saved token is checked with the server before the first screen appears.
  if (restoring) {
    return (
      <ThemeProvider role="vendor">
        <View style={splashStyles.screen}>
          <ActivityIndicator color={palette.clay} />
        </View>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider role={role ?? 'vendor'} brand={branding}>
      <NavigationContainer theme={navTheme}>
        {role === 'vendor' ? (
          <VendorNavigator key="vendor" />
        ) : role === 'delivery' ? (
          <DeliveryNavigator key="delivery" />
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>
    </ThemeProvider>
  );
}

const splashStyles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.cream },
});
