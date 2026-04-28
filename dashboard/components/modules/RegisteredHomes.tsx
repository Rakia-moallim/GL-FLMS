"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { firestore } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

interface HomeRecord {
  id: string;
  home_id: string;
  address: string;
  status: string;
  lat: number | null;
  lng: number | null;
  registration_date: any;
}

export default function RegisteredHomes() {
  const [homes, setHomes] = useState<HomeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, "homes"), orderBy("registration_date", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HomeRecord[];
      setHomes(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("en-US", { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="module-container" style={{ padding: "0 20px" }}>
      <div className="rh-page-header" style={{ marginBottom: 32 }}>
        <div className="rh-page-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
            <path d="m3 9 2.45-4.91A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.79 1.09L21 9"/>
            <path d="M12 3v6"/><path d="M12 14v4"/><path d="M8 14v4"/><path d="M16 14v4"/>
          </svg>
        </div>
        <div>
          <span className="section-label">Inventory</span>
          <h1 className="rh-page-title" style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>Registered Homes</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Real-time directory of all protected assets in Somalia.</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--border)" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
             <div className="rh-spinner" />
             <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Fetching database records...</span>
          </div>
        ) : homes.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
            <p>No homes registered yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Home ID</th>
                  <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Address</th>
                  <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Location (Lat/Lng)</th>
                  <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Registration Date</th>
                  <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {homes.map((home) => (
                  <tr key={home.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} className="table-row-hover">
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                        <span style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 700 }}>{home.home_id}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", maxWidth: 300 }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {home.address}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
                        {home.lat?.toFixed(5) ?? "—"} / {home.lng?.toFixed(5) ?? "—"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: 13, color: "var(--text-muted)" }}>
                      {formatDate(home.registration_date)}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                        background: "rgba(16,185,129,0.1)", color: "#10B981"
                      }}>
                        {home.status?.toUpperCase() ?? "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .table-row-hover:hover { background: rgba(255,255,255,0.03); }
      `}} />
    </motion.div>
  );
}
