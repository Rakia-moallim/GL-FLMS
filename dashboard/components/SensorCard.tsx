"use client";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { LineChart, Line, ResponsiveContainer } from "recharts";

type CardType = "gas" | "oxygen" | "fire" | "system";

interface SensorCardProps {
  type: CardType;
  value: number;
  unit: string;
  label: string;
  title: string;
  alarm: boolean;
  sparkData?: { v: number }[];
  isBoolean?: boolean;
  booleanTrue?: string;
  booleanFalse?: string;
  delay?: number;
}

const ICONS: Record<CardType, React.ReactNode> = {
  gas: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a8 8 0 0 1 8 8c0 5.4-8 12-8 12S4 15.4 4 10a8 8 0 0 1 8-8z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  oxygen: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m10 0h3a2 2 0 0 0 2-2v-3"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  fire: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 6-8 8-8 14a8 8 0 0 0 16 0c0-6-8-8-8-14z"/>
      <path d="M12 12c0 3-3 4-3 7a3 3 0 0 0 6 0c0-3-3-4-3-7z"/>
    </svg>
  ),
  system: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
      <circle cx="12" cy="10" r="2"/>
    </svg>
  ),
};

const COLORS: Record<string, string> = {
  safe: "#10B981",
  warning: "#F59E0B",
  danger: "#DC2626",
  oxygen: "#3B82F6",
};

function getGasState(v: number): "safe" | "warning" | "danger" {
  return v > 60 ? "danger" : v > 35 ? "warning" : "safe";
}

export default function SensorCard({
  type, value, unit, label, title, alarm, sparkData = [],
  isBoolean = false, booleanTrue = "DETECTED", booleanFalse = "CLEAR",
  delay = 0,
}: SensorCardProps) {
  // Color logic
  let color = COLORS.safe;
  let dotClass = "";
  let cardClass = "glass-card";

  if (type === "gas") {
    const state = getGasState(value);
    color = COLORS[state];
    if (state === "danger" || alarm) { cardClass += " state-danger"; dotClass = "danger"; }
    else if (state === "warning") { cardClass += " state-warning"; dotClass = "warning"; }
  } else if (type === "oxygen") {
    color = value < 18 ? COLORS.danger : value < 19.5 ? COLORS.warning : COLORS.oxygen;
    if (alarm) { cardClass += " state-danger"; dotClass = "danger"; }
  } else if (type === "fire") {
    color = value > 0 ? COLORS.danger : COLORS.safe;
    if (value > 0 || alarm) { cardClass += " state-danger"; dotClass = "danger"; }
  } else if (type === "system") {
    color = alarm ? COLORS.danger : COLORS.safe;
    if (alarm) { cardClass += " state-danger"; dotClass = "danger"; }
  }

  const sparkColor = color;

  return (
    <motion.div
      className={cardClass}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      whileHover={{ y: -5 }}
      style={{ padding: "22px", cursor: "default" }}
    >
      {/* Header */}
      <div className="sensor-card-header">
        <div className="sensor-card-meta">
          <span className="sensor-card-label">{label}</span>
          <span className="sensor-card-title">{title}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <motion.div
            style={{ color, opacity: 0.9 }}
            animate={alarm && type !== "oxygen" ? { scale: [1, 1.15, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            {ICONS[type]}
          </motion.div>
          <div className="live-badge">
            <span className={`live-dot ${dotClass}`} />
            LIVE
          </div>
        </div>
      </div>

      {/* Value */}
      <div style={{ marginTop: 4 }}>
        {isBoolean ? (
          <div
            className="sensor-card-value"
            style={{ color, fontSize: 28, fontWeight: 800, marginBottom: 2 }}
          >
            {value > 0 ? booleanTrue : booleanFalse}
          </div>
        ) : (
          <div className="sensor-card-value" style={{ color }}>
            <CountUp
              end={value}
              duration={1.2}
              decimals={type === "oxygen" ? 1 : 0}
              preserveValue
            />
            <span className="sensor-card-unit">{unit}</span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparkData.length > 1 && (
        <div className="sensor-card-sparkline">
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <filter id={`glow-${type}`}>
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <Line
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={2}
                dot={false}
                animationDuration={600}
                style={{ filter: `url(#glow-${type})` }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {sparkData.length <= 1 && (
        <div style={{ height: 40, display: "flex", alignItems: "center" }}>
          <div style={{ height: 2, width: "100%", background: "var(--border)", borderRadius: 1 }}>
            <motion.div
              style={{ height: "100%", background: sparkColor, borderRadius: 1, opacity: 0.5 }}
              animate={{ width: ["0%", "100%", "0%"] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
          </div>
        </div>
      )}

      {/* Bottom bar */}
      {!isBoolean && (
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", background: `linear-gradient(90deg, ${COLORS.safe}, ${color})`, borderRadius: 2 }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, type === "oxygen" ? ((value - 15) / 10) * 100 : value))}%` }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
