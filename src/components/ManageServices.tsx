import { useState } from "react";
import { Plus, Pencil, Trash2, DollarSign, ImagePlus, X, IndianRupee } from "lucide-react";
import MobileSliderNav from "../components/MobileSliderNav";
import { useServiceContext } from "../context/ServiceContext";
import { useVendorFlow } from "../context/VendorFlowContext";

export default function ManageServices() {
  const { services, loading, addService, updateService, deleteService } = useServiceContext();
  const { vendorSettings } = useVendorFlow();

  const [editingService, setEditingService] = useState<string | null>(null);
  const [showServiceForm, setShowServiceForm] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    category_id: "",
    name: "",
    description: "",
    price: "",
    discount: "",
    duration_minutes: "",
    images: [] as File[],
    previewImages: [] as string[],
    quality_tier: "Budget Quality", // Added state mapping for quality tiers

  });

  /** ---------------- IMAGE UPLOAD HANDLER ---------------- */
  const addImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = [...serviceForm.images];
    const newPreview = [...serviceForm.previewImages];

    for (const file of files) {
      newFiles.push(file);
      newPreview.push(URL.createObjectURL(file));
    }

    setServiceForm({ ...serviceForm, images: newFiles, previewImages: newPreview });
  };

  const removeImage = (index: number) => {
    const updatedFiles = [...serviceForm.images];
    const updatedPreview = [...serviceForm.previewImages];
    updatedFiles.splice(index, 1);
    updatedPreview.splice(index, 1);

    setServiceForm({
      ...serviceForm,
      images: updatedFiles,
      previewImages: updatedPreview,
    });
  };

  /** ---------------- SUBMIT SERVICE ---------------- */
  const submitService = async () => {
    if (!serviceForm.name || !serviceForm.price)
      return alert("Required fields missing");

    const formData = new FormData();
    formData.append("category_id", serviceForm.category_id);
    formData.append("name", serviceForm.name);
    formData.append("description", serviceForm.description);
    formData.append("price", serviceForm.price);
    formData.append("discount_price", serviceForm.discount);
    formData.append("duration_minutes", serviceForm.duration_minutes);
    formData.append("quality_tier", serviceForm.quality_tier);


    // append images as files
    serviceForm.images.forEach((file) => {
      formData.append("images", file);
    });

    if (editingService) {
      await updateService(editingService, formData);
      setEditingService(null);
    } else {
      await addService(formData);
    }

    resetForm();
  };

const resetForm = () => {
  setServiceForm({
    category_id: "",
    name: "",
    description: "",
    price: "",
    discount: "",
    duration_minutes: "60",
    images: [],
    previewImages: [],
    quality_tier: "Budget Quality", // Added state mapping for quality tiers

  });

  setShowServiceForm(false);
};

  /** ---------------- EDIT SERVICE ---------------- */
  const startEdit = (service: any) => {
  setEditingService(service.id);

  setServiceForm({
    category_id: String(service.category_id || ""),
    name: service.name,
    description: service.description || "",
    price: String(service.price),
    discount: service.discount_price
      ? String(service.discount_price)
      : "",
    duration_minutes: String(service.duration_minutes),
    images: [],
    previewImages: service.images || [],
    quality_tier: "Budget Quality", // Added state mapping for quality tiers

  });

  setShowServiceForm(true);
};

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-4xl mx-auto">
      <MobileSliderNav />
      <h2 className="text-2xl font-semibold mb-6 text-gray-900">Manage Services</h2>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Services</h3>
        <button
          onClick={() => setShowServiceForm(!showServiceForm)}
          className="flex items-center gap-2 text-sm bg-black text-white px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* SERVICE FORM */}
      {showServiceForm && (
        <div className="border rounded-lg p-4 mb-6 space-y-4">
          {/* Name + Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="border p-2 rounded-lg"
              placeholder="Service Name *"
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
            />

            <input
              className="border p-2 rounded-lg"
              placeholder="Price *"
              type="number"
              value={serviceForm.price}
              onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
            />
          </div>

          {/* Discount + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="border p-2 rounded-lg"
              placeholder="Discount (Optional)"
              type="number"
              value={serviceForm.discount}
              onChange={(e) => setServiceForm({ ...serviceForm, discount: e.target.value })}
            />

            <input
              className="border p-2 rounded-lg"
              placeholder="Duration (min)"
              type="number"
              value={serviceForm.duration_minutes}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, duration_minutes: e.target.value })
              }
            />
          </div>
         <select
  className="border p-2 rounded-lg w-full"
  value={serviceForm.category_id}
  onChange={(e) =>
    setServiceForm({
      ...serviceForm,
      category_id: e.target.value,
    })
  }
>
  <option value="">Select Service Category</option>

  {vendorSettings?.services?.map((service) => (
    <option key={service.id} value={service.id}>
      {service.name}
    </option>
  ))}
</select>
          {/* Description */}
          <textarea
            className="border p-2 rounded-lg w-full"
            placeholder="Description"
            value={serviceForm.description}
            onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
          />

          {/* Image Upload */}
          <div>
             <section className="space-y-3">
            
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quality Tier</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Premium Quality', 'Semi Premium Quality', 'Budget Quality'].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setServiceForm({ ...serviceForm, quality_tier: tier })}
                      className={`py-3 px-4 text-xs font-bold rounded-xl border text-center transition-all ${
                        serviceForm.quality_tier === tier
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
            <label className="text-sm text-gray-700 mb-2 flex gap-2 items-center">
              <ImagePlus size={18} /> Service Images (Multiple Allowed)
            </label>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={addImages}
              className="border p-2 rounded-lg w-full cursor-pointer"
            />
  <div className="mt-4 bg-gray-50 border-l-4 border-black p-3 rounded-r-xl text-xs text-gray-600 font-medium">
              💡 select Aspect ratio 3/4 or image 1080*1920 px for best result
            </div>
            {/* Preview Images */}
            <div className="flex flex-wrap gap-3 mt-3">
              {serviceForm.previewImages.map((img, index) => (
                <div key={index} className="relative w-20 h-20">
                  <img  src={`https://api.thegroome.com${img.image_url}`} className="w-full h-full object-cover rounded-lg" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            
          </div>

          {/* Submit */}
          <button
            onClick={submitService}
            className="mt-4 w-full bg-black text-white py-3 rounded-lg hover:opacity-90"
          >
            {editingService ? "Update Service" : "Save Service"}
          </button>
        </div>
      )}

      {/* SERVICES LIST */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading...</p>
      ) : services.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">No services added yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {services.map((s) => (
            <div key={s.id} className="border rounded-lg p-4 space-y-2">
              {s.images?.length > 0 && (
                <img src={`https://api.thegroome.com${s?.images[0]?.image_url}`} className="w-full h-32 object-cover rounded-lg" />
              )}

              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-800">{s.name}</h4>
                <div className="flex gap-3">
                  <Pencil size={16} className="cursor-pointer" onClick={() => startEdit(s)} />
                  <Trash2
                    size={16}
                    className="cursor-pointer text-red-600"
                    onClick={() => deleteService(s.id)}
                  />
                </div>
              </div>
 
              <p className="text-sm text-gray-500">{s.description}</p>

              <p className="text-black font-semibold flex items-center gap-1">
                <IndianRupee size={16} />
                {s.discount ? (
                  <>
                    <span className="line-through text-gray-400">{s.price}</span>
                    <span className="text-green-600">{s.discount}</span>
                  </>
                ) : (
                  s.price
                )}
              </p>

              <span className="text-xs text-gray-500">{s.duration_minutes} min</span>
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
