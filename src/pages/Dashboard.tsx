import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileSliderNav from "../components/MobileSliderNav";
import { useVendorFlow } from "../context/VendorFlowContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { vendorSettings } = useVendorFlow();
 
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <MobileSliderNav />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Your main dashboard content goes here */}
        <h1 className="text-2xl font-semibold">Welcome to your Dashboard</h1>
      </div>

      {/* ❗ Modal if vendorSettings is null */}
      {vendorSettings?.vendorSettings === null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-8 w-96 text-center">
            <h2 className="text-xl font-bold mb-4">Complete Shop Timing</h2>
            <p className="mb-6 text-gray-700">
              Please complete your shop timings to start using the dashboard.
            </p>
            <button
              onClick={() => navigate("/services/slots")}
              className="bg-black text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 transition"
            >
              Set Shop Timings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
