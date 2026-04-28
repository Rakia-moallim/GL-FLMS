import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { firestore, db } from "../../lib/firebase";
import { collection, query, limit, onSnapshot } from "firebase/firestore";
import { ref, onValue } from "firebase/database";

interface AlertRecord {
  id: string;
  timestamp: any;
  type: "Warning" | "Critical";
  source: string;
  desc: string;
  status: string;
}

interface AlertHistoryProps {
  alarm: boolean;
}

export default function AlertHistory({ alarm }: AlertHistoryProps) {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. We listen to the Realtime Database '/alerts' path
    const alertsRef = ref(db, "alerts");
    
    const unsub = onValue(alertsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setAlerts([]);
        setLoading(false);
        return;
      }

      const data = snapshot.val();
      // Map the object of alerts to an array
      const docs = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) as AlertRecord[];

      // Sort by timestamp (descending)
      docs.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
      });

      setAlerts(docs);
      setLoading(false);
    }, (err) => {
      console.error("RTDB Listen Error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const formatTimestamp = (ts: any) => {
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
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Alert History</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Log of all system warnings and critical alerts.</p>
      
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
             <span className="rh-spinner" style={{ marginBottom: 12 }} />
             <p>Fetching alert logs...</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 600 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>TIMESTAMP</th>
                  <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>SEVERITY</th>
                  <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>SOURCE</th>
                  <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>DESCRIPTION</th>
                  <th style={{ padding: "16px 24px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No alert history found in database.</td>
                  </tr>
                ) : (
                  alerts.map(alert => (
                    <tr key={alert.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s", cursor: "pointer" }} className="alert-row-hover">
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "var(--text-muted)" }}>{formatTimestamp(alert.timestamp)}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ 
                          color: alert.type === "Critical" ? "#DC2626" : "#F59E0B", 
                          fontWeight: 700, fontSize: 11, padding: "4px 8px", 
                          background: alert.type === "Critical" ? "rgba(220,38,38,0.1)" : "rgba(245,158,11,0.1)", 
                          borderRadius: 4 
                        }}>
                          {alert.type?.toUpperCase() ?? "UNKNOWN"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{alert.source}</td>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "var(--text-secondary)" }}>{alert.desc}</td>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "#10B981", fontWeight: 500 }}>{alert.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .alert-row-hover:hover { background: rgba(255,255,255,0.02); }
      `}} />
    </motion.div>
  );
}
