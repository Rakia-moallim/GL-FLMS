"use client";
import { useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";

interface ChartPoint { time: string; gas: number; }

interface TemporalAnalysisProps {
  history: ChartPoint[];
  alarm: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "rgba(10,10,20,0.95)",
        border: "1px solid rgba(255,77,0,0.3)",
        borderRadius: 10,
        padding: "10px 14px",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
        <div style={{ color: "#FF4D00", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em" }}>
          {payload[0].value}<span style={{ fontSize: 12, fontWeight: 500, marginLeft: 2 }}>%</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 2 }}>Gas Concentration</div>
      </div>
    );
  }
  return null;
};

export default function TemporalAnalysis({ history, alarm }: TemporalAnalysisProps) {
  const strokeColor = alarm ? "#DC2626" : "#FF4D00";
  const gradientId = alarm ? "areaGradientDanger" : "areaGradientSafe";

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      style={{ padding: "24px", position: "relative" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <span className="section-label">Real-Time</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginTop: 3 }}>
            Temporal Analysis
          </h2>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            Gas concentration trend — last {history.length} readings
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 24, height: 2, background: "rgba(220,38,38,0.6)", borderRadius: 1 }} />
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em" }}>THRESHOLD 60%</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="live-dot" />
            <span style={{ fontSize: 10, color: "var(--safe)", fontWeight: 700, letterSpacing: "0.1em" }}>LIVE</span>
          </div>
        </div>
      </div>

      {history.length < 2 ? (
        <div style={{
          height: 260,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}>
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </motion.div>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Awaiting ESP32 data stream…</span>
        </div>
      ) : (
        /* Chart wrapper — position relative for scan line overlay */
        <div style={{ position: "relative" }}>
          <div className="chart-scan-line" />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={history} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={strokeColor} stopOpacity={0.35} />
                  <stop offset="50%"  stopColor={strokeColor} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(128,128,180,0.08)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "Inter, sans-serif" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "Inter, sans-serif" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,77,0,0.25)", strokeWidth: 1 }} />
              <ReferenceLine
                y={60}
                stroke="rgba(220,38,38,0.45)"
                strokeDasharray="5 4"
                label={{ value: "Danger", fill: "rgba(220,38,38,0.7)", fontSize: 9, dx: -4 }}
              />
              <Area
                type="monotoneX"
                dataKey="gas"
                stroke={strokeColor}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 5, fill: strokeColor, strokeWidth: 2, stroke: "#fff" }}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
