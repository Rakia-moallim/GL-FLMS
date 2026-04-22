"use client";
import { useState, useMemo } from "react";
import { useSensorData } from "../lib/useSensorData";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SensorCard from "../components/SensorCard";
import TemporalAnalysis from "../components/TemporalAnalysis";
import DetectionGauge from "../components/DetectionGauge";
import RightPanel from "../components/RightPanel";

import SensorNodes from "../components/modules/SensorNodes";
import AlertHistory from "../components/modules/AlertHistory";
import Analytics from "../components/modules/Analytics";
import Reports from "../components/modules/Reports";
import Settings from "../components/modules/Settings";

export default function Dashboard() {
  const { data, history, connected, lastUpdate, uptime, sessionStart, signalStrength } = useSensorData();
  const { gas, flame, alarm } = data;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Build sparkline data from history
  const gasSparkData = useMemo(() => history.map((h) => ({ v: h.gas })), [history]);

  // Fire sparkline (0/1 events)
  const fireSparkData = useMemo(() =>
    history.map(() => ({ v: flame ? 1 : 0 })),
    [history, flame]
  );

  // System health sparkline (100 → lower on issues)
  const systemHealth = alarm ? 10 : flame ? 35 : gas > 60 ? 20 : gas > 35 ? 70 : 100;
  const systemSparkData = useMemo(() =>
    history.map(() => ({ v: systemHealth })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history.length, systemHealth]
  );

  return (
    <div className={`app-shell${alarm ? " alarm-active" : ""}`}>
      {/* Sidebar */}
      <Sidebar searchQuery={searchQuery} onSearchChange={setSearchQuery} activeItem={activeTab} onActiveItemChange={setActiveTab} />

      {/* Main content */}
      <main className="main-content">
        {activeTab === "Dashboard" ? (
          <>
        {/* Emergency ticker */}
        <AnimatePresence>
          {alarm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                overflow: "hidden",
                borderRadius: 12,
                marginBottom: 16,
                background: "rgba(220,38,38,0.08)",
                border: "1px solid rgba(220,38,38,0.25)",
              }}
            >
              <div style={{ padding: "10px 0", overflow: "hidden" }}>
                <div className="ticker-track">
                  {Array(8).fill("🚨  EMERGENCY — HAZARD DETECTED — EVACUATE IMMEDIATELY  ·  ").map((t, i) => (
                    <span key={i} style={{ color: "#DC2626", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", whiteSpace: "nowrap", paddingRight: 40 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero header */}
        <Header alarm={alarm} />

        {/* ── 4 Sensor Cards ── */}
        <div className="sensor-grid">
          <SensorCard
            type="gas"
            label="Sensor · Node 01"
            title="Gas Level"
            value={gas}
            unit="%"
            alarm={alarm}
            sparkData={gasSparkData}
            delay={0}
          />

          <SensorCard
            type="fire"
            label="Sensor · Node 01"
            title="Flame Detection"
            value={flame ? 1 : 0}
            unit=""
            alarm={alarm}
            sparkData={fireSparkData}
            isBoolean
            booleanTrue="DETECTED"
            booleanFalse="ALL CLEAR"
            delay={0.08}
          />
          <SensorCard
            type="system"
            label="System"
            title="Overall Status"
            value={systemHealth}
            unit="%"
            alarm={alarm}
            sparkData={systemSparkData}
            delay={0.16}
          />
        </div>

        {/* ── Temporal Analysis + Right Panel ── */}
        <div className="main-grid">
          <TemporalAnalysis history={history} alarm={alarm} />
          <RightPanel
            connected={connected}
            signalStrength={signalStrength}
            uptime={uptime}
            sessionStart={sessionStart}
            alarm={alarm}
            gas={gas}
            flame={flame}
          />
        </div>

        {/* ── Detection Gauge ── */}
        <div className="bottom-grid" style={{ marginTop: 16 }}>
          <DetectionGauge value={gas} alarm={alarm} />

          {/* System Status summary card */}
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.4 }}
            style={{ padding: "24px" }}
          >
            <span className="section-label">System Status</span>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginTop: 3, marginBottom: 16 }}>
              Diagnostics
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Firebase Connection", value: connected ? "Connected" : "Offline",  ok: connected },
                { label: "ESP32 Device",        value: connected ? "Online" : "Disconnected", ok: connected },
                { label: "Gas Sensor",          value: `${gas}% reading`,                    ok: gas <= 60 },
                { label: "Flame Sensor",        value: flame ? "FLAME DETECTED" : "Clear",   ok: !flame },
                { label: "Alarm System",        value: alarm ? "TRIGGERED" : "Standby",      ok: !alarm },
                { label: "Last Update",         value: lastUpdate ? lastUpdate.toLocaleTimeString() : "—", ok: true },
              ].map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i + 0.4 }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 12px",
                    borderRadius: 10,
                    background: "var(--bg-row)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{row.label}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: row.ok ? "#10B981" : "#DC2626",
                    padding: "2px 10px",
                    borderRadius: 999,
                    background: row.ok ? "rgba(16,185,129,0.1)" : "rgba(220,38,38,0.1)",
                  }}>
                    {row.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
          </>
        ) : activeTab === "Sensor Nodes" ? (
          <SensorNodes gas={gas} flame={flame} alarm={alarm} gasSparkData={gasSparkData} fireSparkData={fireSparkData} />
        ) : activeTab === "Alert History" ? (
          <AlertHistory alarm={alarm} />
        ) : activeTab === "Analytics" ? (
          <Analytics />
        ) : activeTab === "Reports" ? (
          <Reports />
        ) : activeTab === "Settings" ? (
          <Settings />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card"
            style={{ padding: "60px 40px", marginTop: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px" }}
          >
            <div style={{ padding: 24, borderRadius: "50%", background: "rgba(255,255,255,0.05)", marginBottom: 24 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)" }}>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>{activeTab}</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>This module is currently under development.</p>
          </motion.div>
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          style={{
            marginTop: 32,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 11,
            paddingBottom: 24,
            borderTop: "1px solid var(--border)",
            paddingTop: 20,
          }}
        >
          <span style={{ fontWeight: 600 }}>GL&amp;FLMS</span> — Gas Leakage &amp; Flame Detection System · ESP32 + Firebase
          <br />
          <span style={{ fontSize: 10, opacity: 0.6, marginTop: 4, display: "block" }}>
            Ilhaan Ali Dirie · Ismail Mohmed Mahmud · Rakia Moallim
          </span>
        </motion.footer>
      </main>
    </div>
  );
}
