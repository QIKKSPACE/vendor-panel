import { useApi } from "../lib/api";

export interface CreatePackageItemPayload {
  product_id?: string;
  service_id?: string;
  quantity: number;
}

export interface CreatePackagePayload {
  name: string;
  description?: string;
  package_type: "QUANTITY_DISCOUNT" | "PRODUCT_BUNDLE" | "SERVICE_BUNDLE";
  discount_type: "PERCENTAGE" | "FIXED_AMOUNT" | "FIXED_PRICE";
  discount_value: number;
  status: "active" | "draft" | "paused" | "archived";
  max_purchases?: number | null;
  items: CreatePackageItemPayload[];
}

export function usePackageApi() {
  const api = useApi();

  const createPackage = async (payload: CreatePackagePayload) => {
    const res = await api.post("/vendor/packages", payload);
    return res.data;
  };

  const getPackages = async () => {
    const res = await api.get("/vendor/packages");
    return res.data;
  };

  const updatePackageStatus = async (packageId: string, status: string) => {
    const res = await api.patch(`/vendor/packages/${packageId}/status`, { status });
    return res.data;
  };

  const deletePackage = async (packageId: string) => {
    const res = await api.delete(`/vendor/packages/${packageId}`);
    return res.data;
  };

  return {
    createPackage,
    getPackages,
    updatePackageStatus,
    deletePackage,
  };
}
