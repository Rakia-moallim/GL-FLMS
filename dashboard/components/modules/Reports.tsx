import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { firestore } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

interface ReportRecord {
  id: string;
  name: string;
  date: any;
  type: string;
  url?: string;
}

export default function Reports() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, "reports"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReportRecord[];
      setReports(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="module-container" style={{ padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Reports</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Export data and generate system summaries.</p>
      
      <div className="glass-card" style={{ padding: 32, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 20 }}>Generate Report</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <button style={{ padding: "12px 24px", background: "var(--text-primary)", color: "#000", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "0.2s" }} className="hover-brightness">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export to PDF
          </button>
          <button style={{ padding: "12px 24px", background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: 8, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "0.2s" }} className="hover-bg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Export to CSV
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 32 }}>
        <h2 style={{ fontSize: 18, color: "var(--text-primary)", marginBottom: 20 }}>Recent Reports</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-secondary)" }}>
              <span className="rh-spinner" />
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              No reports found in database.
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)", transition: "0.2s" }} className="hover-border">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div>
                    <span style={{ color: "var(--text-primary)", fontWeight: 500, display: "block" }}>{report.name}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{formatDate(report.date)}</span>
                  </div>
                </div>
                <a href={report.url || "#"} target="_blank" rel="noreferrer" style={{ color: "#3B82F6", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Download</a>
              </div>
            ))
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-brightness:hover { filter: brightness(0.9); }
        .hover-bg:hover { background: rgba(255,255,255,0.1) !important; }
        .hover-border:hover { border-color: rgba(255,255,255,0.2) !important; }
      `}} />
    </motion.div>
  );
}
