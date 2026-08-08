"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth";
import { ADMIN_NAV_ITEMS, STAFF_NAV_ITEMS } from "../lib/rbac";
import { useRouter } from "next/navigation";

const NAV_ICONS: Record<string, React.ReactNode> = {
  "Dashboard": (
    <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  "Live Monitoring": (
    <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  "Register Home": (
    <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <polyline points="9 21 9 12 15 12 15 21"/>
    </svg>
  ),
  "Registered Homes": (
    <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
      <path d="m3 9 2.45-4.91A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.79 1.09L21 9"/>
      <path d="M12 3v6"/>
    </svg>
  ),
  "Staff Management": (
    <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  "Alert History": (
    <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  "Analytics": (
    <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  "Reports": (
    <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  "Settings": (
    <svg className="sidebar-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

interface SidebarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeItem: string;
  onActiveItemChange: (item: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar({ searchQuery, onSearchChange, activeItem, onActiveItemChange }: SidebarProps) {
  const [hovered, setHovered] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { profile, userRole, signOut } = useAuth();
  const router = useRouter();

  const navItems = userRole === "admin" ? ADMIN_NAV_ITEMS : STAFF_NAV_ITEMS;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      document.cookie = "firebase-session=; path=/; max-age=0";
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside
      className={`sidebar ${hovered ? "expanded" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2c0 6-8 8-8 14a8 8 0 0 0 16 0c0-6-8-8-8-14z"/>
            <path d="M12 12c0 3-3 4-3 7a3 3 0 0 0 6 0c0-3-3-4-3-7z" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.6)"/>
          </svg>
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-brand">KOOR</span>
          <span className="sidebar-sub">Safety Monitor</span>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="sidebar-search-inner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="sidebar-search-input"
            type="text"
            placeholder="Search node / area…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((label) => (
          <div
            key={label}
            className={`sidebar-nav-item${activeItem === label ? " active" : ""}`}
            onClick={() => onActiveItemChange(label)}
            style={{ cursor: "pointer" }}
          >
            {NAV_ICONS[label]}
            <span className="sidebar-nav-label">{label}</span>
          </div>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div style={{ marginTop: "auto", padding: "0 10px 10px" }}>
        {profile && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: hovered ? "10px 12px" : "10px 8px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                marginBottom: 8,
                overflow: "hidden",
                cursor: "default",
                transition: "padding 0.3s ease"
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 32,
                height: 32,
                minWidth: 32,
                borderRadius: "50%",
                background: userRole === "admin"
                  ? "linear-gradient(135deg, #FF4D00, #DC2626)"
                  : "linear-gradient(135deg, #3B82F6, #6366F1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
                boxShadow: userRole === "admin" ? "0 0 12px rgba(255,77,0,0.4)" : "0 0 12px rgba(99,102,241,0.4)",
              }}>
                {getInitials(profile.name)}
              </div>
              <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: 1, 
                width: hovered ? "auto" : 0, 
                opacity: hovered ? 1 : 0, 
                overflow: "hidden", 
                transition: "width 0.3s ease, opacity 0.3s ease",
                whiteSpace: "nowrap" 
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profile.name}
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: userRole === "admin" ? "#FF4D00" : "#6366F1",
                }}>
                  {userRole === "admin" ? " Admin" : "Staff"}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: hovered ? "9px 12px" : "9px 16px",
            borderRadius: 10,
            background: "transparent",
            border: "1px solid rgba(220,38,38,0.2)",
            cursor: loggingOut ? "not-allowed" : "pointer",
            color: "rgba(220,38,38,0.8)",
            transition: "all 0.3s ease",
            fontSize: 12,
            fontWeight: 600,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.1)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          {loggingOut ? (
            <span className="rh-spinner rh-spinner--sm" style={{ flexShrink: 0, borderTopColor: "#DC2626", borderColor: "rgba(220,38,38,0.2)" }} />
          ) : (
            <svg style={{ flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          )}
          <span style={{ 
            width: hovered ? "auto" : 0, 
            opacity: hovered ? 1 : 0, 
            overflow: "hidden", 
            transition: "width 0.3s ease, opacity 0.3s ease",
            whiteSpace: "nowrap"
          }}>
            {loggingOut ? "Signing out…" : "Sign Out"}
          </span>
        </button>
      </div>
    </aside>
  );
}
