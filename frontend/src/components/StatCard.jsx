import { ArrowUpRight, ArrowDownRight } from "lucide-react"; // Optional: For trend icons

const StatCard = ({ label, value, icon, subtext, trend = "neutral" }) => {
  // trend can be: "up", "down", or "neutral"
  
  return (
    <div className="group relative overflow-hidden bg-linear-to-br from-[#2A181D] to-[#1F1216] border border-pink-500/10 rounded-3xl p-5 hover:border-pink-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-rose-900/20 hover:-translate-y-1">
      
      {/* Background decoration glow */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all duration-500"></div>

      <div className="relative flex justify-between items-start">
        {/* Label & Value */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-wide text-pink-200/60 uppercase">
            {label}
          </p>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {value}
          </h3>
        </div>

        {/* Icon Container */}
        <div className="h-10 w-10 rounded-xl bg-linear-to-br from-rose-500/10 to-pink-600/5 border border-pink-500/10 flex items-center justify-center text-rose-400 group-hover:text-rose-300 group-hover:border-pink-500/30 transition-colors duration-300">
          {icon}
        </div>
      </div>

      {/* Subtext / Footer */}
      {(subtext || trend) && (
        <div className="relative mt-4 flex items-center gap-2">
          {trend === "up" && <ArrowUpRight size={14} className="text-emerald-400" />}
          {trend === "down" && <ArrowDownRight size={14} className="text-rose-400" />}
          
          <p className={`text-xs font-medium ${
            trend === "up" ? "text-emerald-400" : 
            trend === "down" ? "text-rose-400" : 
            "text-pink-200/40"
          }`}>
            {subtext}
          </p>
        </div>
      )}
    </div>
  );
};

export default StatCard;