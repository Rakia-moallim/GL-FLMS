import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { firestore, db } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, set } from "firebase/database";

export default function Settings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [gasThreshold, setGasThreshold] = useState(35);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(firestore, "settings", "global");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setEmailAlerts(data.emailAlerts ?? true);
          setPushAlerts(data.pushAlerts ?? false);
          setMaintenance(data.maintenance ?? false);
          setGasThreshold(data.gasThreshold ?? 35);
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save to Firestore for persistence
      await setDoc(docRef, {
        emailAlerts,
        pushAlerts,
        maintenance,
        gasThreshold
      }, { merge: true });

      // 2. Save to RTDB for hardware sync
      await set(ref(db, "settings/global/gasThreshold"), gasThreshold);

      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const docRef = doc(firestore, "settings", "global");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="module-container" style={{ padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Settings</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>System configurations and preferences.</p>
      
      {loading ? (
        <div style={{ padding: 60, textAlign: "center" }}>
          <span className="rh-spinner" />
        </div>
      ) : (
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
              <input 
                type="number" 
                value={gasThreshold} 
                onChange={(e) => setGasThreshold(parseInt(e.target.value) || 0)}
                style={{ width: "100%", padding: "12px 16px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", outline: "none", transition: "0.2s" }} 
                onFocus={(e) => e.target.style.borderColor = "var(--text-secondary)"} 
                onBlur={(e) => e.target.style.borderColor = "var(--border)"} 
              />
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: 8, fontWeight: 600, cursor: "pointer", transition: "0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} 
              className="hover-bg"
            >
              {saving && <span className="rh-spinner rh-spinner--sm" />}
              {saving ? "Saving..." : "Save Configurations"}
            </button>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg:hover { background: rgba(255,255,255,0.1) !important; }
      `}} />
    </motion.div>
  );
}
