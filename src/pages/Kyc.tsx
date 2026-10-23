import React, { useState, useRef, useEffect } from "react";
import Navigation from '../components/Navigation';
import MobileSliderNav from '../components/MobileSliderNav';
import { Upload, X, ShieldCheck, CreditCard, Building2, User, FileText, ImagePlus, Info, Wallet, Clock, CheckCircle2, AlertCircle, Edit2, Loader2 } from "lucide-react";
import { useApi } from "../lib/api";

export default function Kyc() {
  const api = useApi();
  const [form, setForm] = useState({
    accountNumber: "",
    accountName: "",
    ifsc: "",
    panNumber: "",
    documentType: "AADHAR_CARD",
  });

  const [panImage, setPanImage] = useState<File | null>(null);
  const [docFrontImage, setDocFrontImage] = useState<File | null>(null);
  const [docBackImage, setDocBackImage] = useState<File | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kycData, setKycData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const panInputRef = useRef<HTMLInputElement>(null);
  const docFrontInputRef = useRef<HTMLInputElement>(null);
  const docBackInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchKyc();
  }, []);

  const fetchKyc = async () => {
    try {
      const res = await api.get('/kyc/');
      if (res.data.kyc) {
        const data = res.data.kyc;
        setKycData(data);
        setForm({
          accountName: data.account_holder_name || "",
          accountNumber: data.account_number || "",
          ifsc: data.ifsc || "",
          panNumber: data.pan_number || "",
          documentType: data.document_type || "AADHAR_CARD",
        });
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Error fetching KYC:", error);
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const setField = (field: string, value: string) => {
    setForm((curr) => ({ ...curr, [field]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formData = new FormData();
      formData.append("account_holder_name", form.accountName);
      formData.append("account_number", form.accountNumber);
      formData.append("ifsc", form.ifsc);
      formData.append("pan_number", form.panNumber);
      formData.append("document_type", form.documentType);
      formData.append("other_type", "VENDOR");
      
      if (panImage) formData.append("pan_image", panImage);
      if (docFrontImage) formData.append("document_front", docFrontImage);
      if (docBackImage) formData.append("document_back", docBackImage);

      const response = await api.post("/kyc/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        alert("KYC details submitted successfully!");
        setPanImage(null);
        setDocFrontImage(null);
        setDocBackImage(null);
        await fetchKyc(); 
      } else {
        alert(response.data.message || "Failed to submit KYC");
      }
    } catch (error: any) {
      console.error("KYC submission error:", error);
      alert(error.response?.data?.message || "An error occurred while submitting KYC");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <MobileSliderNav />
  
    <div className="flex-1 mx-auto max-w-4xl px-4 py-8 pt-24 lg:pt-12">
        <div className="mb-8 mt-10 lg:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
                KYC Verification
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Please provide your bank and identity details to complete your KYC process and receive payouts.
              </p>
            </div>
            {kycData && kycData.status === 'VERIFIED' && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 border border-emerald-100 shadow-sm">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-emerald-700">Wallet Activated</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex py-20 justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : !isEditing && kycData ? (
          <div className="space-y-6">
            {/* Status Banners */}
            {kycData.status === 'PENDING' && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-4">
                <Clock className="h-6 w-6 text-amber-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-amber-800">Review in Progress</h3>
                  <p className="mt-1 text-sm text-amber-700">Your KYC details have been submitted and are currently under review. This process usually takes 1-2 business days.</p>
                </div>
              </div>
            )}
            
            {kycData.status === 'VERIFIED' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-800">KYC Verified</h3>
                  <p className="mt-1 text-sm text-emerald-700">Your identity and bank details have been successfully verified. You are now eligible to receive payouts to your wallet.</p>
                </div>
              </div>
            )}

            {kycData.status === 'REJECTED' && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                <div className="flex items-start gap-4 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-red-800">KYC Rejected</h3>
                    <p className="mt-1 text-sm text-red-700">Unfortunately, your KYC submission was rejected.</p>
                    <p className="mt-2 text-sm font-medium text-red-800 bg-red-100 p-3 rounded-lg border border-red-200">
                      <strong>Reason: </strong>{kycData.rejection_reason || "Invalid or unreadable documents."}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end border-t border-red-200 pt-4">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit & Resubmit
                  </button>
                </div>
              </div>
            )}

            {/* Read Only Details */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-6 text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Submitted Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Holder</p>
                  <p className="font-semibold text-slate-800">{kycData.account_holder_name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Number</p>
                  <p className="font-semibold text-slate-800">•••• {kycData.account_number.slice(-4)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bank IFSC</p>
                  <p className="font-semibold text-slate-800">{kycData.ifsc}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">PAN Number</p>
                  <p className="font-semibold text-slate-800">{kycData.pan_number}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Document Type</p>
                  <p className="font-semibold text-slate-800">{kycData.document_type.replace('_', ' ')}</p>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-8">
            {/* BANK DETAILS */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                <Building2 className="h-5 w-5 text-slate-400" />
                Bank Details
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Account Holder Name</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      required
                      value={form.accountName}
                      onChange={(e) => setField("accountName", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-black focus:bg-white"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Account Number</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <CreditCard className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      required
                      value={form.accountNumber}
                      onChange={(e) => setField("accountNumber", e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-black focus:bg-white"
                      placeholder="1234567890"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Bank IFSC Code</label>
                  <input
                    required
                    value={form.ifsc}
                    onChange={(e) => setField("ifsc", e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
                    placeholder="SBIN0001234"
                  />
                </div>
              </div>
            </section>

            {/* PAN DETAILS */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                <FileText className="h-5 w-5 text-slate-400" />
                PAN Card Details
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">PAN Number</label>
                  <input
                    required
                    value={form.panNumber}
                    onChange={(e) => setField("panNumber", e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Upload PAN Image</label>
                  <input
                    ref={panInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPanImage(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="flex gap-4">
                    {panImage && (
                      <div className="relative aspect-[3/2] w-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        <img src={URL.createObjectURL(panImage)} alt="PAN" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPanImage(null)}
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-600 shadow-sm"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {!panImage && (
                      <button
                        type="button"
                        onClick={() => panInputRef.current?.click()}
                        className="flex h-24 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-400 hover:bg-slate-50"
                      >
                        <div className="text-center">
                          <Upload className="mx-auto h-5 w-5 mb-1" />
                          <span className="text-xs font-medium">Click to upload</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* KYC DOCUMENT */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                <ShieldCheck className="h-5 w-5 text-slate-400" />
                Identity Document
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="col-span-full">
                  <label className="mb-2 block text-sm font-bold text-slate-700">Select Document Type</label>
                  <select
                    value={form.documentType}
                    onChange={(e) => setField("documentType", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
                  >
                    <option value="AADHAR_CARD">Aadhar Card</option>
                    <option value="DRIVER_LICENCE">Driver's Licence</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                  {form.documentType === "AADHAR_CARD" && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50/50 p-3.5 text-sm text-blue-700 border border-blue-100">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <p><strong>Special Note:</strong> When uploading an Aadhar Card, please make sure to attach both the <strong>Front</strong> and <strong>Back</strong> images.</p>
                    </div>
                  )}
                </div>
                
                <div className="col-span-full sm:col-span-1">
                  <label className="mb-2 block text-sm font-bold text-slate-700">Attach Card Front Image</label>
                  <input
                    ref={docFrontInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDocFrontImage(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="flex gap-4">
                    {docFrontImage && (
                      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        <img src={URL.createObjectURL(docFrontImage)} alt="Doc Front" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setDocFrontImage(null)}
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-600 shadow-sm"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {!docFrontImage && (
                      <button
                        type="button"
                        onClick={() => docFrontInputRef.current?.click()}
                        className="flex h-32 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-400 hover:bg-slate-50"
                      >
                        <div className="text-center">
                          <ImagePlus className="mx-auto h-5 w-5 mb-1" />
                          <span className="text-xs font-medium">Add Front Image</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                <div className="col-span-full sm:col-span-1">
                  <label className="mb-2 block text-sm font-bold text-slate-700">Attach Card Back Image</label>
                  <input
                    ref={docBackInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDocBackImage(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="flex gap-4">
                    {docBackImage && (
                      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        <img src={URL.createObjectURL(docBackImage)} alt="Doc Back" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setDocBackImage(null)}
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-slate-600 shadow-sm"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {!docBackImage && (
                      <button
                        type="button"
                        onClick={() => docBackInputRef.current?.click()}
                        className="flex h-32 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-400 hover:bg-slate-50"
                      >
                        <div className="text-center">
                          <ImagePlus className="mx-auto h-5 w-5 mb-1" />
                          <span className="text-xs font-medium">Add Back Image</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-end border-t border-slate-200 pt-6">
              {kycData && kycData.status === 'REJECTED' && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="mr-4 rounded-xl border border-slate-200 px-8 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving || !panImage || !docFrontImage || (form.documentType === "AADHAR_CARD" && !docBackImage)}
                className="rounded-xl bg-black px-8 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Submit KYC"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
