"use client";
import { motion } from "framer-motion";

interface SystemPanelProps {
  connected: boolean;
  lastUpdate: Date | null;
  gas: number;
  flame: boolean;
  alarm: boolean;
}

export default function SystemPanel({ connected, lastUpdate, gas, flame, alarm }: SystemPanelProps) {
  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const rows = [
    { label: "Firebase Connection", value: connected ? "Connected" : "Offline", ok: connected },
    { label: "ESP32 Status",        value: connected ? "Online" : "Disconnected", ok: connected },
    { label: "Gas Sensor",          value: `${gas}% reading`, ok: gas <= 60 },
    { label: "Flame Sensor",        value: flame ? "FLAME DETECTED" : "Clear", ok: !flame },
    { label: "Alarm System",        value: alarm ? "TRIGGERED" : "Standby", ok: !alarm },
    { label: "Last Update",         value: lastUpdate ? formatTime(lastUpdate) : "—", ok: true },
  ];

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      whileHover={{ scale: 1.01, y: -2 }}
      style={{ padding: "28px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <p className="section-label">System</p>
          <h2 className="card-title" style={{ marginTop: 4, fontSize: 18, color: "var(--text-primary)" }}>
            Status Panel
          </h2>
        </div>

        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={`live-dot ${connected ? "" : "offline"}`} />
          <span style={{ fontSize: 12, fontWeight: 700, color: connected ? "var(--safe)" : "var(--text-muted)" }}>
            {connected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i + 0.5 }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{row.label}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: row.ok ? "var(--safe)" : "var(--danger)",
                padding: "3px 10px",
                borderRadius: 999,
                background: row.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              }}
            >
              {row.value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
