import { useEffect, useRef } from "react";
import "./ProfileModal.css";

export default function ProfileModal({ onClose }) {
  const modalRef = useRef(null);

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
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modalCard" ref={modalRef}>
        <div className="modalHeader">
          <h2 id="profile-modal-title" className="modalTitle">Profile</h2>
          <button className="modalClose" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div className="profileModalBody">
          {/* Avatar */}
          <div className="profileModalAvatar">S</div>

          {/* Info */}
          <div className="profileModalInfo">
            <div className="profileModalRow">
              <label className="profileModalLabel">Full Name</label>
              <input className="profileModalInput" type="text" defaultValue="Saravanan" />
            </div>
            <div className="profileModalRow">
              <label className="profileModalLabel">Role</label>
              <input className="profileModalInput" type="text" defaultValue="Team Lead" readOnly />
            </div>
            <div className="profileModalRow">
              <label className="profileModalLabel">Email</label>
              <input className="profileModalInput" type="email" defaultValue="saravanan@arrows.com" />
            </div>
            <div className="profileModalRow">
              <label className="profileModalLabel">Phone</label>
              <input className="profileModalInput" type="tel" defaultValue="+91 98765 43210" />
            </div>
          </div>
        </div>

        <div className="modalFooter">
          <button className="modalBtnSecondary" onClick={onClose}>Cancel</button>
          <button className="modalBtnPrimary" onClick={onClose}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
