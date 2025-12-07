import { useEffect, useState, useRef, useMemo } from "react";
import {
  getPayments,
  markPaid,
  markUnpaid,
  resetAllToUnpaid,
} from "../api/payments";
import client from "../api/client"; // 🔹 NEW: to fetch batches
import {
  CreditCard,
  RefreshCw,
  Check,
  X,
  Users,
  Wallet,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react";

const PaymentsPage = () => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState({
    total: 0,
    paidCount: 0,
    unpaidCount: 0,
    paid: [],
    unpaid: [],
  });
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchRef = useRef(null);

  // Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState(false);

  // 🔹 Batches + selected batch filter
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(""); // "" = all batches

  // helper to test match on name or phone
  const matchesQuery = (s, q) => {
    const query = String(q || "").toLowerCase().trim();
    if (!query) return true;
    const name = String(s.name || "").toLowerCase();
    const phone = String(s.phone || "").toLowerCase();
    return name.includes(query) || phone.includes(query);
  };

  // helper: match selected batch
  const matchesBatch = (s) => {
    if (!selectedBatchId) return true; // "All batches"
    return String(s.batch || "") === String(selectedBatchId);
  };

  const sortByNameAsc = (a, b) => {
    const nameA = String(a.name || "").toLowerCase().trim();
    const nameB = String(b.name || "").toLowerCase().trim();
    return nameA.localeCompare(nameB);
  };

  const filteredUnpaid = useMemo(
    () =>
      payments.unpaid
        .filter((s) => matchesQuery(s, debouncedQuery) && matchesBatch(s))
        .sort(sortByNameAsc),
    [payments.unpaid, debouncedQuery, selectedBatchId]
  );

  const filteredPaid = useMemo(
    () =>
      payments.paid
        .filter((s) => matchesQuery(s, debouncedQuery) && matchesBatch(s))
        .sort(sortByNameAsc),
    [payments.paid, debouncedQuery, selectedBatchId]
  );

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getPayments(); // 🔹 stays same: studio-wide payments
      setPayments(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const res = await client.get("/batches");
      setBatches(res.data || []);
    } catch (err) {
      console.error("Failed to load batches", err);
    }
  };

  useEffect(() => {
    load();
    loadBatches();
  }, []);

  useEffect(() => {
    const id = setTimeout(
      () => setDebouncedQuery(query.trim().toLowerCase()),
      300
    );
    return () => clearTimeout(id);
  }, [query]);

  const handleToggle = async (student) => {
    try {
      setSavingId(student._id);
      if (student.isPaid) {
        await markUnpaid(student._id);
      } else {
        await markPaid(student._id);
      }
      await load();
    } catch (err) {
      setError("Failed to update payment status.");
    } finally {
      setSavingId(null);
    }
  };

  const handleResetConfirm = async () => {
    try {
      setResetting(true);
      setError("");
      await resetAllToUnpaid();
      await load();
      setShowResetModal(false);
      setToggleConfirm(false);
    } catch (err) {
      setError("Failed to reset payments.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fee Payments</h2>
          <p className="text-sm text-slate-500 mt-1">
            Track monthly fee status and manage records.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          {/* Search box */}
          <div className="relative">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or phone..."
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </div>
          </div>

          {/* 🔹 Batch filter dropdown */}
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs md:text-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-rose-200"
          >
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} {b.timing ? `(${b.timing})` : ""}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowResetModal(true)}
            disabled={resetting || payments.total === 0}
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={resetting ? "animate-spin" : ""} />
            {resetting ? "Resetting..." : "Reset Month"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Students
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {payments.total}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        {/* Paid Card */}
        <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Paid
            </p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">
              {payments.paidCount}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Unpaid Card */}
        <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Pending
            </p>
            <p className="text-2xl font-bold text-amber-900 mt-1">
              {payments.unpaidCount}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-rose-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* --- COLUMN 1: PENDING FEES (UNPAID) --- */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-fit">
            <div className="px-6 py-4 border-b border-slate-100 bg-amber-50/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600">
                  <Wallet size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Pending Fees
                </h3>
              </div>
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">
                {filteredUnpaid.length}
              </span>
            </div>

            <div className="p-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredUnpaid.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-bold text-slate-700">
                    All caught up! 🎉
                  </p>
                  <p className="text-xs text-slate-400">No pending payments.</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {filteredUnpaid.map((s) => (
                    <li
                      key={s._id}
                      className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold border border-amber-200">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {s.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {s.phone || "No contact"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(s)}
                        disabled={savingId === s._id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1 shadow-sm"
                      >
                        {savingId === s._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Mark Paid
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* --- COLUMN 2: COMPLETED (PAID) --- */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-fit">
            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
                  <CheckCircle2 size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Paid Students
                </h3>
              </div>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                {filteredPaid.length}
              </span>
            </div>

            <div className="p-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredPaid.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs text-slate-400">
                    No payments received yet.
                  </p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {filteredPaid.map((s) => (
                    <li
                      key={s._id}
                      className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold border border-emerald-200">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {s.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {s.phone || "No contact"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(s)}
                        disabled={savingId === s._id}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold hover:bg-amber-100 hover:text-amber-700 transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        {savingId === s._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <X size={14} />
                        )}
                        Undo
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- RESET CONFIRMATION MODAL --- */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-white/20 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Reset Monthly Payments?
              </h2>
              <p className="text-sm text-slate-500 mt-2 mb-6">
                This will mark <b>all {payments.total} students</b> as{" "}
                <span className="text-amber-600 font-bold">Unpaid</span>. This
                is usually done at the start of a new month.
              </p>
            </div>

            {/* Toggle Switch */}
            <div
              className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 cursor-pointer"
              onClick={() => setToggleConfirm(!toggleConfirm)}
            >
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide select-none">
                I understand
              </span>
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                  toggleConfirm ? "bg-rose-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    toggleConfirm ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setToggleConfirm(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>

              <button
                disabled={!toggleConfirm || resetting}
                onClick={handleResetConfirm}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition flex items-center justify-center gap-2 ${
                  !toggleConfirm
                    ? "bg-slate-300 cursor-not-allowed shadow-none"
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30"
                }`}
              >
                {resetting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Reset All"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
