"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from "recharts";
import { motion } from "framer-motion";

interface ChartPoint { time: string; gas: number; }

interface LiveChartProps {
  history: ChartPoint[];
  alarm: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "rgba(13,13,20,0.95)",
        border: "1px solid rgba(255,109,0,0.3)",
        borderRadius: 12, padding: "10px 14px",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{label}</div>
        <div style={{ color: "#FFC400", fontWeight: 700, fontSize: 18 }}>
          {payload[0].value}%
        </div>
      </div>
    );
  }
  return null;
};

export default function LiveChart({ history, alarm }: LiveChartProps) {
  const strokeColor = alarm ? "#EF4444" : "#FF6D00";
  const fillStart = alarm ? "rgba(239,68,68,0.3)" : "rgba(255,109,0,0.3)";
  const fillEnd   = "rgba(255,109,0,0)";

  return (
    <motion.div
      className={`glass-card ${alarm ? "danger-glow" : "orange-glow"}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      style={{ padding: "28px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p className="section-label">Real-Time</p>
          <h2 className="card-title" style={{ marginTop: 4, fontSize: 18, color: "var(--text-primary)" }}>
            Gas Concentration History
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>LIVE</span>
        </div>
      </div>

      {history.length < 2 ? (
        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--text-muted)", fontSize: 14 }}>
          Waiting for data from ESP32...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={60} stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.6}
              label={{ value: "Threshold", fill: "#EF4444", fontSize: 10 }} />
            <Area
              type="monotoneX"
              dataKey="gas"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill="url(#gasGradient)"
              dot={false}
              activeDot={{ r: 5, fill: strokeColor, strokeWidth: 2, stroke: "#fff" }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
