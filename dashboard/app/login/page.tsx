"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../lib/auth";

type Mode = "login" | "forgot";

// Inner component uses useSearchParams — must be inside <Suspense>
function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, sendPasswordReset, user, loading } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      const redirect = searchParams.get("redirect") || "/";
      router.replace(redirect);
    }
  }, [user, loading, router, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setBusy(true);
    try {
      await signIn(email, password);
      // Set the session cookie so middleware allows access
      document.cookie = "firebase-session=1; path=/; max-age=86400; SameSite=Lax";
      const redirect = searchParams.get("redirect") || "/";
      router.replace(redirect);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" || e.code === "auth/user-not-found") {
        setError("Invalid email or password. Please try again.");
      } else if (e.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Sign-in failed. Please check your credentials.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (!email) { setError("Enter your email address above."); return; }
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setInfo("Password reset link sent! Check your inbox.");
    } catch {
      setError("Failed to send reset email. Check the address and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <span className="rh-spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "var(--bg-primary)" }}>
      {/* Animated background orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", top: "-15%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,80,0,0.35) 0%, transparent 70%)", filter: "blur(60px)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.16, 0.08] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          style={{ position: "absolute", top: "40%", left: "45%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,146,60,0.2) 0%, transparent 70%)", filter: "blur(50px)" }}
        />
      </div>

      {/* Grid overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px", zIndex: 0, pointerEvents: "none" }} />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440, padding: "0 24px" }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 200 }}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #FF4D00 0%, #DC2626 100%)", boxShadow: "0 0 40px rgba(255,77,0,0.4), 0 8px 24px rgba(0,0,0,0.3)", marginBottom: 16 }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2c0 6-8 8-8 14a8 8 0 0 0 16 0c0-6-8-8-8-14z"/>
              <path d="M12 12c0 3-3 4-3 7a3 3 0 0 0 6 0c0-3-3-4-3-7z" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.7)"/>
            </svg>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)", marginBottom: 4 }}>
              KOOR <span className="gradient-text">Mission Control</span>
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>
              {mode === "login" ? "Sign in to your account" : "Reset your password"}
            </p>
          </motion.div>
        </div>

        {/* Glass card */}
        <div className="glass-card" style={{ padding: 32, borderRadius: 20 }}>
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSignIn}
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="enter your email"
                      autoComplete="email"
                      style={{ width: "100%", padding: "12px 14px 12px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontSize: 14, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "#FF4D00"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      style={{ width: "100%", padding: "12px 44px 12px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontSize: 14, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "#FF4D00"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                      {showPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error / info banner */}
                <AnimatePresence>
                  {(error || info) && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: "10px 14px", borderRadius: 8, background: error ? "rgba(220,38,38,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${error ? "rgba(220,38,38,0.3)" : "rgba(16,185,129,0.3)"}`, fontSize: 13, color: error ? "#FCA5A5" : "#6EE7B7", fontWeight: 500 }}>
                      {error || info}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={busy}
                  style={{ width: "100%", padding: "13px", background: busy ? "rgba(255,77,0,0.5)" : "linear-gradient(135deg, #FF4D00 0%, #DC2626 100%)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, letterSpacing: "0.02em", boxShadow: busy ? "none" : "0 4px 20px rgba(255,77,0,0.35)", transition: "all 0.2s" }}
                >
                  {busy && <span className="rh-spinner rh-spinner--sm" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />}
                  {busy ? "Signing in…" : "Sign In"}
                </button>

                <div style={{ textAlign: "center" }}>
                  <button type="button" onClick={() => { setMode("forgot"); setError(""); setInfo(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                    Forgot password?
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleForgotPassword}
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  Enter your email address and we&apos;ll send you a password reset link.
                </p>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{ width: "100%", padding: "12px 14px 12px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-primary)", fontSize: 14, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = "#FF4D00"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {(error || info) && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: "10px 14px", borderRadius: 8, background: error ? "rgba(220,38,38,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${error ? "rgba(220,38,38,0.3)" : "rgba(16,185,129,0.3)"}`, fontSize: 13, color: error ? "#FCA5A5" : "#6EE7B7", fontWeight: 500 }}>
                      {error || info}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  id="forgot-submit-btn"
                  type="submit"
                  disabled={busy}
                  style={{ width: "100%", padding: "13px", background: busy ? "rgba(255,77,0,0.5)" : "linear-gradient(135deg, #FF4D00 0%, #DC2626 100%)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: busy ? "none" : "0 4px 20px rgba(255,77,0,0.35)", transition: "all 0.2s" }}
                >
                  {busy && <span className="rh-spinner rh-spinner--sm" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />}
                  {busy ? "Sending…" : "Send Reset Link"}
                </button>

                <div style={{ textAlign: "center" }}>
                  <button type="button" onClick={() => { setMode("login"); setError(""); setInfo(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
                    Back to Sign In
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
          <span style={{ fontWeight: 700 }}>KOOR</span> — Gas Leakage &amp; Flame Detection System · ESP32 + Firebase
        </p>
      </motion.div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
          <span className="rh-spinner" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
