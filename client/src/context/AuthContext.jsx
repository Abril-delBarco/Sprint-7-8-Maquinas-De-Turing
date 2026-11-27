import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_URL = (import.meta.env?.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "user";

export const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false;
  return Date.now() >= payload.exp * 1000;
}

function extractErrorMessage(data, fallback) {
  if (!data || typeof data !== "object") return fallback;
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  if (typeof data.mensaje === "string" && data.mensaje.trim()) return data.mensaje;
  if (typeof data.error === "string" && data.error.trim()) return data.error;
  if (typeof data.error?.message === "string" && data.error.message.trim()) {
    return data.error.message;
  }
  return fallback;
}

function normalizeUser(rawUser, token, fallbackEmail = "") {
  const payload = token ? decodeJwtPayload(token) : null;
  const source = rawUser && typeof rawUser === "object" ? rawUser : {};

  const id = source._id || source.id || payload?.id || payload?._id || payload?.userId || null;
  const nombre = source.nombre || source.name || payload?.nombre || payload?.name || "";
  const email = source.email || payload?.email || fallbackEmail || "";
  const rol = source.rol || source.role || payload?.rol || payload?.role || "cliente";

  return {
    ...source,
    id,
    _id: id,
    nombre,
    email,
    rol,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const persistSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  // Restaura la sesión desde localStorage al recargar la página
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUserRaw = localStorage.getItem(USER_STORAGE_KEY);

      if (!storedToken || isTokenExpired(storedToken)) {
        clearSession();
        return;
      }

      let parsedUser = null;
      if (storedUserRaw) {
        try {
          parsedUser = JSON.parse(storedUserRaw);
        } catch {
          parsedUser = null;
        }
      }

      const normalized = normalizeUser(parsedUser, storedToken);
      setToken(storedToken);
      setUser(normalized);
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  const login = useCallback(
    async ({ email, password }) => {
      let response;
      try {
        response = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      } catch {
        throw new Error("No pudimos conectar con el servidor. Intentá nuevamente.");
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractErrorMessage(data, "Credenciales inválidas. Verificá tu email y contraseña.")
        );
      }

      const receivedToken = data?.token || data?.jwt || data?.accessToken;
      if (!receivedToken) {
        throw new Error("El servidor no devolvió un token de autenticación válido.");
      }

      const receivedUser = normalizeUser(data?.user || data?.usuario, receivedToken, email);
      persistSession(receivedToken, receivedUser);

      return { token: receivedToken, user: receivedUser };
    },
    [persistSession]
  );

  const register = useCallback(
    async ({ nombre, email, password }) => {
      let response;
      try {
        response = await fetch(`${API_URL}/api/auth/registro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, email, password }),
        });
      } catch {
        throw new Error("No pudimos conectar con el servidor. Intentá nuevamente.");
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractErrorMessage(data, "No pudimos completar el registro. Revisá los datos ingresados.")
        );
      }

      const receivedToken = data?.token || data?.jwt || data?.accessToken;
      if (receivedToken) {
        const receivedUser = normalizeUser(
          data?.user || data?.usuario || { nombre, email },
          receivedToken,
          email
        );
        persistSession(receivedToken, receivedUser);
        return { token: receivedToken, user: receivedUser, autoLoggedIn: true };
      }

      return {
        token: null,
        user: data?.user || data?.usuario || { nombre, email },
        autoLoggedIn: false,
        message: extractErrorMessage(data, "Cuenta creada con éxito. Ahora podés iniciar sesión."),
      };
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const getAuthHeaders = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    getAuthHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de un AuthProvider");
  }
  return context;
}
