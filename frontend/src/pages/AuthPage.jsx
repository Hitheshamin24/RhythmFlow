import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, registerStudio } from "../api/auth"; // Assuming these exist
import {
  User,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import image from "../assets/danceapp.png";
const AuthPage = () => {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let data;
      if (mode === "login") {
        data = await login(className, password);
      } else {
        data = await registerStudio(className, email, password);
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("studioName", data.studio.className);
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1F1216] relative overflow-hidden px-4">
      {/* --- Background Decoration (Glows) --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* --- Main Card --- */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-black/50 max-w-md w-full p-8 md:p-10 space-y-8 border border-white/10">
        {/* Header / Logo */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-[#29171c] to-[#27151a] flex items-center justify-center text-white text-2xl shadow-lg shadow-rose-500/30">
            <img src={image} alt="" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome to RhythmFlow
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {mode === "login"
                ? "Sign in to manage your studio"
                : "Create your studio account"}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="bg-slate-100 p-1 rounded-xl flex relative">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 relative z-10 ${
              mode === "login"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 relative z-10 ${
              mode === "register"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Studio Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide ml-1">
              Dance Class Name
            </label>
            <div className="relative group">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors"
                size={18}
              />
              <input
                className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400 text-slate-800"
                placeholder="e.g. Bluewaves Studio"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email Input (Register Only) */}
          <div
            className={`space-y-1.5 overflow-hidden transition-all duration-300 ease-in-out ${
              mode === "register" ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide ml-1">
              Email Address
            </label>
            <div className="relative group">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors"
                size={18}
              />
              <input
                type="email"
                className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400 text-slate-800"
                placeholder="owner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={mode === "register"} // Only required if registering
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            {/* Password Input */}
<div className="space-y-1.5">
  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide ml-1">
    Password
  </label>

  <div className="relative group">

    {/* Lock icon as toggle */}
    <button
      type="button"
      onClick={() => setShow(!show)}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 transition-colors"
    >
      <Lock size={18} />
    </button>

    {/* Password input */}
    <input
      type={show ? "text" : "password"}
      className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400 text-slate-800"
      placeholder="••••••••"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
    />
  </div>
</div>

          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3 animate-pulse">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-linear-to-r from-[#29171c] to-[#451523] text-white font-bold text-sm shadow-lg shadow-rose-500/30 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-6 text-white/20 text-xs">
        © 2025 DanceFlow. All rights reserved.
      </div>
    </div>
  );
};

export default AuthPage;
