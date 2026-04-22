"use client";
import { motion, AnimatePresence } from "framer-motion";

interface FlameCardProps {
  flame: boolean;
  alarm: boolean;
}

export default function FlameCard({ flame, alarm }: FlameCardProps) {
  return (
    <motion.div
      className={`glass-card ${flame ? "danger-glow" : "safe-glow"}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -4 }}
      style={{ padding: "28px" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <p className="section-label">Sensor</p>
          <h2 className="card-title" style={{ marginTop: 4, fontSize: 18, color: "var(--text-primary)" }}>
            Flame Status
          </h2>
        </div>
      </div>

      {/* Flame Icon */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {/* Pulse rings behind icon */}
          {flame && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "rgba(239,68,68,0.15)",
                    border: "2px solid rgba(239,68,68,0.3)",
                  }}
                  animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.6, ease: "easeOut" }}
                />
              ))}
            </>
          )}

          <motion.div
            animate={
              flame
                ? { scale: [1, 1.1, 1], rotate: [-3, 3, -3] }
                : { scale: 1, rotate: 0 }
            }
            transition={{ repeat: flame ? Infinity : 0, duration: 1.5, ease: "easeInOut" }}
            style={{
              fontSize: 72,
              filter: flame
                ? "drop-shadow(0 0 20px rgba(239,68,68,0.8)) drop-shadow(0 0 40px rgba(239,68,68,0.4))"
                : "drop-shadow(0 0 10px rgba(34,197,94,0.4))",
              zIndex: 1,
            }}
          >
            {flame ? "🔥" : "✅"}
          </motion.div>
        </div>

        {/* Status label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={String(flame)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ textAlign: "center" }}
          >
            <div
              className="card-value"
              style={{
                fontSize: 32,
                color: flame ? "var(--danger)" : "var(--safe)",
                letterSpacing: "-0.02em",
              }}
            >
              {flame ? "DETECTED" : "CLEAR"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, fontWeight: 500 }}>
              {flame ? "Flame presence confirmed" : "No flame detected"}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Badge */}
        <span className={`badge ${flame ? "badge-danger" : "badge-safe"}`}>
          <span style={{ fontSize: 8 }}>●</span>
          {flame ? "FLAME ACTIVE" : "SAFE"}
        </span>
      </div>
    </motion.div>
  );
}
