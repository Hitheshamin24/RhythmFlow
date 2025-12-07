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
      monthlyFee: prev.monthlyFee,  // keep default fee
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
    <div className="space-y-8 pb-10">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Students Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage registrations, batches and fee details.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="bg-white px-3 py-2 rounded-2xl border border-slate-100 shadow-sm text-xs font-semibold text-slate-500 flex items-center gap-3">
            <span className="text-xs uppercase text-slate-400">Active</span>
            <span className="text-rose-600 text-base font-bold">
              {activeCount}
            </span>
          </div>

          <div className="bg-white px-3 py-2 rounded-2xl border border-slate-100 shadow-sm text-xs font-semibold text-slate-500 flex items-center gap-3">
            <span className="text-xs uppercase text-slate-400">Inactive</span>
            <span className="text-slate-600 text-base font-bold">
              {inactiveCount}
            </span>
          </div>
        </div>
      </div>

      {/* --- ADD STUDENT FORM --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <Plus size={16} />
          </div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Register New Student
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">
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
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Parent */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">
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
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Phone
              </label>
              <div className="relative group">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors"
                />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Fee */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">
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
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Batch select for new student */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Batch
              </label>
              <div className="relative group">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors"
                />
                <select
                  name="batch"
                  value={form.batch}
                  onChange={handleChange}
                  className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
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
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-xs text-rose-500 font-medium">
              {error && `⚠️ ${error}`}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold shadow-md shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        {/* Search + Global batch controls */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-base font-bold text-slate-800">
            Enrolled Students
          </h3>

          <div className="flex flex-col md:flex-row gap-3 md:items-center w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>

            {/* Global batch + apply */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="bg-slate-50 rounded-full border border-slate-200 px-4 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all min-w-[180px]"
              >
                <option value="">
                  {batches.length ? "Select batch for update" : "No batches"}
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
                className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-rose-500/20 hover:bg-rose-700 hover:shadow-rose-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updatingBatch && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {selectedIds.length != 0
                  ? `Apply to selected  (${selectedIds.length})`
                  : "Apply Batches"}
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="relative">
          {loading && (
            <div className="p-12 flex justify-center">
              <Loader2 size={32} className="animate-spin text-rose-500" />
            </div>
          )}

          {!loading && sortedStudents.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-sm">
              No students found.
            </div>
          )}

          {!loading && sortedStudents.length > 0 && (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50/50 text-slate-400 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
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
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelectStudent(s._id)}
                            className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                          />
                        </td>

                        {/* Student */}
                        <td className="px-6 py-4 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs border border-rose-200">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">
                                {s.name}
                              </div>
                              <div className="text-xs text-slate-400 font-mono">
                                {s.phone || "No phone"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Parent + fee */}
                        <td className="px-6 py-4">
                          <div className="text-slate-600">
                            {s.parentName || "-"}
                          </div>
                          
                          
                          <div className="text-xs text-slate-400">
                            {s.monthlyFee ? `Fee: ₹${s.monthlyFee}` : "Fee: -"}
                          </div>
                        </td>

                        {/* Batch (read-only text) */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
                            {getBatchLabel(s.batch)}
                          </span>
                        </td>

                        {/* Fee status pill */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
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
                            className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-2"
                            title={
                              !s.isActive
                                ? "Mark Active for this month"
                                : "Mark inActive for this month"
                            }
                          >
                            {togglingId === s._id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : s.isActive ? (
                              <X size={18} />
                            ) : (
                              <User size={18} />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setShowDeleteModal(true);
                            }}
                            disabled={deletingId === s._id}
                            className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- DELETE MODAL --- */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-white/20 p-6 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Delete Student?
              </h3>
              <p className="text-sm text-slate-500 mt-2 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-bold text-slate-800">
                  {selectedStudent.name}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition"
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
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition"
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
