import { motion } from "framer-motion";
import { useState } from "react";

export default function Settings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [maintenance, setMaintenance] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="module-container" style={{ padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Settings</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>System configurations and preferences.</p>
      
      <div className="main-grid">
        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>Notifications</h2>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <div style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>Email Alerts</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Receive critical alerts via email.</div>
            </div>
            <div 
              onClick={() => setEmailAlerts(!emailAlerts)}
              style={{ width: 44, height: 24, background: emailAlerts ? "#10B981" : "rgba(255,255,255,0.1)", borderRadius: 12, position: "relative", cursor: "pointer", transition: "0.2s" }}
            >
              <div style={{ width: 20, height: 20, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: emailAlerts ? 22 : 2, transition: "0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>Push Notifications</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Receive alerts on your mobile device.</div>
            </div>
            <div 
              onClick={() => setPushAlerts(!pushAlerts)}
              style={{ width: 44, height: 24, background: pushAlerts ? "#10B981" : "rgba(255,255,255,0.1)", borderRadius: 12, position: "relative", cursor: "pointer", transition: "0.2s" }}
            >
              <div style={{ width: 20, height: 20, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: pushAlerts ? 22 : 2, transition: "0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>System</h2>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <div style={{ fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>Maintenance Mode</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Pause all alarms during system maintenance.</div>
            </div>
            <div 
              onClick={() => setMaintenance(!maintenance)}
              style={{ width: 44, height: 24, background: maintenance ? "#F59E0B" : "rgba(255,255,255,0.1)", borderRadius: 12, position: "relative", cursor: "pointer", transition: "0.2s" }}
            >
              <div style={{ width: 20, height: 20, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, left: maintenance ? 22 : 2, transition: "0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontWeight: 500, color: "var(--text-primary)", marginBottom: 8, fontSize: 14 }}>Gas Warning Threshold (%)</label>
            <input type="number" defaultValue="35" style={{ width: "100%", padding: "12px 16px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", outline: "none", transition: "0.2s" }} onFocus={(e) => e.target.style.borderColor = "var(--text-secondary)"} onBlur={(e) => e.target.style.borderColor = "var(--border)"} />
          </div>

          <button style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: 8, fontWeight: 600, cursor: "pointer", transition: "0.2s" }} className="hover-bg">
            Save Configurations
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg:hover { background: rgba(255,255,255,0.1) !important; }
      `}} />
    </motion.div>
  );
}
