import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("app-theme") || "light"
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("app-notifications") !== "false"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("app-notifications", String(notificationsEnabled));
  }, [notificationsEnabled]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, notificationsEnabled, setNotificationsEnabled }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
