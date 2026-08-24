import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useProductApi } from "../hook/useProductApi";
import { useAuth } from "./UserContext";
import { Product } from "../types";

interface ProductContextType {
  products: Product[];
  loading: boolean;
  refreshProducts: () => Promise<void>;
  addProduct: (data: FormData) => Promise<void>;
  updateProduct: (
    productId: string,
    data: FormData | ProductUpdateData
  ) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
}
const ProductContext = createContext<ProductContextType | undefined>(
  undefined
);
const normalizeProduct = (item: any): Product => {
  const imageUrl =
    item.imageUrl ??
    item.image_url ??
    (Array.isArray(item.images) && item.images[0]?.image_url) ??
    (Array.isArray(item.images) && item.images[0]?.url) ??
    "";

  return {
    id: String(item.id),
    name: item.name || "",
    description: item.description || "",
    price: Number(
      item.price ??
      item.yourPrice ??
      item.sellingPrice ??
      item.selling_price ??
      0
    ),
    selling_price: Number(
      item.sellingPrice ??
      item.selling_price ??
      0
    ),

    imageUrl,
    images: item.images || [], // <-- ADD THIS

    stockQuantity: Number(
      item.stockQuantity ??
      item.stock_quantity ??
      0
    ),

    status: item.status === "inactive"
      ? "inactive"
      : "active",

    createdAt: item.createdAt
      ? new Date(item.createdAt)
      : item.created_at
      ? new Date(item.created_at)
      : new Date(),

    category_id:
      item.category_id ??
      item.categoryId,

    sub_category_id:
      item.sub_category_id ??
      item.subCategoryId,
  };
};
/**
 * Enhanced conversion supporting the dynamic structure your backend expects
 */
type ProductUpdateData = Partial<Product> & {
  images?: File[];
  existingImages?: string[];
};

const buildUpdateFormData = (data: ProductUpdateData) => {
  const formData = new FormData();

  const {
    images,
    existingImages,
    ...restOfData
  } = data;

  // Normal fields
  Object.entries(restOfData).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else {
      formData.append(key, String(value));
    }
  });

  // Existing image URLs to keep
  formData.append(
    "existingImages",
    JSON.stringify(existingImages || [])
  );

  // New uploaded files
  images?.forEach((file) => {
    formData.append("images", file);
  });

  return formData;
};

export const ProductProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const vendorId = user?.id;

  const {
    getProducts,
    createProduct,
    updateProduct: updateProductApi,
    deleteProduct,
  } = useProductApi();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshProducts = async () => {
    if (!vendorId) return;

    try {
      setLoading(true);
      const response = await getProducts();
      const rawProducts = response?.products ?? response ?? [];

      setProducts(
        Array.isArray(rawProducts)
          ? rawProducts.map(normalizeProduct)
          : []
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (data: FormData) => {
    try {
      await createProduct(data);
      await refreshProducts();
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  };
const updateProductHandler = async (
  productId: string,
  data: FormData | ProductUpdateData
) => {
  try {
    const payload =
      data instanceof FormData
        ? data
        : buildUpdateFormData(data);

    await updateProductApi(productId, payload);
    await refreshProducts();
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

  const deleteProductHandler = async (productId: string) => {
    try {
      await deleteProduct(productId);
      await refreshProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  };

  useEffect(() => {
    refreshProducts();
  }, [vendorId]);

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        refreshProducts,
        addProduct,
        updateProduct: updateProductHandler,
        deleteProduct: deleteProductHandler,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error(
      "useProductContext must be used within a ProductProvider"
    );
  }

  return context;
};