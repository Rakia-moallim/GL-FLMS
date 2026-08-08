"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth";
import type { Permission } from "../lib/rbac";
import { hasPermission } from "../lib/rbac";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optional: if set, user must have this permission or see an Access Denied screen. */
  require?: Permission;
}

export default function ProtectedRoute({ children, require: requiredPermission }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      document.cookie = "firebase-session=; path=/; max-age=0";
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "var(--bg-primary)" }}>
        <span className="rh-spinner" />
        <p style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ margin: 40, padding: "60px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
      >
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(220,38,38,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Access Denied</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 340, lineHeight: 1.6 }}>
          You don&apos;t have permission to access this section. Contact your administrator.
        </p>
      </motion.div>
    );
  }

  return <>{children}</>;
}
