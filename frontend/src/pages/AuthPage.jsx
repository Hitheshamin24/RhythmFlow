import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  login,
  registerStudio,
  requestPasswordOtp,
  resetPasswordWithOtp,
} from "../api/auth"; // Assuming these exist
import { User, Mail, Lock, Loader2, ArrowRight, X } from "lucide-react";
import image from "../assets/danceapp.png";

const AuthPage = () => {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpStep, setFpStep] = useState("request"); // "request" | "verify"

  const [fpClassName, setFpClassName] = useState("");
  const [fpEmail, setFpEmail] = useState("");
  const [fpPhone, setFpPhone] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");

  const [fpLoading, setFpLoading] = useState(false);
  const [fpMessage, setFpMessage] = useState("");
  const [fpError, setFpError] = useState("");

  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;

      if (mode === "login") {
        response = await login(className, password);
      } else {
        response = await registerStudio(className, email, password, phone);
      }

      // ✅ IMPORTANT FIX
      const data = response.data;

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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setFpMessage("");
    setFpError("");
    setFpLoading(true);

    try {
      if (fpStep === "request") {
        // Need at least one identifier
        if (!fpClassName && !fpEmail && !fpPhone) {
          setFpError("Enter class name OR email OR phone.");
          return;
        }

        const res = await requestPasswordOtp({
          className: fpClassName,
          email: fpEmail,
          phone: fpPhone,
        });

        setFpMessage(
          res.data?.message ||
            "If an account exists, OTP has been sent to registered email & phone."
        );
        setFpStep("verify");
      } else {
        // verify + reset
        if (fpNewPassword !== fpConfirmPassword) {
          setFpError("New password and confirm password do not match.");
          return;
        }
        if (!fpNewPassword || fpNewPassword.length < 6) {
          setFpError("Password should be at least 6 characters.");
          return;
        }

        const res = await resetPasswordWithOtp({
          className: fpClassName,
          email: fpEmail,
          phone: fpPhone,
          otp: fpOtp,
          newPassword: fpNewPassword,
        });

        setFpMessage(res.data?.message || "Password reset successful.");
        // close after short delay
        setTimeout(() => {
          setShowForgotModal(false);
        }, 1500);
      }
    } catch (err) {
      setFpError(
        err.response?.data?.message || "Failed to process reset request."
      );
    } finally {
      setFpLoading(false);
    }
  };

  // When user opens forgot modal, pre-fill fields from login form
  const openForgotModal = () => {
    setFpClassName(className || "");
    setFpEmail(email || "");
    setFpPhone(phone || "");
    setFpOtp("");
    setFpNewPassword("");
    setFpConfirmPassword("");
    setFpMessage("");
    setFpError("");
    setFpStep("request");
    setShowForgotModal(true);
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
          {/* Phone Input (Register Only) */}
          <div
            className={`space-y-1.5 overflow-hidden transition-all duration-300 ease-in-out ${
              mode === "register" ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide ml-1">
              Phone Number
            </label>
            <div className="relative group">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors"
                size={18}
              />
              <input
                type="tel"
                className="w-full bg-slate-50 rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400 text-slate-800"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={mode === "register"}
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
                required={mode === "register"}
              />
            </div>
          </div>

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

          {/* Forgot password link (Login mode only) */}
          {mode === "login" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={openForgotModal}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-4"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3">
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

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-white/20 p-6 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Forgot Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your dance class name and registered email. This will be
              used to verify your account when reset is implemented.
            </p>

            <form onSubmit={handleForgotSubmit} className="space-y-3">
              {fpStep === "request" && (
                <>
                  <p className="text-[11px] text-slate-500 mb-1">
                    Enter <b>any one</b>: class name, email or phone. We’ll send
                    OTP to the registered email & mobile of that studio.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Dance Class Name
                    </label>
                    <input
                      value={fpClassName}
                      onChange={(e) => setFpClassName(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={fpEmail}
                      onChange={(e) => setFpEmail(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={fpPhone}
                      onChange={(e) => setFpPhone(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none"
                    />
                  </div>
                </>
              )}

              {fpStep === "verify" && (
                <>
                  <p className="text-[11px] text-slate-500 mb-1">
                    Enter the OTP sent to your registered email / phone, and
                    choose a new password.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      OTP
                    </label>
                    <input
                      value={fpOtp}
                      onChange={(e) => setFpOtp(e.target.value)}
                      required
                      className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={fpNewPassword}
                      onChange={(e) => setFpNewPassword(e.target.value)}
                      required
                      className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={fpConfirmPassword}
                      onChange={(e) => setFpConfirmPassword(e.target.value)}
                      required
                      className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none"
                    />
                  </div>
                </>
              )}

              {fpError && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {fpError}
                </div>
              )}
              {fpMessage && (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  {fpMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={fpLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {fpLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {fpStep === "request" ? "Sending..." : "Updating..."}
                    </>
                  ) : fpStep === "request" ? (
                    "Send OTP"
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
