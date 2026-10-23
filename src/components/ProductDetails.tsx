import { useState } from "react";
import { Edit2, IndianRupee, Package, Search, Trash2 } from "lucide-react";
import { useProductContext } from "../context/ProductContext";
import MobileSliderNav from "./MobileSliderNav";
import ProductEditor from "./ProductEditor";

const resolveImageUrl = (url?: string) => !url ? "" : url.startsWith("http") ? url : `https://api.thegroome.com${url.startsWith("/") ? "" : "/"}${url}`;

export default function ProductDetails() {
  const { products, loading, updateProduct, deleteProduct } = useProductContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const filteredProducts = products.filter((product) => `${product.name} ${product.description} ${product.product_code || ""}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalStock = products.reduce((total, product) => total + Number(product.stock_quantity ?? product.stockQuantity ?? 0), 0);
  console.log("Filtered Products:", products);
  const saveProduct = async (payload: Record<string, unknown>) => {
    if (!editingProduct) return;
    await updateProduct(editingProduct.id, payload as any);
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-10 pt-24 sm:px-6 lg:px-8">
      <MobileSliderNav />
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-medium text-slate-500">Catalogue</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1><p className="mt-1 text-sm text-slate-500">Manage your listed products and inventory.</p></div>
          <div className="grid grid-cols-2 gap-3"><Stat label="Products" value={String(products.length)} /><Stat label="Items in stock" value={String(totalStock)} /></div>
        </div>

        {editingProduct && <ProductEditor key={editingProduct.id} product={editingProduct} onSave={saveProduct} onCancel={() => setEditingProduct(null)} />}

        <div className="mb-5 relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by product name or code" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400" /></div>

        {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading products...</p> : filteredProducts.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center"><Package className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-medium text-slate-600">No products found</p></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filteredProducts.map((product: any) => {
          const primaryImage = product.images?.find((image: any) => image.is_primary) || product.images?.[0];
          const stock = Number(product.stock_quantity ?? product.stockQuantity ?? 0);
          const price = Number(product.selling_price ?? product.sellingPrice ?? product.price ?? 0);
          const mrp = Number(product.mrp ?? 0);
          return <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] bg-slate-100">{primaryImage || product.imageUrl ? <img src={resolveImageUrl(primaryImage?.image_url || product.imageUrl)} alt={product.name} className="h-full w-full object-cover" /> : <Package className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-slate-300" />}<span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold ${stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{stock > 0 ? `${stock} in stock` : "Out of stock"}</span></div>
            <div className="p-4"><div className="flex gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{product.product_code || "No product code"}</p><h2 className="mt-1 truncate font-bold text-slate-900">{product.name}</h2><p className="mt-1 text-sm text-slate-500">{product.brand_name || "Unbranded"}</p></div><div className="flex h-fit gap-1"><button onClick={() => setEditingProduct(product)} title="Edit product" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Edit2 className="h-4 w-4" /></button><button onClick={() => { if (window.confirm(`Delete ${product.name}?`)) deleteProduct(product.id); }} title="Delete product" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-baseline gap-2">
                  <p className="flex items-center text-lg font-bold text-slate-900"><IndianRupee className="h-4 w-4" />{price.toFixed(2)}</p>
                  {mrp > price && (
                    <span className="text-xs font-normal text-slate-400 line-through">₹{mrp.toFixed(2)}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-500">{product.quality_tier || "Budget Quality"}</span>
              </div>
            </div>
          </article>;
        })}</div>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5"><p className="text-xs font-medium text-slate-500">{label}</p><p className="text-lg font-bold text-slate-900">{value}</p></div>; }
