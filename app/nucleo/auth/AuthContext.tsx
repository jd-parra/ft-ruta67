import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { login as loginApi, registrar as registrarApi, type Credenciales, type DatosRegistro } from "@nucleo/api/authApi";
import { setAuthToken, setOnUnauthorized } from "@nucleo/api/client";
import type { Sesion } from "@nucleo/types/auth";
import { borrarSesion, guardarSesion, leerSesion } from "./tokenStorage";

interface AuthValue {
  sesion: Sesion | null;
  cargando: boolean;
  login: (c: Credenciales) => Promise<void>;
  registrar: (d: DatosRegistro) => Promise<void>;
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

  const iniciar = useCallback(async (s: Sesion) => {
    setAuthToken(s.token);
    setSesion(s);
    await guardarSesion(s);
  }, []);

  const login = useCallback(async (c: Credenciales) => iniciar(await loginApi(c)), [iniciar]);
  const registrar = useCallback(async (d: DatosRegistro) => iniciar(await registrarApi(d)), [iniciar]);

  const value = useMemo(
    () => ({ sesion, cargando, login, registrar, logout }),
    [sesion, cargando, login, registrar, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
