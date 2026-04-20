import { useState } from "react";
import axios from "axios";

export default function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API = "https://car-rental-app-sdp6.onrender.com";

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

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "#f5f3ff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
    }}>

      {/* LOGO BLOCK */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{
          width: 64,
          height: 64,
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 30,
          fontWeight: 900,
          color: "#fff",
          margin: "0 auto 16px",
          boxShadow: "0 4px 24px rgba(124,58,237,0.3)",
        }}>D</div>

        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, lineHeight: 1.1 }}>
          <span style={{ color: "#7c3aed" }}>D</span>
          <span style={{ color: "#4f46e5" }}>r</span>
          <span style={{ color: "#d97706" }}>i</span>
          <span style={{ color: "#f59e0b" }}>v</span>
          <span style={{ color: "#059669" }}>e</span>
          <span style={{ color: "#7c3aed" }}>K</span>
          <span style={{ color: "#dc2626" }}>h</span>
          <span style={{ color: "#4f46e5" }}>a</span>
          <span style={{ color: "#d97706" }}>t</span>
          <span style={{ color: "#7c3aed" }}>a</span>
        </div>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#a78bfa",
          letterSpacing: 2,
          textTransform: "uppercase",
          marginTop: 5,
        }}>Car Rental</div>
      </div>

      {/* LOGIN CARD */}
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#ffffff",
        borderRadius: 20,
        border: "1.5px solid #ddd6fe",
        padding: "32px 28px",
        boxShadow: "0 8px 36px rgba(124,58,237,0.13)",
      }}>

        {/* CARD HEADER */}
        <div style={{
          background: "linear-gradient(135deg, #ede9fe, #faf8ff)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 24,
          borderLeft: "5px solid #7c3aed",
          border: "1.5px solid #ddd6fe",
          borderLeft: "5px solid #7c3aed",
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", textTransform: "uppercase", letterSpacing: -0.3 }}>
            Welcome Back
          </div>
          <div style={{ fontSize: 13, color: "#a78bfa", marginTop: 2, fontWeight: 500 }}>
            Sign in to your account
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div style={{
            background: "#fef2f2",
            color: "#dc2626",
            border: "1.5px solid #fecaca",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* EMAIL */}
        <div style={{ marginBottom: 14 }}>
          <label style={{
            display: "block",
            fontSize: 11,
            fontWeight: 800,
            color: "#4c1d95",
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: 6,
          }}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKey}
            style={{
              width: "100%",
              padding: "13px 15px",
              borderRadius: 12,
              border: "1.5px solid #c4b5fd",
              background: "#faf8ff",
              color: "#1e1b4b",
              fontSize: 15,
              fontWeight: 500,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* PASSWORD */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: "block",
            fontSize: 11,
            fontWeight: 800,
            color: "#4c1d95",
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: 6,
          }}>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKey}
            style={{
              width: "100%",
              padding: "13px 15px",
              borderRadius: 12,
              border: "1.5px solid #c4b5fd",
              background: "#faf8ff",
              color: "#1e1b4b",
              fontSize: 15,
              fontWeight: 500,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 18px",
            background: loading
              ? "#a78bfa"
              : "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 24px rgba(124,58,237,0.28)",
            letterSpacing: 0.3,
            fontFamily: "inherit",
            transition: "all 0.15s",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

      </div>

      {/* FOOTER */}
      <div style={{
        marginTop: 24,
        fontSize: 12,
        color: "#a78bfa",
        fontWeight: 500,
        letterSpacing: 0.3,
      }}>
        DriveKhata © {new Date().getFullYear()}
      </div>

    </div>
  );
}