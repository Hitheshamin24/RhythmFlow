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
  MoreHorizontal,
  Calendar,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
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

  const [selectedMonth, setSelectedMonth] = useState(null);
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
      const months = m.data.months || [];
      setMonthly(months);

      // ✅ Default: last month = current month
      if (months.length > 0) {
        setSelectedMonth(months[months.length - 1]);
      }
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
  const monthIncome = selectedMonth?.income || 0;
  const monthExpenses = selectedMonth?.expenses || 0;
  const monthProfit = selectedMonth?.profit || 0;

  // --- NEW LOGIC FOR SMOOTH TOGGLE ---
  const monthOptions = [3, 6, 12];
  const activeIndex = monthOptions.indexOf(monthsRange);

  const profitPercent =
    monthIncome > 0 ? Math.round((monthProfit / monthIncome) * 100) : 0;

  return (
    // Applied Warm Background
    <div className="space-y-8 pb-10 bg-[#FFFBF7] min-h-screen p-6 md:p-8 font-sans text-stone-800">
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          {/* Serif Font & Chocolate Color */}
          <h2 className="text-4xl font-bold font-serif text-[#2C1810] tracking-tight">
            Financial Overview
          </h2>
          <p className="text-sm font-medium text-stone-500 mt-2 flex items-center gap-2">
            <Calendar size={14} />
            Track your studio's health, income, and expenses.
          </p>
        </div>

        {/* --- SMOOTH SLIDING TOGGLE --- */}
        <div className="relative flex bg-stone-200/50 p-1.5 rounded-xl w-full md:w-auto min-w-[300px]">
          {/* The Gliding Background Pill */}
          <div
            className="absolute top-1.5 bottom-1.5 left-1.5 bg-white rounded-[10px] shadow-sm border border-stone-200/50 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            style={{
              width: "calc((100% - 0.75rem) / 3)",
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />

          {/* The Transparent Buttons */}
          {monthOptions.map((m) => (
            <button
              key={m}
              onClick={() => handleMonthChange(m)}
              className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors duration-300 text-center uppercase tracking-wide ${
                monthsRange === m
                  ? "text-[#2C1810]" // Active text: Chocolate
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {m} Months
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {initialLoading ? (
        <div className="flex justify-center py-32">
          <Loader2 size={48} className="animate-spin text-rose-500" />
        </div>
      ) : (
        summary && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Projected Income Card - AMBER (Matches Revenue) */}
              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700 ease-out"></div>
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Projected Income
                  </p>
                  <p className="text-3xl font-black text-[#2C1810] mt-2 tracking-tight">
                    ₹{summary.totalExpected.toLocaleString()}
                  </p>
                </div>
                <div className="relative z-10 flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-lg">
                  <IndianRupee size={12} strokeWidth={3} />
                  Total Fees
                </div>
              </div>

              {/* Collected Card - EMERALD (Matches Money In) */}
              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 opacity-50"></div>
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600/70">
                    Collected
                  </p>
                  <p className="text-3xl font-black text-[#2C1810] mt-2 tracking-tight">
                    ₹{summary.totalCollected.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 w-fit px-2 py-1 rounded-lg">
                  <ArrowUpRight size={14} /> Received
                </div>
              </div>

              {/* Expenses Card - ROSE (Matches Brand/Expenses) */}
              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-8 -mt-8 opacity-50"></div>
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-600/70">
                    Expenses
                  </p>
                  <p className="text-3xl font-black text-[#2C1810] mt-2 tracking-tight">
                    ₹{summary.totalExpenses.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 w-fit px-2 py-1 rounded-lg">
                  <ArrowDownRight size={14} /> Outgoing
                </div>
              </div>

              {/* Net Profit Card - CHOCOLATE GRADIENT */}
              <div className="bg-linear-to-br from-[#5D4037] to-[#3E2723] p-6 rounded-3xl shadow-lg shadow-stone-300 flex flex-col justify-between h-36 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-10 transition-opacity duration-300"></div>
                <div className="absolute -bottom-4 -right-4 text-white/10 transform rotate-12">
                   <TrendingUp size={80} />
                </div>
                
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-300">
                    Net Profit
                  </p>
                  <p className="text-3xl font-black mt-2 tracking-tight">
                    ₹{monthProfit.toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 relative z-10">
                   <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-md bg-white/10 border border-white/10 ${
                      profitPercent >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {profitPercent >= 0 ? "+" : ""}
                    {profitPercent}% margin
                  </span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Chart */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-100 p-6 md:p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-bold font-serif text-[#2C1810] flex items-center gap-2">
                    <div className="bg-stone-100 p-2 rounded-lg text-stone-500">
                      <TrendingUp size={18} />
                    </div>
                    Financial Trends
                  </h3>
                  {graphLoading && (
                    <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5 px-3 py-1 bg-rose-50 rounded-full animate-pulse">
                      <Loader2 size={12} className="animate-spin" /> Updating...
                    </span>
                  )}
                </div>
                <div
                  className={`h-80 w-full min-w-0 transition-all duration-500 ease-in-out ${
                    graphLoading
                      ? "opacity-50 scale-[0.99] blur-[1px]"
                      : "opacity-100 scale-100 blur-0"
                  }`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartDataMulti}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      barGap={6}
                      onClick={(data) => {
                        if (data && data.activeLabel) {
                          const month = monthly.find(
                            (m) => m.label === data.activeLabel
                          );
                          if (month) setSelectedMonth(month);
                        }
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="#e7e5e4" // Stone-200
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#a8a29e", fontWeight: 600 }}
                        dy={15}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#a8a29e", fontWeight: 600 }}
                        dx={-10}
                      />
                      <Tooltip
                        cursor={{ fill: "#f5f5f4", opacity: 0.6 }}
                        contentStyle={{
                          borderRadius: "16px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          padding: "12px 16px",
                          fontFamily: "inherit",
                          backgroundColor: "#fff",
                          color: "#2C1810"
                        }}
                        itemStyle={{ fontSize: "12px", fontWeight: "600", padding: "2px 0" }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: "30px" }} 
                        iconType="circle"
                        formatter={(value) => <span className="text-stone-500 font-semibold text-xs ml-1">{value}</span>}
                      />
                      {/* Emerald for Income, Rose for Expense to match image logic */}
                      <Bar
                        dataKey="Income"
                        name="Income"
                        fill="#10b981" 
                        radius={[6, 6, 6, 6]}
                        maxBarSize={32}
                        animationDuration={1000}
                      />

                      <Bar
                        dataKey="Expenses"
                        name="Expenses"
                        fill="#f43f5e" 
                        radius={[6, 6, 6, 6]}
                        maxBarSize={32}
                        animationDuration={1000}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Chart (Monthly Details) */}
              <div className="bg-white rounded-3xl border border-stone-100 p-6 md:p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-xl font-bold font-serif text-[#2C1810]">
                    {selectedMonth?.label || "This Month"}
                  </h3>
                  <p className="text-xs font-medium text-stone-400 mt-1">
                    Monthly performance breakdown
                  </p>
                </div>

                <div className="flex flex-col gap-4 flex-1 justify-center">
                  {/* Income */}
                  <div className="group flex justify-between items-center p-4 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-emerald-50/30 hover:border-emerald-100 transition-colors">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 group-hover:text-emerald-500 transition-colors">
                        Income
                      </p>
                      <p className="text-xl font-bold text-stone-800 mt-1 group-hover:text-emerald-900">
                        ₹{monthIncome.toLocaleString()}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-stone-300 group-hover:text-emerald-500 group-hover:shadow-sm transition-all">
                       <ArrowUpRight size={20} />
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="group flex justify-between items-center p-4 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-rose-50/30 hover:border-rose-100 transition-colors">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 group-hover:text-rose-500 transition-colors">
                        Expenses
                      </p>
                      <p className="text-xl font-bold text-stone-800 mt-1 group-hover:text-rose-900">
                        ₹{monthExpenses.toLocaleString()}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-stone-300 group-hover:text-rose-500 group-hover:shadow-sm transition-all">
                       <ArrowDownRight size={20} />
                    </div>
                  </div>

                  {/* Profit */}
                  <div className="relative overflow-hidden group flex justify-between items-center p-5 rounded-2xl border border-stone-200 bg-[#2C1810]/5">
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#2C1810]">
                        Net Profit
                      </p>
                      <p className="text-2xl font-black text-[#2C1810] mt-1">
                        ₹{monthProfit.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right relative z-10">
                      <p
                        className={`text-sm font-bold ${
                          profitPercent >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {profitPercent >= 0 ? "+" : ""}
                        {profitPercent}%
                      </p>
                      <p className="text-[10px] font-bold text-stone-400 uppercase">Margin</p>
                    </div>
                    {/* Decorative Background */}
                    <TrendingUp className="absolute -bottom-2 -right-2 text-[#2C1810] opacity-10 transform rotate-12" size={80} />
                  </div>
                </div>
              </div>
            </div>

            {/* Expense List */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-6 md:p-8 border-b border-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#2C1810]">
                    Recent Expenses
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 font-medium">
                    Detailed list of outgoing payments.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-5 py-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all duration-300 shadow-lg shadow-rose-200 hover:shadow-rose-300 flex items-center gap-2 transform active:scale-95"
                >
                  <Plus size={16} /> Add Expense
                </button>
              </div>
              
              {summary.expenses.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-stone-300">
                  <div className="bg-stone-50 p-4 rounded-full mb-4">
                    <Wallet size={32} className="opacity-40" />
                  </div>
                  <p className="text-sm font-medium text-stone-400">
                    No expenses recorded for this period.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-stone-50/50 border-b border-stone-100">
                        <th className="px-8 py-4 text-left text-[11px] font-bold text-stone-400 uppercase tracking-wider">Title</th>
                        <th className="px-8 py-4 text-left text-[11px] font-bold text-stone-400 uppercase tracking-wider">Category</th>
                        <th className="px-8 py-4 text-left text-[11px] font-bold text-stone-400 uppercase tracking-wider">Amount</th>
                        <th className="px-8 py-4 text-right text-[11px] font-bold text-stone-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {summary.expenses.map((e) => (
                        <tr
                          key={e._id}
                          className="group hover:bg-stone-50/80 transition-colors duration-200"
                        >
                          <td className="px-8 py-5 font-semibold text-[#2C1810]">
                            {e.title}
                          </td>
                          <td className="px-8 py-5">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                              {e.category}
                            </span>
                          </td>
                          <td className="px-8 py-5 font-bold text-stone-800">
                            ₹{e.amount.toLocaleString()}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button
                              onClick={() => openDeleteModal(e)}
                              className="p-2 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                            >
                              <Trash2 size={16} />
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

      {/* --- ADD & DELETE MODALS --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#2C1810]/40 backdrop-blur-md flex items-center justify-center z-50 px-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-4xl w-full max-w-sm p-8 shadow-2xl border border-white/20 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold font-serif text-[#2C1810] tracking-tight">
                New Expense
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 hover:bg-stone-100 p-2 rounded-full transition-colors"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 ml-1">
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
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-5 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-stone-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 ml-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, amount: e.target.value }))
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-9 pr-5 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-stone-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 ml-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Utility, Equipment"
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-5 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-stone-300"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3.5 rounded-2xl bg-stone-100 text-stone-600 font-bold text-sm hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 px-4 py-3.5 rounded-2xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-[#2C1810]/40 backdrop-blur-md flex items-center justify-center z-50 px-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-4xl w-full max-w-sm p-8 shadow-2xl border border-white/20 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-6 shadow-sm">
                <Trash2 size={28} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold text-[#2C1810]">
                Delete Expense?
              </h2>
              <p className="text-sm text-stone-500 mt-2 mb-8 leading-relaxed">
                You are about to remove{" "}
                <span className="font-bold text-stone-800">
                  "{selectedExpense.title}"
                </span>.
                <br />
                This action cannot be undone.
              </p>
            </div>
            <div
              className={`p-4 rounded-2xl flex items-center justify-between border cursor-pointer select-none transition-all duration-300 ${
                 toggleConfirm 
                 ? "bg-rose-50 border-rose-100 ring-1 ring-rose-200" 
                 : "bg-stone-50 border-stone-100 hover:bg-stone-100"
              }`}
              onClick={() => setToggleConfirm(!toggleConfirm)}
            >
              <span className={`text-xs font-bold uppercase tracking-wide ${toggleConfirm ? 'text-rose-600' : 'text-stone-500'}`}>
                I understand
              </span>
              <div
                className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${
                  toggleConfirm ? "bg-rose-500" : "bg-stone-300"
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    toggleConfirm ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setToggleConfirm(false);
                }}
                className="flex-1 px-4 py-3.5 rounded-2xl bg-white border border-stone-200 text-stone-700 text-sm font-bold hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!toggleConfirm || deleting}
                onClick={handleConfirmDelete}
                className={`flex-1 px-4 py-3.5 rounded-2xl text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  !toggleConfirm
                    ? "bg-stone-300 cursor-not-allowed shadow-none"
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30 hover:scale-[1.02]"
                }`}
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Confirm Delete"
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