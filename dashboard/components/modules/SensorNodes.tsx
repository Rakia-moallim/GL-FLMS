import { motion } from "framer-motion";
import SensorCard from "../SensorCard";

interface SensorNodesProps {
  gas: number;
  flame: boolean;
  alarm: boolean;
  gasSparkData: { v: number }[];
  fireSparkData: { v: number }[];
}

export default function SensorNodes({ gas, flame, alarm, gasSparkData, fireSparkData }: SensorNodesProps) {
  // We'll mock Node 02 and Node 03
  const mockGasSpark = Array(20).fill(0).map(() => ({ v: Math.random() * 10 + 10 }));
  const mockFireSpark = Array(20).fill(0).map(() => ({ v: 0 }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="module-container" style={{ padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Sensor Nodes</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Manage and monitor all connected ESP32 sensor units.</p>
      
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>Active Nodes</h2>
      <div className="sensor-grid" style={{ marginBottom: 40 }}>
        {/* Node 01 - REAL */}
        <SensorCard type="gas" label="Sensor · Node 01 (Kitchen)" title="Gas Level" value={gas} unit="%" alarm={alarm} sparkData={gasSparkData} delay={0.1} />
        <SensorCard type="fire" label="Sensor · Node 01 (Kitchen)" title="Flame Detection" value={flame ? 1 : 0} unit="" alarm={alarm} sparkData={fireSparkData} isBoolean booleanTrue="DETECTED" booleanFalse="ALL CLEAR" delay={0.2} />
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>Standby Nodes</h2>
      <div className="sensor-grid" style={{ opacity: 0.6 }}>
        {/* Node 02 - MOCK */}
        <SensorCard type="gas" label="Sensor · Node 02 (Garage) - OFFLINE" title="Gas Level" value={0} unit="%" alarm={false} sparkData={mockGasSpark} delay={0.3} />
        {/* Node 03 - MOCK */}
        <SensorCard type="fire" label="Sensor · Node 03 (Basement) - OFFLINE" title="Flame Detection" value={0} unit="" alarm={false} sparkData={mockFireSpark} isBoolean booleanTrue="DETECTED" booleanFalse="ALL CLEAR" delay={0.4} />
      </div>
    </motion.div>
  );
}
