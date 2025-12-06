import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X,Layers, ChevronLeft, ChevronRight, LogOut, Home, Users, Calendar, CreditCard, TrendingUp, Settings } from "lucide-react";
import image from "../assets/danceapp.png"

// Note: I swapped emojis for Lucide-React icons for a more professional responsive look. 
// If you don't use lucide-react, you can swap them back to emojis.
const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
  { label: "Students", path: "/dashboard/students", icon: <Users size={20} /> },
  { label: "Batches", path: "/dashboard/batches", icon: <Layers size={20} /> },
  { label: "Attendance", path: "/dashboard/attendance", icon: <Calendar size={20} /> },
  { label: "Payments", path: "/dashboard/payments", icon: <CreditCard size={20} /> },
  { label: "Finances", path: "/dashboard/finances", icon: <TrendingUp size={20} /> },
  { label: "Settings", path: "/dashboard/settings", icon: <Settings size={20} /> },
];

const Sidebar = () => {
  const navigate = useNavigate();
  // Desktop collapse state
  const [collapsed, setCollapsed] = useState(false);
  // Mobile open/close state
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const studioName = localStorage.getItem("studioName") || "DanceFlow";

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("studioName");
    navigate("/auth");
  };

  return (
    <>
      {/* --- Mobile Trigger Button (Visible only on mobile) --- */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 bg-[#1F1216] text-rose-500 rounded-lg shadow-lg border border-white/10 md:hidden"
      >
        <Menu size={24} />
      </button>

      {/* --- Mobile Overlay (Backdrop) --- */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* --- Sidebar Container --- */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-[#1F1216] border-r border-white/5 text-pink-50 flex flex-col 
          transition-all duration-300 ease-in-out
          ${/* Mobile: Slide in/out logic */ ""}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          
          ${/* Desktop: Always visible, handle width logic */ ""}
          md:relative md:translate-x-0 
          ${collapsed ? "md:w-20" : "md:w-64"}
          w-64
        `}
      >
        {/* --- Desktop Toggle Button (Hidden on Mobile) --- */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-9 z-50 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-full shadow-lg border-2 border-[#1F1216] transition-transform hover:scale-110 items-center justify-center"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* --- Mobile Close Button --- */}
        <button 
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute right-4 top-4 text-pink-200/60 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* --- Logo Area --- */}
        <div className={`flex items-center gap-4 px-6 py-6 ${collapsed ? "md:justify-center" : ""}`}>
          <div className="h-10 w-10 min-w-10 rounded-xl bg-gradient-to from-rose-500 to-pink-600 flex items-center justify-center text-xl shadow-lg shadow-rose-900/20">
           <img src={image} alt="" />
          </div>
          
          <div className={`flex flex-col overflow-hidden transition-all duration-300 
            ${collapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"}`}>
            <span className="text-lg font-bold tracking-wide text-white">RythmFlow</span>
            <span className="text-[10px] uppercase tracking-wider text-pink-200/60 truncate">
              {studioName}
            </span>
          </div>
        </div>

        {/* --- Navigation --- */}
        <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleLinkClick} // Auto-close on mobile
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-rose-500/10 text-rose-400"
                    : "text-pink-100/60 hover:bg-white/5 hover:text-pink-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-rose-500" />
                  )}

                  <span className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"} ${collapsed ? "md:mx-auto" : ""}`}>
                    {item.icon}
                  </span>

                  <span
                    className={`whitespace-nowrap font-medium text-sm transition-all duration-300 
                      ${collapsed ? "md:w-0 md:overflow-hidden md:opacity-0" : "w-auto opacity-100"}`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* --- Footer / User --- */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full rounded-xl transition-colors duration-200 group ${
               collapsed ? "md:justify-center md:px-0 py-3 bg-white/5 hover:bg-rose-500/20" : "px-4 py-3 bg-white/5 hover:bg-rose-500 text-pink-200 hover:text-white"
            }`}
          >
            <LogOut size={20} />
            <span
              className={`text-sm font-medium whitespace-nowrap transition-all duration-300 
                ${collapsed ? "md:w-0 md:overflow-hidden md:opacity-0" : "w-auto opacity-100"}`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;