import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  login,
  registerStudio,
  requestPasswordOtp,
  resetPasswordWithOtp,
  verifyEmailOtp,
} from "../api/auth";

import { User, Mail, Lock, Loader2, ArrowRight, X, Phone } from "lucide-react";
import image from "../assets/danceapp.png";

const AuthPage = () => {
  const [mode, setMode] = useState("login");
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Forgot Password State ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpStep, setFpStep] = useState("request"); // "request" | "verify"
  
  // We use this single state for the input box
  const [fpInput, setFpInput] = useState("");
  
  // These store the PARSED values to send to backend (hidden from UI)
  const [fpClassName, setFpClassName] = useState("");
  const [fpEmail, setFpEmail] = useState("");
  const [fpPhone, setFpPhone] = useState("");

  const [fpOtp, setFpOtp] = useState(new Array(6).fill(""));
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpMessage, setFpMessage] = useState("");
  const [fpError, setFpError] = useState("");

  // --- Verify Email State ---
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState(new Array(6).fill(""));
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifyMessage, setVerifyMessage] = useState("");

  // --- Registered Data Storage ---
  const [registeredClassName, setRegisteredClassName] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const navigate = useNavigate();

  // --- OTP Helper Functions (Focus & Paste) ---
  const handleOtpChange = (element, index, setOtpState) => {
    if (isNaN(element.value)) return false;
    setOtpState((prevOtp) => {
      const newOtp = [...prevOtp];
      newOtp[index] = element.value;
      return newOtp;
    });
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (e, index, setOtpState) => {
    if (e.key === "Backspace") {
      setOtpState((prevOtp) => {
        const newOtp = [...prevOtp];
        if (!newOtp[index] && index > 0 && e.target.previousSibling) {
             e.target.previousSibling.focus();
        }
        newOtp[index] = "";
        return newOtp;
      });
      if (!e.target.value && index > 0 && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  const handleOtpPaste = (e, setOtpState) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").slice(0, 6).split("");
    if (data.length > 0) {
        setOtpState((prev) => {
            const newOtp = [...prev];
            data.forEach((char, i) => {
                if (i < 6 && !isNaN(char)) newOtp[i] = char;
            });
            return newOtp;
        });
    }
  };

  // --- Handlers ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const response = await login(className, password);
        const data = response.data;

        if (data.requiresVerification) {
          setRegisteredClassName(className);
          setRegisteredEmail(data.studio?.email || "");
          setError("");
          setShowVerifyModal(true);
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("studioName", data.studio.className);
        navigate("/dashboard");
      } else {
        const response = await registerStudio(className, email, password, phone);
        setRegisteredClassName(className);
        setRegisteredEmail(email);
        setError("");
        setShowVerifyModal(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Logic to determine what the user typed in the single box
  const detectInputType = (input) => {
      const value = input.trim();
      if (value.includes("@")) return "email";
      // If purely digits and longer than 6 chars, assume phone
      if (/^\d+$/.test(value) && value.length > 6) return "phone";
      return "className";
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setFpMessage("");
    setFpError("");
    setFpLoading(true);

    const otpString = fpOtp.join("");

    try {
      if (fpStep === "request") {
        if (!fpInput) {
          setFpError("Please enter your registered details.");
          setFpLoading(false);
          return;
        }

        // 1. Detect what was entered
        const type = detectInputType(fpInput);
        
        // 2. Prepare payload and set internal state for next step
        const payload = { className: "", email: "", phone: "" };
        
        // Reset internal states first
        setFpClassName(""); setFpEmail(""); setFpPhone("");

        if (type === "email") {
            payload.email = fpInput;
            setFpEmail(fpInput);
        } else if (type === "phone") {
            payload.phone = fpInput;
            setFpPhone(fpInput);
        } else {
            payload.className = fpInput;
            setFpClassName(fpInput);
        }

        const res = await requestPasswordOtp(payload);
        setFpMessage(res.data?.message || "OTP sent to registered details.");
        setFpStep("verify");
      } else {
        // Verify Step
        if (fpNewPassword !== fpConfirmPassword) {
          setFpError("Passwords do not match.");
          setFpLoading(false);
          return;
        }

        // We use the hidden states (fpClassName, etc) that we set in step 1
        const res = await resetPasswordWithOtp({
          className: fpClassName,
          email: fpEmail,
          phone: fpPhone,
          otp: otpString,
          newPassword: fpNewPassword,
        });

        setFpMessage(res.data?.message || "Password reset successful.");
        setTimeout(() => setShowForgotModal(false), 1500);
      }
    } catch (err) {
      setFpError(err.response?.data?.message || "Failed to process request.");
    } finally {
      setFpLoading(false);
    }
  };

  const openForgotModal = () => {
    // Pre-fill the single input with whatever the user typed in login form
    // Priority: Email > Phone > ClassName
    const prefill = email || phone || className || "";
    setFpInput(prefill);
    
    setFpOtp(new Array(6).fill(""));
    setFpNewPassword("");
    setFpConfirmPassword("");
    setFpMessage("");
    setFpError("");
    setFpStep("request");
    setShowForgotModal(true);
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setVerifyError("");
    setVerifyMessage("");
    setVerifyLoading(true);

    const otpString = verifyOtp.join("");

    try {
      const res = await verifyEmailOtp({
        className: registeredClassName,
        email: registeredEmail,
        otp: otpString,
      });

      const data = res.data;
      setVerifyMessage(data.message || "Email verified!");

      if (data.token && data.studio) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("studioName", data.studio.className);
        setTimeout(() => {
          setShowVerifyModal(false);
          navigate("/dashboard");
        }, 800);
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || "Verification failed.");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1F1216] relative overflow-hidden px-4 font-sans selection:bg-rose-500/30">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-900/20 rounded-full blur-[100px]" />
      </div>

      {/* --- Main Card --- */}
      <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/40 max-w-[420px] w-full p-8 md:p-10 border border-white/40 ring-1 ring-white/50">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-[#29171c] to-[#3d1f28] flex items-center justify-center text-white p-3 shadow-lg shadow-rose-900/20 transform hover:rotate-3 transition-transform duration-300">
            <img src={image} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              DNCR
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              {mode === "login" ? "Welcome back, Studio Owner" : "Start your journey with us"}
            </p>
          </div>
        </div>

        {/* Toggle Tabs */}
        <div className="bg-slate-100/80 p-1.5 rounded-2xl flex relative mb-8 border border-slate-200/50">
            <div 
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${mode === 'login' ? 'left-1.5' : 'left-[calc(50%+1.5px)]'}`}
            />
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors duration-200 relative z-10 ${
              mode === "login" ? "text-rose-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors duration-200 relative z-10 ${
              mode === "register" ? "text-rose-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <InputGroup icon={User} type="text" placeholder="Studio / Class Name" value={className} onChange={setClassName} />
            
            {mode === "register" && (
                 <div className="animate-in slide-in-from-top-4 fade-in duration-300 space-y-4">
                     <InputGroup icon={Phone} type="tel" placeholder="Phone Number" value={phone} onChange={setPhone} />
                     <InputGroup icon={Mail} type="email" placeholder="Email Address" value={email} onChange={setEmail} />
                 </div>
            )}

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-600 transition-colors" size={18} />
              <input
                type={show ? "text" : "password"}
                className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200 pl-11 pr-10 py-3.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400 text-slate-800 font-medium"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
               <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                 {show ? <span className="text-[10px] font-bold uppercase">Hide</span> : <span className="text-[10px] font-bold uppercase">Show</span>}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          {mode === "login" && (
            <div className="flex justify-end">
              <button type="button" onClick={openForgotModal} className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 text-sm text-rose-600 bg-rose-50/80 border border-rose-100 rounded-xl p-3 animate-in fade-in zoom-in-95 duration-200">
              <span className="text-lg leading-none">⚠️</span>
              <p className="font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-linear-to-r from-[#29171c] to-[#451523] text-white font-bold text-sm shadow-xl shadow-rose-900/20 hover:shadow-rose-900/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                    <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                    <ArrowRight size={18} className="opacity-80" />
                </>
            )}
          </button>
        </form>
      </div>

      <div className="absolute bottom-6 text-white/30 text-xs font-medium tracking-wide">
        © 2025 DNCR. All rights reserved.
      </div>

      {/* ================= MODALS ================= */}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <ModalOverlay onClose={() => setShowForgotModal(false)}>
            <div className="text-center mb-6">
                 <h3 className="text-xl font-bold text-slate-900">Forgot Password</h3>
                 <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto">
                    {fpStep === 'request' 
                        ? "Enter your Class Name, Email OR Phone to receive an OTP." 
                        : "Enter the code sent to your device and set a new password."}
                 </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-6">
                {fpStep === "request" && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        {/* SINGLE INPUT for all */}
                        <InputGroup 
                            icon={User} 
                            placeholder="Class Name / Email / Phone" 
                            value={fpInput} 
                            onChange={setFpInput} 
                        />
                    </div>
                )}

                {fpStep === "verify" && (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                        {/* OTP BOXES */}
                        <div className="flex justify-center gap-2">
                            {fpOtp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    className="w-10 h-12 bg-slate-50 border border-slate-200 rounded-lg text-center text-lg font-bold text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                                    value={data}
                                    onChange={(e) => handleOtpChange(e.target, index, setFpOtp)}
                                    onKeyDown={(e) => handleOtpKeyDown(e, index, setFpOtp)}
                                    onPaste={(e) => handleOtpPaste(e, setFpOtp)}
                                />
                            ))}
                        </div>

                        <div className="space-y-3">
                             <InputGroup icon={Lock} type="password" placeholder="New Password" value={fpNewPassword} onChange={setFpNewPassword} />
                             <InputGroup icon={Lock} type="password" placeholder="Confirm Password" value={fpConfirmPassword} onChange={setFpConfirmPassword} />
                        </div>
                    </div>
                )}

                {fpError && <p className="text-center text-xs text-rose-600 bg-rose-50 py-2 rounded-lg font-medium">{fpError}</p>}
                {fpMessage && <p className="text-center text-xs text-emerald-600 bg-emerald-50 py-2 rounded-lg font-medium">{fpMessage}</p>}

                <div className="flex gap-3">
                     <button type="button" onClick={() => setShowForgotModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={fpLoading} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2">
                         {fpLoading && <Loader2 size={14} className="animate-spin" />}
                         {fpStep === 'request' ? 'Send OTP' : 'Reset Password'}
                    </button>
                </div>
            </form>
        </ModalOverlay>
      )}

      {/* Verify Email Modal */}
      {showVerifyModal && (
         <ModalOverlay onClose={() => setShowVerifyModal(false)}>
            <div className="text-center mb-6">
                 <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-600">
                    <Mail size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900">Verify Email</h3>
                 <p className="text-xs text-slate-500 mt-2">
                    Code sent to <span className="font-semibold text-slate-700">{registeredEmail}</span>
                 </p>
            </div>

            <form onSubmit={handleVerifyEmail} className="space-y-6">
                <div className="flex justify-center gap-2">
                    {verifyOtp.map((data, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength="1"
                            className="w-10 h-12 bg-slate-50 border border-slate-200 rounded-lg text-center text-lg font-bold text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                            value={data}
                            onChange={(e) => handleOtpChange(e.target, index, setVerifyOtp)}
                            onKeyDown={(e) => handleOtpKeyDown(e, index, setVerifyOtp)}
                            onPaste={(e) => handleOtpPaste(e, setVerifyOtp)}
                        />
                    ))}
                </div>

                {verifyError && <p className="text-center text-xs text-rose-600 bg-rose-50 py-2 rounded-lg font-medium">{verifyError}</p>}
                {verifyMessage && <p className="text-center text-xs text-emerald-600 bg-emerald-50 py-2 rounded-lg font-medium">{verifyMessage}</p>}

                <button type="submit" disabled={verifyLoading} className="w-full py-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-200">
                    {verifyLoading ? <Loader2 size={16} className="animate-spin" /> : "Verify Account"}
                </button>
            </form>
         </ModalOverlay>
      )}
    </div>
  );
};

// --- Sub Components ---

const InputGroup = ({ icon: Icon, type = "text", placeholder, value, onChange }) => (
  <div className="relative group">
    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-600 transition-colors" size={18} />
    <input
      type={type}
      className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200 pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400 text-slate-800 font-medium"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    />
  </div>
);

const ModalOverlay = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1216]/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-[20px] w-full max-w-sm shadow-2xl border border-white/40 p-6 md:p-8 relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-all">
                <X size={16} />
            </button>
            {children}
        </div>
    </div>
);

export default AuthPage;