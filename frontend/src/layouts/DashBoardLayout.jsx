import Sidebar from "../components/Sidebar";
import { Bell } from "lucide-react"; 

const DashboardLayout = ({ children }) => {
  const studioName = localStorage.getItem("studioName") || "Sarah";

  // Full date for Desktop
  const fullDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Short date for Mobile
  const shortDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex h-screen bg-[#FFF5F7] text-slate-800 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <Sidebar />

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">
        
        {/* 3. HEADER */}
        <header className="shrink-0 z-20 w-full px-4 py-3 md:px-8 md:py-5 border-b border-pink-100 bg-white/80 backdrop-blur-md flex items-center justify-between shadow-sm">
          
          {/* LEFT: Welcome Message */}
          <div className="pl-12 md:pl-0 flex flex-col justify-center pr-2">
            <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900 truncate max-w-[200px] md:max-w-none">
              Welcome  <span className="text-rose-600">{studioName}</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5 hidden sm:block">
              Here&apos;s what&apos;s happening today.
            </p>
          </div>

          {/* RIGHT: Date & Actions */}
          <div className="flex items-center gap-3 md:gap-6">
            
            {/* Date Display */}
            <div className="flex flex-col items-end">
               {/* 'Today' label - Hidden on mobile */}
               <p className="hidden md:block text-xs font-bold text-slate-400 uppercase tracking-widest">
                 Today
               </p>
               
               {/* Responsive Date Text */}
               <p className="text-xs md:text-sm font-semibold text-slate-700 whitespace-nowrap">
                 <span className="md:hidden">{shortDate}</span>
                 <span className="hidden md:inline">{fullDate}</span>
               </p>
            </div>
            
            {/* Notification Bell */}
            <button className="relative p-2 rounded-full bg-slate-50 hover:bg-rose-50 border border-slate-100 transition-colors group">
              <Bell size={18} className="text-slate-600 group-hover:text-rose-500 md:w-5 md:h-5" />
              <span className="absolute top-1.5 right-2 h-1.5 w-1.5 md:top-2 md:h-2 md:w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* 4. CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
};

export default DashboardLayout;