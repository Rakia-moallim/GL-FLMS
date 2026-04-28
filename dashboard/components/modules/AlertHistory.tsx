import { motion } from "framer-motion";

interface AlertHistoryProps {
  alarm: boolean;
}

export default function AlertHistory({ alarm }: AlertHistoryProps) {
  // Combine real recent history with some mock old history
  const mockAlerts = [
    { id: 1, date: "2026-04-21 14:22:00", type: "Warning", source: "Node 01", desc: "Gas level reached 40%", status: "Resolved" },
    { id: 2, date: "2026-04-19 09:15:30", type: "Critical", source: "Node 02", desc: "Flame detected", status: "Resolved" },
    { id: 3, date: "2026-04-18 22:45:10", type: "Warning", source: "Node 01", desc: "Gas level reached 38%", status: "Resolved" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="module-container" style={{ padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Alert History</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Log of all system warnings and critical alerts.</p>
      
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
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
              {alarm && (
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(220,38,38,0.05)" }}>
                    <td style={{ padding: "16px 24px", fontSize: 14 }}>Just now</td>
                    <td style={{ padding: "16px 24px" }}><span style={{ color: "#DC2626", fontWeight: 700, fontSize: 11, padding: "4px 8px", background: "rgba(220,38,38,0.1)", borderRadius: 4 }}>CRITICAL</span></td>
                    <td style={{ padding: "16px 24px", fontSize: 14 }}>Node 01</td>
                    <td style={{ padding: "16px 24px", fontSize: 14 }}>Hazard Detected (Gas/Flame)</td>
                    <td style={{ padding: "16px 24px", fontSize: 14, color: "#DC2626", fontWeight: 500 }}>Active</td>
                </tr>
              )}
              {mockAlerts.map(alert => (
                <tr key={alert.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s", cursor: "pointer" }} className="alert-row-hover">
                  <td style={{ padding: "16px 24px", fontSize: 14, color: "var(--text-muted)" }}>{alert.date}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ 
                      color: alert.type === "Critical" ? "#DC2626" : "#F59E0B", 
                      fontWeight: 700, fontSize: 11, padding: "4px 8px", 
                      background: alert.type === "Critical" ? "rgba(220,38,38,0.1)" : "rgba(245,158,11,0.1)", 
                      borderRadius: 4 
                    }}>
                      {alert.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{alert.source}</td>
                  <td style={{ padding: "16px 24px", fontSize: 14, color: "var(--text-secondary)" }}>{alert.desc}</td>
                  <td style={{ padding: "16px 24px", fontSize: 14, color: "#10B981", fontWeight: 500 }}>{alert.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .alert-row-hover:hover { background: rgba(255,255,255,0.02); }
      `}} />
    </motion.div>
  );
}
