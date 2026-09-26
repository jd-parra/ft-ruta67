import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { login as loginApi, type Credenciales } from "@nucleo/api/authApi";
import { setAuthToken, setOnUnauthorized } from "@nucleo/api/client";
import type { Sesion } from "@nucleo/types/auth";
import { borrarSesion, guardarSesion, leerSesion } from "./tokenStorage";

interface AuthValue {
  sesion: Sesion | null;
  cargando: boolean;
  login: (c: Credenciales) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(true);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setSesion(null);
    await borrarSesion();
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => void logout());
    leerSesion()
      .then((s) => {
        if (s) {
          setAuthToken(s.token);
          setSesion(s);
        }
      })
      .finally(() => setCargando(false));
    return () => setOnUnauthorized(null);
  }, [logout]);

  const login = useCallback(async (c: Credenciales) => {
    const s = await loginApi(c);
    setAuthToken(s.token);
    setSesion(s);
    await guardarSesion(s);
  }, []);

  const value = useMemo(() => ({ sesion, cargando, login, logout }), [sesion, cargando, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
