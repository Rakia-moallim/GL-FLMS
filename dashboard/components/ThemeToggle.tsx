"use client";
import { useTheme } from "../components/ThemeProvider";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      className="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Toggle light/dark mode"
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ fontSize: 18 }}
      >
        {isDark ? "☀️" : "🌙"}
      </motion.span>
      <span style={{ fontSize: 13 }}>{isDark ? "Light" : "Dark"}</span>
    </motion.button>
  );
}
