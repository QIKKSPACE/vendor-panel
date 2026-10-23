import { useState, useRef, useMemo } from 'react';
import { Upload, X, Package, Tag, Layers, Plus, Info, Palette, Ruler, ShieldCheck, Sparkles, Trash2, Scale } from 'lucide-react';
import MobileSliderNav from './MobileSliderNav';
import { useVendorFlow } from "../context/VendorFlowContext";
import { useProductContext } from '../context/ProductContext';

export default function UploadProduct() {
  const { vendorSettings } = useVendorFlow();
  const { addProduct } = useProductContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State with consolidated sizes & colors arrays
  const [formData, setFormData] = useState({
    product_code: "",
    name: "",
    brand_name: "",
    description: "",
    category_id: "",
    sub_category_id: "",
    mrp: "",
    sellingPrice: "",
    stockQuantity: "",
    quality_tier: "Budget Quality",
    available_sizes: [] as string[],
    available_colors: [] as string[],
    weight: "",
    dimensions: "",
    hsn_code: "",
    gst_percentage: "",
    quality_tier_description: "",
  });

  // Local inputs for adding custom options
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [customColorInput, setCustomColorInput] = useState("");
  const [brandAuthFile, setBrandAuthFile] = useState<File | null>(null);

  // Dynamic Key-Value Specifications State
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" }
  ]);

  const [media, setMedia] = useState<{ file: File | null; url: string; type: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preset option helpers
  const standardSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "5", "6", "7","8"];
  const standardColors = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Navy", "Gray", "Beige"];

  // Category resolution logic
    const categoriesList = vendorSettings?.categories || [];
  const [categoryPath, setCategoryPath] = useState<string[]>([]);
  
  // Compute dropdowns to show
  const categoryLevels = useMemo(() => {
    let levels = [categoriesList];
    let currentLevel = categoriesList;
    for (const id of categoryPath) {
      const found = currentLevel.find((c: any) => c.id === id);
      if (found && found.children && found.children.length > 0) {
        levels.push(found.children);
        currentLevel = found.children;
      } else {
        break;
      }
    }
    return levels;
  }, [categoryPath, categoriesList]);

  const handleCategorySelect = (levelIndex: number, id: string) => {
    const newPath = categoryPath.slice(0, levelIndex);
    if (id) newPath.push(id);
    setCategoryPath(newPath);
    const deepestId = newPath.length > 0 ? newPath[newPath.length - 1] : "";
    setFormData({ ...formData, category_id: deepestId, sub_category_id: "" });
  };

  // Dynamic commissions calculation
  const selectedCategoryMetrics = useMemo(() => {
    const targetId = formData.sub_category_id || formData.category_id;
    if (!targetId || !categoriesList) return { commission: 0, platform: 0, total: 0 };
    
    const findCat = (cats: any[], id: string): any => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children?.length) {
          const found = findCat(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const found = findCat(categoriesList, targetId);
    if (!found) return { commission: 0, platform: 0, total: 0 };

    const commission = parseFloat(found.commission || '0');
    const platform = parseFloat(found.platform_commission || '0');
    return {
      commission,
      platform,
      total: commission + platform
    };
  }, [formData.category_id, formData.sub_category_id, categoriesList]);

  // Handle Size Selection / Toggle
  const toggleSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      available_sizes: prev.available_sizes.includes(size)
        ? prev.available_sizes.filter((s) => s !== size)
        : [...prev.available_sizes, size],
    }));
  };

  // Handle Custom Size Addition
  const addCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (trimmed && !formData.available_sizes.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        available_sizes: [...prev.available_sizes, trimmed],
      }));
      setCustomSizeInput("");
    }
  };

  // Handle Color Selection / Toggle
  const toggleColor = (color: string) => {
    setFormData((prev) => ({
      ...prev,
      available_colors: prev.available_colors.includes(color)
        ? prev.available_colors.filter((c) => c !== color)
        : [...prev.available_colors, color],
    }));
  };

  // Handle Custom Color Addition
  const addCustomColor = () => {
    const trimmed = customColorInput.trim();
    if (trimmed && !formData.available_colors.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        available_colors: [...prev.available_colors, trimmed],
      }));
      setCustomColorInput("");
    }
  };

  // Combine standard and dynamically added sizes/colors for badge rendering
  const allSizes = useMemo(() => {
    return Array.from(new Set([...standardSizes, ...formData.available_sizes]));
  }, [formData.available_sizes]);

  const allColors = useMemo(() => {
    return Array.from(new Set([...standardColors, ...formData.available_colors]));
  }, [formData.available_colors]);

  // Dynamic Specifications Handlers
  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specifications];
    updated[index][field] = val;
    setSpecifications(updated);
  };

  const addSpecField = () => {
    setSpecifications([...specifications, { key: "", value: "" }]);
  };

  const removeSpecField = (index: number) => {
    if (specifications.length === 1) return;
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMedia(prev => [...prev, { file, url: e.target?.result as string, type: file.type.startsWith('video') ? 'video' : 'image', name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.mrp  || media.length === 0) {
      setError('Please fill in required fields and upload at least one media file');
      return;
    }

    const payload = new FormData();
    payload.append('product_code', formData.product_code);
    payload.append('name', formData.name);
    payload.append('brand_name', formData.brand_name);
    payload.append('description', formData.description);
    payload.append('category_id', formData.category_id);
    payload.append('sub_category_id', formData.sub_category_id);
    payload.append('mrp', formData.mrp);
    payload.append('stockQuantity', formData.stockQuantity);
    payload.append('quality_tier', formData.quality_tier);
    payload.append('hsn_code', formData.hsn_code);
    payload.append('gst_percentage', formData.gst_percentage);
    payload.append('quality_tier_description', formData.quality_tier_description);
    if (brandAuthFile) {
      payload.append('brand_authorisation_letter', brandAuthFile);
    }
    payload.append('weight', formData.weight);
    payload.append('dimensions', formData.dimensions);
    payload.append('available_sizes', JSON.stringify(formData.available_sizes));
    payload.append('available_colors', JSON.stringify(formData.available_colors));
    payload.append('selling_price', formData.sellingPrice);
    // Filter non-empty key-value specs
    const validSpecs = specifications.filter(s => s.key.trim() && s.value.trim());
    payload.append('specifications', JSON.stringify(validSpecs));

    const mediaDetails = [];
    media.forEach((item) => {
      if (item.file) {
        payload.append('images', item.file);
        mediaDetails.push({ file_name: item.name, media_type: item.type });
      }
    });
    payload.append('media_details', JSON.stringify(mediaDetails));

    try {
      setIsSubmitting(true);
      await addProduct(payload);

      setFormData({
        product_code: "",
        name: "",
        brand_name: "",
        description: "",
        category_id: "",
        sub_category_id: "",
        mrp: "",
        sellingPrice: "",
        stockQuantity: "",
        quality_tier: "Budget Quality",
        available_sizes: [],
        available_colors: [],
        weight: "",
        dimensions: "",
    hsn_code: "",
    gst_percentage: "",
    quality_tier_description: "",
      });
      setSpecifications([{ key: "", value: "" }]);
      setMedia([]);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <MobileSliderNav />
      
      <div className="flex flex-col lg:flex-row gap-8 mt-4">
        {/* LEFT COLUMN: Media Gallery */}
        <div className="w-full lg:w-5/12 space-y-6">
          <div className="sticky top-6 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-black" /> Media Gallery
            </h3>
            
            {/* Primary Preview */}
            <div className="aspect-[4/3] sm:aspect-square w-full rounded-2xl bg-gray-50/80 border-2 border-dashed border-gray-200 overflow-hidden relative flex items-center justify-center transition-all hover:border-black/30 group">
              {media.length > 0 ? (
                media[0].type === 'video' ? 
                  <video src={media[0].url} controls className="w-full h-full object-contain p-4" /> :
                  <img src={media[0].url} alt="Primary" className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="text-center p-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="bg-white p-4 rounded-full shadow-md inline-block mb-3 border border-gray-100">
                    <Upload className="w-8 h-8 text-black" />
                  </div>
                  <p className="text-gray-700 font-semibold text-sm">Upload High-Res Images & Videos</p>
                  <p className="text-xs text-gray-400 mt-1">Drag and drop or click to browse</p>
                </div>
              )}
            </div>

            {/* Thumbnails Container Grid */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              {media.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl border border-gray-200 overflow-hidden group shadow-sm">
                  {img.type === 'video' ? <video src={img.url} className="w-full h-full object-cover" /> : <img src={img.url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />}
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {idx === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-white text-center py-0.5 tracking-wider uppercase">
                      Cover
                    </div>
                  )}
                </div>
              ))}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:bg-gray-50 hover:border-black/40 transition-all text-gray-400 hover:text-black"
              >
                <Plus className="w-6 h-6" />
                <span className="text-[10px] font-bold mt-1">Add More</span>
              </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleFileChange} />

            {/* Aspect Ratio Hint Label Banner */}
            <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-3.5 rounded-r-xl text-xs text-amber-900 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Use 3:4 aspect ratio or 1080Ã—1920 px images for best mobile view.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Comprehensive Product Form */}
        <div className="w-full lg:w-7/12 bg-white rounded-3xl shadow-xl shadow-gray-100/60 border border-gray-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Basic Information */}
            <section className="space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-black">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Product Code</label>
                  <input
                    type="text"
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all outline-none"
                    placeholder="e.g. PRD-8821"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all outline-none"
                    placeholder="e.g. Nike, Apple, Sony"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all outline-none font-medium"
                  placeholder="e.g. Premium Noise Cancelling Headphones"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all outline-none"
                  placeholder="Tell your customers about the key features, design, and material benefits..."
                />
              </div>
            </section>

            {/* Section 2: Organization & Pricing */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-black">Organization</h3>
                </div>
                <div className="col-span-full space-y-4">
                  {categoryLevels.map((levelCategories, index) => (
                    <div key={index}>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                        <Tag className="w-3.5 h-3.5 text-gray-500" /> {index === 0 ? "Category" : `Sub-category Level ${index}`}
                      </label>
                      <select
                        value={categoryPath[index] || ""}
                        onChange={(e) => handleCategorySelect(index, e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-black outline-none transition-all cursor-pointer"
                      >
                        <option value="">{index === 0 ? "Choose Category" : "Choose Sub-category"}</option>
                        {levelCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  ))}
                  </div>

                {/* Dynamic Commission Alert */}
                {(formData.category_id || formData.sub_category_id) && (
                  <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex items-center gap-3">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="text-xs text-amber-900 font-semibold">
                      <span>Platform Commission Fee: </span>
                      <span className="text-amber-950 font-bold">{selectedCategoryMetrics.total.toFixed(2)}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-black">Pricing & Stock</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">MRP *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-gray-400 font-medium text-sm"></span>
                      <input
                        type="number"
                        value={formData.mrp}
                        onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                        className="w-full pl-8 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none font-medium"
                        placeholder="0.00"
                        required
                      />
                    </div>
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
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">HSN Code</label>
                    <input type="text" value={formData.hsn_code} onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-black outline-none" placeholder="HSN Code" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">GST Percentage</label>
                    <input type="number" value={formData.gst_percentage} onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-black outline-none" placeholder="18" />
                  </div>
                  <div>
                   
                  </div>
                </div>

                {discount > 0 && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200/50 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                    <span> Customers save {discount}% off MRP!</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Available Stock</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Product Variants (Sizes & Colors) */}
            <section className="space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-black">Product Variants</h3>
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <Ruler className="w-3.5 h-3.5 text-gray-500" /> Available Sizes
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {allSizes.map((size) => {
                    const isSelected = formData.available_sizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-md'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomSize();
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:border-black outline-none"
                    placeholder="Add custom size (e.g. 32 Inches, 42mm) and press enter"
                  />
                  <button
                    type="button"
                    onClick={addCustomSize}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors flex-shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <Palette className="w-3.5 h-3.5 text-gray-500" /> Available Colors
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {allColors.map((color) => {
                    const isSelected = formData.available_colors.includes(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleColor(color)}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all border ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-md'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customColorInput}
                    onChange={(e) => setCustomColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomColor();
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:border-black outline-none"
                    placeholder="Add custom color (e.g. Space Gray, Rose Gold) and press enter"
                  />
                  <button
                    type="button"
                    onClick={addCustomColor}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors flex-shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Physical Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                    <Scale className="w-3.5 h-3.5 text-gray-500" /> Weight
                  </label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:border-black outline-none"
                    placeholder="e.g. 250g, 1.2 kg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Dimensions</label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:border-black outline-none"
                    placeholder="L x W x H (e.g. 15 x 10 x 5 cm)"
                  />
                </div>
              </div>
            </section>

            {/* Section 4: Dynamic Specifications */}
            <section className="space-y-3">
              <div className="border-b border-gray-100 pb-2 flex justify-between items-center">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-black">Specifications</h3>
                <button
                  type="button"
                  onClick={addSpecField}
                  className="text-xs font-bold text-black flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Field
                </button>
              </div>

              <div className="space-y-2.5">
                {specifications.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                      placeholder="Key (e.g. Material)"
                      className="w-1/2 px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:border-black outline-none"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                      placeholder="Value (e.g. 100% Cotton)"
                      className="w-1/2 px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:border-black outline-none"
                    />
                    {specifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSpecField(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: Product Quality Tier */}
            <section className="space-y-3">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-black flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-black" /> Quality Tier
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['Premium Quality', 'Semi Premium Quality', 'Budget Quality'].map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setFormData({ ...formData, quality_tier: tier })}
                    className={`py-3 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                      formData.quality_tier === tier
                        ? 'border-black bg-black text-white shadow-lg shadow-black/10'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tier}
                  </button>
                  ))} 
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Quality Tier Description *</label>
                  <textarea rows={2} value={formData.quality_tier_description} onChange={(e) => setFormData({ ...formData, quality_tier_description: e.target.value })} required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-black outline-none" placeholder="Why does this product fit this category?" />
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Brand Authorisation Letter (If selling a brand's product)</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setBrandAuthFile(e.target.files?.[0] || null)} className="w-full" />
                </div>
              </section>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-900 transition-all transform hover:scale-[1.005] active:scale-[0.99] shadow-xl shadow-black/10 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="w-5 h-5" />
              {isSubmitting ? 'Saving Product...' : 'Publish Product'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
