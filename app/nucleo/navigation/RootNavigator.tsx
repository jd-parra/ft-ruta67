import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator, type BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { useAuth } from "@nucleo/auth/AuthContext";
import { colors } from "@nucleo/theme";
import { LoginScreen } from "@pantallas/auth/LoginScreen";
import { RegistroScreen } from "@pantallas/auth/RegistroScreen";
import { HistorialScreen } from "@pantallas/pasajero/HistorialScreen";
import { InicioScreen } from "@pantallas/pasajero/InicioScreen";
import { PagarScreen } from "@pantallas/pasajero/PagarScreen";
import { RecargarScreen } from "@pantallas/pasajero/RecargarScreen";
import { CobrarScreen } from "@pantallas/recolector/CobrarScreen";
import type { AuthStackParams, PasajeroStackParams, PasajeroTabsParams, RecolectorTabsParams } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const PasajeroStack = createNativeStackNavigator<PasajeroStackParams>();
const PasajeroTabs = createBottomTabNavigator<PasajeroTabsParams>();
const RecolectorTabs = createBottomTabNavigator<RecolectorTabsParams>();

type NombreIcono = keyof typeof Ionicons.glyphMap;
const ICONOS: Record<string, [NombreIcono, NombreIcono]> = {
  Inicio: ["home", "home-outline"],
  Pagar: ["phone-portrait", "phone-portrait-outline"],
  Historial: ["time", "time-outline"],
  Cobrar: ["scan-circle", "scan-circle-outline"],
};

const opcionesTabs = ({ route }: { route: { name: string } }): BottomTabNavigationOptions => ({
  headerShown: false,
  tabBarActiveTintColor: colors.primario,
  tabBarInactiveTintColor: colors.textoSuave,
  tabBarLabelStyle: { fontWeight: "600" },
  tabBarStyle: { borderTopColor: colors.borde },
  tabBarIcon: ({ focused, color, size }) => (
    <Ionicons name={ICONOS[route.name]?.[focused ? 0 : 1] ?? "ellipse"} color={color} size={size} />
  ),
});

// Navegación separada por rol: cada modo tiene su propio árbol.
function PasajeroTabsNavigator() {
  return (
    <PasajeroTabs.Navigator screenOptions={opcionesTabs}>
      <PasajeroTabs.Screen name="Inicio" component={InicioScreen} />
      <PasajeroTabs.Screen name="Pagar" component={PagarScreen} />
      <PasajeroTabs.Screen name="Historial" component={HistorialScreen} />
    </PasajeroTabs.Navigator>
  );
}

function PasajeroNavigator() {
  return (
    <PasajeroStack.Navigator screenOptions={{ headerShown: false }}>
      <PasajeroStack.Screen name="Tabs" component={PasajeroTabsNavigator} />
      <PasajeroStack.Screen name="Recargar" component={RecargarScreen} options={{ animation: "slide_from_bottom" }} />
    </PasajeroStack.Navigator>
  );
}

function RecolectorNavigator() {
  return (
    <RecolectorTabs.Navigator screenOptions={opcionesTabs}>
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
          <AuthStack.Screen name="Registro" component={RegistroScreen} />
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
