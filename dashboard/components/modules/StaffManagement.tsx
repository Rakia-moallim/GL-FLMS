"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { firestore, auth } from "../../lib/firebase";
import { useAuth } from "../../lib/auth";

interface StaffUser {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  active: boolean;
  createdAt?: string;
}

const FIELD_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{ width: "100%", maxWidth: 480, padding: 32, borderRadius: 20 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function Badge({ role }: { role: "admin" | "staff" }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 999,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        background: role === "admin" ? "rgba(255,77,0,0.12)" : "rgba(99,102,241,0.12)",
        color: role === "admin" ? "#FF4D00" : "#818CF8",
        border: `1px solid ${role === "admin" ? "rgba(255,77,0,0.25)" : "rgba(99,102,241,0.25)"}`,
      }}
    >
      {role === "admin" ? "🛡️ Admin" : "👨‍💼 Staff"}
    </span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: active ? "#10B981" : "var(--text-muted)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? "#10B981" : "rgba(255,255,255,0.2)", display: "inline-block", boxShadow: active ? "0 0 6px #10B981" : "none" }} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function StaffManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"admin" | "staff">("staff");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit role inline
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "staff">("staff");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "users"), (snap) => {
      setUsers(snap.docs.map((d) => d.data() as StaffUser));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const getIdToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Not authenticated");
    return currentUser.getIdToken();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createName || !createEmail || !createPassword) {
      setCreateError("All fields are required.");
      return;
    }
    setCreating(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: createName, email: createEmail, password: createPassword, role: createRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      setShowCreate(false);
      setCreateName(""); setCreateEmail(""); setCreatePassword(""); setCreateRole("staff");
    } catch (err: unknown) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: deleteTarget.uid }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete");
      }
      setDeleteTarget(null);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (u: StaffUser) => {
    await updateDoc(doc(firestore, "users", u.uid), { active: !u.active });
  };

  const handleSaveRole = async (uid: string) => {
    setSavingEdit(true);
    await updateDoc(doc(firestore, "users", uid), { role: editRole });
    setSavingEdit(false);
    setEditingUid(null);
  };

  const currentUserId = user?.uid;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "0 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, letterSpacing: "-0.02em" }}>
            Staff Management
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Manage team accounts, roles, and access.
          </p>
        </div>
        <button
          id="create-staff-btn"
          onClick={() => { setShowCreate(true); setCreateError(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "11px 20px",
            background: "linear-gradient(135deg, #FF4D00, #DC2626)",
            border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13,
            cursor: "pointer", boxShadow: "0 4px 18px rgba(255,77,0,0.3)", transition: "0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 28px rgba(255,77,0,0.5)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 18px rgba(255,77,0,0.3)")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Staff
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Accounts", value: users.length, color: "#FF4D00" },
          { label: "Admin", value: users.filter(u => u.role === "admin").length, color: "#F59E0B" },
          { label: "Staff", value: users.filter(u => u.role === "staff").length, color: "#6366F1" },
          { label: "Active", value: users.filter(u => u.active).length, color: "#10B981" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden", borderRadius: 16 }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}><span className="rh-spinner" /></div>
        ) : users.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-secondary)" }}>No accounts found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                  {["User", "Role", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.uid} style={{ borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    {/* User */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                          background: u.role === "admin" ? "linear-gradient(135deg,#FF4D00,#DC2626)" : "linear-gradient(135deg,#3B82F6,#6366F1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, color: "#fff",
                        }}>
                          {u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                            {u.name}
                            {u.uid === currentUserId && (
                              <span style={{ fontSize: 10, marginLeft: 8, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.08)", color: "var(--text-muted)", fontWeight: 600 }}>You</span>
                            )}
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td style={{ padding: "14px 20px" }}>
                      {editingUid === u.uid ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <select
                            value={editRole}
                            onChange={e => setEditRole(e.target.value as "admin" | "staff")}
                            style={{ ...FIELD_STYLE, padding: "6px 10px", fontSize: 12, width: "auto" }}
                          >
                            <option value="staff" style={{ color: "#000" }}>Staff</option>
                            <option value="admin" style={{ color: "#000" }}>Admin</option>
                          </select>
                          <button onClick={() => handleSaveRole(u.uid)} disabled={savingEdit}
                            style={{ padding: "6px 12px", background: "#10B981", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            {savingEdit ? "…" : "Save"}
                          </button>
                          <button onClick={() => setEditingUid(null)}
                            style={{ padding: "6px 10px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Badge role={u.role} />
                          {u.uid !== currentUserId && (
                            <button onClick={() => { setEditingUid(u.uid); setEditRole(u.role); }}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }} title="Edit role">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    {/* Status */}
                    <td style={{ padding: "14px 20px" }}>
                      <StatusDot active={u.active} />
                    </td>
                    {/* Actions */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {u.uid !== currentUserId && (
                          <>
                            {/* Toggle active */}
                            <button
                              onClick={() => handleToggleActive(u)}
                              title={u.active ? "Deactivate" : "Activate"}
                              style={{ padding: "6px 12px", background: u.active ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)", border: `1px solid ${u.active ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`, borderRadius: 8, color: u.active ? "#F59E0B" : "#10B981", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              {u.active ? "Deactivate" : "Activate"}
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(u)}
                              title="Delete account"
                              style={{ padding: "6px 10px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center" }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <Modal open={showCreate} onClose={() => !creating && setShowCreate(false)}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Add Staff Account</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>Create a new account and assign a role.</p>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Full Name</label>
                <input id="new-staff-name" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="e.g. Ahmed Hassan" style={FIELD_STYLE}
                  onFocus={e => e.target.style.borderColor = "#FF4D00"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Email</label>
                <input id="new-staff-email" type="email" value={createEmail} onChange={e => setCreateEmail(e.target.value)} placeholder="ahmed@example.com" style={FIELD_STYLE}
                  onFocus={e => e.target.style.borderColor = "#FF4D00"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Password</label>
                <input id="new-staff-password" type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} placeholder="min. 8 characters" style={FIELD_STYLE}
                  onFocus={e => e.target.style.borderColor = "#FF4D00"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Role</label>
                <select id="new-staff-role" value={createRole} onChange={e => setCreateRole(e.target.value as "admin" | "staff")} style={{ ...FIELD_STYLE }}>
                  <option value="staff" style={{ color: "#000" }}>👨‍💼 Staff</option>
                  <option value="admin" style={{ color: "#000" }}>🛡️ Admin</option>
                </select>
              </div>
              {createError && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", fontSize: 13, color: "#FCA5A5" }}>{createError}</div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowCreate(false)} disabled={creating}
                  style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button id="create-staff-submit" type="submit" disabled={creating}
                  style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #FF4D00, #DC2626)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: creating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {creating && <span className="rh-spinner rh-spinner--sm" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />}
                  {creating ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteTarget && (
          <Modal open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(220,38,38,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Delete Account?</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.6 }}>
                You are about to permanently delete <strong style={{ color: "var(--text-primary)" }}>{deleteTarget.name}</strong> ({deleteTarget.email}).
                This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                  style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button id="confirm-delete-btn" onClick={handleDelete} disabled={deleting}
                  style={{ flex: 1, padding: "12px", background: "rgba(220,38,38,0.9)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {deleting && <span className="rh-spinner rh-spinner--sm" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)" }} />}
                  {deleting ? "Deleting…" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
