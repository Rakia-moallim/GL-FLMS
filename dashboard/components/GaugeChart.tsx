"use client";
import { motion } from "framer-motion";

interface GaugeChartProps {
  value: number; // 0–100
  alarm: boolean;
}

export default function GaugeChart({ value, alarm }: GaugeChartProps) {
  const cx = 120, cy = 110, r = 88;
  const startAngle = -210;
  const endAngle = 30;
  const range = endAngle - startAngle;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (start: number, end: number) => {
    const s = toRad(start);
    const e = toRad(end);
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleAngle = startAngle + (value / 100) * range;
  const needleRad = toRad(needleAngle);
  const needleLen = 72;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  const color = value > 60 ? "#EF4444" : value > 35 ? "#F97316" : "#22C55E";
  const glowColor = value > 60 ? "rgba(239,68,68,0.6)" : value > 35 ? "rgba(249,115,22,0.5)" : "rgba(34,197,94,0.5)";

  // Tick marks
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const ang = toRad(startAngle + i * (range / 10));
    const inner = r - 14;
    const outer = r + 2;
    return {
      x1: cx + inner * Math.cos(ang), y1: cy + inner * Math.sin(ang),
      x2: cx + outer * Math.cos(ang), y2: cy + outer * Math.sin(ang),
      label: i * 10,
      lx: cx + (r - 28) * Math.cos(ang),
      ly: cy + (r - 28) * Math.sin(ang),
    };
  });

  return (
    <motion.div
      className={`glass-card ${alarm ? "danger-glow" : "safe-glow"}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      whileHover={{ scale: 1.02, y: -4 }}
      style={{ padding: "28px" }}
    >
      <p className="section-label">Detection Intensity</p>
      <h2 className="card-title" style={{ marginTop: 4, marginBottom: 16, fontSize: 18, color: "var(--text-primary)" }}>
        Gas Gauge
      </h2>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width={240} height={160} viewBox="0 0 240 160">
          {/* Track arc */}
          <path
            d={arcPath(startAngle, endAngle)}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={12} strokeLinecap="round"
          />
          {/* Colored fill arc */}
          <motion.path
            d={arcPath(startAngle, startAngle + (value / 100) * range)}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
          />

          {/* Tick marks */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke="rgba(255,255,255,0.25)" strokeWidth={i % 5 === 0 ? 2 : 1} />
              {i % 5 === 0 && (
                <text x={t.lx} y={t.ly} textAnchor="middle" dominantBaseline="middle"
                  fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily="Inter, sans-serif">
                  {t.label}
                </text>
              )}
            </g>
          ))}

          {/* Needle */}
          <motion.line
            x1={cx} y1={cy}
            x2={nx} y2={ny}
            stroke={color} strokeWidth={3} strokeLinecap="round"
            initial={{ rotate: startAngle, originX: cx, originY: cy }}
            animate={{ x2: nx, y2: ny }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
          />
          <circle cx={cx} cy={cy} r={7} fill={color}
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }} />
          <circle cx={cx} cy={cy} r={3} fill="white" />

          {/* Center value */}
          <text x={cx} y={cy + 28} textAnchor="middle"
            fill={color} fontSize={22} fontWeight={800} fontFamily="Inter, sans-serif">
            {value}%
          </text>
          <text x={cx} y={cy + 42} textAnchor="middle"
            fill="rgba(255,255,255,0.4)" fontSize={9} fontFamily="Inter, sans-serif">
            GAS LEVEL
          </text>
        </svg>
      </div>

      {/* Zone labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "0 8px" }}>
        {["SAFE", "CAUTION", "DANGER"].map((label, i) => (
          <span key={label} className="section-label" style={{
            color: i === 0 ? "var(--safe)" : i === 1 ? "var(--warning)" : "var(--danger)",
            fontSize: 9
          }}>
            {label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
