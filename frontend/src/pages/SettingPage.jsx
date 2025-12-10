import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../api/settings";
import {
  getStudioProfile,
  updateStudioProfile,
  changeStudioPassword,
  verifyProfileOtp,
} from "../api/studio";

import { requestPasswordOtp, resetPasswordWithOtp } from "../api/auth";

import {
  Mail,
  Phone,
  User,
  Lock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Settings as SettingsIcon,
  MessageCircle,
  Save,
  X,
  Wallet,
  Calendar,
  Eye,
  EyeOff
} from "lucide-react";

const SettingsPage = () => {
  // -------- GLOBAL ALERTS --------
  const [alertMsg, setAlertMsg] = useState("");
  const [alertErr, setAlertErr] = useState("");

  // -------- STUDIO PROFILE --------
  const [studioForm, setStudioForm] = useState({
    className: "",
    email: "",
    phone: "",
  });
  const [savingStudio, setSavingStudio] = useState(false);

  // -------- PASSWORD CHANGE --------
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPassword, setSavingPassword] = useState(false);

  // -------- APP SETTINGS --------
  const [settingsForm, setSettingsForm] = useState({
    defaultMonthlyFee: "",
    monthStartDay: 1,
    hideInactiveByDefault: false,
    feeReminderTemplate: "",
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // -------- Profile OTP (Changed to Array for 6-box style) --------
  const [showProfileOtpModal, setShowProfileOtpModal] = useState(false);
  const [profileOtp, setProfileOtp] = useState(new Array(6).fill(""));
  const [profileOtpLoading, setProfileOtpLoading] = useState(false);
  const [profileOtpError, setProfileOtpError] = useState("");

  // -------- Forgot Password Modal --------
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpStep, setFpStep] = useState("request"); // "request" | "verify"
  
  // Single Input for "Request" step
  const [fpInput, setFpInput] = useState("");
  
  // Parsed values (Hidden from UI)
  const [fpClassName, setFpClassName] = useState("");
  const [fpEmail, setFpEmail] = useState("");
  const [fpPhone, setFpPhone] = useState("");

  const [fpOtp, setFpOtp] = useState(new Array(6).fill("")); // Changed to Array
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpMessage, setFpMessage] = useState("");
  const [fpError, setFpError] = useState("");

  // ===== LOAD DATA =====
  useEffect(() => {
    const load = async () => {
      try {
        setSettingsLoading(true);
        const [settingsRes, studioRes] = await Promise.all([
          getSettings(),
          getStudioProfile(),
        ]);

        // Settings
        const s = settingsRes.data || {};
        setSettingsForm({
          defaultMonthlyFee: s.defaultMonthlyFee !== undefined ? String(s.defaultMonthlyFee) : "",
          monthStartDay: s.monthStartDay || 1,
          hideInactiveByDefault: !!s.hideInactiveByDefault,
          feeReminderTemplate: s.feeReminderTemplate || "Dear {parentName}, this is a reminder that {studentName}'s fee of ₹{amount} for {month} is pending. - {studioName}",
        });

        // Studio
        const st = studioRes.data || {};
        setStudioForm({
          className: st.className || "",
          email: st.email || "",
          phone: st.phone || "",
        });
      } catch (e) {
        setAlertErr("Failed to load settings. Please refresh.");
      } finally {
        setSettingsLoading(false);
      }
    };
    load();
  }, []);

  // ===== OTP HELPERS (Focus, Paste, Backspace) =====
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

  // ===== HANDLERS: STUDIO PROFILE =====
  const handleStudioChange = (e) => {
    setStudioForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleStudioSave = async (e) => {
    e.preventDefault();
    setAlertErr(""); setAlertMsg("");

    try {
      setSavingStudio(true);
      const res = await updateStudioProfile(studioForm);
      const data = res.data;

      if (data.requiresVerification) {
        setAlertMsg(data.message || "OTP sent for verification.");
        setProfileOtp(new Array(6).fill("")); // Reset OTP
        setShowProfileOtpModal(true);
        return; 
      }

      localStorage.setItem("studioName", data.className);
      setAlertMsg("Studio details updated.");
    } catch (e) {
      setAlertErr(e.response?.data?.message || "Failed to update studio details.");
    } finally {
      setSavingStudio(false);
    }
  };

  // ===== HANDLERS: PASSWORD =====
  const handlePwChange = (e) => {
    setPwForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setAlertErr(""); setAlertMsg("");

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setAlertErr("New passwords do not match.");
      return;
    }
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) {
        setAlertErr("Password must be at least 6 characters.");
        return;
    }

    try {
      setSavingPassword(true);
      await changeStudioPassword(pwForm.currentPassword, pwForm.newPassword);
      setAlertMsg("Password updated successfully.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setAlertErr(e.response?.data?.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  // ===== HANDLERS: APP SETTINGS =====
  const handleSettingsChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSettingsForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setAlertErr(""); setAlertMsg("");

    try {
      setSettingsSaving(true);
      await updateSettings({
        ...settingsForm,
        defaultMonthlyFee: settingsForm.defaultMonthlyFee ? Number(settingsForm.defaultMonthlyFee) : 0,
      });
      setAlertMsg("Settings saved successfully.");
    } catch (e) {
      setAlertErr(e.response?.data?.message || "Failed to save settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  // ===== HANDLERS: OTP VERIFY =====
  const handleProfileOtpVerify = async (e) => {
    e.preventDefault();
    setProfileOtpError(""); setAlertErr(""); setAlertMsg("");
    
    const otpString = profileOtp.join("");
    if (otpString.length < 6) {
        setProfileOtpError("Please enter complete OTP");
        return;
    }

    try {
      setProfileOtpLoading(true);
      const res = await verifyProfileOtp(otpString);
      const data = res.data;

      setStudioForm((prev) => ({
        ...prev,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        className: data.className || prev.className,
      }));

      localStorage.setItem("studioName", data.className);
      setAlertMsg("Contact details verified & updated.");
      setShowProfileOtpModal(false);
      setProfileOtp(new Array(6).fill(""));
    } catch (e) {
      setProfileOtpError(e.response?.data?.message || "Failed to verify.");
    } finally {
      setProfileOtpLoading(false);
    }
  };

  // ===== HANDLERS: FORGOT PASSWORD =====
  const detectInputType = (input) => {
    const value = input.trim();
    if (value.includes("@")) return "email";
    if (/^\d+$/.test(value) && value.length > 6) return "phone";
    return "className";
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setFpMessage(""); setFpError(""); setFpLoading(true);
    
    const otpString = fpOtp.join("");

    try {
      if (fpStep === "request") {
        if (!fpInput) {
            setFpError("Please enter your registered details.");
            setFpLoading(false);
            return;
        }

        const type = detectInputType(fpInput);
        const payload = { className: "", email: "", phone: "" };
        setFpClassName(""); setFpEmail(""); setFpPhone(""); // Reset

        if (type === "email") { payload.email = fpInput; setFpEmail(fpInput); }
        else if (type === "phone") { payload.phone = fpInput; setFpPhone(fpInput); }
        else { payload.className = fpInput; setFpClassName(fpInput); }

        const res = await requestPasswordOtp(payload);
        setFpMessage(res.data?.message || "OTP sent.");
        setFpStep("verify");
      } else {
        if (fpNewPassword !== fpConfirmPassword) {
            setFpError("Passwords do not match."); setFpLoading(false); return;
        }
        const res = await resetPasswordWithOtp({
          className: fpClassName, email: fpEmail, phone: fpPhone,
          otp: otpString, newPassword: fpNewPassword,
        });
        setFpMessage(res.data?.message || "Password reset successful.");
        setTimeout(() => setShowForgotModal(false), 1500);
      }
    } catch (err) {
      setFpError(err.response?.data?.message || "Failed.");
    } finally {
      setFpLoading(false);
    }
  };

  // ================== RENDER ==================
  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
                <SettingsIcon size={24} />
            </div>
            Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1 ml-1">
            Manage studio profile, login credentials, and app defaults.
          </p>
        </div>
      </div>

      {/* Global Alerts */}
      {(alertMsg || alertErr) && (
        <div className={`flex items-start gap-3 text-sm px-5 py-4 rounded-2xl border shadow-sm animate-in slide-in-from-top-2 duration-300 ${
            alertErr ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
          }`}
        >
          {alertErr ? <AlertTriangle className="shrink-0 mt-0.5" size={18} /> : <CheckCircle2 className="shrink-0 mt-0.5" size={18} />}
          <span className="font-medium">{alertErr || alertMsg}</span>
        </div>
      )}

      {/* Loading state for settings */}
      {settingsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 size={36} className="animate-spin text-rose-500" />
          <p className="text-slate-400 text-sm">Loading settings...</p>
        </div>
      ) : (
        <>
          {/* -------- Studio Profile Card -------- */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
               <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><User size={20} /></div>
               <h3 className="text-base font-bold text-slate-800">Studio Profile</h3>
            </div>

            <form onSubmit={handleStudioSave} className="space-y-4">
              <InputGroup icon={User} label="Studio Name" name="className" value={studioForm.className} onChange={handleStudioChange} />
              <InputGroup icon={Mail} label="Contact Email" type="email" name="email" value={studioForm.email} onChange={handleStudioChange} />
              <InputGroup icon={Phone} label="Phone / WhatsApp" type="tel" name="phone" value={studioForm.phone} onChange={handleStudioChange} />

              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={savingStudio} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-70">
                  {savingStudio ? <Loader2 size={16} className="animate-spin" /> : "Save Profile"}
                </button>
              </div>
            </form>
          </div>

          {/* -------- Password Card -------- */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6 hover:shadow-md transition-shadow">
             <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
               <div className="bg-amber-50 text-amber-600 p-2 rounded-lg"><Lock size={20} /></div>
               <h3 className="text-base font-bold text-slate-800">Change Password</h3>
            </div>

            <form onSubmit={handlePasswordSave} className="space-y-5">
              <PasswordInput label="Current Password" name="currentPassword" value={pwForm.currentPassword} onChange={handlePwChange} 
                show={showPw.current} onToggle={() => setShowPw(p => ({...p, current: !p.current}))} 
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <PasswordInput label="New Password" name="newPassword" value={pwForm.newPassword} onChange={handlePwChange} 
                    show={showPw.new} onToggle={() => setShowPw(p => ({...p, new: !p.new}))} 
                 />
                 <PasswordInput label="Confirm Password" name="confirmPassword" value={pwForm.confirmPassword} onChange={handlePwChange} 
                    show={showPw.confirm} onToggle={() => setShowPw(p => ({...p, confirm: !p.confirm}))} 
                 />
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-[11px] text-slate-400 font-medium">
                  Use a strong password you don&apos;t reuse elsewhere.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    // pre-fill from current studio info for smart detection
                    setFpInput(studioForm.email || studioForm.phone || studioForm.className || "");
                    setFpStep("request");
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline underline-offset-4"
                >
                  Forgot password?
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={savingPassword} className="px-6 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all disabled:opacity-70">
                  {savingPassword ? <Loader2 size={16} className="animate-spin" /> : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* -------- Finance & Defaults -------- */}
          <form onSubmit={handleSettingsSave} className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg"><Wallet size={20} /></div>
                <h3 className="text-base font-bold text-slate-800">
                  Finance & Attendance Defaults
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputGroup icon={Wallet} label="Default Monthly Fee (₹)" name="defaultMonthlyFee" type="number" value={settingsForm.defaultMonthlyFee} onChange={handleSettingsChange} placeholder="e.g. 2000" />

                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Month Start Day</label>
                   <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
                      <select name="monthStartDay" value={settingsForm.monthStartDay} onChange={handleSettingsChange} className="w-full appearance-none bg-slate-50 hover:bg-white rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-700 font-medium">
                        {[1, 5, 10, 15, 20, 25].map((d) => (
                            <option key={d} value={d}>Day {d}</option>
                        ))}
                      </select>
                   </div>
                </div>

                <div className="flex items-center gap-3 mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <input id="hideInactiveByDefault" type="checkbox" name="hideInactiveByDefault" checked={settingsForm.hideInactiveByDefault} onChange={handleSettingsChange} className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500" />
                  <label htmlFor="hideInactiveByDefault" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                    Hide inactive students by default
                  </label>
                </div>
              </div>
            </div>

            {/* -------- Fee Reminder Template -------- */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                <div className="bg-purple-50 text-purple-600 p-2 rounded-lg"><MessageCircle size={20} /></div>
                <h3 className="text-base font-bold text-slate-800">Fee Reminder Template</h3>
              </div>
              
              <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500">
                 {["{parentName}", "{studentName}", "{amount}", "{month}", "{studioName}"].map(tag => (
                     <span key={tag} className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{tag}</span>
                 ))}
              </div>

              <textarea 
                name="feeReminderTemplate" 
                value={settingsForm.feeReminderTemplate} 
                onChange={handleSettingsChange} 
                rows={4} 
                className="w-full rounded-xl border border-slate-200 p-4 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-y font-medium text-slate-700"
              />

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={settingsSaving} className="px-8 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center gap-2 hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all disabled:opacity-70">
                  {settingsSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Settings
                </button>
              </div>
            </div>
          </form>
        </>
      )}

      {/* PROFILE OTP MODAL */}
      {showProfileOtpModal && (
        <ModalOverlay onClose={() => setShowProfileOtpModal(false)} title="Verify Contact Update">
            <p className="text-xs text-slate-500 mb-6 text-center">
              Enter the OTP sent to your new email / phone.
            </p>
            <form onSubmit={handleProfileOtpVerify} className="space-y-6">
              <div className="flex justify-center gap-2">
                 {profileOtp.map((digit, i) => (
                    <OtpBox key={i} value={digit} onChange={(e) => handleOtpChange(e.target, i, setProfileOtp)} onKeyDown={(e) => handleOtpKeyDown(e, i, setProfileOtp)} onPaste={(e) => handleOtpPaste(e, setProfileOtp)} />
                 ))}
              </div>

              {profileOtpError && <ErrorMessage msg={profileOtpError} />}

              <div className="flex gap-3">
                 <button type="button" onClick={() => setShowProfileOtpModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors">
                   Close
                 </button>
                 <button type="submit" disabled={profileOtpLoading} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2">
                    {profileOtpLoading ? <Loader2 size={14} className="animate-spin" /> : "Verify"}
                 </button>
              </div>
            </form>
        </ModalOverlay>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <ModalOverlay onClose={() => setShowForgotModal(false)} title="Forgot Password">
           <form onSubmit={handleForgotSubmit} className="space-y-6 mt-4">
              {fpStep === "request" ? (
                 <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
                     <p className="text-xs text-slate-500 text-center">Enter your Class Name, Email OR Phone.</p>
                     <InputGroup icon={User} placeholder="Search..." value={fpInput} onChange={(e) => setFpInput(e.target.value)} />
                 </div>
              ) : (
                <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
                    <p className="text-xs text-slate-500 text-center">Enter OTP and New Password.</p>
                    <div className="flex justify-center gap-2">
                        {fpOtp.map((digit, i) => (
                            <OtpBox key={i} value={digit} onChange={(e) => handleOtpChange(e.target, i, setFpOtp)} onKeyDown={(e) => handleOtpKeyDown(e, i, setFpOtp)} onPaste={(e) => handleOtpPaste(e, setFpOtp)} />
                        ))}
                    </div>
                    <div className="space-y-3 pt-2">
                        <PasswordInput placeholder="New Password" value={fpNewPassword} onChange={(e) => setFpNewPassword(e.target.value)} show={showPw.new} onToggle={() => setShowPw(p => ({...p, new: !p.new}))} />
                        <PasswordInput placeholder="Confirm Password" value={fpConfirmPassword} onChange={(e) => setFpConfirmPassword(e.target.value)} show={showPw.confirm} onToggle={() => setShowPw(p => ({...p, confirm: !p.confirm}))} />
                    </div>
                </div>
              )}

              {fpError && <ErrorMessage msg={fpError} />}
              {fpMessage && <SuccessMessage msg={fpMessage} />}

              <div className="flex gap-3">
                 <button type="button" onClick={() => setShowForgotModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors">
                   Close
                 </button>
                 <button type="submit" disabled={fpLoading} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2">
                    {fpLoading ? <Loader2 size={14} className="animate-spin" /> : fpStep === "request" ? "Send OTP" : "Reset"}
                 </button>
              </div>
           </form>
        </ModalOverlay>
      )}
    </div>
  );
};

// --- SUB COMPONENTS FOR STYLE CONSISTENCY ---

const InputGroup = ({ icon: Icon, label, className="bg-slate-50 hover:bg-white", ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>}
    <div className="relative group">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
      <input 
        className={`w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-800 font-medium placeholder:text-slate-400 ${className}`} 
        {...props} 
      />
    </div>
  </div>
);

const PasswordInput = ({ label, show, onToggle, ...props }) => (
    <div className="space-y-1.5">
        {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>}
        <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
            <input 
                type={show ? "text" : "password"}
                className="w-full bg-slate-50 hover:bg-white rounded-xl border border-slate-200 pl-11 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-800 font-medium"
                {...props}
            />
            <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    </div>
);

const ModalOverlay = ({ onClose, title, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F1216]/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-white/40 p-8 relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-all">
                <X size={16} />
            </button>
            <h3 className="text-xl font-bold text-slate-900 text-center">{title}</h3>
            {children}
        </div>
    </div>
);

const OtpBox = (props) => (
    <input
        type="text"
        maxLength="1"
        className="w-10 h-12 bg-slate-50 border border-slate-200 rounded-lg text-center text-lg font-bold text-slate-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
        {...props}
    />
);

const ErrorMessage = ({ msg }) => (
    <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-center font-medium">
        {msg}
    </div>
);

const SuccessMessage = ({ msg }) => (
    <div className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center font-medium">
        {msg}
    </div>
);

export default SettingsPage;