"use client";
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";


type WebflowData = {
  banners: any[];
  services: any[];
  categories: any[];
  products?: any[];
  franchise_types?: any[];
};

type WebflowContextType = {
  data: WebflowData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export const WebflowContext = createContext<WebflowContextType>({
  data: null,
  loading: true,
  error: null,
  refetch: () => {},
});

export const WebflowProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<WebflowData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebflowData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://api.thegroome.com/webflow/", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch webflow data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("❌ Webflow fetch error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebflowData();
  }, [fetchWebflowData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <img
          src="/groome-logo.png"
          alt="Welcome to Gromme"
          width={160}
          height={160}
          className="mb-6 animate-pulse drop-shadow-lg"
        />
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Welcome to Groome ✨
        </h1>
        <p className="text-gray-500 text-sm">Loading your experience...</p>
        <div className="mt-8 animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-white">
        <img
          src="/groome-logo.png"
          alt="Gromme logo"
          width={120}
          height={120}
          className="mb-6 opacity-80"
        />
        <h1 className="text-xl font-semibold text-gray-800 mb-3">
          Oops! Something went wrong 😢
        </h1>
        <p className="text-gray-500 mb-6 text-center px-4">
          We couldn’t load your data. Please check your connection or try again
          later.
        </p>
        <button
          onClick={fetchWebflowData}
          className="px-5 py-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <WebflowContext.Provider
      value={{ data, loading, error, refetch: fetchWebflowData }}
    >
      {children}
    </WebflowContext.Provider>
  );
};
