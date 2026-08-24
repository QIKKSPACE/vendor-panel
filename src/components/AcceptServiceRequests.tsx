import { useState } from "react";
import { Check, X, Clock, Users, MapPin, Calendar } from "lucide-react";
import MobileSliderNav from '../components/MobileSliderNav';
import SidebarNav from "./SidebarNav";

// ---------- TYPES ----------
export interface ServiceRequest {
  id: string;
  serviceName: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  requestDate: string;
  slotDate?: string;
  slotTime?: string;
  status: "pending" | "accepted" | "rejected" | "completed";
}

// ---------- PAGE COMPONENT ----------
export default function ServiceRequestPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([
    {
      id: "abc12345",
      serviceName: "Home Cleaning",
      customerName: "Rahul Sharma",
      customerPhone: "9876543210",
      customerAddress: "Gandhi Nagar, Delhi, 110008",
      requestDate: new Date().toISOString(),
      slotDate: "2025-11-22",
      slotTime: "10:00 AM - 12:00 PM",
      status: "pending",
    },
    {
      id: "xyz76902",
      serviceName: "Hair Spa",
      customerName: "Priya Singh",
      requestDate: new Date().toISOString(),
      status: "accepted",
    },
  ]);

  const updateRequestStatus = (id: string, status: "accepted" | "rejected" | "completed") => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <AcceptServiceRequests
          requests={requests}
          onUpdateRequestStatus={updateRequestStatus}
        />
      </div>
    </div>
  );
}

// ---------- ORIGINAL COMPONENT ----------
interface AcceptServiceRequestsProps {
  requests: ServiceRequest[];
  onUpdateRequestStatus: (requestId: string, status: "accepted" | "rejected" | "completed") => void;
}

function AcceptServiceRequests({ requests, onUpdateRequestStatus }: AcceptServiceRequestsProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "accepted">("pending");

  const filteredRequests = requests.filter((request) => {
    if (filter === "all") return true;
    return request.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-green-100 text-green-800",
    };
    return badges[status as keyof typeof badges] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
     <SidebarNav />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 mt-10">
        <h2 className="text-2xl font-semibold text-gray-800">Accept Service Requests</h2>
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "accepted"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                filter === tab ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            No {filter !== "all" ? filter : ""} service requests found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{request.serviceName}</h3>
                  <p className="text-sm text-gray-500 mt-1">Request #{request.id.slice(0, 8)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                  {request.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium text-gray-800">{request.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium text-gray-800">{request.customerPhone || "N/A"}</p>
                </div>
              </div>

              {request.slotDate && request.slotTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-800">Service Schedule</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-blue-600">Date</p>
                      <p className="font-medium text-blue-900">
                        {new Date(request.slotDate + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-600">Time Slot</p>
                      <p className="font-medium text-blue-900">{request.slotTime}</p>
                    </div>
                  </div>
                </div>
              )}

              {request.customerAddress && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Customer Address</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{request.customerAddress}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Clock className="w-4 h-4" />
                <span>Requested: {new Date(request.requestDate).toLocaleString()}</span>
              </div>

              {request.status === "pending" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => onUpdateRequestStatus(request.id, "accepted")}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Check className="w-4 h-4" /> Accept
                  </button>

                  <button
                    onClick={() => onUpdateRequestStatus(request.id, "rejected")}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}

              {request.status === "accepted" && (
                <button
                  onClick={() => onUpdateRequestStatus(request.id, "completed")}
                  className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-4 h-4" /> Mark as Completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
