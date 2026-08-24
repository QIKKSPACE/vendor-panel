// src/context/VendorFlowContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./UserContext";
import { useApi } from "../lib/api"; // Axios instance with interceptor

interface VendorFlowContextType {
  loading: boolean;
  error: string | null;
  vendorSettings: any;
  refresh: () => Promise<void>;
  updateSettings: (newSettings: any) => void;
  saveSettings: (payload?: any) => Promise<void>;
  saveBlockedSlot: (payload: any) => Promise<void>;
}

const VendorFlowContext = createContext<VendorFlowContextType | null>(null);

export function VendorFlowProvider({ vendorId, children }: any) {
  const api = useApi();
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [vendorSettings, setVendorSettings] = useState<any>(null);
  const [originalSettings, setOriginalSettings] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  /** ---------------------------
   * Fetch Vendor Settings
   --------------------------- */
  const fetchSettings = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const res = await api.get(`/vendors/webflow/`);
      setVendorSettings(res.data);
      setOriginalSettings(res.data || {}); // initialize original
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed loading vendor settings");
    } finally {
      setLoading(false);
    }
  };

  /** ---------------------------
   * Update local state optimistically
   --------------------------- */
  const updateSettings = (newSettings: any) => {
    setVendorSettings((prev: any) => ({ ...prev, ...newSettings }));
  };

  /** ---------------------------
   * Recursive diff for nested objects
   --------------------------- */
  const getDiff = (original: any, current: any): any => {
    if (!original) return current;
    const diff: any = {};
    for (const key in current) {
      if (typeof current[key] === "object" && current[key] !== null) {
        const nestedDiff = getDiff(original[key], current[key]);
        if (Object.keys(nestedDiff).length > 0) diff[key] = nestedDiff;
      } else if (current[key] !== original[key]) {
        diff[key] = current[key];
      }
    }
    return diff;
  };

  /** ---------------------------
   * Save settings back to server
   --------------------------- */
  const saveSettings = async (payload?: any) => {
    if (!accessToken || !vendorSettings) return;

    try {
      setLoading(true);

      // Use provided payload or compute diff
      const dataToSend = payload || getDiff(originalSettings, vendorSettings);

      // If first save, send full object if originalSettings is empty
      if (!payload && Object.keys(originalSettings).length === 0) {
        await api.post(`/vendors/settings/`, vendorSettings);
      } else if (Object.keys(dataToSend).length > 0) {
        await api.post(`/vendors/settings/`, dataToSend);
      } else {
        return; // nothing to save
      }

      setOriginalSettings(vendorSettings); // update original after save
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Error saving settings");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchSettings();
  }, [accessToken]);
const saveBlockedSlot = async (payload: any) => {
  if (!accessToken) return;

  try {
    setLoading(true);

    const res = await api.post(
      "/vendors/blocked-slot",
      payload
    );

    setError(null);

    return res.data;
  } catch (err: any) {
    setError(
      err?.response?.data?.message ||
      err?.message ||
      "Error saving blocked slot"
    );
    throw err;
  } finally {
    setLoading(false);
  }
};
  return (
    <VendorFlowContext.Provider
      value={{
        loading,
        error,
        vendorSettings,
        refresh: fetchSettings,
        updateSettings,
        saveSettings,
        saveBlockedSlot
      }}
    >
      {children}
    </VendorFlowContext.Provider>
  );
}

export const useVendorFlow = () => {
  const ctx = useContext(VendorFlowContext);
  if (!ctx) throw new Error("useVendorFlow must be used inside VendorFlowProvider");
  return ctx;
};
