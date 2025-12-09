import { useState, useEffect } from "react";
import {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
} from "../api/batches";

import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  Clock,
} from "lucide-react";

const DAY_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const BatchesPage = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false); // create vs edit
  const [currentBatch, setCurrentBatch] = useState(null);

  // 🔹 now includes days: []
  const [form, setForm] = useState({ name: "", timing: "", days: [] });
  const [error, setError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDelete, setSelectedDelete] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getBatches();
      setBatches(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateModal = () => {
    setEditMode(false);
    setForm({ name: "", timing: "", days: [] });
    setError("");
    setShowModal(true);
  };

  const openEditModal = (batch) => {
    setEditMode(true);
    setCurrentBatch(batch);
    setForm({
      name: batch.name,
      timing: batch.timing,
      days: batch.days || [],
    });
    setError("");
    setShowModal(true);
  };

  const toggleDay = (day) => {
    setForm((prev) => {
      const exists = prev.days.includes(day);
      return {
        ...prev,
        days: exists
          ? prev.days.filter((d) => d !== day)
          : [...prev.days, day],
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!form.name.trim()) {
      setError("Batch name is required");
      setSaving(false);
      return;
    }

    if (!form.days || form.days.length === 0) {
      setError("Select at least one day for this batch.");
      setSaving(false);
      return;
    }

    try {
      if (editMode) {
        await updateBatch(currentBatch._id, {
          name: form.name.trim(),
          timing: form.timing,
          days: form.days,
        });
      } else {
        await createBatch({
          name: form.name.trim(),
          timing: form.timing,
          days: form.days,
        });
      }

      setShowModal(false);
      setForm({ name: "", timing: "", days: [] });
      await load();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save batch");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (batch) => {
    setSelectedDelete(batch);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteBatch(selectedDelete._id);
      setShowDeleteModal(false);
      await load();
    } catch (err) {
      console.error(err);
      setError("Failed to delete batch");
    }
  };

  const formatDays = (days = []) =>
    days.length ? days.join(" · ") : "No days set";

  return (
    <div className="space-y-8 pb-10">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Batches & Timings
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Organize your classes into specific time slots and days.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-linear-to-r from-rose-500 to-pink-600 text-white text-sm font-bold shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Create Batch
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* --- BATCH LIST CARD --- */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">All Batches</h3>
          <div className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
            Total: {batches.length}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-rose-500" />
            <p className="text-xs text-slate-400">Loading batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Layers size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-900 font-semibold">No batches found</p>
            <p className="text-sm text-slate-500 max-w-xs mt-1">
              Create your first batch (e.g., "Morning Yoga" or "Kids Hip Hop")
              to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/50">
                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Batch Name</th>
                  <th className="px-6 py-4">Timing</th>
                  <th className="px-6 py-4">Days</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {batches.map((b) => (
                  <tr
                    key={b._id}
                    className="group hover:bg-slate-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Generated Avatar */}
                        <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-md border border-rose-100">
                          {b.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 text-base">
                          {b.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 bg-slate-100/50 px-3 py-1.5 rounded-lg w-fit">
                        <Clock
                          size={14}
                          className="text-slate-400"
                        />
                        <span className="font-medium text-xs md:text-sm">
                          {b.timing || "No timing set"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex flex-wrap gap-1 text-xs text-slate-600">
                        {b.days && b.days.length ? (
                          b.days.map((d) => (
                            <span
                              key={d}
                              className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200"
                            >
                              {d}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">No days set</span>
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Batch"
                        >
                          <Edit3 size={18} />
                        </button>

                        <button
                          onClick={() => confirmDelete(b)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Batch"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editMode ? "Edit Batch" : "New Batch"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define your class group details.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                  Batch Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Morning Yoga"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition"
                />
              </div>

              {/* Timing */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                  Timing
                </label>
                <div className="relative">
                  <Clock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={form.timing}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, timing: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition"
                    placeholder="e.g. 5:00 PM - 6:00 PM"
                  />
                </div>
              </div>

              {/* Days selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                  Days
                </label>
                <p className="text-[11px] text-slate-400 mb-2 ml-1">
                  Select the days this batch runs.
                </p>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => {
                    const active = form.days.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                          active
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Save Batch"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-white/20">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <Trash2 size={24} />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Delete Batch?
              </h3>
              <p className="text-sm text-slate-500 mt-2 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-bold text-slate-800">
                  "{selectedDelete?.name}"
                </span>
                ? This cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchesPage;
