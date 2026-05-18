import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import "./ProfileModal.css";

export default function SettingsModal({ onClose }) {
  const modalRef = useRef(null);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const { theme, setTheme, notificationsEnabled, setNotificationsEnabled } = useTheme();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Trap focus
  useEffect(() => {
    modalRef.current?.querySelector("button")?.focus();
  }, []);

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modalCard" ref={modalRef}>
        <div className="modalHeader">
          <h2 id="settings-modal-title" className="modalTitle">Settings</h2>
          <button className="modalClose" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div className="settingsModalBody">
          {/* Appearance */}
          <div className="settingsSection">
            <h3 className="settingsSectionTitle">Appearance</h3>
            <div className="settingsRow">
              <label className="settingsLabel">Theme</label>
              <select className="settingsSelect" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

          </div>

          {/* Notifications */}
          <div className="settingsSection">
            <h3 className="settingsSectionTitle">Notifications</h3>
            <div className="settingsRow">
              <label className="settingsLabel">Push Notifications</label>
              <button
                type="button"
                role="switch"
                aria-checked={notificationsEnabled}
                className={`settingsToggle ${notificationsEnabled ? "settingsToggleOn" : ""}`}
                onClick={() => setNotificationsEnabled((v) => !v)}
              >
                <span className="settingsToggleThumb" />
              </button>
            </div>
            <div className="settingsRow">
              <label className="settingsLabel">Email Alerts</label>
              <button
                type="button"
                role="switch"
                aria-checked={emailAlerts}
                className={`settingsToggle ${emailAlerts ? "settingsToggleOn" : ""}`}
                onClick={() => setEmailAlerts((v) => !v)}
              >
                <span className="settingsToggleThumb" />
              </button>
            </div>
          </div>

          {/* Account */}
          <div className="settingsSection">
            <h3 className="settingsSectionTitle">Account</h3>
            <div className="settingsRow">
              <label className="settingsLabel">Change Password</label>
              <button
                className="settingsLinkBtn"
                onClick={() => { setShowChangePassword((v) => !v); setPasswordError(""); setNewPassword(""); setConfirmPassword(""); }}
              >
                {showChangePassword ? "Cancel ✕" : "Update →"}
              </button>
            </div>

            {showChangePassword && (
              <div className="changePasswordFields">
                <div className="changePasswordRow">
                  <label className="profileModalLabel">New Password</label>
                  <input
                    className="profileModalInput"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                    autoFocus
                  />
                </div>
                <div className="changePasswordRow">
                  <label className="profileModalLabel">Confirm Password</label>
                  <input
                    className={`profileModalInput ${passwordError ? "inputError" : ""}`}
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                  />
                  {passwordError && <span className="passwordErrorMsg">{passwordError}</span>}
                </div>
                <div className="changePasswordActions">
                  <button
                    className="modalBtnPrimary"
                    style={{ fontSize: "0.82rem", padding: "7px 16px" }}
                    onClick={() => {
                      if (!newPassword) { setPasswordError("Password cannot be empty."); return; }
                      if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
                      setShowChangePassword(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    Save Password
                  </button>
                </div>
              </div>
            )}

            <div className="settingsRow">
              <label className="settingsLabel">Two-Factor Auth</label>
              <button className="settingsLinkBtn" onClick={() => setTwoFactorEnabled((v) => !v)}>
                {twoFactorEnabled ? "Disable →" : "Enable →"}
              </button>
            </div>
          </div>
        </div>

        <div className="modalFooter">
          <button className="modalBtnSecondary" onClick={onClose}>Cancel</button>
          <button className="modalBtnPrimary" onClick={onClose}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
