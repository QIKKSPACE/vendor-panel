import React, { useState, useEffect, useRef } from "react";
import { Edit, Plus, Loader2, Trash2, Clock } from "lucide-react";
import { useApi } from "../lib/api";

interface CategoryOrService {
  id: string | number;
  name: string;
}

interface VendorData {
  id: string;
  name: string;
  business_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  delivery_radius_km: number;
  profile_image: string | null;
  latitude: number | null;
  longitude: number | null;
  categories: CategoryOrService[];
  services: CategoryOrService[];
  why_choose_us?: string[];
  // 🆕 Appointment Delay Fields added to type definitions
  is_delay_active?: boolean;
  delay_time_minutes?: number;
}

const VendorProfile: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const api = useApi();
  
  // Editable fields local state
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Tracking "Why Choose Us" features
  const [whyChooseUs, setWhyChooseUs] = useState<string[]>([]);

  // 🆕 Appointment Delay System states
  const [isDelayActive, setIsDelayActive] = useState<boolean>(false);
  const [delayTime, setDelayTime] = useState<string>("0");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Vendor Profile Data
  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        const response = await api.get("vendors/");
        console.log("Raw vendor API response:", response);
        
        if (response?.data?.success) {
          const fetchedVendor = response?.data?.vendor || null;
          setVendor(fetchedVendor);
          setRadiusKm(fetchedVendor?.delivery_radius_km || 5);
          setLatitude(fetchedVendor?.latitude);
          setLongitude(fetchedVendor?.longitude);
          setImagePreview(`https://api.thegroome.com${fetchedVendor?.profile_image}`);
          
          // Hydrate the "Why Choose Us" array safely
          if (fetchedVendor?.why_choose_us && Array.isArray(fetchedVendor.why_choose_us)) {
            setWhyChooseUs(fetchedVendor.why_choose_us);
          } else {
            setWhyChooseUs([""]); 
          }

          // 🆕 Hydrate Appointment Delay values from API response payload
          setIsDelayActive(!!fetchedVendor?.is_delay_active);
          setDelayTime(String(fetchedVendor?.delay_time_minutes || 0));
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error);
        alert("Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, []);

  // Get Current Geolocation Coordinates
  const handleLocateShop = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        alert("Location updated successfully with current coordinates!");
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please check browser permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Profile Image Selection Handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // State array mutations handlers
  const handleAddReason = () => {
    setWhyChooseUs([...whyChooseUs, ""]);
  };

  const handleRemoveReason = (indexToRemove: number) => {
    const filtered = whyChooseUs.filter((_, idx) => idx !== indexToRemove);
    setWhyChooseUs(filtered.length === 0 ? [""] : filtered);
  };

  const handleReasonValueChange = (index: number, textValue: string) => {
    const updatedReasons = [...whyChooseUs];
    updatedReasons[index] = textValue;
    setWhyChooseUs(updatedReasons);
  };

  // Submit Updated Fields
  const handleConfirmChanges = async () => {
    if (!vendor) return;

    try {
      setUpdating(true);

      const formData = new FormData();
      formData.append("delivery_radius_km", String(radiusKm));
      if (latitude !== null) formData.append("latitude", String(latitude));
      if (longitude !== null) formData.append("longitude", String(longitude));
      
      // 🆕 Appending new configurations to request payload parameters
      formData.append("is_delay_active", String(isDelayActive));
      formData.append("delay_time_minutes", String(Number(delayTime) || 0));

      if (imageFile) {
        formData.append("profile_image", imageFile);
      }

      // Clean empty parameters and append list elements
      const cleanReasons = whyChooseUs.map(val => val.trim()).filter(val => val !== "");
      cleanReasons.forEach((reason) => {
        formData.append("why_choose_us[]", reason);
      });

      await api.put(`vendors/updateVendor/${vendor.id}/`, formData);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to save changes.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-600" size={32} />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-10 text-gray-500">
        No vendor profile data found.
      </div>
    );
  }

  const structuralAddress = `${vendor.address || ""}, ${vendor.city || ""}, ${vendor.state || ""} - ${vendor.pincode || ""}`;

  return (
    <div className="w-full max-w-3xl mx-auto py-10 px-6">
      {/* Header */}
      <h2 className="text-2xl font-semibold text-black mb-8">Vendor Profile</h2>

      {/* Profile Image Element */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          <div className="w-32 h-32 rounded-full bg-white border border-black flex items-center justify-center overflow-hidden">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-sm">No Image</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile image"
            className="absolute bottom-0 right-0 -mb-1 -mr-1 w-9 h-9 rounded-full bg-black text-white flex items-center justify-center border-2 border-white hover:bg-gray-800 transition"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Read-only Vendor Details View */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadonlyField label="Store Name" value={vendor.business_name} />
          <ReadonlyField label="Owner Name" value={vendor.name} />
          <ReadonlyField label="Phone Number" value={vendor.phone} />
          <ReadonlyField label="Email" value={vendor.email} />
          
          <div className="sm:col-span-2">
            <label className="text-sm text-gray-600 block mb-1">Address</label>
            <textarea
              readOnly
              value={structuralAddress}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm resize-none bg-gray-50 text-gray-500 outline-none"
              rows={2}
            />
          </div>
        </div>

        {/* Dynamic Location coordinates metadata indicators */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div>
            <span className="font-medium text-gray-600">Latitude:</span>{" "}
            {latitude !== null ? latitude.toFixed(6) : "Not Configured"}
          </div>
          <div>
            <span className="font-medium text-gray-600">Longitude:</span>{" "}
            {longitude !== null ? longitude.toFixed(6) : "Not Configured"}
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-md font-semibold text-gray-900">Why Choose Us</h3>
              <p className="text-xs text-gray-500">Highlight key store benefits, highlights, or configurations for customers</p>
            </div>
            <button
              type="button"
              onClick={handleAddReason}
              className="flex items-center gap-1 text-xs font-medium border border-black px-2.5 py-1.5 rounded-md hover:bg-black hover:text-white transition"
            >
              <Plus size={14} /> Add Feature
            </button>
          </div>

          <div className="space-y-3">
            {whyChooseUs.map((reason, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => handleReasonValueChange(index, e.target.value)}
                  placeholder="e.g. 10+ years experience, Certified organic hair products..."
                  className="flex-1 border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveReason(index)}
                  disabled={whyChooseUs.length === 1 && reason === ""}
                  className="p-3 text-gray-400 hover:text-red-600 disabled:opacity-40 disabled:hover:text-gray-400 transition"
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 🆕 Appointment Delay System Section */}
        <div className="border-t border-gray-100 pt-6">
          <div className="mb-4">
            <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={18} className="text-gray-700" /> Appointment Delay System
            </h3>
            <p className="text-xs text-gray-500">Inform customers if operations are running slightly behind schedule today</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <label htmlFor="delay-status" className="text-xs font-medium text-gray-600 block mb-1">
                Delay Status
              </label>
              <select
                id="delay-status"
                value={isDelayActive ? "active" : "deactivate"}
                onChange={(e) => setIsDelayActive(e.target.value === "active")}
                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition cursor-pointer"
              >
                <option value="deactivate">Deactivate</option>
                <option value="active">Activate</option>
              </select>
            </div>

            <div>
              <label htmlFor="delay-time" className="text-xs font-medium text-gray-600 block mb-1">
                Usual Delay Time (Minutes)
              </label>
              <input
                id="delay-time"
                type="number"
                min={0}
                disabled={!isDelayActive}
                value={delayTime}
                onChange={(e) => setDelayTime(e.target.value)}
                placeholder="e.g. 15"
                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Locate Shop Actions & Radius Control Picker */}
        <div className="border-t border-gray-100 pt-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <button
              type="button"
              onClick={handleLocateShop}
              className="w-full sm:w-auto border border-black px-5 py-3 text-black rounded-lg flex items-center justify-center gap-2 hover:bg-black hover:text-white transition font-medium text-sm"
            >
              <Edit size={16} /> Locate My Shop
            </button>

            <div className="w-full sm:w-1/2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-600">Delivery Radius</label>
                <span className="text-sm font-medium text-gray-800">{radiusKm} km</span>
              </div>

              <input
                type="range"
                min={1}
                max={50}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none bg-gray-200 accent-black cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>
          </div>

          {/* Finalize Form Mutation Event Action */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleConfirmChanges}
              disabled={updating}
              className="w-full bg-black text-white px-4 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating && <Loader2 className="animate-spin" size={16} />}
              Confirm Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReadonlyField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <label className="text-sm text-gray-600 block mb-1">{label}</label>
    <input
      readOnly
      value={value || ""}
      className="border border-gray-300 rounded-lg p-3 w-full bg-gray-50 text-gray-500 outline-none text-sm"
    />
  </div>
);

export default VendorProfile;