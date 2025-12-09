import { useEffect, useState } from "react";
import {
  getFinanceSummary,
  getMonthlyFinance,
  addExpense,
  deleteExpense,
} from "../api/finance";

import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Trash2,
  Loader2,
  PieChart,
  IndianRupee,
  AlertTriangle,
  Wallet,
  TrendingUp,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const FinancePage = () => {
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);

  // Loading States
  const [initialLoading, setInitialLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(false);

  // Add Expense State
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", category: "" });
  const [showAddModal, setShowAddModal] = useState(false);

  // Delete Expense State
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [toggleConfirm, setToggleConfirm] = useState(false);

  const [error, setError] = useState("");
  const [monthsRange, setMonthsRange] = useState(6);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await getFinanceSummary();
        setSummary(res.data);
        await updateGraph(6);
      } catch (err) {
        setError("Failed to load finance data");
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, []);

  const updateGraph = async (range) => {
    setGraphLoading(true);
    try {
      const m = await getMonthlyFinance(range);
      setMonthly(m.data.months || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setGraphLoading(false), 300);
    }
  };

  const handleMonthChange = (range) => {
    if (range === monthsRange) return;
    setMonthsRange(range);
    updateGraph(range);
  };

  // ... (Keep handleAddExpense, openDeleteModal, handleConfirmDelete as they were) ...
  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      setAdding(true);
      await addExpense({
        title: form.title,
        amount: Number(form.amount),
        category: form.category || "General",
      });
      setForm({ title: "", amount: "", category: "" });
      setShowAddModal(false);
      const res = await getFinanceSummary();
      setSummary(res.data);
      await updateGraph(monthsRange);
    } catch (err) {
      setError("Failed to add expense.");
    } finally {
      setAdding(false);
    }
  };

  const openDeleteModal = (expense) => {
    setSelectedExpense(expense);
    setToggleConfirm(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedExpense) return;
    try {
      setDeleting(true);
      await deleteExpense(selectedExpense._id);
      const res = await getFinanceSummary();
      setSummary(res.data);
      await updateGraph(monthsRange);
      setShowDeleteModal(false);
    } catch (err) {
      setError("Failed to delete expense");
    } finally {
      setDeleting(false);
      setSelectedExpense(null);
    }
  };

  const chartDataMulti = monthly.map((m) => ({
    name: m.label,
    Income: m.income,
    Expenses: m.expenses,
    Profit: m.profit,
  }));

  useEffect(() => {
    const init = async () => {
      try {
        const res = await getFinanceSummary();
        console.log("🔍 Finance summary from API:", res.data); // <-- add this
        setSummary(res.data);
        await updateGraph(6);
      } catch (err) {
        setError("Failed to load finance data");
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, []);

  // --- NEW LOGIC FOR SMOOTH TOGGLE ---
  const monthOptions = [3, 6, 12];
  const activeIndex = monthOptions.indexOf(monthsRange);

  return (
    <div className="space-y-8 pb-10">
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Financial Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track your studio's health, income, and expenses.
          </p>
        </div>

        {/* --- SMOOTH SLIDING TOGGLE --- */}
        <div className="relative flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto min-w-[280px]">
          {/* The Gliding Background Pill */}
          <div
            className="absolute top-1 bottom-1 left-1 bg-rose-500 rounded-xl shadow-md transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{
              width: "calc((100% - 0.5rem) / 3)", // Exact 1/3 width minus padding
              transform: `translateX(${activeIndex * 100}%)`, // Slide by 100% of its own width
            }}
          />

          {/* The Transparent Buttons */}
          {monthOptions.map((m) => (
            <button
              key={m}
              onClick={() => handleMonthChange(m)}
              className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors duration-300 text-center ${
                monthsRange === m
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m} Months
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* ... (Keep the rest of your JSX exactly as it was: Cards, Charts, Expense List, Modals) ... */}

      {initialLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={40} className="animate-spin text-rose-500" />
        </div>
      ) : (
        summary && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* ... (Your existing Cards) ... */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Projected Income
                  </p>
                  <p className="text-2xl font-bold text-slate-800 mt-2">
                    ₹{summary.totalExpected.toLocaleString()}
                  </p>
                </div>
                <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-blue-600">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full border-[1.5px] border-current">
                    <IndianRupee size={10} strokeWidth={3} />
                  </div>
                  Total Fees
                </div>
              </div>
              {/* ... (Repeat other cards as before) ... */}
              <div className="bg-emerald-50/60 p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between h-32">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600/70">
                    Collected
                  </p>
                  <p className="text-2xl font-bold text-emerald-900 mt-2">
                    ₹{summary.totalCollected.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <ArrowUpRight size={14} /> Received
                </div>
              </div>
              <div className="bg-rose-50/60 p-6 rounded-3xl border border-rose-100 shadow-sm flex flex-col justify-between h-32">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-600/70">
                    Expenses
                  </p>
                  <p className="text-2xl font-bold text-rose-900 mt-2">
                    ₹{summary.totalExpenses.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
                  <ArrowDownRight size={14} /> Outgoing
                </div>
              </div>
              <div className="bg-purple-50/60 p-6 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between h-32">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-600/70">
                    Net Profit
                  </p>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    ₹{summary.profit.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                  <TrendingUp size={14} /> Actual Growth
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Chart */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp size={18} className="text-slate-400" />
                    Financial Trends
                  </h3>
                  {graphLoading && (
                    <span className="text-xs font-medium text-rose-500 flex items-center gap-1 animate-pulse">
                      <Loader2 size={12} className="animate-spin" /> Updating...
                    </span>
                  )}
                </div>
                <div
                  className={`h-72 w-full min-w-0 transition-all duration-500 ease-in-out ${
                    graphLoading
                      ? "opacity-40 scale-[0.99] blur-[1px]"
                      : "opacity-100 scale-100 blur-0"
                  }`}
                >
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartDataMulti} barGap={4}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        cursor={{ fill: "#f8fafc" }}
                        animationDuration={300}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      <Bar
                        dataKey="Income"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                        animationDuration={800}
                      />
                      <Bar
                        dataKey="Expenses"
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                        animationDuration={800}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Chart */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col">
                <h3 className="text-base font-bold text-slate-800 mb-2">
                  This Month
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Income vs Expenses flow
                </p>
                <div className="w-full min-h-[200px] min-w-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={[
                        { name: "Start", income: 0, expenses: 0 },
                        {
                          name: "Current",
                          income: summary.totalCollected,
                          expenses: summary.totalExpenses,
                        },
                      ]}
                    >
                      <defs>
                        <linearGradient
                          id="colorIncome"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorExpense"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#f43f5e"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#f43f5e"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                        strokeWidth={3}
                        animationDuration={1000}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#f43f5e"
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                        strokeWidth={3}
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Expense List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Recent Expenses
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Detailed list of outgoing payments.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 flex items-center gap-2"
                >
                  <Plus size={16} /> Add Expense
                </button>
              </div>
              {summary.expenses.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Wallet size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">
                    No expenses recorded for this period.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50/50">
                      <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {summary.expenses.map((e) => (
                        <tr
                          key={e._id}
                          className="group hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-700">
                            {e.title}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {e.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            ₹{e.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openDeleteModal(e)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )
      )}

      {/* --- ADD & DELETE MODALS (Same as before) --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-white/20 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">
                Add New Expense
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Studio Rent"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, amount: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Utility, Equipment"
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                >
                  {adding ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Save Expense"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedExpense && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-white/20 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <Trash2 size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Delete Expense?
              </h2>
              <p className="text-sm text-slate-500 mt-2 mb-6">
                Delete{" "}
                <span className="font-bold text-slate-800">
                  "{selectedExpense.title}"
                </span>
                ?<br />
                This cannot be undone.
              </p>
            </div>
            <div
              className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 cursor-pointer select-none transition-colors hover:bg-slate-100"
              onClick={() => setToggleConfirm(!toggleConfirm)}
            >
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Confirm Delete
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
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setToggleConfirm(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                disabled={!toggleConfirm || deleting}
                onClick={handleConfirmDelete}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition flex items-center justify-center gap-2 ${
                  !toggleConfirm
                    ? "bg-slate-300 cursor-not-allowed shadow-none"
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30"
                }`}
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
