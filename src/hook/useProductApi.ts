import { useApi } from "../lib/api";

export function useProductApi() {
  const api = useApi();

  const getProducts = async () => {
    const res = await api.get("/vendors/products");
    return res.data;
  };

  const createProduct = async (data: FormData) => {
    const res = await api.post("/vendors/products", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  };

  const updateProduct = async (
    productId: string,
    data: FormData
  ) => {
    const res = await api.put(
      `/vendors/products/${productId}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  };

  const deleteProduct = async (productId: string) => {
    const res = await api.delete(
      `/vendors/products/${productId}`
    );

    return res.data;
  };

  return {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}