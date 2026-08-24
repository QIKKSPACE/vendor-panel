import { useState, useRef, useMemo } from 'react';
import { Upload, X, Package, Tag, Layers, Plus, Info } from 'lucide-react';
import MobileSliderNav from './MobileSliderNav';
import { useVendorFlow } from "../context/VendorFlowContext";
import { useProductContext } from '../context/ProductContext';

export default function UploadProduct() {
  const { vendorSettings } = useVendorFlow();
  const { addProduct } = useProductContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

const [formData, setFormData] = useState({
  category_id: "",
  sub_category_id: "",
  product_code: "",      // Add this
  name: "",
  description: "",
  mrp: "",
  sellingPrice: "",
  stockQuantity: "",
  quality_tier: "Budget Quality",
});
  const [images, setImages] = useState<{ file: File | null; url: string }[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category resolution logic
  const categoriesList = vendorSettings?.categories || [];
  const categories = categoriesList.filter((item: any) => !item.parent_id) || [];
  const subCategories = categoriesList.filter((item: any) => item.parent_id === formData.category_id) || [];

  // Calculate dynamic commissions depending on the selected structural hierarchy
  const selectedCategoryMetrics = useMemo(() => {
    const targetId = formData.sub_category_id || formData.category_id;
    if (!targetId || !categoriesList) return { commission: 0, platform: 0, total: 0 };
    
    const found = categoriesList.find((cat: any) => cat.id === targetId);
    if (!found) return { commission: 0, platform: 0, total: 0 };

    const commission = parseFloat(found.commission || '0');
    const platform = parseFloat(found.platform_commission || '0');
    return {
      commission,
      platform,
      total: commission + platform
    };
  }, [formData.category_id, formData.sub_category_id, categoriesList]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, { file, url: e.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.mrp || !formData.sellingPrice || images.length === 0) {
      setError('Please fill in required fields and upload at least one image');
      return;
    }

    const payload = new FormData();
    payload.append('category_id', formData.category_id);
    payload.append('sub_category_id', formData.sub_category_id);
    payload.append('name', formData.name);
    payload.append('description', formData.description);
    payload.append('mrp', formData.mrp);
    payload.append('selling_price', formData.sellingPrice);
    payload.append('stockQuantity', formData.stockQuantity);
    payload.append('quality_tier', formData.quality_tier); // Included value on network serialization data parameters
payload.append("product_code", formData.product_code);
    images.forEach((image) => {
      if (image.file) {
        payload.append('images', image.file);
      }
    });

    try {
      setIsSubmitting(true);
      await addProduct(payload);

      setFormData({
        category_id: "",
        sub_category_id: "",
        name: "",
        description: "",
        mrp: "",
        sellingPrice: "",
        stockQuantity: "",
        quality_tier: "Budget Quality",
        product_code: "", // Reset product code
      });
      setImages([]);
    } catch (err) {
      console.error('Product upload failed:', err);
      setError('Unable to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const discount = (Number(formData.mrp) > 0 && Number(formData.sellingPrice) > 0) 
    ? Math.round(((Number(formData.mrp) - Number(formData.sellingPrice)) / Number(formData.mrp)) * 100) 
    : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <MobileSliderNav />
      
      <div className="flex flex-col lg:flex-row gap-8 mt-4">
        {/* LEFT COLUMN: Media Gallery */}
        <div className="w-full lg:w-5/12 space-y-4">
          <div className="sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Media Gallery
            </h3>
            
            {/* Primary Preview */}
            <div className="aspect-square w-full rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden relative flex items-center justify-center transition-all hover:border-gray-300">
              {images.length > 0 ? (
                <img src={images[0].url} alt="Primary" className="w-full h-full object-contain p-4" />
              ) : (
                <div className="text-center p-6">
                  <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-3">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No images uploaded yet</p>
                </div>
              )}
            </div>

            {/* Thumbnails Container Grid */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group">
                  <img src={img.url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {idx === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white text-center py-0.5">
                      Main
                    </div>
                  )}
                </div>
              ))}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                <Plus className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />

            {/* Aspect Ratio Hint Label Banner */}
            <div className="mt-4 bg-gray-50 border-l-4 border-black p-3 rounded-r-xl text-xs text-gray-600 font-medium">
              💡 select Aspect ratio 3/4 or image 1080*1920 px for best result
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Details Form */}
        <div className="w-full lg:w-7/12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Basic Information</h3>
              <div>
  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
    Product Code
  </label>
  <input
    type="text"
    value={formData.product_code}
    onChange={(e) =>
      setFormData({
        ...formData,
        product_code: e.target.value.toUpperCase(),
      })
    }
    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-black transition-all outline-none"
    placeholder="e.g. PRD00123"
  />
</div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-black transition-all outline-none"
                  placeholder="e.g., Premium Wireless Headphones"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-black transition-all outline-none"
                  placeholder="Tell your customers about the features and benefits..."
                />
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Organization</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value, sub_category_id: "" })}
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="">Choose Category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                {subCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Sub-category
                    </label>
                    <select
                      value={formData.sub_category_id}
                      onChange={(e) => setFormData({ ...formData, sub_category_id: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-black outline-none animate-in fade-in slide-in-from-top-2"
                    >
                      <option value="">Select Sub-category</option>
                      {subCategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
                            {/* Dynamic Commissions Overview Alert Box */}
            {(formData.category_id || formData.sub_category_id) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-900 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                
                  <div className="sm:border-l sm:pl-4 border-amber-200 font-bold text-amber-950"><span className="text-amber-800">Total Commission:</span> {selectedCategoryMetrics.total.toFixed(2)}%</div>
                </div>
              </div>
            )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Pricing & Stock</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">MRP *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-gray-400">₹</span>
                      <input
                        type="number"
                        value={formData.mrp}
                        onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                        className="w-full pl-7 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-black outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Selling Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-gray-400">₹</span>
                      <input
                        type="number"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                        className="w-full pl-7 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-black outline-none font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>
                {discount > 0 && (
                  <div className="p-2 bg-green-50 text-green-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1">
                    Customers save {discount}% off MRP!
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Available Stock</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-black outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </section>



            {/* Product Quality Tier Selector Block */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Product Assignment</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quality Tier</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Premium Quality', 'Semi Premium Quality', 'Budget Quality'].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setFormData({ ...formData, quality_tier: tier })}
                      className={`py-3 px-4 text-xs font-bold rounded-xl border text-center transition-all ${
                        formData.quality_tier === tier
                          ? 'border-black bg-black text-white shadow-md'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-900 transition-all transform hover:scale-[1.01] active:scale-95 shadow-xl shadow-black/10 flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="w-5 h-5" />
              {isSubmitting ? 'Saving...' : 'List Product Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}