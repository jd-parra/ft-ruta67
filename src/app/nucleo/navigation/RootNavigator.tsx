import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "@nucleo/auth/AuthContext";
import { LoginScreen } from "@pantallas/auth/LoginScreen";
import { MapaScreen } from "@pantallas/pasajero/MapaScreen";
import { CobroScreen } from "@pantallas/recolector/CobroScreen";
import type { AuthStackParams, PasajeroTabsParams, RecolectorTabsParams } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const PasajeroTabs = createBottomTabNavigator<PasajeroTabsParams>();
const RecolectorTabs = createBottomTabNavigator<RecolectorTabsParams>();

// Navegación separada por rol: cada modo tiene su propio árbol.
function PasajeroNavigator() {
  return (
    <PasajeroTabs.Navigator screenOptions={{ headerShown: false }}>
      <PasajeroTabs.Screen name="Mapa" component={MapaScreen} />
    </PasajeroTabs.Navigator>
  );
}

function RecolectorNavigator() {
  return (
    <RecolectorTabs.Navigator screenOptions={{ headerShown: false }}>
      <RecolectorTabs.Screen name="Cobro" component={CobroScreen} />
    </RecolectorTabs.Navigator>
  );
}

export function RootNavigator() {
  const { sesion, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!sesion ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
      ) : sesion.usuario.rol === "recolector" ? (
        <RecolectorNavigator />
      ) : (
        <PasajeroNavigator />
      )}
    </NavigationContainer>
  );
}
