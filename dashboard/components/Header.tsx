"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore } from "../lib/firebase";

interface HeaderProps {
  alarm: boolean;
  selectedHomeId: string;
  onHomeChange: (id: string) => void;
  address?: string;
}

export default function Header({ alarm, selectedHomeId, onHomeChange, address }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [homes, setHomes] = useState<string[]>([]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "homes"), (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.id);
      if (ids.length > 0) setHomes(ids);
    });
    return () => unsub();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      {/* Left: Title + timestamp */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span className="section-label" style={{ color: "var(--primary)" }}>System Overview</span>
          {alarm && (
            <motion.span
              className="badge badge-danger"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ animation: "none" }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
              EMERGENCY
            </motion.span>
          )}
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "var(--text-primary)",
            lineHeight: 1.15,
          }}
        >
          KOOR{" "}
          <span className="gradient-text">Mission Control</span>
        </h1>
        <div
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "var(--text-muted)",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <span style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>{time}</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} />
          <span>{date}</span>
          {address && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} />
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>📍 {address}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Home Selector + Alarm banner + theme toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Home Selector Dropdown */}
        <div className="glass-card" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active:</span>
          <select 
            value={selectedHomeId} 
            onChange={(e) => onHomeChange(e.target.value)}
            style={{ 
              background: "transparent", 
              border: "none", 
              color: "var(--text-primary)", 
              fontSize: 13, 
              fontWeight: 700,
              outline: "none",
              cursor: "pointer",
              paddingRight: 4
            }}
          >
            {homes.map(id => (
              <option key={id} value={id} style={{ background: "#111", color: "#fff" }}>{id}</option>
            ))}
          </select>
        </div>

        {alarm && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background: "rgba(220,38,38,0.1)",
              border: "1px solid rgba(220,38,38,0.3)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--danger)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            HAZARD ACTIVE
          </motion.div>
        )}

        {/* Theme Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            id="theme-toggle-btn"
          >
            <div className="theme-toggle-thumb">
              {theme === "dark" ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#fff" }}>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FF4D00" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5"/>
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
