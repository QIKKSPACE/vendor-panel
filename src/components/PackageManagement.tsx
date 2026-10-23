import { useState, useMemo, useEffect } from "react";
import {
  IndianRupee,
  Plus,
  Search,
  Trash2,
  Package as PackageIcon,
  Wrench,
  Check,
  AlertCircle,
  Tag,
  Sparkles,
  Clock,
  ArrowRight,
  Filter,
  Eye,
  Layers,
  Percent,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import MobileSliderNav from "./MobileSliderNav";
import { useProductContext } from "../context/ProductContext";
import { useServiceContext } from "../context/ServiceContext";
import { usePackageApi, CreatePackagePayload, CreatePackageItemPayload } from "../hook/usePackageApi";
import { Package, PackageType, DiscountType, PackageStatus } from "../types";

const resolveImageUrl = (url?: string) =>
  !url
    ? ""
    : url.startsWith("http")
    ? url
    : `https://api.thegroome.com${url.startsWith("/") ? "" : "/"}${url}`;

export default function PackageManagement() {
  const { products, loading: productsLoading } = useProductContext();
  const { services, loading: servicesLoading } = useServiceContext();
  const { createPackage, getPackages, updatePackageStatus, deletePackage: deletePackageApi } = usePackageApi();

  // Navigation tab: 'list' or 'create'
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [filterType, setFilterType] = useState<"ALL" | PackageType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Submitting & Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // Storage for packages in UI state (persisted to localStorage as fallback)
  const [packages, setPackages] = useState<Package[]>(() => {
    const saved = localStorage.getItem("vendor_packages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved packages", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("vendor_packages", JSON.stringify(packages));
  }, [packages]);

  // Load packages from API on mount
  useEffect(() => {
    const fetchRemotePackages = async () => {
      try {
        setLoadingPackages(true);
        const data = await getPackages();
        const list = Array.isArray(data) ? data : data?.packages || data?.data;
        if (Array.isArray(list) && list.length > 0) {
          setPackages(list);
        }
      } catch (err) {
        console.warn("Using local packages cache (GET /vendor/packages fallback):", err);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchRemotePackages();
  }, []);

  // Form State for Package Builder
  const [packageType, setPackageType] = useState<PackageType>("PRODUCT_BUNDLE");
  const [packageName, setPackageName] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("FIXED_PRICE");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [maxPurchases, setMaxPurchases] = useState<string>("");

  // Items selection state
  // For PRODUCT_BUNDLE: map of productId -> quantity
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  // For QUANTITY_DISCOUNT: single productId & threshold
  const [singleProductId, setSingleProductId] = useState<string>("");
  const [quantityThreshold, setQuantityThreshold] = useState<number>(3);
  // For SERVICE_BUNDLE: set of serviceIds
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});

  // Product/service search inside the creator
  const [itemSearch, setItemSearch] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-fill default single product if available
  useEffect(() => {
    if (!singleProductId && products.length > 0) {
      setSingleProductId(products[0].id);
    }
  }, [products, singleProductId]);

  // Reset form when changing package type
  const handleTypeChange = (newType: PackageType) => {
    setPackageType(newType);
    setValidationError(null);

    if (newType === "PRODUCT_BUNDLE") {
      setPackageName("Summer Grooming Combo Kit");
      setDiscountType("FIXED_PRICE");
      setDiscountValue(0);
    } else if (newType === "QUANTITY_DISCOUNT") {
      const p = products.find((prod) => prod.id === singleProductId) || products[0];
      setPackageName(p ? `Buy ${quantityThreshold} Pack - ${p.name}` : `Volume Discount Pack`);
      setDiscountType("PERCENTAGE");
      setDiscountValue(15);
    } else if (newType === "SERVICE_BUNDLE") {
      setPackageName("Complete Styling & Haircut Package");
      setDiscountType("FIXED_PRICE");
      setDiscountValue(0);
    }
  };

  // Filtered available products & services for the creator
  const filteredAvailableProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [products, itemSearch]);

  const filteredAvailableServices = useMemo(() => {
    return services.filter((s) =>
      s.name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [services, itemSearch]);

  // Calculate Original Items Total and Items Summary
  const { originalTotal, totalDuration, selectedItemsCount } = useMemo(() => {
    let sum = 0;
    let duration = 0;
    let count = 0;

    if (packageType === "PRODUCT_BUNDLE") {
      Object.entries(selectedProducts).forEach(([id, qty]) => {
        const prod = products.find((p) => p.id === id);
        if (prod) {
          const price = Number(prod.selling_price ?? prod.price ?? 0);
          sum += price * qty;
          count += 1;
        }
      });
    } else if (packageType === "QUANTITY_DISCOUNT") {
      const prod = products.find((p) => p.id === singleProductId);
      if (prod) {
        const price = Number(prod.selling_price ?? prod.price ?? 0);
        sum = price * quantityThreshold;
        count = 1;
      }
    } else if (packageType === "SERVICE_BUNDLE") {
      Object.entries(selectedServices).forEach(([id, qty]) => {
        const srv = services.find((s) => s.id === id);
        if (srv) {
          sum += Number(srv.price || 0) * qty;
          duration += Number(srv.duration_minutes || 0) * qty;
          count += 1;
        }
      });
    }

    return { originalTotal: sum, totalDuration: duration, selectedItemsCount: count };
  }, [
    packageType,
    selectedProducts,
    singleProductId,
    quantityThreshold,
    selectedServices,
    products,
    services,
  ]);

  // Calculate final selling price and customer savings
  const { finalPrice, savingsAmount, savingsPercentage } = useMemo(() => {
    let final = originalTotal;
    let savings = 0;

    if (discountType === "FIXED_PRICE") {
      final = discountValue > 0 ? discountValue : originalTotal;
      savings = Math.max(0, originalTotal - final);
    } else if (discountType === "PERCENTAGE") {
      const percent = Math.min(100, Math.max(0, discountValue));
      savings = (originalTotal * percent) / 100;
      final = Math.max(0, originalTotal - savings);
    } else if (discountType === "FIXED_AMOUNT") {
      savings = Math.min(originalTotal, Math.max(0, discountValue));
      final = Math.max(0, originalTotal - savings);
    }

    const percentage = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;
    return {
      finalPrice: final,
      savingsAmount: savings,
      savingsPercentage: percentage,
    };
  }, [originalTotal, discountType, discountValue]);

  // Handle publishing a package via POST /vendor/packages
  const handleSavePackage = async (status: PackageStatus = "active") => {
    setValidationError(null);
    setApiError(null);
    setApiSuccess(null);

    // Validation
    if (!packageName.trim()) {
      setValidationError("Please enter a package title.");
      return;
    }

    if (packageType === "PRODUCT_BUNDLE") {
      const selectedKeys = Object.keys(selectedProducts);
      if (selectedKeys.length < 2) {
        setValidationError("A product bundle must contain at least 2 distinct products.");
        return;
      }
    } else if (packageType === "QUANTITY_DISCOUNT") {
      if (!singleProductId) {
        setValidationError("Please select a product for the quantity discount.");
        return;
      }
      if (quantityThreshold < 2) {
        setValidationError("Quantity threshold must be at least 2 units.");
        return;
      }
    } else if (packageType === "SERVICE_BUNDLE") {
      const selectedKeys = Object.keys(selectedServices);
      if (selectedKeys.length < 2) {
        setValidationError("A service combo must contain at least 2 services.");
        return;
      }
    }

    if (discountType === "FIXED_PRICE" && discountValue <= 0) {
      setValidationError("Please enter a valid fixed package selling price.");
      return;
    }

    // Build package items for the API payload and local representation
    const apiItems: CreatePackageItemPayload[] = [];
    const localItems: Package["items"] = [];

    if (packageType === "PRODUCT_BUNDLE") {
      Object.entries(selectedProducts).forEach(([id, qty]) => {
        const prod = products.find((p) => p.id === id);
        apiItems.push({
          product_id: id,
          quantity: Number(qty),
        });
        localItems.push({
          product_id: id,
          quantity: Number(qty),
          product: prod,
        });
      });
    } else if (packageType === "QUANTITY_DISCOUNT") {
      const prod = products.find((p) => p.id === singleProductId);
      apiItems.push({
        product_id: singleProductId,
        quantity: Number(quantityThreshold),
      });
      localItems.push({
        product_id: singleProductId,
        quantity: Number(quantityThreshold),
        product: prod,
      });
    } else if (packageType === "SERVICE_BUNDLE") {
      Object.entries(selectedServices).forEach(([id, qty]) => {
        const srv = services.find((s) => s.id === id);
        apiItems.push({
          service_id: id,
          quantity: Number(qty),
        });
        localItems.push({
          service_id: id,
          quantity: Number(qty),
          service: srv,
        });
      });
    }

    const payload: CreatePackagePayload = {
      name: packageName.trim(),
      package_type: packageType,
      discount_type: discountType,
      discount_value: Number(discountValue),
      status: status,
      items: apiItems,
    };

    if (packageDescription.trim()) {
      payload.description = packageDescription.trim();
    }
    if (maxPurchases) {
      payload.max_purchases = parseInt(maxPurchases, 10);
    }

    try {
      setIsSubmitting(true);
      const response = await createPackage(payload);

      // Extract created package or fall back to local structure with returned id
      const createdPkg: Package = response?.package || response?.data || {
        id: response?.id || `pkg-${Date.now()}`,
        name: payload.name,
        description: payload.description,
        package_type: payload.package_type,
        discount_type: payload.discount_type,
        discount_value: payload.discount_value,
        status: payload.status,
        max_purchases: payload.max_purchases ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: localItems,
      };

      // Enrich items with product/service objects for immediate rendering
      if (!createdPkg.items || createdPkg.items.length === 0) {
        createdPkg.items = localItems;
      } else {
        createdPkg.items = createdPkg.items.map((it: any) => ({
          ...it,
          product: it.product || products.find((p) => p.id === it.product_id),
          service: it.service || services.find((s) => s.id === it.service_id),
        }));
      }

      setPackages((prev) => [createdPkg, ...prev]);
      setApiSuccess(`Package "${payload.name}" created successfully!`);

      // Reset Form
      setSelectedProducts({});
      setSelectedServices({});
      setPackageName("");
      setPackageDescription("");
      setDiscountValue(0);
      setActiveTab("list");
    } catch (err: any) {
      console.error("Error creating package via /vendor/packages:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to create package. Please check the network connection and try again.";
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle package active / paused
  const togglePackageStatus = async (id: string) => {
    const target = packages.find((p) => p.id === id);
    if (!target) return;
    const nextStatus: PackageStatus = target.status === "active" ? "paused" : "active";

    // Optimistically update local state
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, status: nextStatus } : pkg))
    );

    try {
      await updatePackageStatus(id, nextStatus);
    } catch (err) {
      console.warn("Could not update remote package status (using local state):", err);
    }
  };

  // Delete package
  const deletePackage = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this package?")) {
      setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
      try {
        await deletePackageApi(id);
      } catch (err) {
        console.warn("Could not delete remote package (using local state):", err);
      }
    }
  };

  // Filtered packages for list view
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchesType = filterType === "ALL" || pkg.package_type === filterType;
      const matchesSearch =
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [packages, filterType, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <MobileSliderNav />

      <div className="mx-auto max-w-7xl">
        {/* Top Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                <Sparkles className="h-3 w-3" /> Promotions & Bundles
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Package Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create product bundles, single-item volume discounts, and service combos.
            </p>
          </div>

          {/* View Switch Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("list")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-sm ${
                activeTab === "list"
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              My Packages ({packages.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("create");
                handleTypeChange(packageType);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition shadow-sm ${
                activeTab === "create"
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Plus className="h-4 w-4" />
              Create Package
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: PACKAGE CREATOR                                  */}
        {/* ======================================================== */}
        {activeTab === "create" && (
          <div className="space-y-6">
            {/* Step 1: Package Type Selector */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Step 1
                </span>
                <h2 className="text-lg font-bold text-slate-900">Choose Offer Type</h2>
                <p className="text-sm text-slate-500">
                  Select what kind of promotional package you want to create for your store.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* 1. PRODUCT BUNDLE */}
                <div
                  onClick={() => handleTypeChange("PRODUCT_BUNDLE")}
                  className={`relative cursor-pointer rounded-2xl border-2 p-5 transition ${
                    packageType === "PRODUCT_BUNDLE"
                      ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <PackageIcon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">Mixed Product Bundle</h3>
                    {packageType === "PRODUCT_BUNDLE" && (
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Bundle 2 or more complementary products together for a discounted kit price.
                  </p>
                  <div className="mt-3 inline-block rounded-md bg-indigo-100/60 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                    e.g. Shampoo + Conditioner Kit
                  </div>
                </div>

                {/* 2. QUANTITY DISCOUNT */}
                <div
                  onClick={() => handleTypeChange("QUANTITY_DISCOUNT")}
                  className={`relative cursor-pointer rounded-2xl border-2 p-5 transition ${
                    packageType === "QUANTITY_DISCOUNT"
                      ? "border-amber-500 bg-amber-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">Buy X Quantity Discount</h3>
                    {packageType === "QUANTITY_DISCOUNT" && (
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Single-product volume deal. Customer buys minimum X units and unlocks pack rate.
                  </p>
                  <div className="mt-3 inline-block rounded-md bg-amber-100/60 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    e.g. Buy 5 Hair Gels for ₹400
                  </div>
                </div>

                {/* 3. SERVICE BUNDLE */}
                <div
                  onClick={() => handleTypeChange("SERVICE_BUNDLE")}
                  className={`relative cursor-pointer rounded-2xl border-2 p-5 transition ${
                    packageType === "SERVICE_BUNDLE"
                      ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">Service Combo Bundle</h3>
                    {packageType === "SERVICE_BUNDLE" && (
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Combine multiple salon and grooming services into one packaged appointment.
                  </p>
                  <div className="mt-3 inline-block rounded-md bg-emerald-100/60 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    e.g. Haircut + Beard Grooming
                  </div>
                </div>
              </div>
            </div>

            {/* Validation & API Error Alerts */}
            {validationError && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
            {apiError && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Form & Live Preview Layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Form Left Side (2 cols) */}
              <div className="space-y-6 lg:col-span-2">
                {/* Step 2: Item Selection */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                        Step 2
                      </span>
                      <h2 className="text-lg font-bold text-slate-900">
                        {packageType === "QUANTITY_DISCOUNT"
                          ? "Select Single Product & Threshold"
                          : packageType === "PRODUCT_BUNDLE"
                          ? "Select Products for the Bundle"
                          : "Select Services for the Combo"}
                      </h2>
                    </div>
                    <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {packageType === "QUANTITY_DISCOUNT"
                        ? `1 Product (Pack of ${quantityThreshold})`
                        : `${selectedItemsCount} items selected`}
                    </span>
                  </div>

                  {/* 2A: FOR QUANTITY_DISCOUNT */}
                  {packageType === "QUANTITY_DISCOUNT" && (
                    <div className="space-y-5">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">
                          Choose Product from Store *
                        </label>
                        {productsLoading ? (
                          <p className="text-sm text-slate-400">Loading products...</p>
                        ) : (
                          <select
                            value={singleProductId}
                            onChange={(e) => {
                              setSingleProductId(e.target.value);
                              const p = products.find((prod) => prod.id === e.target.value);
                              if (p) {
                                setPackageName(`Buy ${quantityThreshold} Pack - ${p.name}`);
                              }
                            }}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                          >
                            {products.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name} (Price: ₹
                                {Number(prod.selling_price ?? prod.price ?? 0).toFixed(2)} | Stock:{" "}
                                {prod.stock_quantity ?? prod.stockQuantity ?? 0})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Threshold Selector */}
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wide text-amber-900">
                              Minimum Quantity Threshold (X)
                            </h4>
                            <p className="text-xs text-amber-700">
                              How many units the customer must add to trigger the discounted pack
                              rate.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const next = Math.max(2, quantityThreshold - 1);
                                setQuantityThreshold(next);
                                const p = products.find((prod) => prod.id === singleProductId);
                                if (p) setPackageName(`Buy ${next} Pack - ${p.name}`);
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-300 bg-white font-bold text-amber-900 hover:bg-amber-100"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-lg font-extrabold text-amber-900">
                              {quantityThreshold}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = quantityThreshold + 1;
                                setQuantityThreshold(next);
                                const p = products.find((prod) => prod.id === singleProductId);
                                if (p) setPackageName(`Buy ${next} Pack - ${p.name}`);
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-300 bg-white font-bold text-amber-900 hover:bg-amber-100"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2B: FOR PRODUCT_BUNDLE */}
                  {packageType === "PRODUCT_BUNDLE" && (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={itemSearch}
                          onChange={(e) => setItemSearch(e.target.value)}
                          placeholder="Search products to add to bundle..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                        />
                      </div>

                      {productsLoading ? (
                        <p className="py-6 text-center text-xs text-slate-400">Loading products...</p>
                      ) : (
                        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                          {filteredAvailableProducts.map((prod) => {
                            const isSelected = selectedProducts[prod.id] !== undefined;
                            const qty = selectedProducts[prod.id] || 1;
                            const price = Number(prod.selling_price ?? prod.price ?? 0);

                            return (
                              <div
                                key={prod.id}
                                className={`flex items-center justify-between rounded-xl border p-3 transition ${
                                  isSelected
                                    ? "border-indigo-400 bg-indigo-50/30"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      setSelectedProducts((prev) => {
                                        const copy = { ...prev };
                                        if (e.target.checked) copy[prod.id] = 1;
                                        else delete copy[prod.id];
                                        return copy;
                                      });
                                    }}
                                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <div>
                                    <h4 className="text-xs font-semibold text-slate-900">
                                      {prod.name}
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                      ₹{price.toFixed(2)} • Stock:{" "}
                                      {prod.stock_quantity ?? prod.stockQuantity ?? 0}
                                    </p>
                                  </div>
                                </div>

                                {isSelected ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-medium text-slate-400">Qty:</span>
                                    <input
                                      type="number"
                                      min={1}
                                      value={qty}
                                      onChange={(e) => {
                                        const v = Math.max(1, parseInt(e.target.value) || 1);
                                        setSelectedProducts((prev) => ({
                                          ...prev,
                                          [prod.id]: v,
                                        }));
                                      }}
                                      className="w-12 rounded-lg border border-indigo-200 px-1.5 py-1 text-center text-xs font-bold text-slate-900"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-slate-700">
                                    ₹{price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2C: FOR SERVICE_BUNDLE */}
                  {packageType === "SERVICE_BUNDLE" && (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={itemSearch}
                          onChange={(e) => setItemSearch(e.target.value)}
                          placeholder="Search salon services..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-600 focus:bg-white"
                        />
                      </div>

                      {servicesLoading ? (
                        <p className="py-6 text-center text-xs text-slate-400">Loading services...</p>
                      ) : (
                        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                          {filteredAvailableServices.map((srv) => {
                            const isSelected = selectedServices[srv.id] !== undefined;

                            return (
                              <div
                                key={srv.id}
                                className={`flex items-center justify-between rounded-xl border p-3 transition ${
                                  isSelected
                                    ? "border-emerald-400 bg-emerald-50/30"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      setSelectedServices((prev) => {
                                        const copy = { ...prev };
                                        if (e.target.checked) copy[srv.id] = 1;
                                        else delete copy[srv.id];
                                        return copy;
                                      });
                                    }}
                                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <div>
                                    <h4 className="text-xs font-semibold text-slate-900">
                                      {srv.name}
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                      ₹{Number(srv.price).toFixed(2)} • ⏱️ {srv.duration_minutes} mins
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-slate-700">
                                  ₹{Number(srv.price).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 3: Pricing & Discount Setup */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Step 3
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">Discount & Pricing Mode</h2>
                    <p className="text-sm text-slate-500">
                      Decide how you want to price this package offer.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Fixed Package Price */}
                    <label
                      onClick={() => setDiscountType("FIXED_PRICE")}
                      className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition ${
                        discountType === "FIXED_PRICE"
                          ? "border-indigo-600 bg-indigo-50/40"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Fixed Package Price</span>
                        <input
                          type="radio"
                          name="discount_type"
                          checked={discountType === "FIXED_PRICE"}
                          onChange={() => setDiscountType("FIXED_PRICE")}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Sell the entire combo/pack for a flat round amount (e.g., ₹499).
                      </p>
                    </label>

                    {/* Percentage Off */}
                    <label
                      onClick={() => setDiscountType("PERCENTAGE")}
                      className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition ${
                        discountType === "PERCENTAGE"
                          ? "border-indigo-600 bg-indigo-50/40"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Percentage Off (%)</span>
                        <input
                          type="radio"
                          name="discount_type"
                          checked={discountType === "PERCENTAGE"}
                          onChange={() => setDiscountType("PERCENTAGE")}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Discount total combined items by a percentage (e.g., 20% off).
                      </p>
                    </label>

                    {/* Fixed Amount Off */}
                    <label
                      onClick={() => setDiscountType("FIXED_AMOUNT")}
                      className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition ${
                        discountType === "FIXED_AMOUNT"
                          ? "border-indigo-600 bg-indigo-50/40"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Fixed Amount Off (₹)</span>
                        <input
                          type="radio"
                          name="discount_type"
                          checked={discountType === "FIXED_AMOUNT"}
                          onChange={() => setDiscountType("FIXED_AMOUNT")}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Deduct a flat amount from the items total (e.g., ₹100 off).
                      </p>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700">
                        {discountType === "FIXED_PRICE"
                          ? "Final Package Selling Price (₹) *"
                          : discountType === "PERCENTAGE"
                          ? "Discount Percentage (%) *"
                          : "Flat Discount Amount (₹) *"}
                      </label>
                      <div className="relative">
                        {discountType !== "PERCENTAGE" ? (
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                            ₹
                          </span>
                        ) : (
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                            %
                          </span>
                        )}
                        <input
                          type="number"
                          min={0}
                          value={discountValue || ""}
                          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className={`w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 ${
                            discountType !== "PERCENTAGE" ? "pl-8 pr-3" : "pl-3 pr-8"
                          }`}
                        />
                      </div>
                    </div>

                 
                  </div>
                </div>

                {/* Step 4: Package Name & Description */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Step 4
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">Package Information</h2>
                    <p className="text-sm text-slate-500">
                      Name and details shown to customers on the product page.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700">
                      Package Title *
                    </label>
                    <input
                      type="text"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      placeholder="e.g. Grooming Essentials Kit"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={packageDescription}
                      onChange={(e) => setPackageDescription(e.target.value)}
                      placeholder="Describe what is special about this bundle or who it is for..."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>

              {/* Right Side Sticky Preview (1 col) */}
              <div className="space-y-6">
                <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Live Customer Preview
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400">PDP Widget</span>
                  </div>

                  {/* Customer Preview Card */}
                  <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          {packageType === "PRODUCT_BUNDLE"
                            ? "BUNDLE DEAL"
                            : packageType === "QUANTITY_DISCOUNT"
                            ? "VOLUME PACK"
                            : "SERVICE COMBO"}
                        </span>
                        <h4 className="mt-1 text-sm font-bold text-slate-900">
                          {packageName || "Untitled Package"}
                        </h4>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                        Save {savingsPercentage}%
                      </span>
                    </div>

                    {/* Items Breakdown in Preview */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-2 text-xs text-slate-600">
                      {packageType === "PRODUCT_BUNDLE" &&
                        Object.entries(selectedProducts).map(([id, qty]) => {
                          const p = products.find((item) => item.id === id);
                          if (!p) return null;
                          return (
                            <div key={id} className="flex justify-between">
                              <span>
                                • {p.name} {qty > 1 ? `(×${qty})` : ""}
                              </span>
                              <span className="font-medium text-slate-700">
                                ₹{(Number(p.selling_price ?? p.price ?? 0) * qty).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}

                      {packageType === "QUANTITY_DISCOUNT" && (
                        <div>
                          {(() => {
                            const p = products.find((item) => item.id === singleProductId);
                            if (!p) return <p className="italic text-slate-400">No product selected</p>;
                            return (
                              <div className="flex justify-between">
                                <span>
                                  • {p.name} (×{quantityThreshold} units)
                                </span>
                                <span className="font-medium text-slate-700">
                                  ₹{(Number(p.selling_price ?? p.price ?? 0) * quantityThreshold).toFixed(2)}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {packageType === "SERVICE_BUNDLE" && (
                        <div>
                          {Object.entries(selectedServices).map(([id, qty]) => {
                            const s = services.find((item) => item.id === id);
                            if (!s) return null;
                            return (
                              <div key={id} className="flex justify-between">
                                <span>
                                  • {s.name} ({s.duration_minutes}m)
                                </span>
                                <span className="font-medium text-slate-700">
                                  ₹{(Number(s.price || 0) * qty).toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                          {totalDuration > 0 && (
                            <div className="pt-1 text-[11px] font-semibold text-emerald-700">
                              ⏱️ Total Session Duration: {totalDuration} mins
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Price calculation summary */}
                    <div className="mt-2 space-y-1.5 rounded-lg border border-slate-200/80 bg-white p-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Original Total:</span>
                        <span className="line-through font-medium text-slate-400">
                          ₹{originalTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
                        <span>Customer Savings:</span>
                        <span>-₹{savingsAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                        <span className="text-xs font-bold text-slate-900">Package Price:</span>
                        <span className="text-base font-extrabold text-indigo-600">
                          ₹{finalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Threshold explanation */}
                    {packageType === "QUANTITY_DISCOUNT" && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800 space-y-1">
                        <span className="font-bold">💡 How 6 items will be billed:</span>
                        <p>
                          Customer buying {quantityThreshold + 1} units gets {quantityThreshold} at pack
                          rate + 1 unit at regular price!
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      className="w-full rounded-lg bg-slate-900 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                    >
                      + Add Bundle to Cart
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSavePackage("active")}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Publishing Package...</span>
                        </>
                      ) : (
                        <span>Publish Package Live</span>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSavePackage("draft")}
                      className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save as Draft
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: PACKAGES LIST (Management View)                  */}
        {/* ======================================================== */}
        {activeTab === "list" && (
          <div className="space-y-6">
            {apiSuccess && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>{apiSuccess}</span>
                </div>
                <button
                  onClick={() => setApiSuccess(null)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setFilterType("ALL")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filterType === "ALL"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  All ({packages.length})
                </button>
                <button
                  onClick={() => setFilterType("PRODUCT_BUNDLE")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filterType === "PRODUCT_BUNDLE"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Product Bundles (
                  {packages.filter((p) => p.package_type === "PRODUCT_BUNDLE").length})
                </button>
                <button
                  onClick={() => setFilterType("QUANTITY_DISCOUNT")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filterType === "QUANTITY_DISCOUNT"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Quantity Discounts (
                  {packages.filter((p) => p.package_type === "QUANTITY_DISCOUNT").length})
                </button>
                <button
                  onClick={() => setFilterType("SERVICE_BUNDLE")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    filterType === "SERVICE_BUNDLE"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Service Combos (
                  {packages.filter((p) => p.package_type === "SERVICE_BUNDLE").length})
                </button>
              </div>

              {/* Search */}
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search packages..."
                  className="w-full rounded-xl border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Packages Grid */}
            {filteredPackages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <PackageIcon className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-3 text-sm font-bold text-slate-700">No packages created yet</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Click the button below to start creating product bundles or quantity discounts.
                </p>
                <button
                  onClick={() => {
                    setActiveTab("create");
                    handleTypeChange("PRODUCT_BUNDLE");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" /> Create First Package
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredPackages.map((pkg) => {
                  const itemsList = Array.isArray(pkg.items) ? pkg.items : [];

                  // Calculate item sum with fallback to loaded products & services
                  const originalTotalSum = itemsList.reduce((acc, it) => {
                    const prod = it.product || products.find((p) => p.id === it.product_id);
                    const srv = it.service || services.find((s) => s.id === it.service_id);
                    const qty = Number(it.quantity) || 1;
                    if (prod) {
                      const itemPrice = Number(prod.selling_price ?? prod.price ?? 0);
                      return acc + itemPrice * qty;
                    }
                    if (srv) {
                      const itemPrice = Number(srv.price || 0);
                      return acc + itemPrice * qty;
                    }
                    return acc;
                  }, 0);

                  // Ensure discount_value is parsed to number (PostgreSQL NUMERIC comes as string e.g. "10000.00")
                  const dVal = Number(pkg.discount_value) || 0;
                  let finalPriceVal = originalTotalSum;

                  if (pkg.discount_type === "FIXED_PRICE") {
                    finalPriceVal = dVal;
                  } else if (pkg.discount_type === "PERCENTAGE") {
                    finalPriceVal = originalTotalSum * (1 - dVal / 100);
                  } else if (pkg.discount_type === "FIXED_AMOUNT") {
                    finalPriceVal = Math.max(0, originalTotalSum - dVal);
                  }

                  const numFinalPrice = Number(finalPriceVal) || 0;
                  const savings = Math.max(0, originalTotalSum - numFinalPrice);
                  const percent =
                    originalTotalSum > 0 ? Math.round((savings / originalTotalSum) * 100) : 0;

                  return (
                    <article
                      key={pkg.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                              pkg.package_type === "PRODUCT_BUNDLE"
                                ? "bg-indigo-50 text-indigo-700"
                                : pkg.package_type === "QUANTITY_DISCOUNT"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {pkg.package_type === "PRODUCT_BUNDLE"
                              ? "📦 BUNDLE"
                              : pkg.package_type === "QUANTITY_DISCOUNT"
                              ? "🏷️ VOLUME PACK"
                              : "✂️ SERVICE COMBO"}
                          </span>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              pkg.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : pkg.status === "paused"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {pkg.status.toUpperCase()}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900">{pkg.name}</h3>
                          {pkg.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {pkg.description}
                            </p>
                          )}
                        </div>

                        {/* Items preview box */}
                        <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Included Items ({itemsList.length})
                          </p>
                          {itemsList.slice(0, 3).map((it, idx) => {
                            const prod = it.product || products.find((p) => p.id === it.product_id);
                            const srv = it.service || services.find((s) => s.id === it.service_id);
                            const qty = Number(it.quantity) || 1;
                            return (
                              <div key={idx} className="truncate">
                                • {prod?.name || srv?.name || "Item"} (×{qty})
                              </div>
                            );
                          })}
                          {itemsList.length > 3 && (
                            <p className="text-[11px] italic text-slate-400">
                              +{itemsList.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer & Actions */}
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-bold text-slate-900">
                                ₹{numFinalPrice.toFixed(2)}
                              </span>
                              {originalTotalSum > numFinalPrice && (
                                <span className="text-xs line-through text-slate-400">
                                  ₹{originalTotalSum.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-600">
                              Save ₹{Math.round(savings)} ({percent}%)
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => togglePackageStatus(pkg.id)}
                              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                pkg.status === "active"
                                  ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {pkg.status === "active" ? "Pause" : "Activate"}
                            </button>
                            <button
                              onClick={() => deletePackage(pkg.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Delete package"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


/*   <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-700">
                        Max Redemptions / Purchases (Optional)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={maxPurchases}
                        onChange={(e) => setMaxPurchases(e.target.value)}
                        placeholder="Leave blank for unlimited"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>*/