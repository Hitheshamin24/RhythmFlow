import { useEffect, useState, useMemo } from "react";
import StatCard from "../components/StatCard";
import client from "../api/client";
import { getPayments } from "../api/payments";
import {
  Users,
  Banknote,
  Calendar,
  Activity,
  MoreHorizontal,
  ArrowUpRight,
  Clock,
} from "lucide-react";

const DashboardPage = () => {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [payments, setPayments] = useState({
    total: 0,
    paidCount: 0,
    unpaidCount: 0,
    paid: [],
    unpaid: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attendanceStats, setAttendanceStats] = useState({
    currentRate: 0, // this month
    lastRate: 0, // previous month
  });

  // ---- Loaders ----
  const loadStudents = async () => {
    const res = await client.get("/students");
    setStudents(res.data || []);
  };

  const loadBatches = async () => {
    const res = await client.get("/batches");
    setBatches(res.data || []);
  };

  const loadPayments = async () => {
    const res = await getPayments();
    setPayments(res.data || {});
  };
  const loadAttendanceSummary = async () => {
    const res = await client.get("/attendance/summary");
    // EXPECTED backend response:
    // { currentRate: number, lastRate: number }
    setAttendanceStats({
      currentRate: res.data?.currentRate || 0,
      lastRate: res.data?.lastRate || 0,
    });
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        await Promise.all([
          loadStudents(),
          loadBatches(),
          loadPayments(),
          loadAttendanceSummary(), // 🔹 add this
        ]);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ---- Derived Stats ----
  const totalStudents = students.length;
  const activeStudents = useMemo(
    () => students.filter((s) => s.isActive).length,
    [students]
  );

  const attendanceRate = totalStudents
    ? Math.round((activeStudents / totalStudents) * 100)
    : 0;

  const monthlyRevenue = useMemo(() => {
    const paidList = payments.paid || [];
    return paidList.reduce(
      (sum, s) => sum + (s.monthlyFee ? Number(s.monthlyFee) : 0),
      0
    );
  }, [payments]);

  // ---- Recent Payments from payments.paid ----
  const recentPayments = useMemo(() => {
    const paidList = payments.paid || [];
    const sorted = [...paidList].sort((a, b) => {
      const da = a.lastPaidDate ? new Date(a.lastPaidDate) : 0;
      const db = b.lastPaidDate ? new Date(b.lastPaidDate) : 0;
      return db - da; // latest first
    });

    return sorted.slice(0, 3).map((s) => {
      const dateStr = s.lastPaidDate
        ? new Date(s.lastPaidDate).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Date not set";

      return {
        name: s.name,
        amount: s.monthlyFee
          ? `+ ₹${Number(s.monthlyFee).toLocaleString("en-IN")}`
          : "Paid",
        date: dateStr,
        status: "success",
      };
    });
  }, [payments]);

  // ---- Upcoming classes from batches + student counts ----
  const upcomingClasses = useMemo(() => {
    if (!batches.length) return [];

    return (
      batches
        .map((b) => {
          const count = students.filter(
            (s) => String(s.batch || "") === String(b._id)
          ).length;

          return {
            time: b.timing || "—",
            title: b.name,
            instructor: "Studio Batch", // you can later map to real instructor
            students: count,
          };
        })
        // optionally sort by time (strings)
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(0, 4)
    );
  }, [batches, students]);
  const { currentRate, lastRate } = attendanceStats;
  const diff = currentRate - lastRate;
  const diffLabel =
    diff === 0
      ? "No change vs last month"
      : `${diff > 0 ? "+" : ""}${diff.toFixed(1)}% vs last month`;

  return (
    <div className="space-y-8 pb-8">
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm mb-2">
          {error}
        </div>
      )}

      {/* --- Top Stats Row --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Students"
          value={String(totalStudents)}
          icon={<Users size={22} />}
          subtext={`${activeStudents} active this month`}
          trend={activeStudents >= totalStudents / 2 ? "up" : "down"}
        />
        <StatCard
          label="Monthly Revenue"
          value={`₹${monthlyRevenue.toLocaleString("en-IN")}`}
          icon={<Banknote size={22} />}
          subtext={`${payments.paidCount || 0} paid / ${
            payments.total || 0
          } students`}
          trend="up"
        />
        <StatCard
          label="Attendance Rate"
          value={`${currentRate.toFixed(1)}%`}
          icon={<Activity size={22} />}
          subtext={diffLabel}
          trend={diff >= 0 ? "up" : "down"}
        />
      </div>

      {/* --- Charts Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Attendance (Mock visualization, but based on counts if you want later) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Weekly Attendance
              </h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">
                Active vs Total (visual)
              </p>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* CSS-only Mock Chart (Visual representation) */}
          <div className="h-64 flex items-end justify-between px-2 gap-2 md:gap-4">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div
                key={i}
                className="w-full flex flex-col items-center gap-2 group/bar"
              >
                <div
                  className="w-full max-w-10 bg-rose-500/10 rounded-t-xl relative overflow-hidden transition-all duration-300 hover:bg-rose-500/20"
                  style={{ height: `${h}%` }}
                >
                  {/* Inner fill animation */}
                  <div
                    className="absolute bottom-0 left-0 w-full bg-rose-500 transition-all duration-1000"
                    style={{
                      height: "0%",
                      animation: `fillBar 1s ease-out ${i * 0.1}s forwards`,
                      "--target-height": "100%",
                    }}
                  ></div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {["M", "T", "W", "T", "F", "S", "S"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Finances Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Finances</h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">
                Current Month
              </p>
            </div>
            <button className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full hover:bg-rose-100 transition">
              View Report
            </button>
          </div>

          {/* Donut Chart Mockup */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* Outer Ring */}
            <div className="w-48 h-48 rounded-full border-12 border-slate-100 relative">
              {/* Colored Segments (CSS ring) */}
              <div className="absolute inset-0 rounded-full border-12 border-rose-500 border-t-transparent border-l-transparent -rotate-45"></div>
            </div>
            {/* Inner Text */}
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold text-slate-800">
                {payments.total
                  ? Math.round((payments.paidCount / payments.total) * 100)
                  : 0}
                %
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                Fee Collection
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-sm text-slate-600 font-medium">
                Paid Students
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-200"></span>
              <span className="text-sm text-slate-600 font-medium">
                Pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Bottom Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Payments */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">
              Recent Payments
            </h2>
            <ArrowUpRight
              className="text-slate-400 cursor-pointer hover:text-rose-500 transition"
              size={20}
            />
          </div>

          <div className="space-y-4">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400">
                No recent payments recorded yet.
              </p>
            ) : (
              recentPayments.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-linear-to-br from-rose-100 to-pink-200 flex items-center justify-center text-rose-700 font-bold text-sm">
                      {payment.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {payment.name}
                      </p>
                      <p className="text-xs text-slate-400">{payment.date}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      payment.status === "success"
                        ? "text-emerald-500"
                        : "text-amber-500"
                    }`}
                  >
                    {payment.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Schedule (from batches) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">
              Today's Schedule
            </h2>
            <button className="text-sm text-rose-600 font-medium hover:underline">
              See all
            </button>
          </div>

          <div className="space-y-0">
            {upcomingClasses.length === 0 ? (
              <p className="text-xs text-slate-400">
                No batches created yet. Create batches to see schedule here.
              </p>
            ) : (
              upcomingClasses.map((cls, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 border-l-2 border-slate-100 hover:border-rose-500 hover:bg-slate-50 transition-all duration-300"
                >
                  <div className="min-w-[70px]">
                    <p className="text-sm font-bold text-slate-800">
                      {cls.time}
                    </p>
                    <p className="text-xs text-slate-400">
                      {cls.students} students
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {cls.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Users size={12} /> {cls.students}
                      </span>
                      <span className="text-xs text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                        {cls.instructor}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Simple animation styles for the mock chart */}
      <style>{`
        @keyframes fillBar {
          from { height: 0%; }
          to { height: var(--target-height); }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
