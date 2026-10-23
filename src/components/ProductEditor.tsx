import { useMemo, useRef, useState } from "react";
import { ImagePlus, IndianRupee, Palette, Plus, Ruler, Save, Scale, ShieldCheck, Trash2, X } from "lucide-react";
import { useVendorFlow } from "../context/VendorFlowContext";

type Specification = { key: string; value: string };

type ProductEditorProps = {
  product: any;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
};

const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "5", "6", "7", "8"];
const colors = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Navy", "Gray", "Beige"];

const imageUrl = (url: string) => url.startsWith("http") ? url : `https://api.thegroome.com${url.startsWith("/") ? "" : "/"}${url}`;

export default function ProductEditor({ product, onSave, onCancel }: ProductEditorProps) {
  const { vendorSettings } = useVendorFlow();
  const imageInput = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [existingImages, setExistingImages] = useState<any[]>(product.images || []);
  const [newImages, setNewImages] = useState<{ file: File; url: string; type: string; name: string }[]>([]);
  const [customSize, setCustomSize] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [brandAuthLetter, setBrandAuthLetter] = useState<File | null>(null);

  const initialMrp =
    product.mrp !== undefined && product.mrp !== null && product.mrp !== "" && Number(product.mrp) > 0
      ? String(product.mrp)
      : product.price !== undefined && product.price !== null && Number(product.price) > 0
      ? String(product.price)
      : "";

  const initialSellingPrice =
    product.selling_price !== undefined && product.selling_price !== null && product.selling_price !== "" && Number(product.selling_price) > 0
      ? String(product.selling_price)
      : product.sellingPrice !== undefined && product.sellingPrice !== null && product.sellingPrice !== "" && Number(product.sellingPrice) > 0
      ? String(product.sellingPrice)
      : product.price !== undefined && product.price !== null && Number(product.price) > 0
      ? String(product.price)
      : "";

  const [form, setForm] = useState({
    product_code: product.product_code || "",
    name: product.name || "",
    brand_name: product.brand_name || "",
    description: product.description || "",
    category_id: product.category_id || "",
    sub_category_id: product.sub_category_id || "",
    mrp: initialMrp,
    selling_price: initialSellingPrice,
    stockQuantity: String(product.stock_quantity ?? product.stockQuantity ?? ""),
    quality_tier: product.quality_tier || "Budget Quality",
    available_sizes: Array.isArray(product.available_sizes) ? product.available_sizes : [],
    available_colors: Array.isArray(product.available_colors) ? product.available_colors : [],
    weight: product.weight || "",
    dimensions: product.dimensions || "",
    hsn_code: product.hsn_code || "",
    gst_percentage: product.gst_percentage || "",
    quality_tier_description: product.quality_tier_description || "",
    status: product.status || "active",
  });
  const [specifications, setSpecifications] = useState<Specification[]>(product.specifications?.length ? product.specifications : [{ key: "", value: "" }]);

    const categoriesList = vendorSettings?.categories || [];
  console.log("Product in editor", product);
    const [categoryPath, setCategoryPath] = useState<string[]>(product.category_hierarchy ? product.category_hierarchy.map((c: any) => c.id) : [product.category_id].filter(Boolean) as string[]);
  
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
    setForm((current) => ({ ...current, category_id: deepestId, sub_category_id: "" }));
  };
  const allSizes = useMemo(() => Array.from(new Set([...sizes, ...form.available_sizes])), [form.available_sizes]);
  const allColors = useMemo(() => Array.from(new Set([...colors, ...form.available_colors])), [form.available_colors]);
  const setField = (field: string, value: unknown) => setForm((current) => ({ ...current, [field]: value }));
  const toggle = (field: "available_sizes" | "available_colors", value: string) => setForm((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item: string) => item !== value) : [...current[field], value] }));
  const addOption = (field: "available_sizes" | "available_colors", value: string, clear: () => void) => {
    const option = value.trim();
    if (option && !form[field].includes(option)) setField(field, [...form[field], option]);
    clear();
  };
  const addFiles = (files: FileList | null) => Array.from(files || []).forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => setNewImages((current) => [...current, { file, url: String(reader.result), type: file.type.startsWith('video') ? 'video' : 'image', name: file.name }]);
    reader.readAsDataURL(file);
  });
  const updateSpecification = (index: number, field: keyof Specification, value: string) => setSpecifications((current) => current.map((spec, itemIndex) => itemIndex === index ? { ...spec, [field]: value } : spec));

  const discount =
    Number(form.mrp) > 0 && Number(form.selling_price) > 0
      ? Math.round(((Number(form.mrp) - Number(form.selling_price)) / Number(form.mrp)) * 100)
      : 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.mrp || !form.selling_price) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        mrp: Number(form.mrp),
        selling_price: Number(form.selling_price),
        price: Number(form.selling_price),
        stockQuantity: Number(form.stockQuantity || 0),
        specifications: specifications.filter((item) => item.key.trim() && item.value.trim()),
        existingImages: existingImages.map((item) => item.image_url),
        images: newImages.map((item) => item.file),
        media_details: JSON.stringify(newImages.map(item => ({ file_name: item.name, media_type: item.type }))),
        ...(brandAuthLetter ? { brand_authorisation_letter: brandAuthLetter } : {}),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">Product catalogue</p><h2 className="text-xl font-bold text-slate-900">Edit product</h2></div><button type="button" onClick={onCancel} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div>
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-2"><h3 className="mb-3 text-sm font-bold text-slate-900">Product images</h3><div className="grid grid-cols-3 gap-3">
          {existingImages.map((image) => <MediaTile key={image.id} src={imageUrl(image.image_url)} isVideo={!!image.image_url.match(/\.(mp4|webm|mov)$/i)} primary={image.is_primary} onRemove={() => setExistingImages((current) => current.filter((item) => item.id !== image.id))} />)}
          {newImages.map((image, index) => <MediaTile key={image.url} src={image.url} isVideo={image.type === 'video'} onRemove={() => setNewImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} />)}
          <button type="button" onClick={() => imageInput.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-200 text-slate-400 transition hover:border-slate-400 hover:bg-slate-50"><ImagePlus className="mx-auto h-6 w-6" /><span className="mt-1 block text-xs font-medium">Add media</span></button>
        </div><input ref={imageInput} type="file" multiple accept="image/*,video/*" onChange={(event) => addFiles(event.target.files)} className="hidden" /></section>

        <section className="space-y-6 lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Product code"><input value={form.product_code} onChange={(e) => setField("product_code", e.target.value.toUpperCase())} placeholder="PRODUCT-01" /></Field><Field label="Brand name"><input value={form.brand_name} onChange={(e) => setField("brand_name", e.target.value)} placeholder="Nike" /></Field></div>
          <Field label="Product name" required><input required value={form.name} onChange={(e) => setField("name", e.target.value)} /></Field>
          <Field label="Description"><textarea rows={3} value={form.description} onChange={(e) => setField("description", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
              {categoryLevels.map((levelCategories, index) => (
                <Field key={index} label={index === 0 ? "Category" : "Sub-category Level " + index}>
                  <select
                    value={categoryPath[index] || ""}
                    onChange={(e) => handleCategorySelect(index, e.target.value)}
                  >
                    <option value="">Choose {index === 0 ? "category" : "sub-category"}</option>
                    {levelCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
              ))}
            </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="MRP" required icon={IndianRupee}>
              <input
                required
                type="number"
                min="0"
                step="any"
                value={form.mrp}
                onChange={(e) => setField("mrp", e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Selling Price" required icon={IndianRupee}>
              <input
                required
                type="number"
                min="0"
                step="any"
                value={form.selling_price}
                onChange={(e) => setField("selling_price", e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="HSN Code">
              <input
                value={form.hsn_code}
                onChange={(e) => setField("hsn_code", e.target.value)}
                placeholder="HSN Code"
              />
            </Field>
            <Field label="GST Percentage">
              <input
                type="number"
                min="0"
                step="any"
                value={form.gst_percentage}
                onChange={(e) => setField("gst_percentage", e.target.value)}
                placeholder="18"
              />
            </Field>
            <Field label="Available stock">
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => setField("stockQuantity", e.target.value)}
                placeholder="0"
              />
            </Field>
          </div>
          {discount > 0 && (
            <div className="rounded-xl border border-emerald-200/50 bg-emerald-50 p-2.5 text-center text-xs font-bold text-emerald-800">
              Customers save {discount}% off MRP!
            </div>
          )}
          {Number(form.selling_price) > Number(form.mrp) && Number(form.mrp) > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-center text-xs font-medium text-amber-800">
              Selling price is higher than MRP.
            </div>
          )}
        </section>

        <section className="space-y-6 lg:col-span-5">
          <div className="grid gap-6 rounded-2xl bg-slate-50 p-5 md:grid-cols-2"><OptionPicker label="Available sizes" icon={Ruler} options={allSizes} selected={form.available_sizes} input={customSize} setInput={setCustomSize} onToggle={(value) => toggle("available_sizes", value)} onAdd={() => addOption("available_sizes", customSize, () => setCustomSize(""))} placeholder="Add custom size" /><OptionPicker label="Available colors" icon={Palette} options={allColors} selected={form.available_colors} input={customColor} setInput={setCustomColor} onToggle={(value) => toggle("available_colors", value)} onAdd={() => addOption("available_colors", customColor, () => setCustomColor(""))} placeholder="Add custom color" /></div>
          <div className="grid gap-4 sm:grid-cols-3"><Field label="Weight" icon={Scale}><input value={form.weight} onChange={(e) => setField("weight", e.target.value)} placeholder="250g" /></Field><Field label="Dimensions"><input value={form.dimensions} onChange={(e) => setField("dimensions", e.target.value)} placeholder="15 × 10 × 10 cm" /></Field><Field label="Status"><select value={form.status} onChange={(e) => setField("status", e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field></div>
          <div><div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><ShieldCheck className="h-4 w-4" /> Specifications</h3><button type="button" onClick={() => setSpecifications((current) => [...current, { key: "", value: "" }])} className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-black"><Plus className="h-4 w-4" /> Add field</button></div><div className="space-y-2">{specifications.map((item, index) => <div key={index} className="flex gap-2"><input value={item.key} onChange={(e) => updateSpecification(index, "key", e.target.value)} placeholder="Material" /><input value={item.value} onChange={(e) => updateSpecification(index, "value", e.target.value)} placeholder="100% Cotton" />{specifications.length > 1 && <button type="button" onClick={() => setSpecifications((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}</div>)}</div></div>
          <div><h3 className="mb-3 text-sm font-bold text-slate-900">Quality tier</h3><div className="grid grid-cols-3 gap-3">{["Premium Quality", "Semi Premium Quality", "Budget Quality"].map((tier) => <button key={tier} type="button" onClick={() => setField("quality_tier", tier)} className={"rounded-xl border px-3 py-3 text-xs font-bold " + (form.quality_tier === tier ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600")}>{tier}</button>)}</div></div>
          <div><Field label="Quality Tier Description" required><textarea rows={2} required value={form.quality_tier_description} onChange={(e) => setField("quality_tier_description", e.target.value)} placeholder="Why does this product fit this category?" /></Field></div>
          <div><Field label="Brand Authorisation Letter"><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setBrandAuthLetter(e.target.files?.[0] || null)} /></Field></div>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="rounded-xl px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={saving} type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save changes"}</button></div>
        </section>
      </form>
    </div>
  );
}

function Field({ label, required, icon: Icon, children }: { label: string; required?: boolean; icon?: any; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-slate-700">{Icon ? <span className="mb-1.5 flex items-center gap-1.5"><Icon className="h-4 w-4" />{label}{required && " *"}</span> : <span className="mb-1.5 block">{label}{required && " *"}</span>}<span className="block [&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-200 [&>input]:bg-slate-50 [&>input]:px-3 [&>input]:py-2.5 [&>textarea]:w-full [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-slate-200 [&>textarea]:bg-slate-50 [&>textarea]:px-3 [&>textarea]:py-2.5 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-slate-200 [&>select]:bg-slate-50 [&>select]:px-3 [&>select]:py-2.5">{children}</span></label>; }
  function MediaTile({ src, isVideo, primary, onRemove }: { src: string; isVideo?: boolean; primary?: boolean; onRemove: () => void }) { return <div className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200">{isVideo ? <video src={src} className="h-full w-full object-cover" /> : <img src={src} alt="Product" className="h-full w-full object-cover" />}{primary && <span className="absolute bottom-0 left-0 right-0 bg-slate-900/80 py-1 text-center text-[10px] font-bold text-white">Primary</span>}<button type="button" onClick={onRemove} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100"><X className="h-3.5 w-3.5" /></button></div>; }
  function ImageTile({ src, primary, onRemove }: { src: string; primary?: boolean; onRemove: () => void }) { return <div className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200"><img src={src} alt="Product" className="h-full w-full object-cover" />{primary && <span className="absolute bottom-0 left-0 right-0 bg-slate-900/80 py-1 text-center text-[10px] font-bold text-white">Primary</span>}<button type="button" onClick={onRemove} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100"><X className="h-3.5 w-3.5" /></button></div>; }
function OptionPicker({ label, icon: Icon, options, selected, input, setInput, onToggle, onAdd, placeholder }: { label: string; icon: typeof Ruler; options: string[]; selected: string[]; input: string; setInput: (value: string) => void; onToggle: (value: string) => void; onAdd: () => void; placeholder: string }) { return <div><p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-800"><Icon className="h-4 w-4" />{label}</p><div className="mb-3 flex flex-wrap gap-2">{options.map((option) => <button key={option} type="button" onClick={() => onToggle(option)} className={"rounded-lg border px-2.5 py-1.5 text-xs font-bold " + (selected.includes(option) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600")}>{option}</button>)}</div><div className="flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }} placeholder={placeholder} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" /><button type="button" onClick={onAdd} className="rounded-lg bg-white px-3 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">Add</button></div></div>; }
