import { useEffect, useState } from "react";
import {
  getSettings,
  updateSettings,
} from "../api/settings";
import {
  getStudioProfile,
  updateStudioProfile,
  changeStudioPassword,
} from "../api/studio";

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
} from "lucide-react";

const SettingsPage = () => {
  // -------- GLOBAL ALERTS --------
  const [alertMsg, setAlertMsg] = useState("");
  const [alertErr, setAlertErr] = useState("");

  // -------- STUDIO PROFILE (Studio model) --------
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
  const [savingPassword, setSavingPassword] = useState(false);

  // -------- APP SETTINGS (Settings model) --------
  const [settingsForm, setSettingsForm] = useState({
    defaultMonthlyFee: "",
    monthStartDay: 1,
    hideInactiveByDefault: false,
    feeReminderTemplate: "",
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // ===== LOAD STUDIO + SETTINGS ONCE =====
  useEffect(() => {
    const load = async () => {
      try {
        setSettingsLoading(true);
        const [settingsRes, studioRes] = await Promise.all([
          getSettings(),
          getStudioProfile(),
        ]);

        // settings doc
        const s = settingsRes.data || {};
        setSettingsForm({
          defaultMonthlyFee:
            s.defaultMonthlyFee !== undefined ? String(s.defaultMonthlyFee) : "",
          monthStartDay: s.monthStartDay || 1,
          hideInactiveByDefault: !!s.hideInactiveByDefault,
          feeReminderTemplate:
            s.feeReminderTemplate ||
            "Dear {parentName}, this is a reminder that {studentName}'s fee of ₹{amount} for {month} is pending. - {studioName}",
        });

        // studio profile
        const st = studioRes.data || {};
        setStudioForm({
          className: st.className || "",
          email: st.email || "",
          phone: st.phone || "",
        });
      } catch (e) {
        console.error("Settings load error", e);
        setAlertErr("Failed to load settings. Please refresh the page.");
      } finally {
        setSettingsLoading(false);
      }
    };

    load();
  }, []);

  // ===== HANDLERS: STUDIO PROFILE =====
  const handleStudioChange = (e) => {
    const { name, value } = e.target;
    setStudioForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudioSave = async (e) => {
    e.preventDefault();
    setAlertErr("");
    setAlertMsg("");

    try {
      setSavingStudio(true);
      const res = await updateStudioProfile(studioForm);

      // keep sidebar label in sync
      localStorage.setItem("studioName", res.data.className);

      setAlertMsg("Studio details updated.");
    } catch (e) {
      setAlertErr(
        e.response?.data?.message || "Failed to update studio details."
      );
    } finally {
      setSavingStudio(false);
    }
  };

  // ===== HANDLERS: PASSWORD =====
  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setAlertErr("");
    setAlertMsg("");

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setAlertErr("New password and confirm password do not match.");
      return;
    }

    if (!pwForm.newPassword || pwForm.newPassword.length < 6) {
      setAlertErr("New password should be at least 6 characters.");
      return;
    }

    try {
      setSavingPassword(true);
      await changeStudioPassword(pwForm.currentPassword, pwForm.newPassword);

      setAlertMsg("Password updated successfully.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setAlertErr(
        e.response?.data?.message || "Failed to update password."
      );
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
    setAlertErr("");
    setAlertMsg("");

    try {
      setSettingsSaving(true);
      await updateSettings({
        ...settingsForm,
        defaultMonthlyFee: settingsForm.defaultMonthlyFee
          ? Number(settingsForm.defaultMonthlyFee)
          : 0,
      });

      setAlertMsg("Settings saved successfully.");
    } catch (e) {
      setAlertErr(
        e.response?.data?.message || "Failed to save settings."
      );
    } finally {
      setSettingsSaving(false);
    }
  };

  // ================== RENDER ==================
  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon size={22} className="text-rose-500" />
            Settings
          </h2>
          <p className="text-sm text-slate-500">
            Manage studio profile, login credentials, and app defaults.
          </p>
        </div>
      </div>

      {/* Global Alerts */}
      {(alertMsg || alertErr) && (
        <div
          className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${
            alertErr
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {alertErr ? (
            <AlertTriangle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{alertErr || alertMsg}</span>
        </div>
      )}

      {/* Loading state for settings */}
      {settingsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-rose-500" />
        </div>
      ) : (
        <>
          {/* -------- Studio Profile Card -------- */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              Studio Profile (Login Account)
            </h3>

            <form onSubmit={handleStudioSave} className="space-y-4">
              {/* Studio Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Studio Name
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    name="className"
                    value={studioForm.className}
                    onChange={handleStudioChange}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  This name also appears in the sidebar and messages.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Login / Contact Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    name="email"
                    value={studioForm.email}
                    onChange={handleStudioChange}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={studioForm.phone}
                    onChange={handleStudioChange}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingStudio}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                >
                  {savingStudio && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* -------- Password Card -------- */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              Change Password
            </h3>

            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={pwForm.currentPassword}
                  onChange={handlePwChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={pwForm.newPassword}
                    onChange={handlePwChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={pwForm.confirmPassword}
                    onChange={handlePwChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                >
                  {savingPassword && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* -------- Finance & Defaults -------- */}
          <form onSubmit={handleSettingsSave} className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <SettingsIcon size={18} className="text-rose-500" />
                <h3 className="text-sm font-bold text-slate-800">
                  Finance & Attendance Defaults
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Default Monthly Fee (₹)
                  </label>
                  <input
                    name="defaultMonthlyFee"
                    type="number"
                    value={settingsForm.defaultMonthlyFee}
                    onChange={handleSettingsChange}
                    placeholder="2000"
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Month Start Day
                  </label>
                  <select
                    name="monthStartDay"
                    value={settingsForm.monthStartDay}
                    onChange={handleSettingsChange}
                    className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none"
                  >
                    {[1, 5, 10, 15, 20, 25].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Used for fee cycles & reports.
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="hideInactiveByDefault"
                    type="checkbox"
                    name="hideInactiveByDefault"
                    checked={settingsForm.hideInactiveByDefault}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label
                    htmlFor="hideInactiveByDefault"
                    className="text-xs font-semibold text-slate-600"
                  >
                    Hide inactive students by default
                  </label>
                </div>
              </div>
            </div>

            {/* -------- Fee Reminder Template -------- */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle size={18} className="text-rose-500" />
                <h3 className="text-sm font-bold text-slate-800">
                  Fee Reminder Template
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                You can use placeholders:{" "}
                <code className="bg-slate-50 px-1 rounded">
                  {"{parentName}"}
                </code>
                ,{" "}
                <code className="bg-slate-50 px-1 rounded">
                  {"{studentName}"}
                </code>
                ,{" "}
                <code className="bg-slate-50 px-1 rounded">{"{month}"}</code>,{" "}
                <code className="bg-slate-50 px-1 rounded">{"{amount}"}</code>,{" "}
                <code className="bg-slate-50 px-1 rounded">
                  {"{studioName}"}
                </code>
                .
              </p>
              <textarea
                name="feeReminderTemplate"
                value={settingsForm.feeReminderTemplate}
                onChange={handleSettingsChange}
                rows={4}
                className="w-full border rounded-2xl px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none"
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={settingsSaving}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold flex items-center gap-2 hover:bg-slate-700 disabled:opacity-60"
              >
                {settingsSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {settingsSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default SettingsPage;
