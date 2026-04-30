import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://car-rental-app-sdp6.onrender.com";

export default function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password flow
  const [mode, setMode] = useState("login"); // "login" | "forgot" | "reset"
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
    } catch {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  const handleSendReset = async () => {
    if (!resetEmail) { setResetError("Enter your email"); return; }
    try {
      setResetLoading(true);
      setResetError("");
      await axios.post(`${API}/auth/forgot-password`, { email: resetEmail });
      setResetSuccess("Reset code sent! Check your email.");
      setMode("reset");
    } catch (err) {
      setResetError(err?.response?.data?.message || "Failed to send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode || !newPassword || !confirmPassword) {
      setResetError("Fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }
    try {
      setResetLoading(true);
      setResetError("");
      await axios.post(`${API}/auth/reset-password`, {
        email: resetEmail,
        code: resetCode,
        newPassword,
      });
      setResetSuccess("Password reset! You can now login.");
      setTimeout(() => {
        setMode("login");
        setResetSuccess("");
        setResetCode("");
        setNewPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch (err) {
      setResetError(err?.response?.data?.message || "Invalid or expired code.");
    } finally {
      setResetLoading(false);
    }
  };

  // ─── shared styles ───
  const inputStyle = {
    width: "100%", padding: "13px 15px", borderRadius: 12,
    border: "1.5px solid #c4b5fd", background: "#faf8ff",
    color: "#1e1b4b", fontSize: 15, fontWeight: 500,
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block", fontSize: 11, fontWeight: 800, color: "#4c1d95",
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6,
  };
  const btnStyle = (disabled) => ({
    width: "100%", padding: "14px 18px",
    background: disabled ? "#a78bfa" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
    color: "#fff", border: "none", borderRadius: 12, fontSize: 16,
    fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: "0 4px 24px rgba(124,58,237,0.28)",
    fontFamily: "inherit", transition: "all 0.15s",
  });

  return (
    <div style={{
      minHeight: "100vh", width: "100%", background: "#f5f3ff",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px 16px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* LOGO */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{
          width: 64, height: 64, background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 30, fontWeight: 900, color: "#fff", margin: "0 auto 16px",
          boxShadow: "0 4px 24px rgba(124,58,237,0.3)",
        }}>D</div>
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, lineHeight: 1.1 }}>
          <span style={{ color: "#7c3aed" }}>D</span><span style={{ color: "#4f46e5" }}>r</span>
          <span style={{ color: "#d97706" }}>i</span><span style={{ color: "#f59e0b" }}>v</span>
          <span style={{ color: "#059669" }}>e</span><span style={{ color: "#7c3aed" }}>K</span>
          <span style={{ color: "#dc2626" }}>h</span><span style={{ color: "#4f46e5" }}>a</span>
          <span style={{ color: "#d97706" }}>t</span><span style={{ color: "#7c3aed" }}>a</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: 2, textTransform: "uppercase", marginTop: 5 }}>
          Car Rental
        </div>
      </div>

      {/* LOGIN CARD */}
      <div style={{
        width: "100%", maxWidth: 400, background: "#ffffff",
        borderRadius: 20, border: "1.5px solid #ddd6fe",
        padding: "32px 28px", boxShadow: "0 8px 36px rgba(124,58,237,0.13)",
      }}>
        {/* ─── LOGIN MODE ─── */}
        {mode === "login" && (
          <>
            <div style={{
              background: "linear-gradient(135deg, #ede9fe, #faf8ff)", borderRadius: 12,
              padding: "14px 18px", marginBottom: 24,
              border: "1.5px solid #ddd6fe", borderLeft: "5px solid #7c3aed",
            }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", textTransform: "uppercase" }}>Welcome Back</div>
              <div style={{ fontSize: 13, color: "#a78bfa", marginTop: 2, fontWeight: 500 }}>Sign in to your account</div>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKey} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKey} style={inputStyle} />
            </div>

            <div style={{ textAlign: "right", marginBottom: 20 }}>
              <button
                onClick={() => { setMode("forgot"); setResetEmail(email); setResetError(""); setResetSuccess(""); }}
                style={{ background: "none", border: "none", color: "#7c3aed", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>

            <button onClick={handleLogin} disabled={loading} style={btnStyle(loading)}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </>
        )}

        {/* ─── FORGOT PASSWORD MODE ─── */}
        {mode === "forgot" && (
          <>
            <div style={{
              background: "linear-gradient(135deg, #ede9fe, #faf8ff)", borderRadius: 12,
              padding: "14px 18px", marginBottom: 24,
              border: "1.5px solid #ddd6fe", borderLeft: "5px solid #d97706",
            }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", textTransform: "uppercase" }}>Reset Password</div>
              <div style={{ fontSize: 13, color: "#a78bfa", marginTop: 2, fontWeight: 500 }}>We'll send a reset code to your email</div>
            </div>

            {resetError && (
              <div style={{ background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div style={{ background: "#f0fdf4", color: "#166534", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {resetSuccess}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Your Email</label>
              <input type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} style={inputStyle} />
            </div>

            <button onClick={handleSendReset} disabled={resetLoading} style={btnStyle(resetLoading)}>
              {resetLoading ? "Sending..." : "Send Reset Code"}
            </button>

            <button
              onClick={() => setMode("login")}
              style={{ width: "100%", marginTop: 12, padding: "12px", background: "none", border: "1.5px solid #ddd6fe", borderRadius: 12, color: "#7c3aed", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
            >
              ← Back to Login
            </button>
          </>
        )}

        {/* ─── RESET CODE MODE ─── */}
        {mode === "reset" && (
          <>
            <div style={{
              background: "linear-gradient(135deg, #f0fdf4, #faf8ff)", borderRadius: 12,
              padding: "14px 18px", marginBottom: 24,
              border: "1.5px solid #bbf7d0", borderLeft: "5px solid #059669",
            }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", textTransform: "uppercase" }}>Enter New Password</div>
              <div style={{ fontSize: 13, color: "#a78bfa", marginTop: 2, fontWeight: 500 }}>Code sent to {resetEmail}</div>
            </div>

            {resetError && (
              <div style={{ background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div style={{ background: "#f0fdf4", color: "#166534", border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                {resetSuccess}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>6-Digit Reset Code</label>
              <input type="text" placeholder="e.g. 123456" value={resetCode} onChange={(e) => setResetCode(e.target.value)} style={inputStyle} maxLength={6} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>New Password</label>
              <input type="password" placeholder="Min. 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Confirm Password</label>
              <input type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
            </div>

            <button onClick={handleResetPassword} disabled={resetLoading} style={btnStyle(resetLoading)}>
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              onClick={() => setMode("forgot")}
              style={{ width: "100%", marginTop: 12, padding: "12px", background: "none", border: "1.5px solid #ddd6fe", borderRadius: 12, color: "#7c3aed", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
            >
              ← Resend Code
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: "#a78bfa", fontWeight: 500, letterSpacing: 0.3 }}>
        DriveKhata © {new Date().getFullYear()}
      </div>
    </div>
  );
}