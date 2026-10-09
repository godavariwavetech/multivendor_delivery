import type { NavigatorScreenParams, RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthParams = {
  Login: undefined;
  /** `role` is the workspace picked on the sign-in screen (login only). */
  Otp: { mobile: string; purpose: 'login' | 'reset'; role?: 'vendor' | 'delivery' };
  ForgotPassword: undefined;
  /** Where the app looks for the backend; needed when testing on a real phone. */
  ServerAddress: undefined;
  ResetPassword: { mobile: string; otp: string };
};

/** Screens both role stacks register. */
export type SharedParams = {
  Notifications: undefined;
  Help: undefined;
  Assistant: undefined;
  ReportProblem: { context?: string } | undefined;
  Privacy: undefined;
};

export type VendorTabParams = {
  Home: undefined;
  Orders: { tab?: 'new' | 'cooking' | 'ready' | 'delivered' | 'past' } | undefined;
  Menu: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type VendorParams = SharedParams & {
  VendorTabs: NavigatorScreenParams<VendorTabParams> | undefined;
  HistoryDetails: { from: string; to: string };
  OrderDetail: { id: string };
  AcceptOrder: { id: string };
  RejectOrder: { id: string };
  Handover: { id: string };
  ProductEdit: { id?: string };
  RateSheet: undefined;
  OutOfStock: undefined;
  Timings: undefined;
  Coupons: undefined;
  CouponEdit: { code?: string };
  Reports: undefined;
  SettlementDetail: { id: string };
  StoreDetails: undefined;
  Documents: undefined;
  BankAccount: { role: 'vendor' | 'delivery' };
};

export type DeliveryTabParams = {
  Home: undefined;
  Requests: undefined;
  Active: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type DeliveryParams = SharedParams & {
  DeliveryTabs: NavigatorScreenParams<DeliveryTabParams> | undefined;
  IncomingRequest: { id: string };
  PickupCode: undefined;
  DeliveryOtp: undefined;
  ProofPhoto: undefined;
  DeliveryFailed: undefined;
  Statement: undefined;
  TripDetail: { id: string };
  History: undefined;
  Vehicle: undefined;
  Kyc: undefined;
  BankAccount: { role: 'vendor' | 'delivery' };
  ZoneShift: undefined;
};

export const useAuthNav = () => useNavigation<NativeStackNavigationProp<AuthParams>>();
export const useVendorNav = () => useNavigation<NativeStackNavigationProp<VendorParams>>();
export const useDeliveryNav = () => useNavigation<NativeStackNavigationProp<DeliveryParams>>();
/** Shared screens are registered in both stacks; either navigator type works for them. */
export const useSharedNav = () => useNavigation<NativeStackNavigationProp<SharedParams & { BankAccount: { role: 'vendor' | 'delivery' } }>>();

export const useAuthRoute = <K extends keyof AuthParams>() => useRoute<RouteProp<AuthParams, K>>();
export const useVendorRoute = <K extends keyof VendorParams>() => useRoute<RouteProp<VendorParams, K>>();
export const useDeliveryRoute = <K extends keyof DeliveryParams>() => useRoute<RouteProp<DeliveryParams, K>>();
