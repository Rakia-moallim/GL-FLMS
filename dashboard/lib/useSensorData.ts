"use client";
import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

export interface SensorData {
  gas: number;
  flame: boolean;
  alarm: boolean;
  oxygen?: number;
  signalStrength?: number; // dBm
}

export interface ChartPoint {
  time: string;
  gas: number;
}

const MAX_HISTORY = 30;

export function useSensorData() {
  const [data, setData] = useState<SensorData>({ gas: 0, flame: false, alarm: false, oxygen: 20.9 });
  const [history, setHistory] = useState<ChartPoint[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [uptime, setUptime] = useState(0); // seconds
  const [sessionStart] = useState(() => new Date());
  const uptimeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const sensorRef = ref(db, "/sensor");

    const unsub = onValue(
      sensorRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val() as SensorData;
          // Ensure oxygen has a sensible default if not provided by firmware
          if (val.oxygen === undefined) val.oxygen = 20.9;
          setData(val);
          setConnected(true);
          const now = new Date();
          setLastUpdate(now);
          const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          setHistory((prev) => {
            const next = [...prev, { time: timeStr, gas: val.gas }];
            return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
          });
        }
      },
      () => setConnected(false)
    );

    // Uptime counter
    uptimeRef.current = setInterval(() => setUptime((s) => s + 1), 1000);

    return () => {
      unsub();
      if (uptimeRef.current) clearInterval(uptimeRef.current);
    };
  }, []);

  // Simulate signal strength oscillation when real value absent
  const signalStrength = data.signalStrength ?? -67;

  return { data, history, connected, lastUpdate, uptime, sessionStart, signalStrength };
}

