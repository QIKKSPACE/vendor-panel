import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Check,
  X,
  Clock,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  RotateCcw,
  RefreshCw,
  Search,
  AlertCircle,
  IndianRupee,
  Sparkles,
  CheckCircle2,
  XCircle,
  CalendarDays,
  FileText,
} from "lucide-react";
import MobileSliderNav from "./MobileSliderNav";
import { useApi } from "../lib/api";
import { useAuth } from "../context/UserContext";
import { VendorBooking } from "../types";


const resolveImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://api.thegroome.com${url.startsWith("/") ? "" : "/"}${url}`;
};

const formatSlotDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatTimeRange = (startTs?: string, endTs?: string) => {
  if (!startTs && !endTs) return "N/A";
  const formatTime = (ts?: string) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return ts;
    }
  };

  const start = formatTime(startTs);
  const end = formatTime(endTs);
  if (start && end) return `${start} - ${end}`;
  return start || end || "N/A";
};

const getAddressFromMetadata = (metadata: any): string | null => {
  if (!metadata) return null;
  let data = metadata;
  if (typeof metadata === "string") {
    try {
      data = JSON.parse(metadata);
    } catch {
      return metadata;
    }
  }
  if (!data || typeof data !== "object") return String(data || "");

  if (data.address) {
    if (typeof data.address === "string") return data.address;
    if (typeof data.address === "object") {
      const parts = [
        data.address.street,
        data.address.address_line1,
        data.address.landmark,
        data.address.city,
        data.address.state,
        data.address.pincode,
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
  }
  if (data.user_address) return String(data.user_address);
  if (data.location) return String(data.location);
  if (data.address_line1 || data.city) {
    return [data.address_line1, data.address_line2, data.city, data.pincode].filter(Boolean).join(", ");
  }
  return null;
};

const getNotesFromMetadata = (metadata: any): string | null => {
  if (!metadata) return null;
  let data = metadata;
  if (typeof metadata === "string") {
    try {
      data = JSON.parse(metadata);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== "object") return null;
  return data.notes || data.note || data.instructions || data.special_instructions || null;
};

const getStatusBadge = (status: string) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "accepted":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "completed":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "cancelled":
    case "canceled":
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export default function AcceptServiceRequests() {
  const api = useApi();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "completed" | "cancelled">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const vendorId = user?.id || user?.vendorId || user?.vendor_id;
      const res = await api.get("/vendors/service-booking", {
        params: vendorId ? { vendorId } : undefined,
      });
      const data = res.data;

      let list: VendorBooking[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.bookings)) {
        list = data.bookings;
      } else if (data && Array.isArray(data.data)) {
        list = data.data;
      } else if (data && data.data && Array.isArray(data.data.bookings)) {
        list = data.data.bookings;
      }

      setBookings(list);
    } catch (err: any) {
      console.error("Error fetching vendor bookings:", err);
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load bookings";
      setError(errMsg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [api, user]);

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBookings();
  };


  // Accept and Reject buttons placeholder action (does nothing for now)
  const handleAccept = (bookingId: string) => {
    console.log("Accept clicked for booking:", bookingId);
  };

  const handleReject = (bookingId: string) => {
    console.log("Reject clicked for booking:", bookingId);
  };

  // Filter & Search logic
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      const bStatus = (b.status || "").toLowerCase();
      if (filter === "confirmed" && bStatus !== "confirmed") return false;
      if (filter === "pending" && bStatus !== "pending") return false;
      if (filter === "completed" && bStatus !== "completed") return false;
      if (filter === "cancelled" && bStatus !== "cancelled" && bStatus !== "canceled" && bStatus !== "rejected") return false;

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const userName = (b.user_name || "").toLowerCase();
        const userEmail = (b.user_email || "").toLowerCase();
        const userPhone = (b.user_phone || "").toLowerCase();
        const bookingId = (b.id || "").toLowerCase();
        const serviceNames = (b.services || []).map((s) => (s.name || "").toLowerCase()).join(" ");

        const matches =
          userName.includes(query) ||
          userEmail.includes(query) ||
          userPhone.includes(query) ||
          bookingId.includes(query) ||
          serviceNames.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [bookings, filter, searchTerm]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => (b.status || "").toLowerCase() === "confirmed").length;
    const pending = bookings.filter((b) => (b.status || "").toLowerCase() === "pending").length;
    const totalRevenue = bookings.reduce((sum, b) => {
      const bTotal = (b.services || []).reduce((sAcc, s) => sAcc + (Number(s.price) || 0), 0);
      return sum + bTotal;
    }, 0);

    return { total, confirmed, pending, totalRevenue };
  }, [bookings]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <MobileSliderNav />

      <main className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Service Management</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Service Orders & Bookings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage client appointments, booked services, and schedules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Bookings</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Confirmed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.confirmed}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Booked Revenue</p>
            <p className="mt-1 flex items-center text-2xl font-bold text-slate-900">
              <IndianRupee className="h-5 w-5" />
              {stats.totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>
        </section>

        {/* Filters & Search */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, phone, or service..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 shadow-sm"
            >
            </input>
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-200/70 p-1">
            {(
              [
                { id: "all", label: "All" },
                { id: "confirmed", label: "Confirmed" },
                { id: "pending", label: "Pending" },
                { id: "completed", label: "Completed" },
                { id: "cancelled", label: "Cancelled" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filter === tab.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="h-6 w-20 rounded-full bg-slate-200" />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-20 rounded-xl bg-slate-100" />
                  <div className="h-20 rounded-xl bg-slate-100" />
                  <div className="h-20 rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-white py-14 px-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Failed to Load Bookings</h3>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              {error}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing || loading ? "animate-spin" : ""}`} />
                Retry
              </button>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-semibold text-slate-800">No service bookings found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchTerm
                ? "No bookings match your search query."
                : filter !== "all"
                ? `No ${filter} service bookings available.`
                : "No customer bookings have been received yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredBookings.map((booking) => {
              const bookingTotal = (booking.services || []).reduce(
                (sum, s) => sum + (Number(s.price) || 0),
                0
              );
              const address = getAddressFromMetadata(booking.metadata);
              const notes = getNotesFromMetadata(booking.metadata);

              return (
                <article
                  key={booking.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                >
                  {/* Top Row: Booking ID, Badges, Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-800">
                        #BK-{booking.id.slice(0, 8).toUpperCase()}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${getStatusBadge(
                          booking.status
                        )}`}
                      >
                        {booking.status || "CONFIRMED"}
                      </span>

                      {booking.is_reschedule && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                          <RotateCcw className="h-3 w-3" /> Rescheduled
                        </span>
                      )}

                      {booking.employee_slot && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          Slot #{booking.employee_slot}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatSlotDate(booking.slot_date)}</span>
                      <span>•</span>
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatTimeRange(booking.start_ts, booking.end_ts)}</span>
                    </div>
                  </div>

                  {/* Middle Section: Customer & Schedule Cards */}
                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Customer Information */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        <User className="h-3.5 w-3.5" />
                        Customer Details
                      </div>

                      <p className="font-semibold text-slate-900 text-sm">
                        {booking.user_name || "Guest Customer"}
                      </p>

                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        {booking.user_phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <a
                              href={`tel:${booking.user_phone}`}
                              className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                            >
                              {booking.user_phone}
                            </a>
                          </div>
                        ) : null}

                        {booking.user_email ? (
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <a
                              href={`mailto:${booking.user_email}`}
                              className="truncate text-slate-600 hover:underline"
                            >
                              {booking.user_email}
                            </a>
                          </div>
                        ) : null}
                      </div>

                      {address && (
                        <div className="mt-2.5 flex items-start gap-2 border-t border-slate-200/70 pt-2 text-xs text-slate-600">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                          <span className="leading-snug">{address}</span>
                        </div>
                      )}
                    </div>

                    {/* Schedule & Policy */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        <Clock className="h-3.5 w-3.5" />
                        Appointment Time
                      </div>

                      <p className="font-semibold text-slate-900 text-sm">
                        {formatSlotDate(booking.slot_date)}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-600">
                        {formatTimeRange(booking.start_ts, booking.end_ts)}
                      </p>

                      {booking.can_reschedule !== undefined && (
                        <div className="mt-3 border-t border-slate-200/70 pt-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              booking.can_reschedule ? "text-emerald-700" : "text-slate-500"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                booking.can_reschedule ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            {booking.can_reschedule
                              ? "Eligible to reschedule (>24h window)"
                              : "Reschedule window closed"}
                          </span>
                        </div>
                      )}

                      {notes && (
                        <div className="mt-2 text-xs text-slate-600 border-t border-slate-200/70 pt-2 flex items-start gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="italic">"{notes}"</span>
                        </div>
                      )}
                    </div>

                    {/* Booking Price & Total */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                          <IndianRupee className="h-3.5 w-3.5" />
                          Payment & Services
                        </div>
                        <p className="text-xs text-slate-500">
                          {booking.services?.length || 0}{" "}
                          {(booking.services?.length || 0) === 1 ? "service" : "services"} included
                        </p>
                      </div>

                      <div className="mt-3 border-t border-slate-200/70 pt-2">
                        <p className="text-xs text-slate-500">Total Booking Value</p>
                        <p className="flex items-center text-xl font-bold text-slate-900">
                          <IndianRupee className="h-4 w-4" />
                          {bookingTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Services List */}
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      Booked Services
                    </p>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(booking.services || []).map((service) => {
                        const primaryImg = service.service_images?.[0]?.image_url;
                        const priceNum = Number(service.price) || 0;

                        return (
                          <div
                            key={service.id}
                            className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-xs"
                          >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                              {primaryImg ? (
                                <img
                                  src={resolveImageUrl(primaryImg)}
                                  alt={service.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Sparkles className="h-5 w-5 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-sm font-semibold text-slate-900">
                                {service.name}
                              </h4>
                              {service.description && (
                                <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                  {service.description}
                                </p>
                              )}
                              <p className="mt-1 flex items-center text-xs font-bold text-slate-800">
                                <IndianRupee className="h-3 w-3" />
                                {priceNum.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions: Reject and Accept Buttons */}
                  <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => handleReject(booking.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 hover:border-rose-300 shadow-xs"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAccept(booking.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-sm"
                    >
                      <Check className="h-4 w-4" />
                      Accept
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
