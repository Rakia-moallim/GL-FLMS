"use client";
import { motion } from "framer-motion";
import CountUp from "react-countup";

interface GasCardProps {
  gas: number;
  alarm: boolean;
}

export default function GasCard({ gas, alarm }: GasCardProps) {
  const radius = 70;
  const stroke = 10;
  const normalizedR = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedR;
  const progress = circumference - (gas / 100) * circumference;

  const color = gas > 60 ? "#EF4444" : gas > 35 ? "#F97316" : "#22C55E";
  const glowColor = gas > 60 ? "rgba(239,68,68,0.5)" : gas > 35 ? "rgba(249,115,22,0.4)" : "rgba(34,197,94,0.4)";

  return (
    <motion.div
      className={`glass-card ${alarm ? "danger-glow" : "safe-glow"}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -4 }}
      style={{ padding: "28px", position: "relative" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p className="section-label">Sensor</p>
          <h2 className="card-title" style={{ marginTop: 4, fontSize: 18, color: "var(--text-primary)" }}>
            Gas Level
          </h2>
        </div>
        <motion.div
          style={{
            fontSize: 32,
            filter: `drop-shadow(0 0 12px ${glowColor})`,
          }}
          animate={{ scale: alarm ? [1, 1.15, 1] : 1 }}
          transition={{ repeat: alarm ? Infinity : 0, duration: 0.8 }}
        >
          💨
        </motion.div>
      </div>

      {/* Circular Progress */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
        <svg width={radius * 2} height={radius * 2} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle
            cx={radius} cy={radius} r={normalizedR}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <motion.circle
            cx={radius} cy={radius} r={normalizedR}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
          />
        </svg>

        {/* Center label */}
        <div style={{ position: "absolute", textAlign: "center" }}>
          <div className="card-value" style={{ color }}>
            <CountUp end={gas} duration={1.2} decimals={0} />
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>%</div>
        </div>
      </div>

      {/* Status */}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
        <motion.span
          className={`badge ${gas > 60 ? "badge-danger" : gas > 35 ? "badge-warning" : "badge-safe"}`}
          animate={alarm ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <span style={{ fontSize: 8 }}>●</span>
          {gas > 60 ? "HIGH — DANGER" : gas > 35 ? "ELEVATED" : "NORMAL"}
        </motion.span>
      </div>

      {/* Threshold bar */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
          <span>Concentration</span>
          <span>Threshold: 60%</span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${gas}%` }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{
              height: "100%",
              background: `linear-gradient(90deg, #22C55E, ${color})`,
              borderRadius: 3,
              boxShadow: `0 0 8px ${glowColor}`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
