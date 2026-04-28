"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

interface AlarmCardProps {
  alarm: boolean;
  gas: number;
  flame: boolean;
}

export default function AlarmCard({ alarm, gas, flame }: AlarmCardProps) {
  const prevAlarm = useRef(false);

  useEffect(() => {
    prevAlarm.current = alarm;
  }, [alarm]);

  const reason =
    gas > 60 && flame ? "Gas Leakage + Fire" : gas > 60 ? "Gas Concentration" : flame ? "Flame Detected" : null;

  return (
    <motion.div
      className={`glass-card ${alarm ? "danger-glow" : "safe-glow"}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -4 }}
      style={{
        padding: "28px",
        background: alarm ? "rgba(239,68,68,0.08)" : undefined,
        borderColor: alarm ? "rgba(239,68,68,0.4)" : undefined,
        transition: "background 0.4s ease, border-color 0.4s ease",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p className="section-label">System</p>
          <h2 className="card-title" style={{ marginTop: 4, fontSize: 18, color: "var(--text-primary)" }}>
            Alarm Status
          </h2>
        </div>
        <motion.div
          style={{ fontSize: 32 }}
          animate={alarm ? { rotate: [-10, 10, -10, 10, 0] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          🚨
        </motion.div>
      </div>

      {/* Main alarm display */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={String(alarm)}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {alarm && (
              <>
                {[0, 1].map((i) => (
                  <motion.div
                    key={i}
                    style={{
                      position: "absolute",
                      width: 80, height: 80,
                      borderRadius: "50%",
                      background: "rgba(239,68,68,0.2)",
                      border: "2px solid rgba(239,68,68,0.5)",
                    }}
                    animate={{ scale: [1, 2.2], opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.9 }}
                  />
                ))}
              </>
            )}
            <div
              style={{
                width: 80, height: 80,
                borderRadius: "50%",
                background: alarm
                  ? "linear-gradient(135deg, #EF4444, #991B1B)"
                  : "linear-gradient(135deg, #22C55E, #15803D)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                boxShadow: alarm
                  ? "0 0 30px rgba(239,68,68,0.6), inset 0 1px 1px rgba(255,255,255,0.2)"
                  : "0 0 20px rgba(34,197,94,0.5), inset 0 1px 1px rgba(255,255,255,0.2)",
                zIndex: 1,
              }}
            >
              {alarm ? "⚠️" : "✓"}
            </div>
          </motion.div>
        </AnimatePresence>

        <div style={{ textAlign: "center" }}>
          <motion.div
            className="card-value"
            style={{
              fontSize: 28,
              color: alarm ? "var(--danger)" : "var(--safe)",
            }}
            animate={alarm ? { x: [-2, 2, -2, 2, 0] } : {}}
            transition={{ repeat: alarm ? Infinity : 0, duration: 0.4, repeatDelay: 2 }}
          >
            {alarm ? "ALARM ON" : "ALL CLEAR"}
          </motion.div>
          {reason && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: 13, color: "var(--danger)", marginTop: 6, fontWeight: 500 }}
            >
              Cause: {reason}
            </motion.div>
          )}
        </div>

        <span className={`badge ${alarm ? "badge-danger" : "badge-safe"}`}>
          <span style={{ fontSize: 8 }}>●</span>
          {alarm ? "EMERGENCY ACTIVE" : "SYSTEM NORMAL"}
        </span>
      </div>
    </motion.div>
  );
}
