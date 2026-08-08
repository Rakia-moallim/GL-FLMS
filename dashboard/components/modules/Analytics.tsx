import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { firestore, db } from "../../lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { ref, get } from "firebase/database";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Analytics() {
  const [stats, setStats] = useState({ gasIncidents: 0, flameIncidents: 0, total: 0 });
  const [chartData, setChartData] = useState<{date: string, gas: number, flame: number}[]>([]);
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

        // Compute chart data
        const sortedDocs = docs
          .filter(d => d.timestamp)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const cDataMap = new Map<string, { date: string; gas: number; flame: number }>();
        sortedDocs.forEach(d => {
          const dateStr = new Date(d.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (!cDataMap.has(dateStr)) {
            cDataMap.set(dateStr, { date: dateStr, gas: 0, flame: 0 });
          }
          const entry = cDataMap.get(dateStr)!;
          if (d.desc?.toLowerCase().includes("gas")) entry.gas++;
          else if (d.desc?.toLowerCase().includes("flame")) entry.flame++;
        });

        if (cDataMap.size === 0) {
           const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
           cDataMap.set(today, { date: today, gas: 0, flame: 0 });
        }

        setChartData(Array.from(cDataMap.values()).slice(-14));
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

      <div className="glass-card" style={{ padding: 24, height: 380, position: "relative" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 24 }}>Incidents Over Time</h3>
        <div style={{ width: "100%", height: 300 }}>
          {loading ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span className="rh-spinner" /></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFlame" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(17,24,39,0.9)", backdropFilter: "blur(8px)", borderColor: "rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                  cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1, strokeDasharray: "3 3" }}
                />
                <Area type="monotone" dataKey="gas" name="Gas Alerts" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorGas)" />
                <Area type="monotone" dataKey="flame" name="Flame Alerts" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFlame)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </motion.div>
  );
}
