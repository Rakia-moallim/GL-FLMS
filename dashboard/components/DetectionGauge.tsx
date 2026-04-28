"use client";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useTheme } from "./ThemeProvider";

interface DetectionGaugeProps {
  value: number; // 0–100
  alarm: boolean;
}

// Returns color stops along safe→warning→danger gradient
function getGaugeColor(v: number): string {
  if (v > 60) return "#DC2626";       // Crimson
  if (v > 35) return "#FF4D00";       // Neon Orange
  return "#10B981";                   // Emerald
}

function getZoneLabel(v: number): string {
  if (v > 60) return "DANGER";
  if (v > 35) return "WARNING";
  return "SAFE";
}

// SVG arc helpers — semi-circle: start=-180°, end=0°
const CX = 130, CY = 120, R = 92;

function polarToXY(angleDeg: number, r = R): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function arcD(startDeg: number, endDeg: number, r = R): string {
  const [x1, y1] = polarToXY(startDeg, r);
  const [x2, y2] = polarToXY(endDeg, r);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// Map value 0-100 → angle -180° to 0°
function valueToAngle(v: number): number {
  return -180 + (v / 100) * 180;
}

export default function DetectionGauge({ value, alarm }: DetectionGaugeProps) {
  const { theme } = useTheme();
  const color = getGaugeColor(value);
  const label = getZoneLabel(value);
  const needleAngle = valueToAngle(value);
  const [nx, ny] = polarToXY(needleAngle, 76);

  // Track arc: from -180° to 0°
  const trackPath = arcD(-180, 0);
  // Fill arc: from -180° to needleAngle
  const fillPath = value > 0 ? arcD(-180, Math.min(needleAngle, -0.5)) : null;

  // Tick positions (0%, 25%, 50%, 75%, 100%)
  const ticks = [0, 25, 50, 75, 100].map((t) => {
    const angle = valueToAngle(t);
    const [ox, oy] = polarToXY(angle, R + 8);
    const [ix, iy] = polarToXY(angle, R - 10);
    const [lx, ly] = polarToXY(angle, R + 22);
    return { t, ox, oy, ix, iy, lx, ly };
  });

  const isLight = theme === "light";

  return (
    <motion.div
      className={isLight ? "neumorphic" : "glass-card"}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      whileHover={{ y: -3 }}
      style={{ padding: "24px" }}
    >
      <span className="section-label">Detection Intensity</span>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginTop: 3, marginBottom: 4 }}>
        Gas Gauge
      </h2>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width={260} height={150} viewBox="0 0 260 150">
          {/* Gradient defs */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#10B981" />
              <stop offset="50%"  stopColor="#FF4D00" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Track arc */}
          <path
            d={trackPath}
            fill="none"
            stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)"}
            strokeWidth={14}
            strokeLinecap="round"
          />

          {/* Gradient fill arc (static full gradient, clip by value) */}
          <path
            d={trackPath}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={14}
            strokeLinecap="round"
            opacity={0.18}
          />

          {/* Animated active fill */}
          {fillPath && (
            <motion.path
              d={fillPath}
              fill="none"
              stroke={color}
              strokeWidth={14}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
            />
          )}

          {/* Tick marks */}
          {ticks.map(({ t, ox, oy, ix, iy, lx, ly }) => (
            <g key={t}>
              <line x1={ix} y1={iy} x2={ox} y2={oy}
                stroke={isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.2)"}
                strokeWidth={t % 50 === 0 ? 2 : 1}
              />
              {t % 50 === 0 && (
                <text
                  x={lx} y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.35)"}
                  fontSize={9}
                  fontFamily="Inter, sans-serif"
                  fontWeight={600}
                >
                  {t}
                </text>
              )}
            </g>
          ))}

          {/* Needle */}
          <motion.line
            x1={CX} y1={CY}
            x2={nx} y2={ny}
            stroke={color}
            strokeWidth={3.5}
            strokeLinecap="round"
            animate={{ x2: nx, y2: ny }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
            style={{ filter: `drop-shadow(0 0 5px ${color})` }}
          />
          {/* Needle hub */}
          <circle cx={CX} cy={CY} r={9} fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
          <circle cx={CX} cy={CY} r={4} fill={isLight ? "#E8ECF0" : "#101018"} />
        </svg>
      </div>

      {/* Value + label */}
      <div style={{ textAlign: "center", marginTop: -4 }}>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.04em", color, lineHeight: 1 }}>
          <CountUp end={value} duration={1.4} decimals={0} preserveValue />
          <span style={{ fontSize: 16, fontWeight: 500, color: "var(--text-muted)", marginLeft: 2 }}>%</span>
        </div>
        <div style={{
          marginTop: 8,
          display: "inline-block",
          padding: "3px 14px",
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.14em",
          background: color + "18",
          color,
          border: `1px solid ${color}44`,
        }}>
          {label}
        </div>
      </div>

      {/* Zone bar */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em" }}>
        <span style={{ color: "#10B981" }}>● SAFE</span>
        <span style={{ color: "#FF4D00" }}>● WARNING</span>
        <span style={{ color: "#DC2626" }}>● DANGER</span>
      </div>
    </motion.div>
  );
}
