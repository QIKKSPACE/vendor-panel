// src/lib/api.ts
import axios from "axios";
import { useMemo } from "react";
import { useAuth } from "../context/UserContext";

// Create a function that returns a configured axios instance
export function useApi() {
  const { getAccessToken, updateTokens, logout } = useAuth();

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: "https://api.thegroome.com",
    });

    // ---------------------------
    // Request interceptor: attach token
    // ---------------------------
    instance.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) config.headers!["Authorization"] = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // ---------------------------
    // Response interceptor: handle 401 & refresh
    // ---------------------------
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Attempt to refresh token using AuthProvider
            await updateTokens();

            const newToken = getAccessToken();
            if (!newToken) throw new Error("Unable to refresh token");

            // Retry original request with new token
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            return instance(originalRequest);
          } catch (err) {
            // Refresh failed → logout
            await logout();
            return Promise.reject(err);
          }
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }, [getAccessToken, updateTokens, logout]);

  return api;
}

