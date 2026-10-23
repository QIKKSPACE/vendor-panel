import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock3, PackageCheck, ShoppingBag } from "lucide-react";
import MobileSliderNav from "../components/MobileSliderNav";
import { useVendorFlow } from "../context/VendorFlowContext";
import { useNavigate } from "react-router-dom";

type Period = "Weekly" | "Monthly" | "Yearly";

const chartData: Record<Period, { labels: string[]; values: number[]; orders: string; revenue: string }> = {
  Weekly: { labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], values: [18, 32, 24, 46, 38, 56, 49], orders: "263", revenue: "₹42,680" },
  Monthly: { labels: ["Week 1", "Week 2", "Week 3", "Week 4"], values: [142, 188, 164, 226], orders: "720", revenue: "₹1,18,450" },
  Yearly: { labels: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"], values: [540, 720, 650, 910, 820, 1080], orders: "8,126", revenue: "₹12.6L" },
};

const recentOrders = [
  { id: "#ORD-1048", customer: "Aarav Sharma", amount: "₹1,249", status: "Delivered" },
  { id: "#ORD-1047", customer: "Meera Patel", amount: "₹899", status: "Processing" },
  { id: "#ORD-1046", customer: "Rohan Gupta", amount: "₹1,599", status: "Delivered" },
];

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("Weekly");
  const data = chartData[period];
    const { vendorSettings } = useVendorFlow();
  const navigate = useNavigate();

  const chartPoints = useMemo(() => {
    const max = Math.max(...data.values);
    const step = 560 / (data.values.length - 1);
    return data.values.map((value, index) => `${index * step},${190 - (value / max) * 150 - 12}`).join(" ");
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileSliderNav />
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Orders dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Track order activity and sales performance.</p>
          </div>
          <div className="flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            {(Object.keys(chartData) as Period[]).map((item) => <button key={item} type="button" onClick={() => setPeriod(item)} className={`rounded-lg px-3 py-2 text-sm font-medium transition ${period === item ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>{item}</button>)}
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total orders" value={data.orders} detail="12.5% from last period" icon={ShoppingBag} positive />
          <MetricCard label="Order revenue" value={data.revenue} detail="8.2% from last period" icon={ArrowUpRight} positive />
          <MetricCard label="Pending orders" value="18" detail="4 need attention" icon={Clock3} />
          <MetricCard label="Delivered" value="245" detail="93% fulfilment rate" icon={PackageCheck} positive />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-3 sm:p-6">
            <div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-900">Order trend</h2><p className="mt-1 text-sm text-slate-500">Orders received this {period.toLowerCase().replace("ly", "")}</p></div><span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><ArrowUpRight className="h-3.5 w-3.5" /> 12.5%</span></div>
            <div className="mt-6 h-56"><svg viewBox="0 0 560 210" className="h-full w-full overflow-visible" role="img" aria-label="Order trend chart">
              {[40, 90, 140, 190].map((y) => <line key={y} x1="0" x2="560" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />)}
              <polyline points={chartPoints} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {chartPoints.split(" ").map((point, index) => { const [cx, cy] = point.split(","); return <circle key={data.labels[index]} cx={cx} cy={cy} r="4" fill="white" stroke="#0f172a" strokeWidth="2.5" />; })}
              {data.labels.map((label, index) => <text key={label} x={(560 / (data.labels.length - 1)) * index} y="208" textAnchor="middle" fill="#64748b" fontSize="12">{label}</text>)}
            </svg></div>
          </div>
        
        </section>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Recent orders</h2><p className="mt-1 text-sm text-slate-500">Latest activity from your store</p></div><span className="text-sm font-medium text-slate-500">Last 3 orders</span></div>
          <div className="divide-y divide-slate-100">{recentOrders.map((order) => <div key={order.id} className="flex items-center justify-between gap-4 py-3.5"><div><p className="font-medium text-slate-900">{order.customer}</p><p className="mt-0.5 text-sm text-slate-500">{order.id}</p></div><div className="text-right"><p className="font-semibold text-slate-900">{order.amount}</p><p className={`mt-0.5 text-xs font-semibold ${order.status === "Delivered" ? "text-emerald-600" : "text-blue-600"}`}>{order.status}</p></div></div>)}</div>
        </section>
      </main>
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

function MetricCard({ label, value, detail, icon: Icon, positive = false }: { label: string; value: string; detail: string; icon: typeof ShoppingBag; positive?: boolean }) {
  return <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><div className="rounded-xl bg-slate-100 p-2"><Icon className="h-4 w-4 text-slate-700" /></div></div><p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{value}</p><p className={`mt-2 flex items-center gap-1 text-xs font-medium ${positive ? "text-emerald-600" : "text-slate-500"}`}>{positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{detail}</p></div>;
}

function StatusBar({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return <div><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-700">{label}</span><span className="text-slate-500">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div></div>;
}
