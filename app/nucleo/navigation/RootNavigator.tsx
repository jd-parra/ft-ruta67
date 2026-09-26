import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { useAuth } from "@nucleo/auth/AuthContext";
import { LoginScreen } from "@pantallas/auth/LoginScreen";
import { InicioScreen } from "@pantallas/pasajero/InicioScreen";
import { PagarScreen } from "@pantallas/pasajero/PagarScreen";
import { CobrarScreen } from "@pantallas/recolector/CobrarScreen";
import type { AuthStackParams, PasajeroTabsParams, RecolectorTabsParams } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const PasajeroTabs = createBottomTabNavigator<PasajeroTabsParams>();
const RecolectorTabs = createBottomTabNavigator<RecolectorTabsParams>();

// Navegación separada por rol: cada modo tiene su propio árbol.
function PasajeroNavigator() {
  return (
    <PasajeroTabs.Navigator screenOptions={{ headerShown: false }}>
      <PasajeroTabs.Screen name="Inicio" component={InicioScreen} />
      <PasajeroTabs.Screen name="Pagar" component={PagarScreen} />
    </PasajeroTabs.Navigator>
  );
}

function RecolectorNavigator() {
  return (
    <RecolectorTabs.Navigator screenOptions={{ headerShown: false }}>
      <RecolectorTabs.Screen name="Cobrar" component={CobrarScreen} />
    </RecolectorTabs.Navigator>
  );
}

// La central usa el panel web, no la app.
function SinAcceso() {
  const { logout } = useAuth();
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
      <AppText>Esta cuenta es de la central. Usa el panel web.</AppText>
      <Boton titulo="Cerrar sesión" onPress={() => void logout()} secundario />
    </View>
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
      ) : sesion.usuario.rol === "pasajero" ? (
        <PasajeroNavigator />
      ) : (
        <SinAcceso />
      )}
    </NavigationContainer>
  );
}
