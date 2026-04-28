"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { firestore } from "./firebase";

export interface HomeDetails {
  address: string;
  lat: number | null;
  lng: number | null;
  status: string;
  registration_date: any;
}

export function useHomeDetails(homeId: string | null) {
  const [details, setDetails] = useState<HomeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!homeId) {
      setDetails(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Use onSnapshot for real-time updates to home metadata
    const docRef = doc(firestore, "homes", homeId);
    
    const unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setDetails(snapshot.data() as HomeDetails);
      } else {
        setDetails(null);
        setError("Home not found");
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching home details:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsub();
  }, [homeId]);

  return { details, loading, error };
}
