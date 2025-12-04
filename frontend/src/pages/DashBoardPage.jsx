import StatCard from "../components/StatCard";
import { 
  Users, 
  Banknote, 
  Calendar, 
  Activity, 
  MoreHorizontal, 
  ArrowUpRight,
  Clock
} from "lucide-react";

const DashboardPage = () => {
  
  // Mock Data for UI visualization
  const recentPayments = [
    { name: "Alice Johnson", amount: "+ $120.00", date: "Today, 10:23 AM", status: "success" },
    { name: "Michael Smith", amount: "+ $85.00", date: "Yesterday, 4:15 PM", status: "success" },
    { name: "Sophie Turner", amount: "Pending", date: "Yesterday, 2:30 PM", status: "pending" },
  ];

  const upcomingClasses = [
    { time: "04:00 PM", title: "Hip Hop Inter.", instructor: "Sarah J.", students: 12 },
    { time: "05:30 PM", title: "Ballet Basics", instructor: "Emily R.", students: 8 },
    { time: "07:00 PM", title: "Contemp. Fusion", instructor: "Mike T.", students: 15 },
  ];

  return (
    <div className="space-y-8 pb-8">
      
      {/* --- Top Stats Row --- */}
      {/* These use the Dark StatCard component to pop against the light bg */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Students"
          value="156"
          icon={<Users size={22} />}
          subtext="+12% vs last month"
          trend="up"
        />
        <StatCard
          label="Monthly Revenue"
          value="$12,450"
          icon={<Banknote size={22} />}
          subtext="+8% vs last month"
          trend="up"
        />
       
        <StatCard
          label="Attendance Rate"
          value="94%"
          icon={<Activity size={22} />}
          subtext="+3% vs last week"
          trend="up"
        />
      </div>

      {/* --- Charts Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Attendance (Takes up 2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Weekly Attendance</h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Live Overview</p>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition">
              <MoreHorizontal size={20} />
            </button>
          </div>
          
          {/* CSS-only Mock Chart (Visual representation) */}
          <div className="h-64 flex items-end justify-between px-2 gap-2 md:gap-4">
            {/* Generating bars with random heights for visual effect */}
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-2 group/bar">
                <div 
                  className="w-full max-w-10 bg-rose-500/10 rounded-t-xl relative overflow-hidden transition-all duration-300 hover:bg-rose-500/20"
                  style={{ height: `${h}%` }}
                >
                  {/* Inner fill animation */}
                  <div className="absolute bottom-0 left-0 w-full bg-rose-500 transition-all duration-1000" style={{ height: '0%', animation: `fillBar 1s ease-out ${i*0.1}s forwards`, '--target-height': '100%' }}></div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {['M','T','W','T','F','S','S'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Income vs Expenses (1 Column) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-start mb-6">
             <div>
              <h2 className="text-lg font-bold text-slate-800">Finances</h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Last 30 Days</p>
            </div>
             <button className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full hover:bg-rose-100 transition">
              View Report
            </button>
          </div>
          
          {/* Donut Chart Mockup */}
          <div className="flex-1 flex items-center justify-center relative">
             {/* Outer Ring */}
             <div className="w-48 h-48 rounded-full border-12 border-slate-100 relative">
                {/* Colored Segments (CSS Conic linear) */}
                <div className="absolute inset-0 rounded-full border-12 border-rose-500 border-t-transparent border-l-transparent -rotate-45"></div>
             </div>
             {/* Inner Text */}
             <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-800">78%</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Profit Margin</span>
             </div>
          </div>
          
          <div className="mt-6 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-sm text-slate-600 font-medium">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-200"></span>
              <span className="text-sm text-slate-600 font-medium">Expenses</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Bottom Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Payments */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Recent Payments</h2>
            <ArrowUpRight className="text-slate-400 cursor-pointer hover:text-rose-500 transition" size={20} />
          </div>
          
          <div className="space-y-4">
            {recentPayments.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition group">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-linear-to-br from-rose-100 to-pink-200 flex items-center justify-center text-rose-700 font-bold text-sm">
                    {payment.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{payment.name}</p>
                    <p className="text-xs text-slate-400">{payment.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${payment.status === 'success' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {payment.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Today's Schedule</h2>
            <button className="text-sm text-rose-600 font-medium hover:underline">See all</button>
          </div>

          <div className="space-y-0">
            {upcomingClasses.map((cls, index) => (
              <div key={index} className="flex gap-4 p-4 border-l-2 border-slate-100 hover:border-rose-500 hover:bg-slate-50 transition-all duration-300">
                <div className="min-w-[70px]">
                  <p className="text-sm font-bold text-slate-800">{cls.time}</p>
                  <p className="text-xs text-slate-400">45 min</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{cls.title}</h4>
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
            ))}
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