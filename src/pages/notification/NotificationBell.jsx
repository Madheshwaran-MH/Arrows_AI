import { useEffect, useRef, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import './notification.scss'; // import the SCSS (global)


export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(3);
  const ref = useRef(null);
  const { notificationsEnabled } = useTheme();

  // Close menu on outside click / Escape
  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!notificationsEnabled) return null;


  return (
    <div className="notif" ref={ref} aria-expanded={open ? 'true' : 'false'}>
      <button
        type="button"
        className="notifBtn"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <FiBell className="icon" aria-hidden="true" />
        {unread > 0 && (
          <span className="notifBadge" aria-label={`${unread} unread notifications`}>
            {unread}
          </span>
        )}
      </button>


      {/* Optional dropdown */}
      {open && (
        <ul className="notifMenu" role="menu" aria-label="Notifications">
          <li className="notifItem" role="menuitem">
            <span className="notifDot" aria-hidden></span>
            New comment on your post
          </li>
          <li className="notifItem" role="menuitem">
            <span className="notifDot" aria-hidden></span>
            Build finished successfully
          </li>
          <li className="notifFooter" role="presentation">
            <button
              className="notifClear"
              type="button"
              onClick={() => {
                setUnread(0);
                setOpen(false);
              }}
            >
              Clear all
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}


