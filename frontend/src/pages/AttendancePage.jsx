import { useEffect, useState, forwardRef } from "react";
import client from "../api/client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Calendar,
  Check,
  Save,
  Users,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Layers,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

// Map your schema days → JS Date.getDay() index
const DAY_TO_INDEX = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};
// Helper: Format Date Object -> YYYY-MM-DD string for Backend
const formatDateForBackend = (date) => {
  return date.toISOString().slice(0, 10);
};

const AttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [students, setStudents] = useState([]);
  const [absentIds, setAbsentIds] = useState(new Set()); // Stores ABSENTEES
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Batches
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  // ✅ Selected batch object
  const selectedBatch = batches.find((b) => b._id === selectedBatchId);

  // ✅ Allow only class days in calendar
  const isDateAllowed = (date) => {
    if (
      !selectedBatch ||
      !selectedBatch.days ||
      selectedBatch.days.length === 0
    ) {
      return false; // no batch → no dates allowed
    }

    const allowedIndexes = selectedBatch.days
      .map((d) => DAY_TO_INDEX[d.toLowerCase()])
      .filter((d) => d !== undefined);

    const dow = date.getDay(); // 0 (Sun) → 6 (Sat)

    return allowedIndexes.includes(dow);
  };

  // Load Students
  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await client.get("/students");

      // ✅ Only ACTIVE students + ✅ SORT ascending by name
      const activeStudents = (res.data || [])
        .filter((s) => s.isActive)
        .sort((a, b) => a.name.localeCompare(b.name));

      setStudents(activeStudents);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students.");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Load Batches
  const loadBatches = async () => {
    try {
      const res = await client.get("/batches");
      setBatches(res.data || []);
    } catch (err) {
      console.error("Failed to load batches", err);
    }
  };

  // Load Attendance (batch + date)
  const loadAttendance = async (
    dateObj = selectedDate,
    batchId = selectedBatchId
  ) => {
    if (!dateObj || !batchId) {
      setAbsentIds(new Set());
      return;
    }
    try {
      setLoadingAttendance(true);
      setError("");
      setInfo("");

      const dateString = formatDateForBackend(dateObj);

      const res = await client.get("/attendance", {
        params: { date: dateString, batch: batchId },
      });

      const present = res.data?.presentStudents || [];
      const batchStudents = students.filter((s) => s.batch === batchId);

      if (present.length === 0) {
        // Treat as "no attendance yet" → everyone is present by default
        setAbsentIds(new Set());
        setInfo(`No record found. Defaulting to all present.`);
      } else {
        // Normal case: calculate absentees based on who is NOT in the present list
        const presentSet = new Set(present.map((s) => s._id));
        const newAbsentIds = new Set(
          batchStudents.filter((s) => !presentSet.has(s._id)).map((s) => s._id)
        );

        setAbsentIds(newAbsentIds);
        setInfo(
          `Loaded: ${present.length} Present, ${
            batchStudents.length - present.length
          } Absent`
        );
      }
    } catch (err) {
      setAbsentIds(new Set());
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    loadStudents();
    loadBatches();
  }, []);

  // Reload attendance when date / batch / students are ready
  useEffect(() => {
    if (students.length > 0 && selectedBatchId) {
      loadAttendance(selectedDate, selectedBatchId);
    }
    // eslint-disable-next-line
  }, [selectedDate, students.length, selectedBatchId]);
  useEffect(() => {
    if (!selectedBatch) return;

    if (!isDateAllowed(selectedDate)) {
      let d = new Date();
      for (let i = 0; i < 7; i++) {
        if (isDateAllowed(d)) {
          setSelectedDate(new Date(d));
          break;
        }
        d.setDate(d.getDate() + 1);
      }
    }
    // eslint-disable-next-line
  }, [selectedBatchId, batches.length]);

  // Toggle ABSENT for a student
  const toggleAbsent = (id) => {
    setAbsentIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id); // was absent -> now present
      else copy.add(id); // now absent
      return copy;
    });
  };

  const markAllAbsent = () => {
    const list = selectedBatchId
      ? students.filter((s) => s.batch === selectedBatchId)
      : [];
    setAbsentIds(new Set(list.map((s) => s._id)));
  };

  const clearAll = () => {
    setAbsentIds(new Set());
  };

  const handleSave = async () => {
    if (!selectedBatchId) {
      setError("Please select a batch before saving.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setInfo("");

      // Logic: Convert "Absent IDs" back to "Present IDs" for backend
      const batchStudents = students.filter((s) => s.batch === selectedBatchId);
      const presentStudents = batchStudents
        .filter((s) => !absentIds.has(s._id))
        .map((s) => s._id);

      const body = {
        date: formatDateForBackend(selectedDate),
        batch: selectedBatchId,
        presentStudents,
      };

      await client.post("/attendance", body);
      await loadAttendance(selectedDate, selectedBatchId);
      setInfo("Attendance saved successfully.");
      setTimeout(() => setInfo(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // Students of selected batch
  const filteredStudents = selectedBatchId
    ? students.filter((s) => s.batch === selectedBatchId)
    : [];

  // Absentees = those in batch whose id is in absentIds
  const computedAbsentees = filteredStudents.filter((s) =>
    absentIds.has(s._id)
  );

  const isLoading = loadingStudents || loadingAttendance;

  // --- CUSTOM DATE INPUT COMPONENT ---
  const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <div
      onClick={onClick}
      ref={ref}
      className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 cursor-pointer group hover:border-rose-300 transition-all select-none min-w-[200px]"
    >
      <div className="bg-rose-50 h-9 w-9 rounded-xl flex items-center justify-center text-rose-500 group-hover:bg-rose-100 transition-colors">
        <Calendar size={18} />
      </div>
      <div className="flex flex-col">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer leading-tight">
          Date
        </label>
        <p className="text-sm font-bold text-slate-800 whitespace-nowrap leading-tight">
          {value}
        </p>
      </div>
    </div>
  ));

  CustomDateInput.displayName = "CustomDateInput";

  return (
    <div className="space-y-8 pb-10">
      {/* --- HEADER --- */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Attendance</h2>
          <p className="text-sm text-slate-500 mt-1">
            Select a batch and date to mark attendance.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Styled Batch Selector */}
          <div className="relative group min-w-[220px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 pointer-events-none z-10">
              <Layers size={18} />
            </div>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setAbsentIds(new Set());
                setInfo("");
                setError("");
              }}
              className="w-full appearance-none bg-white pl-10 pr-10 py-3 rounded-2xl border border-slate-200 shadow-sm text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 hover:border-rose-300 transition-all cursor-pointer"
            >
              <option value="">Select Batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ChevronDown size={16} />
            </div>
          </div>

          {/* Date Picker */}
          <div className="relative z-20">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="EEE, MMM d, yyyy"
              customInput={<CustomDateInput />}
              popperPlacement="bottom-end"
              filterDate={(date) => isDateAllowed(date)} // ✅ only allow class days
              disabled={!selectedBatchId} // ✅ disabled until batch selected
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- LEFT PANEL: Attendance Marking --- */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[600px]">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shadow-sm">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Mark Attendance
                </h3>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Tap row to mark{" "}
                  <span className="text-rose-600 font-bold">Absent</span>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={markAllAbsent}
                disabled={!selectedBatchId || filteredStudents.length === 0}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle size={14} /> Mark All Absent
              </button>
              <button
                onClick={clearAll}
                disabled={!selectedBatchId || filteredStudents.length === 0}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={14} /> All Present
              </button>
            </div>
          </div>

          {/* Student List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
                <Loader2
                  size={32}
                  className="animate-spin text-rose-500 mb-2"
                />
                <p className="text-xs text-slate-500 font-medium">
                  Loading roster...
                </p>
              </div>
            ) : !selectedBatchId ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                <div className="bg-slate-50 p-4 rounded-full mb-3">
                  <Layers size={32} className="opacity-40" />
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  No Batch Selected
                </p>
                <p className="text-xs mt-1">
                  Please select a batch above to start.
                </p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                <Users size={40} className="mb-3 opacity-20" />
                <p className="text-sm">No students found in this batch.</p>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6 w-20 text-center">Status</th>
                    <th className="py-3 px-6">Student Name</th>
                    <th className="py-3 px-6">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.map((s) => {
                    const isAbsent = absentIds.has(s._id);
                    return (
                      <tr
                        key={s._id}
                        onClick={() => toggleAbsent(s._id)}
                        className={`cursor-pointer transition-all duration-200 group border-l-4 ${
                          isAbsent
                            ? "bg-rose-50/40 border-l-rose-500"
                            : "hover:bg-slate-50 border-l-transparent"
                        }`}
                      >
                        <td className="py-3 px-6 text-center">
                          <div
                            className={`w-7 h-7 rounded-lg mx-auto flex items-center justify-center border transition-all duration-200 shadow-sm ${
                              isAbsent
                                ? "bg-rose-500 border-rose-500 text-white scale-110"
                                : "bg-white border-slate-200 text-slate-300 group-hover:border-rose-200"
                            }`}
                          >
                            {isAbsent ? (
                              <XCircle size={16} />
                            ) : (
                              <Check size={16} />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors border ${
                                isAbsent
                                  ? "bg-rose-100 text-rose-600 border-rose-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            >
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p
                                className={`font-semibold transition-colors ${
                                  isAbsent ? "text-rose-700" : "text-slate-700"
                                }`}
                              >
                                {s.name}
                              </p>
                              {/* Show parent name if available */}
                              {s.parentName && (
                                <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                                  p: {s.parentName}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-slate-500 text-xs font-mono">
                          {s.phone || <span className="text-slate-300">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Save Area */}
          <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
            <div className="flex-1 min-h-1">
              {error && (
                <p className="text-xs font-medium text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 inline-flex items-center gap-2 animate-in fade-in">
                  <AlertCircle size={14} /> {error}
                </p>
              )}
              {info && !error && (
                <p className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 inline-flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={14} /> {info}
                </p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={
                saving || !selectedBatchId || filteredStudents.length === 0
              }
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-rose-500 to-pink-600 text-white text-sm font-bold shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>

        {/* --- RIGHT PANEL: Absentees --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-fit">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Absentees List</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedBatchId
                ? `${computedAbsentees.length} student(s) marked absent`
                : "Select a batch to view"}
            </p>
          </div>

          <div className="p-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {!selectedBatchId ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4 text-slate-400">
                <Users size={32} className="mb-3 opacity-30" />
                <p className="text-xs">Choose a batch to manage attendance.</p>
              </div>
            ) : computedAbsentees.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3 border border-emerald-100">
                  <Check size={24} />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  100% Attendance
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Everyone is present!
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {computedAbsentees.map((s) => (
                  <li
                    key={s._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-100 hover:border-rose-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold border border-rose-200">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {s.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {s.phone
                            ? `Ph: ${s.phone}`
                            : s.parentName || "No info"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-white px-2 py-1 rounded border border-rose-100 shadow-sm">
                      Absent
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
