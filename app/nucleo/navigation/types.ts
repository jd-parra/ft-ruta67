import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp, NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type AuthStackParams = { Login: undefined; Registro: undefined };
export type PasajeroTabsParams = { Inicio: undefined; Pagar: undefined; Historial: undefined };
// Recargar se abre encima de las pestañas.
export type PasajeroStackParams = { Tabs: NavigatorScreenParams<PasajeroTabsParams>; Recargar: undefined };
export type RecolectorTabsParams = { Cobrar: undefined };

export type AuthNav = NativeStackNavigationProp<AuthStackParams>;
export type PasajeroNav = CompositeNavigationProp<
  BottomTabNavigationProp<PasajeroTabsParams>,
  NativeStackNavigationProp<PasajeroStackParams>
>;
