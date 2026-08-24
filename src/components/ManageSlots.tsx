import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, CalendarDays, Users, Ban, Save, CheckCircle2 } from "lucide-react";
import MobileSliderNav from "../components/MobileSliderNav";
import { useVendorFlow } from "../context/VendorFlowContext";
import { useNavigate } from "react-router-dom";

export default function ManageSlots() {
  const navigate = useNavigate();
  const { vendorSettings, updateSettings, saveSettings, saveBlockedSlot, loading } = useVendorFlow();

  // Core Operations State
  const [businessHours, setBusinessHours] = useState({ open: "", close: "", slotDuration: "30" });
  const [weeklyOff, setWeeklyOff] = useState<string[]>([]);
  const [employeeCount, setEmployeeCount] = useState(1);
  
  // Independent Blocked Slots State
  const [blockedTimings, setBlockedTimings] = useState<any[]>([]);
  
  const hasSlotsAdded = Boolean(
    businessHours.open && businessHours.close
  );

  const [isLoaded, setIsLoaded] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ global: boolean; blocks: boolean }>({ global: false, blocks: false });

  // Initialize data
  useEffect(() => {
    if (!vendorSettings) return;

    setBusinessHours(vendorSettings.vendorSettings?.businessHours || { open: "", close: "", slotDuration: "30" });
    setWeeklyOff(vendorSettings.vendorSettings?.weeklyOffDays || []);
    setBlockedTimings(vendorSettings.blockedTimings || []);
    setEmployeeCount(vendorSettings.vendorSettings?.employeeCount || 1);
    setIsLoaded(true);
  }, [vendorSettings]);

  // Handler 1: Save Core Settings
  const handleSaveGlobalSettings = async () => {
    if (!isLoaded || loading) return;
    setActionLoading(prev => ({ ...prev, global: true }));

    const payload = {
      vendorSettings: {
        businessHours,
        weeklyOffDays: weeklyOff,
        employeeCount
      }
    };

    try {
      console.log(payload);
      await saveSettings(payload);
      updateSettings(payload);
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    } finally {
      setActionLoading(prev => ({ ...prev, global: false }));
    }
  };

  // Handler 2: Save / Sync Blocked Timings Section Independently
  const handleUpdateBlockedTimings = async (updatedList: any[]) => {
    if (!isLoaded || loading) return;
    setActionLoading(prev => ({ ...prev, blocks: true }));
    setBlockedTimings(updatedList);

    const payload = {
      blockedTimings: updatedList
    };

    try {
      await saveBlockedSlot(payload);
      updateSettings(payload);
      alert("Blocked timings updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error updating blocked timings.");
    } finally {
      setActionLoading(prev => ({ ...prev, blocks: false }));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/60 antialiased text-slate-900 pb-36 pt-20">
      <MobileSliderNav />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Slot Management</h1>
          <p className="text-sm text-slate-500 mt-1">Configure your workspace hours, allocation logic, and exception rules.</p>
        </header>

        {!isLoaded ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-slate-400 font-medium animate-pulse">Loading workspace schema...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1: Operational Base (Settings) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Business Hours & Intervals</h2>
                    <p className="text-xs text-slate-400">Set availability windows & default increments</p>
                  </div>
                </div>
                
                <BusinessHours state={businessHours} setState={setBusinessHours} />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                    <Users size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Resource Multipliers</h2>
                    <p className="text-xs text-slate-400">Manage operational concurrent concurrency</p>
                  </div>
                </div>

                <EmployeeCount count={employeeCount} setCount={setEmployeeCount} />
              </div>

              <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 ${!hasSlotsAdded ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Weekly System Rest</h2>
                    <p className="text-xs text-slate-400">Select recurrent full-day off-cycles</p>
                  </div>
                </div>

                <WeeklyOff selected={weeklyOff} setSelected={setWeeklyOff} />
              </div>
            </div>

            {/* COLUMN 2: Isolated Blocked Timings */}
            <div className={`lg:col-span-5 ${!hasSlotsAdded ? 'opacity-50 pointer-events-none' : ''}`}>
              <BlockedTimings 
                list={blockedTimings} 
                onSyncList={handleUpdateBlockedTimings}
                isUpdating={actionLoading.blocks} 
              />
            </div>

          </div>
        )}
      </div>

      {/* Global Bottom Save Strip for Core Operations */}
      {isLoaded && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 py-4 px-6 z-40 shadow-xl flex justify-center">
          <div className="w-full max-w-6xl flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-500">Unsaved configuration changes detected</p>
              <p className="text-[11px] text-slate-400">Updates will reflect live across scheduling widgets</p>
            </div>
            <button
              onClick={handleSaveGlobalSettings}
              disabled={actionLoading.global || actionLoading.blocks}
              className={`bg-slate-950 text-white rounded-xl py-3.5 px-8 text-sm font-semibold flex items-center gap-2 transition active:scale-[0.99] w-full sm:w-auto justify-center ${
                actionLoading.global ? "opacity-75 cursor-wait" : "hover:bg-slate-900 shadow-sm"
              }`}
            >
              <Save size={16} />
              {actionLoading.global ? "Updating Engine..." : "Save Workspace Profile"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------- CORE PROFILE COMPONENTS ------------------- */
function BusinessHours({ state, setState }: any) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Opening Pivot</label>
          <input 
            type="time" 
            value={state.open} 
            onChange={e => setState({ ...state, open: e.target.value })} 
            className="border border-slate-200 focus:border-slate-400 focus:ring-0 p-3 rounded-xl w-full text-slate-800 bg-slate-50/50 transition font-medium text-sm" 
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Closing Pivot</label>
          <input 
            type="time" 
            value={state.close} 
            onChange={e => setState({ ...state, close: e.target.value })} 
            className="border border-slate-200 focus:border-slate-400 focus:ring-0 p-3 rounded-xl w-full text-slate-800 bg-slate-50/50 transition font-medium text-sm" 
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Slot Duration (Minutes)</label>
        <input
          type="number"
          min={1}
          placeholder="e.g., 30"
          value={state.slotDuration}
          onChange={e => setState({ ...state, slotDuration: e.target.value })}
          className="border border-slate-200 focus:border-slate-400 focus:ring-0 p-3 rounded-xl w-full text-slate-800 bg-slate-50/50 transition font-medium text-sm"
        />
      </div>
    </div>
  );
}

function EmployeeCount({ count, setCount }: any) {
  return (
    <div>
      <p className="text-xs font-normal text-slate-400 mb-3">Defines structural overhead thresholds allowed concurrently inside a standard timeslot cluster block.</p>
      <input 
        type="number" 
        min={1} 
        value={count} 
        onChange={e => setCount(Number(e.target.value))} 
        className="border border-slate-200 focus:border-slate-400 focus:ring-0 p-3 rounded-xl w-full bg-slate-50/50 font-medium text-sm" 
      />
    </div>
  );
}

function WeeklyOff({ selected, setSelected }: any) {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const toggleDay = (d: string) => setSelected((prev: any[]) => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  
  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
      {days.map(d => {
        const isActive = selected.includes(d);
        return (
          <button 
            type="button"
            key={d} 
            onClick={() => toggleDay(d)}
            className={`py-2.5 px-1 text-xs rounded-xl border font-semibold transition active:scale-95 ${
              isActive 
                ? "bg-rose-50 border-rose-300 text-rose-600 shadow-xs" 
                : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
            }`}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------- INDEPENDENT ACTIONS COMPONENT ------------------- */
function BlockedTimings({ list, onSyncList, isUpdating }: { list: any[]; onSyncList: (list: any[]) => void; isUpdating: boolean }) {
  const [form, setForm] = useState({ date: "", start: "", end: "" });

  const handleInsertBlock = () => {
    if (!form.date || !form.start || !form.end) return;
    const nextList = [...list, form];
    onSyncList(nextList);
    setForm({ date: "", start: "", end: "" });
  };

  const handleRemoveBlock = (targetIndex: number) => {
    const nextList = list.filter((_, idx) => idx !== targetIndex);
    onSyncList(nextList);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
            <Ban size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Custom Blockout Eras</h2>
            <p className="text-xs text-slate-400">Hard-lock timeline segments instantly</p>
          </div>
        </div>
        {isUpdating && (
          <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 font-bold px-2 py-0.5 rounded-full animate-pulse">
            Syncing...
          </span>
        )}
      </div>

      <div className="space-y-4 bg-slate-50/60 p-4 rounded-xl border border-slate-100 mb-6">
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Target Date</label>
          <input 
            type="date" 
            value={form.date} 
            onChange={e => setForm({ ...form, date: e.target.value })} 
            className="border border-slate-200 focus:border-slate-400 p-2.5 rounded-xl text-xs w-full bg-white font-medium" 
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Freeze From</label>
            <input 
              type="time" 
              value={form.start} 
              onChange={e => setForm({ ...form, start: e.target.value })} 
              className="border border-slate-200 focus:border-slate-400 p-2.5 rounded-xl text-xs w-full bg-white font-medium" 
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Freeze Until</label>
            <input 
              type="time" 
              value={form.end} 
              onChange={e => setForm({ ...form, end: e.target.value })} 
              className="border border-slate-200 focus:border-slate-400 p-2.5 rounded-xl text-xs w-full bg-white font-medium" 
            />
          </div>
        </div>
        
        <button 
          type="button"
          onClick={handleInsertBlock}
          disabled={!form.date || !form.start || !form.end || isUpdating}
          className="w-full mt-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold shadow-xs transition active:scale-[0.98]"
        >
          <Plus size={14} /> Commit Time Lockout
        </button>
      </div>

      <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Lockouts ({list.length})</h3>
        {list.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-200/10">
            <CheckCircle2 className="mx-auto text-slate-300 mb-1.5" size={20} />
            <p className="text-xs text-slate-400 font-medium">No schedule lockouts configured.</p>
          </div>
        ) : (
          list.map((o: any, i: number) => (
            <div key={i} className="group border border-slate-100 hover:border-slate-200 p-3.5 rounded-xl flex justify-between items-center bg-white shadow-2xs transition">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-700">{o.date}</span>
                <span className="text-[11px] font-medium text-slate-400">{o.start} &ndash; {o.end}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveBlock(i)}
                disabled={isUpdating}
                className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition opacity-80 group-hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}