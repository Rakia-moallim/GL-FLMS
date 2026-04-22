"use client";
import { motion } from "framer-motion";
import CountUp from "react-countup";

interface RightPanelProps {
  connected: boolean;
  signalStrength: number;
  uptime: number;
  sessionStart: Date;
  alarm: boolean;
  gas: number;
  flame: boolean;
}

function formatUptime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function SignalBars({ dbm }: { dbm: number }) {
  // -50 excellent, -67 good, -80 weak
  const strength = dbm >= -60 ? "full" : dbm >= -75 ? "medium" : "weak";
  const bars = [1, 2, 3, 4];
  const filled = strength === "full" ? 4 : strength === "medium" ? 3 : 1;
  const color = strength === "full" ? "#10B981" : strength === "medium" ? "#F59E0B" : "#DC2626";
  return (
    <span className="signal-bar">
      {bars.map((b) => (
        <span key={b} style={{
          width: 3,
          height: `${b * 25}%`,
          borderRadius: 2,
          background: b <= filled ? color : "rgba(128,128,128,0.25)",
          display: "inline-block",
        }} />
      ))}
    </span>
  );
}

export default function RightPanel({ connected, signalStrength, uptime, sessionStart, alarm, gas, flame }: RightPanelProps) {
  const sessionDuration = uptime;
  const overallHealth = alarm ? 0 : flame ? 30 : gas > 60 ? 20 : gas > 35 ? 65 : 100;
  const healthColor = overallHealth >= 90 ? "#10B981" : overallHealth >= 60 ? "#F59E0B" : "#DC2626";

  const nodes = [
    {
      id: "ESP32-01",
      role: "Primary Sensor",
      rssi: signalStrength,
      latency: connected ? 48 : null,
      status: connected ? "streaming" : "offline",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Active Session Shield ── */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 0.25 }}
        style={{ padding: "22px" }}
      >
        <span className="section-label">Active Session</span>

        {/* Shield */}
        <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 12px" }}>
          <motion.div
            animate={alarm ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2 }}
            style={{ position: "relative" }}
          >
            <svg width="80" height="88" viewBox="0 0 80 88" fill="none">
              <path
                d="M40 4L8 16v24c0 20.8 13.6 40.3 32 46 18.4-5.7 32-25.2 32-46V16L40 4z"
                fill={alarm ? "rgba(220,38,38,0.15)" : "rgba(16,185,129,0.12)"}
                stroke={alarm ? "#DC2626" : "#10B981"}
                strokeWidth="2"
              />
              {alarm ? (
                <path d="M40 30v16M40 54v2" stroke="#DC2626" strokeWidth="3" strokeLinecap="round"/>
              ) : (
                <path d="M28 44l8 8 16-16" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
            {!alarm && (
              <motion.div
                style={{
                  position: "absolute",
                  inset: -4,
                  borderRadius: "50%",
                  border: "1px solid rgba(16,185,129,0.25)",
                }}
                animate={{ scale: [1, 1.15], opacity: [0.6, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
              />
            )}
          </motion.div>
        </div>

        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: healthColor, letterSpacing: "-0.03em" }}>
            <CountUp end={overallHealth} duration={1.2} suffix="%" preserveValue />
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.1em", marginTop: 2 }}>
            SYSTEM HEALTH
          </div>
        </div>

        {/* Session info rows */}
        {[
          { label: "Session Start", value: sessionStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
          { label: "Uptime", value: formatUptime(sessionDuration) },
          { label: "Operator", value: "GL&FLMS Admin" },
        ].map((row) => (
          <div key={row.label} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{row.label}</span>
            <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Node Diagnostic ── */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 0.4 }}
        style={{ padding: "22px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <span className="section-label">Node Diagnostic</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>ESP32 Network</div>
          </div>
          <span className={`badge ${connected ? "badge-safe" : "badge-danger"}`}>
            {connected ? "Online" : "Offline"}
          </span>
        </div>

        {nodes.map((node) => (
          <div key={node.id} style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--bg-row)",
            border: "1px solid var(--border)",
            marginBottom: 10,
          }}>
            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{node.id}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{node.role}</div>
              </div>
              {node.status === "streaming" ? (
                <span className="badge badge-stream">
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                  Streaming
                </span>
              ) : (
                <span className="badge badge-danger">Offline</span>
              )}
            </div>

            {/* Signal + latency */}
            <div style={{ display: "flex", gap: 16 }}>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>SIGNAL</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <SignalBars dbm={node.rssi} />
                  <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>{node.rssi} dBm</span>
                </div>
              </div>
              {node.latency && (
                <div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>LATENCY</div>
                  <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>{node.latency} ms</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Cloud Link */}
        <div style={{
          padding: "11px 14px",
          borderRadius: 12,
          background: "var(--bg-row)",
          border: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
            </svg>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>Firebase RTDB</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Cloud Link</div>
            </div>
          </div>
          <span className={`badge ${connected ? "badge-stream" : "badge-danger"}`}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
            {connected ? "Synced" : "Lost"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
