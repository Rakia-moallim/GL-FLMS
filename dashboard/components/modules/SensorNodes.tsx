import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { firestore } from "../../lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import SensorCard from "../SensorCard";

interface NodeRecord {
  id: string;
  name: string;
  location: string;
  status: "Online" | "Offline" | "Standby";
  type: "gas" | "fire";
  lastSeen: any;
}

interface SensorNodesProps {
  gas: number;
  flame: boolean;
  alarm: boolean;
  gasSparkData: { v: number }[];
  fireSparkData: { v: number }[];
}

export default function SensorNodes({ gas, flame, alarm, gasSparkData, fireSparkData }: SensorNodesProps) {
  const [nodes, setNodes] = useState<NodeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(firestore, "nodes"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NodeRecord[];
      setNodes(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // We'll mock Node 02 and Node 03 if they don't exist in DB yet
  const mockGasSpark = Array(20).fill(0).map(() => ({ v: Math.random() * 10 + 10 }));
  const mockFireSpark = Array(20).fill(0).map(() => ({ v: 0 }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="module-container" style={{ padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Sensor Nodes</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Manage and monitor all connected ESP32 sensor units.</p>
      
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>Active Nodes</h2>
      <div className="sensor-grid" style={{ marginBottom: 40 }}>
        {loading ? (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
            <span className="rh-spinner" />
          </div>
        ) : nodes.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            <p>No nodes registered in Firestore. Displaying default Node 01.</p>
            <div className="sensor-grid" style={{ marginTop: 24 }}>
              <SensorCard type="gas" label="Sensor · Node 01 (Kitchen)" title="Gas Level" value={gas} unit="%" alarm={alarm} sparkData={gasSparkData} delay={0.1} />
              <SensorCard type="fire" label="Sensor · Node 01 (Kitchen)" title="Flame Detection" value={flame ? 1 : 0} unit="" alarm={alarm} sparkData={fireSparkData} isBoolean booleanTrue="DETECTED" booleanFalse="ALL CLEAR" delay={0.2} />
            </div>
          </div>
        ) : (
          nodes.map((node, i) => (
            <SensorCard 
              key={node.id}
              type={node.type} 
              label={`Sensor · ${node.name} (${node.location})`} 
              title={node.type === "gas" ? "Gas Level" : "Flame Detection"} 
              value={node.name === "Node 01" ? (node.type === "gas" ? gas : (flame ? 1 : 0)) : 0} 
              unit={node.type === "gas" ? "%" : ""} 
              alarm={node.name === "Node 01" ? alarm : false} 
              sparkData={node.name === "Node 01" ? (node.type === "gas" ? gasSparkData : fireSparkData) : (node.type === "gas" ? mockGasSpark : mockFireSpark)} 
              isBoolean={node.type === "fire"}
              booleanTrue="DETECTED"
              booleanFalse="ALL CLEAR"
              delay={0.1 * (i + 1)} 
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
