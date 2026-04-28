"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { firestore } from "../../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

/* ─── Nominatim result shape ─────────────────────────────────────────────── */
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface PlaceResult {
  display_name: string;
  lat: number;
  lng: number;
}

/* ─── Nominatim search — restricted to Somalia ───────────────────────────── */
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

async function searchSomalia(query: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    countrycodes: "so",   // ← Somalia only
    limit: "6",
    addressdetails: "0",
  });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 
      "Accept-Language": "en",
      "User-Agent": "GL-FLMS-Audit/1.0 (Somalia Home Safety Project)"
    },
  });
  if (!res.ok) throw new Error("Nominatim fetch failed");
  return res.json() as Promise<NominatimResult[]>;
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function RegisterHome() {
  const [homeSuffix, setHomeSuffix] = useState("");
  const [deviceMac, setDeviceMac]     = useState("");
  const [password, setPassword]     = useState("");
  const [email, setEmail]           = useState("");
  const [showPass, setShowPass]     = useState(false);

  // Address state
  const [addressInput, setAddressInput]   = useState("");
  const [suggestions, setSuggestions]     = useState<NominatimResult[]>([]);
  const [isFetching, setIsFetching]       = useState(false);
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [highlighted, setHighlighted]     = useState(-1);

  // Form status
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressRef    = useRef<HTMLInputElement>(null);
  const dropdownRef   = useRef<HTMLDivElement>(null);

  /* ── Debounced Nominatim search ──────────────────────────────────────── */
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 3) {
      setSuggestions([]);
      setDropdownOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsFetching(true);
      try {
        const results = await searchSomalia(q);
        setSuggestions(results);
        setDropdownOpen(results.length > 0);
        setHighlighted(-1);
      } catch {
        setSuggestions([]);
        setDropdownOpen(false);
      } finally {
        setIsFetching(false);
      }
    }, 400);
  }, []);

  /* ── Address input change ────────────────────────────────────────────── */
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddressInput(val);
    setSelectedPlace(null);
    setErrorMsg("");
    fetchSuggestions(val);
  };

  /* ── Pick a suggestion ───────────────────────────────────────────────── */
  const pickSuggestion = (r: NominatimResult) => {
    const place: PlaceResult = {
      display_name: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    };
    setSelectedPlace(place);
    setAddressInput(r.display_name);
    setSuggestions([]);
    setDropdownOpen(false);
    setHighlighted(-1);
  };

  /* ── Keyboard navigation in dropdown ────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[highlighted]);
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  /* ── Close dropdown on outside click ────────────────────────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        addressRef.current &&
        !addressRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Derived final ID ────────────────────────────────────────────────── */
  const finalId = homeSuffix.trim() ? `1000${homeSuffix.trim()}` : "";

  /* ── Validate & Submit ───────────────────────────────────────────────── */
  const handleRegister = useCallback(async () => {
    setErrorMsg("");

    if (!homeSuffix.trim()) {
      setErrorMsg("Please enter a Home Number.");
      return;
    }
    if (!addressInput.trim()) {
      setErrorMsg("Please enter a Home Address.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid Notification Email.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please set a Mobile Access Password.");
      return;
    }
    if (password.trim().length < 4) {
      setErrorMsg("Password must be at least 4 characters.");
      return;
    }

    setStatus("loading");
    try {
      const docRef = doc(firestore, "homes", finalId);
      await setDoc(docRef, {
        home_id:           finalId,
        password:          password.trim(),
        email:             email.trim().toLowerCase(),
        address:           selectedPlace?.display_name ?? addressInput.trim(),
        lat:               selectedPlace?.lat ?? null,
        lng:               selectedPlace?.lng ?? null,
        registration_date: serverTimestamp(),
        status:            "Active",
      });

      // If MAC is provided, link it in RTDB for dynamic sync
      if (deviceMac.trim()) {
        const cleanMac = deviceMac.trim().replace(/[:\s-]/g, "").toUpperCase();
        // We'll use the RTDB reference from our lib/firebase
        const { ref, set } = await import("firebase/database");
        const { db } = await import("../../lib/firebase");
        await set(ref(db, `devices/${cleanMac}/home_id`), finalId);
      }

      setStatus("success");
      setHomeSuffix("");
      setDeviceMac("");
      setPassword("");
      setEmail("");
      setAddressInput("");
      setSelectedPlace(null);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Registration failed.");
      setStatus("error");
    }
  }, [homeSuffix, addressInput, password, finalId, selectedPlace]);

  /* ── Auto-dismiss success banner ─────────────────────────────────────── */
  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => setStatus("idle"), 4500);
    return () => clearTimeout(t);
  }, [status]);

  /* ── Clear handler ───────────────────────────────────────────────────── */
  const handleClear = () => {
    setHomeSuffix(""); setPassword(""); setAddressInput("");
    setSelectedPlace(null); setSuggestions([]); setDropdownOpen(false);
    setErrorMsg(""); setStatus("idle");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rh-page"
    >
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="rh-page-header">
        <div className="rh-page-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
            <polyline points="9 21 9 12 15 12 15 21"/>
          </svg>
        </div>
        <div>
          <span className="section-label">Management</span>
          <h1 className="rh-page-title">Register Home</h1>
        </div>
      </div>

      {/* ── Central Card ──────────────────────────────────────────────── */}
      <div className="rh-card-wrapper">
        <div className="rh-card glass-card">
          <div className="rh-accent-bar" />

          <div className="rh-card-body">

            {/* Success banner */}
            <AnimatePresence>
              {status === "success" && (
                <motion.div className="rh-banner rh-banner--success"
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Home <strong>{finalId || "—"}</strong> registered successfully!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error banner */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div className="rh-banner rh-banner--error"
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Form Grid ───────────────────────────────────────────── */}
            <div className="rh-form-grid">

              {/* Home Number — split input */}
              <div className="rh-field rh-field--full">
                <label className="rh-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  </svg>
                  Home Number
                </label>
                <div className="rh-id-split">
                  <span className="rh-id-prefix">1000</span>
                  <input
                    id="home-number-suffix"
                    className="rh-input rh-id-suffix"
                    type="number"
                    min="1"
                    placeholder="e.g. 36"
                    value={homeSuffix}
                    onChange={(e) => { setHomeSuffix(e.target.value); setErrorMsg(""); }}
                  />
                  {finalId && (
                    <span className="rh-id-preview">→ ID: <strong>{finalId}</strong></span>
                  )}
                </div>
              </div>

              {/* Home Owner ID — read-only */}
              <div className="rh-field">
                <label className="rh-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Home Owner ID
                </label>
                <div className="rh-input rh-input--readonly">
                  {finalId || <span style={{ opacity: 0.4 }}>1000…</span>}
                </div>
              </div>

              {/* Status */}
              <div className="rh-field">
                <label className="rh-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Status
                </label>
                <div className="rh-input rh-input--readonly">
                  <span className="rh-status-active">● Active</span>
                </div>
              </div>

              {/* Hardware MAC — for dynamic sync */}
              <div className="rh-field rh-field--full">
                <label className="rh-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                    <path d="M7 22V10"/><path d="M17 22V10"/><path d="M2 10h20"/>
                  </svg>
                  Device Hardware ID (MAC)
                  <span className="rh-label-sub">(Optional · For dynamic sync)</span>
                </label>
                <input
                  className="rh-input"
                  type="text"
                  placeholder="e.g. AA:BB:CC:11:22:33"
                  value={deviceMac}
                  onChange={(e) => setDeviceMac(e.target.value)}
                />
              </div>

              {/* ── Home Address — Nominatim typeahead ─────────────── */}
              <div className="rh-field rh-field--full">
                <label className="rh-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Home Address
                  <span className="rh-label-sub">(OpenStreetMap · Somalia)</span>
                </label>

                <div className="rh-address-wrap">
                  {/* Search input row */}
                  <div className="rh-address-input-row">
                    <input
                      id="home-address"
                      ref={addressRef}
                      className="rh-input"
                      type="text"
                      placeholder="e.g. Waberi, Mogadishu…"
                      value={addressInput}
                      onChange={handleAddressChange}
                      onKeyDown={handleKeyDown}
                      onFocus={() => suggestions.length > 0 && setDropdownOpen(true)}
                      autoComplete="off"
                    />
                    {/* Spinner / check icon */}
                    <div className="rh-address-status-icon">
                      {isFetching ? (
                        <span className="rh-spinner rh-spinner--sm" />
                      ) : selectedPlace ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Dropdown suggestions */}
                  <AnimatePresence>
                    {dropdownOpen && suggestions.length > 0 && (
                      <motion.div
                        ref={dropdownRef}
                        className="rh-dropdown"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                      >
                        {suggestions.map((r, i) => (
                          <div
                            key={r.place_id}
                            className={`rh-dropdown-item${highlighted === i ? " rh-dropdown-item--active" : ""}`}
                            onMouseEnter={() => setHighlighted(i)}
                            onMouseDown={(e) => { e.preventDefault(); pickSuggestion(r); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="rh-dropdown-pin">
                              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span className="rh-dropdown-text">{r.display_name}</span>
                          </div>
                        ))}
                        <div className="rh-dropdown-footer">
                          <svg viewBox="0 0 256 256" width="12" height="12" fill="currentColor">
                            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM128,216a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-68a8,8,0,0,1-8,8H136v8a8,8,0,0,1-16,0v-8H96a8,8,0,0,1,0-16h24V112a8,8,0,0,1,16,0v28h16A8,8,0,0,1,168,148Z"/>
                          </svg>
                          Powered by OpenStreetMap · Nominatim
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Selected coords chip */}
                  {selectedPlace && (
                    <motion.div
                      className="rh-coords-chip"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>Lat: <strong>{selectedPlace.lat.toFixed(5)}</strong></span>
                      <span className="rh-coords-divider">·</span>
                      <span>Lng: <strong>{selectedPlace.lng.toFixed(5)}</strong></span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Notification Email */}
              <div className="rh-field rh-field--full">
                <label className="rh-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Notification Email
                </label>
                <div className="rh-input-group">
                  <input
                    type="email"
                    className="rh-input"
                    placeholder="e.g. resident@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <p className="rh-hint">Used for sending critical gas and flame alerts.</p>
              </div>

              {/* Mobile Access Password */}
              <div className="rh-field rh-field--full">
                <label className="rh-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Mobile Access Password
                </label>
                <div className="rh-password-wrap">
                  <input
                    id="home-password"
                    className="rh-input"
                    type={showPass ? "text" : "password"}
                    placeholder="Set a PIN or password (min. 4 chars)"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
                  />
                  <button type="button" className="rh-eye-btn"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "Hide password" : "Show password"}>
                    {showPass ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Actions ─────────────────────────────────────────────── */}
            <div className="rh-actions">
              <button id="register-home-btn" className="rh-btn-register"
                onClick={handleRegister} disabled={status === "loading"}>
                {status === "loading" ? (
                  <><span className="rh-spinner" />Registering…</>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                      <polyline points="9 21 9 12 15 12 15 21"/>
                    </svg>
                    Register Home
                  </>
                )}
              </button>
              <button className="rh-btn-clear" onClick={handleClear}>Clear</button>
            </div>

            {/* ── Info chips ────────────────────────────────────────────
            <div className="rh-info-row">
              <div className="rh-info-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
                Firestore · homes collection
              </div>
              <div className="rh-info-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Somalia Home Safety 🇸🇴
              </div>
              <div className="rh-info-chip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                100% Free · No API key
              </div>
            </div>
            ─ */}

          </div>
        </div>
      </div>
    </motion.div>
  );
}
