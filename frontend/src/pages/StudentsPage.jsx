import { useEffect, useState, useMemo } from "react";
import client from "../api/client";
import { getSettings } from "../api/settings";

import {
  User,
  Phone,
  IndianRupee,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  Check,
  CheckSquare
} from "lucide-react";

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    name: "",
    parentName: "",
    phone: "",
    email: "",
    monthlyFee: "",
    batch: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // 🔹 NEW: global batch selection + checklist state
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]); // student ids
  const [updatingBatch, setUpdatingBatch] = useState(false);

  // ---- Helpers ----
  const getBatchLabel = (batchId) => {
    if (!batchId) return "No batch";
    const b = batches.find((x) => x._id === batchId);
    if (!b) return "No batch";
    return b.timing ? `${b.name} (${b.timing})` : b.name;
  };

  // ---- Toggle Active/Inactive ----
  const handleToggleisActive = async (student) => {
    try {
      setTogglingId(student._id);
      setError("");

      // optimistic
      setStudents((prev) =>
        prev.map((s) =>
          s._id === student._id ? { ...s, isActive: !Boolean(s.isActive) } : s
        )
      );

      await client.put(`/students/${student._id}`, {
        isActive: !Boolean(student.isActive),
      });
    } catch (err) {
      // rollback
      setStudents((prev) =>
        prev.map((s) =>
          s._id === student._id
            ? { ...s, isActive: Boolean(student.isActive) }
            : s
        )
      );
      setError(err.response?.data?.message || "Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  // ---- Loaders ----
  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await client.get("/students");
      setStudents(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const res = await client.get("/batches");
      setBatches(res.data);
    } catch (err) {
      console.error("Failed to load batches", err);
    }
  };

  useEffect(() => {
    loadStudents();
    loadBatches();
    loadDefaultFee();
  }, []);
  const loadDefaultFee = async () => {
    try {
      const res = await getSettings();
      const defaultFee = res.data?.defaultMonthlyFee || 0;

      setForm((prev) => ({
        ...prev,
        monthlyFee: defaultFee ? String(defaultFee) : "",
      }));
    } catch (err) {
      console.log("Default fee not loaded");
    }
  };

  // ---- Form ----
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSaving(true);
      setError("");

      await client.post("/students", {
        ...form,
        monthlyFee: form.monthlyFee ? Number(form.monthlyFee) : 0,
        batch: form.batch || undefined,
      });

      // ✅ SAFE RESET WITHOUT res
      setForm((prev) => ({
        name: "",
        parentName: "",
        phone: "",
        email: "",
        monthlyFee: prev.monthlyFee, // keep default fee
        batch: "",
      }));

      loadStudents();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add student.");
    } finally {
      setSaving(false);
    }
  };

  // ---- Checklist selection ----
  const toggleSelectStudent = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = sortedStudents.map((s) => s._id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      // unselect all visible
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      // add all visible
      setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  // ---- Apply batch to selected ----
  const handleApplyBatch = async () => {
    if (!selectedBatch || selectedIds.length === 0) return;

    try {
      setUpdatingBatch(true);
      setError("");

      // optimistic UI
      setStudents((prev) =>
        prev.map((s) =>
          selectedIds.includes(s._id) ? { ...s, batch: selectedBatch } : s
        )
      );

      // sequential calls to existing single-student endpoint
      for (const id of selectedIds) {
        await client.put(`/students/${id}`, { batch: selectedBatch });
      }

      // clear selection after success
      setSelectedIds([]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update batch.");
      // reload to be safe
      loadStudents();
    } finally {
      setUpdatingBatch(false);
    }
  };

  // ---- Filter / counts ----
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.parentName &&
        s.parentName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedStudents = [...filteredStudents].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const activeCount = useMemo(
    () => students.filter((s) => Boolean(s.isActive)).length,
    [students]
  );

  const inactiveCount = useMemo(
    () => students.length - activeCount,
    [students, activeCount]
  );

  const allVisibleSelected =
    sortedStudents.length > 0 &&
    sortedStudents.every((s) => selectedIds.includes(s._id));

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-10">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Students Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage registrations, batches and fees.
          </p>
        </div>
        
        {/* Stats Chips */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active</span>
            <span className="text-rose-600 text-lg font-black leading-none">
              {activeCount}
            </span>
          </div>

          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Inactive</span>
            <span className="text-slate-600 text-lg font-black leading-none">
              {inactiveCount}
            </span>
          </div>
        </div>
      </div>

      {/* --- ADD STUDENT FORM --- */}
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <Plus size={14} strokeWidth={3} />
          </div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
            Register New Student
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wide">
                Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors"
                />
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Rahul"
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Parent */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wide">
                Parent Name
              </label>
              <div className="relative group">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors"
                />
                <input
                  name="parentName"
                  value={form.parentName}
                  onChange={handleChange}
                  placeholder="Mr. Kumar"
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wide">
                Phone
              </label>
              <div className="relative group">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors"
                />
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Fee */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wide">
                Monthly Fee
              </label>
              <div className="relative group">
                <IndianRupee
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors"
                />
                <input
                  name="monthlyFee"
                  type="number"
                  value={form.monthlyFee}
                  onChange={handleChange}
                  placeholder="2000"
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Batch select for new student */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wide">
                Batch
              </label>
              <div className="relative group">
                <CheckSquare
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors"
                />
                <select
                  name="batch"
                  value={form.batch}
                  onChange={handleChange}
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all appearance-none text-slate-600"
                >
                  <option value="">
                    {batches.length
                      ? "Select batch (optional)"
                      : "No batches yet"}
                  </option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} {b.timing ? `(${b.timing})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="text-xs text-rose-500 font-bold min-h-5">
              {error && (
                <span className="flex items-center gap-1">
                  <AlertTriangle size={14} /> {error}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              {saving ? "Saving..." : "Add Student"}
            </button>
          </div>
        </form>
      </div>

      {/* --- STUDENT LIST --- */}
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 flex flex-col">
        {/* Search + Global batch controls */}
        <div className="px-5 py-5 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Enrolled Students
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
               <div className="relative flex-1 sm:w-64">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>

               {/* Global batch + apply */}
              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="flex-1 sm:flex-initial bg-slate-50 rounded-xl border border-slate-200 px-3 py-2.5 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all min-w-[140px]"
                >
                  <option value="">
                    {batches.length ? "Batch Update" : "No batches"}
                  </option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} {b.timing ? `(${b.timing})` : ""}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleApplyBatch}
                  disabled={
                    !selectedBatch || selectedIds.length === 0 || updatingBatch
                  }
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-500/20 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updatingBatch ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span className="hidden sm:inline">Apply</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Select All Toggle (Visible mostly on Mobile or when items selected) */}
          {(sortedStudents.length > 0) && (
             <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="selectAll" className="text-xs font-bold text-slate-500 cursor-pointer select-none">
                   Select All Visible ({selectedIds.length} selected)
                </label>
             </div>
          )}
        </div>

        {/* Content Area */}
        <div className="relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
              <Loader2 size={32} className="animate-spin text-rose-500" />
            </div>
          )}

          {!loading && sortedStudents.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
              <User size={48} className="opacity-10 mb-2" />
              <p className="text-sm font-medium">No students found.</p>
            </div>
          )}

          {!loading && sortedStudents.length > 0 && (
            <>
              {/* 📱 MOBILE VIEW: CARDS (Visible on small screens) */}
              <div className="block md:hidden p-4 space-y-3 bg-slate-50/50">
                {sortedStudents.map((s) => {
                   const checked = selectedIds.includes(s._id);
                   return (
                     <div 
                       key={s._id} 
                       className={`bg-white p-4 rounded-2xl border ${checked ? 'border-rose-300 shadow-md shadow-rose-100' : 'border-slate-100 shadow-sm'} transition-all duration-200 relative overflow-hidden`}
                     >
                       {/* Left Accent Bar */}
                       <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />

                       <div className="flex gap-3">
                          {/* Checkbox */}
                          <div className="pt-1">
                             <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSelectStudent(s._id)}
                                className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                              />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                             {/* Name & Status */}
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                   <h4 className={`text-base font-bold truncate ${!s.isActive && 'text-slate-400 line-through'}`}>{s.name}</h4>
                                   <p className="text-xs text-slate-400 font-medium">{s.phone}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${s.isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                                  {s.isPaid ? "PAID" : "DUE"}
                                </span>
                             </div>

                             {/* Details Grid */}
                             <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mb-3">
                                <div>
                                   <p className="text-slate-400 font-bold uppercase text-[10px]">Parent</p>
                                   <p className="text-slate-700 font-medium truncate">{s.parentName || "-"}</p>
                                </div>
                                <div>
                                   <p className="text-slate-400 font-bold uppercase text-[10px]">Batch</p>
                                   <p className="text-slate-700 font-medium truncate">{getBatchLabel(s.batch)}</p>
                                </div>
                                <div>
                                   <p className="text-slate-400 font-bold uppercase text-[10px]">Fee</p>
                                   <p className="text-slate-700 font-medium">₹{s.monthlyFee}</p>
                                </div>
                             </div>

                             {/* Actions Row */}
                             <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                <button
                                  onClick={() => handleToggleisActive(s)}
                                  disabled={togglingId === s._id}
                                  className="flex-1 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition flex items-center justify-center gap-1"
                                >
                                  {togglingId === s._id ? <Loader2 size={12} className="animate-spin" /> : (s.isActive ? "Deactivate" : "Activate")}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedStudent(s);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                                >
                                   <Trash2 size={14} />
                                </button>
                             </div>
                          </div>
                       </div>
                     </div>
                   )
                })}
              </div>

              {/* 💻 DESKTOP VIEW: TABLE (Hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50/80 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-100 backdrop-blur-sm sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-4 text-center w-12">
                         {/* Header checkbox handled in main header now */}
                         #
                      </th>
                      <th className="px-6 py-4 text-left pl-4">Student</th>
                      <th className="px-6 py-4 text-left">Parent Info</th>
                      <th className="px-6 py-4 text-left">Batch</th>
                      <th className="px-6 py-4 text-left">Fee Status</th>
                      <th className="px-6 py-4 text-right pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedStudents.map((s) => {
                      const checked = selectedIds.includes(s._id);
                      return (
                        <tr
                          key={s._id}
                          className={`group hover:bg-slate-50/80 transition-colors ${
                            !s.isActive ? "opacity-50 grayscale" : ""
                          } ${checked ? "bg-rose-50/30" : ""}`}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelectStudent(s._id)}
                              className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                          </td>

                          {/* Student */}
                          <td className="px-6 py-4 pl-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs border border-rose-200">
                                {s.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">
                                  {s.name}
                                </div>
                                <div className="text-xs text-slate-400 font-mono font-medium">
                                  {s.phone || "No phone"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Parent + fee */}
                          <td className="px-6 py-4">
                            <div className="text-slate-700 font-medium text-xs">
                              {s.parentName || "-"}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                              {s.monthlyFee ? `Fee: ₹${s.monthlyFee}` : "Fee: -"}
                            </div>
                          </td>

                          {/* Batch */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200">
                              {getBatchLabel(s.batch)}
                            </span>
                          </td>

                          {/* Fee status */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                s.isPaid
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  s.isPaid ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                              ></span>
                              {s.isPaid ? "Paid" : "Pending"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right pr-8 flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleisActive(s)}
                              disabled={
                                togglingId === s._id || deletingId === s._id
                              }
                              className="p-2 rounded-lg hover:bg-white text-slate-400 hover:text-rose-600 hover:shadow-sm border border-transparent hover:border-slate-100 transition-all"
                              title={
                                !s.isActive
                                  ? "Mark Active"
                                  : "Mark Inactive"
                            }
                            >
                              {togglingId === s._id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : s.isActive ? (
                                <X size={16} />
                              ) : (
                                <Check size={16} />
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setSelectedStudent(s);
                                setShowDeleteModal(true);
                              }}
                              disabled={deletingId === s._id}
                              className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- DELETE MODAL --- */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-white/20 p-6 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-5 shadow-sm">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Delete Student?
              </h3>
              <p className="text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-bold text-slate-800">
                  "{selectedStudent.name}"
                </span>?
                <br />
                This action cannot be undone.
              </p>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeletingId(selectedStudent._id);
                    try {
                      await client.delete(`/students/${selectedStudent._id}`);
                      setStudents((prev) =>
                        prev.filter((s) => s._id !== selectedStudent._id)
                      );
                    } catch (err) {
                      setError("Failed to delete.");
                    } finally {
                      setShowDeleteModal(false);
                      setDeletingId(null);
                      setSelectedStudent(null);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;