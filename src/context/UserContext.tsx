// src/context/UserContext.tsx
import { createContext, useContext, useState, useEffect } from "react";

interface UserData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: UserData | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthLoading: boolean;
  login: (mobile: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateTokens: () => Promise<void>;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Load initial state
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAccess = localStorage.getItem("accessToken");
    const storedRefresh = localStorage.getItem("refreshToken");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedAccess) setAccessToken(storedAccess);
    if (storedRefresh) setRefreshToken(storedRefresh);

    setIsAuthLoading(false);
  }, []);

  // LOGIN
  const login = async (phone: string, password: string) => {
    try {
      const res = await fetch("https://api.thegroome.com/vendors/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.message || "Invalid credentials" };
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      return { success: true, user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken };
    } catch (err) {
      console.log("Login error:", err);
      return { success: false, message: "Network or server error. Try again." };
    }
  };

  // REFRESH TOKENS
  const updateTokens = async () => {
    if (!refreshToken) return logout();

    try {
      const res = await fetch("https://api.thegroome.com/vendors/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return logout();

      const data = await res.json(); // { accessToken, refreshToken? }

      setAccessToken(data.accessToken);
      localStorage.setItem("accessToken", data.accessToken);

      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
        localStorage.setItem("refreshToken", data.refreshToken);
      }
    } catch (err) {
      console.log("Refresh error:", err);
      logout();
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      if (accessToken) {
        await fetch("https://api.thegroome.com/vendors/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch (err) {
      console.log("Logout request failed", err);
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  // Helpers
  const getAccessToken = () => accessToken;
  const getRefreshToken = () => refreshToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthLoading,
        login,
        logout,
        updateTokens,
        getAccessToken,
        getRefreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
