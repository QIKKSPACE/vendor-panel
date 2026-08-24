import { useApi } from "../lib/api";

export function useServiceApi() {
  const api = useApi();

  const getServices = async () => {
    const res = await api.get(`/vendors/services`);
    return res.data;
  };

const createService = async (data: FormData) => {
  const res = await api.post(`/vendors/services`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

  const updateService = async (serviceId: string, data: any) => {
    const res = await api.put(`/vendors/services/${serviceId}`, data);
    return res.data;
  };

  const deleteService = async (serviceId: string) => {
    const res = await api.delete(`/vendors/services/${serviceId}`);
    return res.data;
  };

  return {
    getServices,
    createService,
    updateService,
    deleteService,
  };
}
