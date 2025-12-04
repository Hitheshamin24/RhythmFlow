import { useEffect, useState, forwardRef } from "react";
import client from "../api/client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import default styles
import { 
  Calendar, 
  Check, 
  Save, 
  Users, 
  Clock, 
  Loader2, 
  CheckCircle2,
  XCircle
} from "lucide-react";

// Helper: Format Date Object -> YYYY-MM-DD string for Backend
const formatDateForBackend = (date) => {
  return date.toISOString().slice(0, 10);
};

const AttendancePage = () => {
  // 1. State now holds a Date Object, not a string
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [students, setStudents] = useState([]);
  const [presentIds, setPresentIds] = useState(new Set());
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [absentees, setAbsentees] = useState([]);

  // Load Students
  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await client.get("/students");
      setStudents(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students.");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Load Attendance
  const loadAttendance = async (dateObj = selectedDate) => {
    if (!dateObj) return;
    try {
      setLoadingAttendance(true);
      setError("");
      setInfo("");

      // Convert Date Object to String for API
      const dateString = formatDateForBackend(dateObj);

      const res = await client.get("/attendance", {
        params: { date: dateString },
      });

      const present = res.data?.presentStudents || [];
      const absent = res.data?.absentees || [];

      setPresentIds(new Set(present.map((s) => s._id)));
      setAbsentees(absent);
      setInfo(`Loaded: ${present.length} Present, ${absent.length} Absent`);
    } catch (err) {
      setPresentIds(new Set());
      setAbsentees([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      loadAttendance(selectedDate);
    }
    // eslint-disable-next-line
  }, [selectedDate, students.length]);

  const togglePresent = (id) => {
    setPresentIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const markAllPresent = () => {
    setPresentIds(new Set(students.map((s) => s._id)));
  };

  const clearAll = () => {
    setPresentIds(new Set());
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setInfo("");

      const body = {
        date: formatDateForBackend(selectedDate), // Convert for API
        presentStudents: Array.from(presentIds),
      };

      await client.post("/attendance", body);
      await loadAttendance(selectedDate);
      setInfo("Attendance saved successfully.");
      setTimeout(() => setInfo(""), 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const computedAbsentees =
    absentees.length > 0
      ? absentees
      : students.filter((s) => !presentIds.has(s._id));

  const isLoading = loadingStudents || loadingAttendance;

  // --- CUSTOM TRIGGER COMPONENT ---
  // This looks exactly like your old card, but triggers React Datepicker
  const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <div 
      onClick={onClick}
      ref={ref}
      className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 cursor-pointer group hover:border-rose-300 transition-all select-none w-auto sm:w-52"
    >
      <div className="bg-rose-50 h-10 w-10 rounded-xl flex items-center justify-center text-rose-500 group-hover:bg-rose-100 transition-colors">
        <Calendar size={20} />
      </div>
      <div className="flex flex-col px-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer">
          Select Date
        </label>
        <p className="text-sm font-bold text-slate-800 whitespace-nowrap">
          {value} {/* Datepicker passes the formatted string here */}
        </p>
      </div>
    </div>
  ));

  return (
    <div className="space-y-8 pb-10">
      
      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance</h2>
          <p className="text-sm text-slate-500 mt-1">
            Track daily student attendance and view history.
          </p>
        </div>

        {/* --- REACT DATE PICKER --- */}
        <div className="relative z-20">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="EEE, MMM d, yyyy" // e.g. "Mon, Nov 30, 2025"
            customInput={<CustomDateInput />} // Uses your styled card
            popperPlacement="bottom-end"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- LEFT PANEL: Attendance Marking --- */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[600px]">
          
          {/* Header Actions */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Clock size={16} />
               </div>
               <div>
                 <h3 className="text-sm font-bold text-slate-800">Mark Attendance</h3>
                 <p className="text-xs text-slate-500 hidden sm:block">
                   Date: {formatDateForBackend(selectedDate)}
                 </p>
               </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={markAllPresent}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                <CheckCircle2 size={14} /> Mark All
              </button>
              <button
                onClick={clearAll}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1"
              >
                <XCircle size={14} /> Clear
              </button>
            </div>
          </div>

          {/* Student List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
             {isLoading ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                 <Loader2 size={32} className="animate-spin text-rose-500 mb-2" />
                 <p className="text-xs text-slate-500">Loading roster...</p>
               </div>
             ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                   <Users size={40} className="mb-3 opacity-20" />
                   <p className="text-sm">No students found in directory.</p>
                </div>
             ) : (
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-white z-10 shadow-sm">
                    <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-6 w-16 text-center">Status</th>
                      <th className="py-3 px-6">Student Name</th>
                      <th className="py-3 px-6">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.map((s) => {
                      const isPresent = presentIds.has(s._id);
                      return (
                        <tr
                          key={s._id}
                          onClick={() => togglePresent(s._id)}
                          className={`cursor-pointer transition-all duration-200 group ${
                            isPresent ? "bg-rose-50/60" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="py-3 px-6 text-center">
                            <div className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center border transition-all duration-200 ${
                                isPresent 
                                ? "bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200" 
                                : "bg-white border-slate-300 group-hover:border-rose-300"
                            }`}>
                                {isPresent && <Check size={14} strokeWidth={3} />}
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-3">
                               <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                   isPresent ? "bg-rose-200 text-rose-700" : "bg-slate-100 text-slate-500"
                               }`}>
                                   {s.name.charAt(0).toUpperCase()}
                               </div>
                               <span className={`font-semibold transition-colors ${
                                   isPresent ? "text-slate-900" : "text-slate-600"
                               }`}>
                                   {s.name}
                               </span>
                            </div>
                          </td>
                          <td className="py-3 px-6 text-slate-400 text-xs font-mono">
                            {s.phone || "—"}
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
             <div className="flex-1">
                {error && (
                   <p className="text-xs text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 inline-flex items-center gap-2">
                      <XCircle size={14}/> {error}
                   </p>
                )}
                {info && !error && (
                   <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 inline-flex items-center gap-2">
                      <CheckCircle2 size={14}/> {info}
                   </p>
                )}
             </div>
             
             <button
                onClick={handleSave}
                disabled={saving || students.length === 0}
                className="px-6 py-2.5 rounded-xl bg-linear-to-r from-rose-500 to-pink-600 text-white text-sm font-bold shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
             >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />}
                {saving ? "Saving..." : "Save Report"}
             </button>
          </div>
        </div>

        {/* --- RIGHT PANEL: Absentees --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-fit">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800">Absentees List</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                    {computedAbsentees.length} student(s) absent on {formatDateForBackend(selectedDate)}
                </p>
            </div>
            
            <div className="p-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {computedAbsentees.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                        <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                            <Check size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-800">100% Attendance!</p>
                        <p className="text-xs text-slate-500 mt-1">Everyone is present today.</p>
                    </div>
                ) : (
                    <ul className="space-y-1">
                        {computedAbsentees.map((s) => (
                            <li key={s._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-xs font-bold">
                                        {s.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{s.name}</p>
                                        <p className="text-[10px] text-slate-400">
                                            {s.phone ? `Ph: ${s.phone}` : s.parentName || "No contact info"}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Absent</span>
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