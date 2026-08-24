import { createContext, useContext, useEffect, useState } from "react";
import { useServiceApi } from "../hook/useServiceApi";
import { useAuth } from "./UserContext";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount?: number;
  duration_minutes: number;
  images: string[];
  status: "active" | "inactive";
}

interface ServiceContextType {
  services: Service[];
  loading: boolean;

  refreshServices: () => Promise<void>;
  addService: (data: any) => Promise<void>;
  updateService: (serviceId: string, data: any) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const ServiceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const vendorId = user?.id;

  const { getServices, createService, updateService, deleteService } = useServiceApi();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  /** --------------------------
   * Fetch Services
   * -------------------------*/
  const refreshServices = async () => {
    if (!vendorId) return;

    try {
      setLoading(true);
      const data = await getServices(vendorId);
      setServices(data.services);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  /** --------------------------
   * Add Service
   * -------------------------*/
  const addService = async (data: any) => {
    if (!vendorId) return;

    await createService( data);
    await refreshServices();
  };

  /** --------------------------
   * Update Service
   * -------------------------*/
  const updateServiceHandler = async (serviceId: string, data: any) => {
    if (!vendorId) return;

    await updateService(serviceId, data);
    await refreshServices();
  };

  /** --------------------------
   * Delete Service
   * -------------------------*/
  const deleteServiceHandler = async (serviceId: string) => {
    if (!vendorId) return;

    await deleteService(serviceId);
    await refreshServices();
  };

  // Load services initially
  useEffect(() => {
    if (vendorId) refreshServices();
  }, [vendorId]);

  return (
    <ServiceContext.Provider
      value={{
        services,
        loading,
        refreshServices,
        addService,
        updateService: updateServiceHandler,
        deleteService: deleteServiceHandler,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};

export const useServiceContext = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServiceContext must be used inside ServiceProvider");
  }
  return context;
};
