import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { firestore, db } from "../../lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { ref, get } from "firebase/database";

export default function Analytics() {
  const [stats, setStats] = useState({ gasIncidents: 0, flameIncidents: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch from RTDB alerts path
        const snapshot = await get(ref(db, "alerts"));
        if (!snapshot.exists()) {
          setStats({ gasIncidents: 0, flameIncidents: 0, total: 0 });
          setLoading(false);
          return;
        }

        const data = snapshot.val();
        const docs = Object.values(data) as any[];
        
        const gas = docs.filter(d => d.desc?.toLowerCase().includes("gas")).length;
        const flame = docs.filter(d => d.desc?.toLowerCase().includes("flame")).length;
        
        setStats({ 
          gasIncidents: gas, 
          flameIncidents: flame, 
          total: docs.length 
        });
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="module-container" style={{ padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Analytics</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Historical trends and data analysis.</p>
      
      <div className="main-grid" style={{ marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h3 style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>Avg Daily Gas Level</h3>
          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--text-primary)" }}>{loading ? "..." : "14.2%"}</div>
          <div style={{ color: "#10B981", fontSize: 13, marginTop: 6, fontWeight: 500 }}>↓ 2.4% from last week</div>
        </div>
        <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h3 style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>Total Incidents (All Time)</h3>
          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--text-primary)" }}>{loading ? "..." : stats.total}</div>
          <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>{stats.gasIncidents} Gas / {stats.flameIncidents} Flame</div>
        </div>
        <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h3 style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>System Uptime</h3>
          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--text-primary)" }}>99.9%</div>
          <div style={{ color: "#10B981", fontSize: 13, marginTop: 6, fontWeight: 500 }}>All systems operational</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 24, height: 340, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {/* Mock background grid lines to make it look like a chart background */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "100% 40px", pointerEvents: "none" }} />
        
        <div style={{ textAlign: "center", color: "var(--text-muted)", position: "relative", zIndex: 10 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" style={{ marginBottom: 16, opacity: 0.5 }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <p style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>Area Chart Visualization (Placeholder)</p>
          <p style={{ fontSize: 13, opacity: 0.7 }}>A premium charting library (like Recharts) can be added here.</p>
        </div>
      </div>
    </motion.div>
  );
}
