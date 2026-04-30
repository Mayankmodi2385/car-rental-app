import Login from "./Login";
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const API = import.meta.env.VITE_API_URL || "https://car-rental-app-sdp6.onrender.com";
const CACHE_KEY = "drivekhata_entries_cache";

// ── Keep Render server warm — ping every 14 min to prevent cold start ──
function keepServerWarm() {
  const ping = () => fetch(`${API}/`).catch(() => {});
  ping(); // ping immediately on app open
  setInterval(ping, 14 * 60 * 1000);
}

function App() {
  const [form, setForm] = useState({
    customerName: "",
    carName: "",
    startDate: "",
    startTime: "",
    endDate: "",
    pricePerDay: "",
    remark: "",
  });

  // ── Load cached entries immediately from localStorage (zero wait) ──
  const [entries, setEntries] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [filterCar, setFilterCar] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");
  const [showIosHint, setShowIosHint] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showCarManager, setShowCarManager] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editEntry, setEditEntry] = useState(null); // holds entry being edited
  const [editForm, setEditForm] = useState({});
  const [cars, setCars] = useState(() => {
    const saved = localStorage.getItem("drivekhata_cars");
    return saved
      ? JSON.parse(saved)
      : ["Baleno", "Nexon", "Altroz", "Swift Dzire", "Swift Automatic", "Creta"];
  });
  const [newCarName, setNewCarName] = useState("");

  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  const showMessage = (msg, msgType) => {
    setMessage(msg);
    setType(msgType);
    setTimeout(() => setMessage(""), 3000);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem(CACHE_KEY);
    setToken(null);
  };

  // silent=true → no loading spinner, used for background refresh
  const fetchEntries = async (silent = false) => {
    try {
      if (!silent) setIsSyncing(true);
      const res = await axios.get(`${API}/entries`, { headers: authHeader() });
      setEntries(res.data);
      localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
    } catch {
      if (!silent) showMessage("Failed to load data", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-detect overdue on the fly (no backend call needed)
  const computedEntries = entries.map((e) => {
    if (e.status === "Active" && new Date(e.endDate) < new Date()) {
      return { ...e, status: "Overdue" };
    }
    return e;
  });

 useEffect(() => {
  if (token) {
    keepServerWarm();
    fetchEntries(true);
  }

  // 🔥 AUTO UPDATE SERVICE WORKER
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").then((reg) => {

      // check for updates on load
      reg.update();

      reg.onupdatefound = () => {
        const newWorker = reg.installing;

        if (newWorker) {
          newWorker.onstatechange = () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                console.log("🔥 New version available");

                // 💥 force reload so user gets latest UI
                window.location.reload();
              }
            }
          };
        }
      };
    });
  }
}, []);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    const hintDismissed = localStorage.getItem("iosHintDismissed");
    if (isIos && !isInStandaloneMode && !hintDismissed) {
      setTimeout(() => setShowIosHint(true), 1500);
    }
  }, []);

  const saveCars = (updatedCars) => {
    setCars(updatedCars);
    localStorage.setItem("drivekhata_cars", JSON.stringify(updatedCars));
  };

  const addCar = () => {
    const name = newCarName.trim();
    if (!name) return;
    if (cars.includes(name)) { showMessage("Car already exists", "error"); return; }
    saveCars([...cars, name]);
    setNewCarName("");
    showMessage(`${name} added`, "success");
  };

  const removeCar = (name) => {
    saveCars(cars.filter((c) => c !== name));
    showMessage(`${name} removed`, "success");
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.carName || !form.startDate || !form.endDate) {
      showMessage("Please fill all required fields", "error");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API}/entries`, form, { headers: authHeader() });
      setForm({ customerName: "", carName: "", startDate: "", startTime: "", endDate: "", pricePerDay: "", remark: "" });
      showMessage("Entry added successfully", "success");
      fetchEntries();
    } catch {
      showMessage("Error adding entry", "error");
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (id) => {
    try {
      await axios.put(`${API}/entries/${id}`, {}, { headers: authHeader() });
      showMessage("Marked as completed", "success");
      fetchEntries();
    } catch {
      showMessage("Error updating entry", "error");
    }
  };

  const deleteEntry = async (id) => {
    try {
      await axios.delete(`${API}/entries/${id}`, { headers: authHeader() });
      setDeleteConfirmId(null);
      showMessage("Entry deleted", "success");
      fetchEntries();
    } catch {
      showMessage("Error deleting entry", "error");
    }
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setEditForm({
      customerName: entry.customerName || "",
      carName: entry.carName || "",
      startDate: entry.startDate ? entry.startDate.slice(0, 10) : "",
      startTime: entry.startTime || "",
      endDate: entry.endDate ? entry.endDate.slice(0, 10) : "",
      pricePerDay: entry.pricePerDay || "",
      remark: entry.remark || "",
    });
  };

  const saveEdit = async () => {
    try {
      await axios.patch(`${API}/entries/${editEntry._id}`, editForm, { headers: authHeader() });
      setEditEntry(null);
      showMessage("Entry updated", "success");
      fetchEntries();
    } catch {
      showMessage("Error updating entry", "error");
    }
  };

  const handleUpload = async (event, id, typeFile) => {
    const file = event.target.files[0];
    const formData = new FormData();
    if (file) formData.append(typeFile, file);
    try {
      setUploadingId(id);
      await axios.put(`${API}/entries/upload/${id}`, formData, {
        headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
      });
      showMessage(`${typeFile} uploaded successfully`, "success");
      fetchEntries();
    } catch {
      showMessage("Upload failed", "error");
    } finally {
      setUploadingId(null);
    }
  };

  const openPreview = (url) => setPreviewImage(url);
  const closePreview = () => setPreviewImage(null);

  // Filter + Search + Sort
  let filteredEntries = filterCar
    ? computedEntries.filter((e) => e.carName === filterCar)
    : computedEntries;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredEntries = filteredEntries.filter(
      (e) =>
        (e.customerName || "").toLowerCase().includes(q) ||
        (e.carName || "").toLowerCase().includes(q)
    );
  }

  filteredEntries = [...filteredEntries].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.startDate) - new Date(a.startDate);
    if (sortBy === "oldest") return new Date(a.startDate) - new Date(b.startDate);
    if (sortBy === "amount_high") return (b.totalAmount || 0) - (a.totalAmount || 0);
    if (sortBy === "amount_low") return (a.totalAmount || 0) - (b.totalAmount || 0);
    return 0;
  });

  const totalEarnings = filteredEntries.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  const activeCars = filteredEntries.filter((e) => e.status === "Active").length;
  const overdueCars = filteredEntries.filter((e) => e.status === "Overdue").length;
  const completedCars = filteredEntries.filter((e) => e.status === "Completed").length;

  const exportToExcel = () => {
    const data = filteredEntries.map((e) => ({
      Customer: e.customerName || "-",
      Car: e.carName,
      Start: new Date(e.startDate).toLocaleDateString(),
      End: new Date(e.endDate).toLocaleDateString(),
      "Price/Day": e.pricePerDay,
      Total: e.totalAmount,
      Status: e.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(file, "Car_Report.xlsx");
  };

  const getBadgeClass = (status) => {
    if (status === "Active") return "badge badge--active";
    if (status === "Completed") return "badge badge--returned";
    if (status === "Overdue") return "badge badge--overdue";
    return "badge badge--pending";
  };

  if (!token) return <Login setToken={setToken} />;

  return (
    <>
      {/* STICKY HEADER */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">D</div>
          <div className="logo-text">
            <div className="logo-brand">
              <span className="l1">D</span><span className="l2">r</span>
              <span className="l3">i</span><span className="l4">v</span>
              <span className="l5">e</span><span className="l6">K</span>
              <span className="l7">h</span><span className="l8">a</span>
              <span className="l9">t</span><span className="l10">a</span>
            </div>
            <span className="logo-sub">
              Car Rental
              {isSyncing && (
                <span style={{ marginLeft: 6, fontSize: 10, color: "#a78bfa", fontWeight: 600 }}>
                  ↻
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary btn--sm"
            style={{ padding: "8px 14px", fontWeight: 800, fontSize: 13 }}
            onClick={() => setShowCarManager(true)}
          >
            🚗 Cars
          </button>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      {/* iOS INSTALL HINT */}
      {showIosHint && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500,
          background: "#ffffff", borderTop: "2px solid #ddd6fe",
          borderRadius: "16px 16px 0 0", padding: "16px 20px 36px",
          boxShadow: "0 -4px 32px rgba(124,58,237,0.18)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 46, height: 46, background: "linear-gradient(135deg, #7c3aed, #4f46e5)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 22, flexShrink: 0 }}>D</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1e1b4b" }}>Install DriveKhata</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, fontWeight: 500 }}>Add to your iPhone home screen</div>
              </div>
            </div>
            <button onClick={() => { localStorage.setItem("iosHintDismissed", "true"); setShowIosHint(false); }}
              style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "50%", width: 32, height: 32, fontSize: 16, color: "#7c3aed", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✕</button>
          </div>
          <div style={{ background: "#f5f3ff", borderRadius: 12, padding: "14px 16px", border: "1.5px solid #ddd6fe" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 24, height: 24, background: "#7c3aed", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>1</div>
              <div style={{ fontSize: 13, color: "#4c1d95", fontWeight: 500, lineHeight: 1.5 }}>Tap the <strong style={{ color: "#7c3aed" }}>Share button</strong> <span style={{ display: "inline-block", background: "#7c3aed", color: "#fff", borderRadius: 6, padding: "1px 7px", fontSize: 13, fontWeight: 700 }}>⬆</span> at the bottom of Safari</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 24, height: 24, background: "#d97706", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>2</div>
              <div style={{ fontSize: 13, color: "#4c1d95", fontWeight: 500, lineHeight: 1.5 }}>Scroll down and tap <strong style={{ color: "#d97706" }}>"Add to Home Screen"</strong> then tap <strong style={{ color: "#7c3aed" }}>Add</strong></div>
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 10, fontWeight: 500 }}>⚠️ Only works in Safari — not Chrome or Firefox</div>
        </div>
      )}

      {/* TOAST */}
      {message && (
        <div style={{
          position: "fixed", top: "calc(72px + 12px)", left: "50%", transform: "translateX(-50%)",
          zIndex: 300, background: type === "success" ? "#f0fdf4" : "#fef2f2",
          color: type === "success" ? "#166534" : "#b91c1c",
          border: `1.5px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
          borderRadius: "var(--radius-md)", padding: "12px 24px", fontSize: "14px",
          fontWeight: 700, boxShadow: "var(--shadow-md)", whiteSpace: "nowrap",
        }}>
          {message}
        </div>
      )}

      {/* CAR MANAGER MODAL */}
      {showCarManager && (
        <div className="modal-overlay" onClick={() => setShowCarManager(false)}>
          <div className="modal-content" onClick={(ev) => ev.stopPropagation()}>
            <span className="modal-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span className="modal-title">🚗 Manage Cars</span>
              <button className="modal-close" onClick={() => setShowCarManager(false)}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input type="text" placeholder="New car name (e.g. Ertiga)" value={newCarName}
                onChange={(e) => setNewCarName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCar()}
                style={{ flex: 1, marginBottom: 0 }} />
              <button className="btn btn-success btn--sm" style={{ whiteSpace: "nowrap", padding: "10px 16px", fontWeight: 800 }} onClick={addCar}>+ Add</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cars.map((car) => (
                <div key={car} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f5f3ff", border: "1.5px solid #ddd6fe", borderRadius: 10, padding: "10px 14px" }}>
                  <span style={{ fontWeight: 700, color: "#1e1b4b", fontSize: 15 }}>🚙 {car}</span>
                  <button onClick={() => removeCar(car)} style={{ background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fecaca", borderRadius: 8, padding: "5px 12px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" style={{ maxWidth: 360 }} onClick={(ev) => ev.stopPropagation()}>
            <span className="modal-handle" />
            <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#1e1b4b", marginBottom: 8 }}>Delete Entry?</div>
              <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24 }}>This action cannot be undone.</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                <button className="btn" style={{ flex: 1, background: "#dc2626", color: "#fff", border: "none", fontWeight: 800 }} onClick={() => deleteEntry(deleteConfirmId)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE BODY */}
      <div className="page-body">
        <div className="container">

          {/* SUMMARY STATS */}
          <div className="summary">
            <div className="summary-card summary-card--active">
              <div className="summary-card__value">₹{totalEarnings.toLocaleString()}</div>
              <div className="summary-card__label">Total Earnings</div>
            </div>
            <div className="summary-card summary-card--success">
              <div className="summary-card__value">{activeCars}</div>
              <div className="summary-card__label">Active</div>
            </div>
            <div className="summary-card">
              <div className="summary-card__value" style={{ color: "#dc2626" }}>{overdueCars}</div>
              <div className="summary-card__label">Overdue</div>
            </div>
            <div className="summary-card">
              <div className="summary-card__value">{completedCars}</div>
              <div className="summary-card__label">Completed</div>
            </div>
          </div>

          {/* FILTER + SEARCH + SORT + EXPORT */}
          <div className="card" style={{ marginBottom: "16px" }}>
            <div style={{ marginBottom: 10 }}>
              <input type="search" placeholder="🔍  Search by customer name or car..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: 0 }} />
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <select style={{ flex: 1, marginBottom: 0, minWidth: 120 }} value={filterCar} onChange={(e) => setFilterCar(e.target.value)}>
                <option value="">All Cars</option>
                {cars.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select style={{ flex: 1, marginBottom: 0, minWidth: 120 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_high">Amount: High → Low</option>
                <option value="amount_low">Amount: Low → High</option>
              </select>
              <button className="btn btn-secondary" style={{ width: "auto", whiteSpace: "nowrap", padding: "9px 14px" }} onClick={exportToExcel}>
                Export Excel
              </button>
            </div>
          </div>

          {/* NEW RENTAL FORM */}
          <div className="section-header">
            <span className="section-title">New Rental Entry</span>
          </div>
          <div className="card" style={{ marginBottom: "20px" }}>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input type="text" name="customerName" placeholder="e.g. Rahul Sharma" value={form.customerName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Car *</label>
                <select name="carName" value={form.carName} onChange={handleChange}>
                  <option value="">Select Car</option>
                  {cars.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" name="startDate" value={form.startDate} onChange={handleChange} style={{ colorScheme: "light" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" name="startTime" value={form.startTime} onChange={handleChange} style={{ colorScheme: "light" }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} style={{ colorScheme: "light" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Price Per Day (₹)</label>
                <input type="number" name="pricePerDay" placeholder="e.g. 1200" value={form.pricePerDay} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Remark</label>
                <textarea
                  name="remark"
                  placeholder="e.g. Advance paid ₹500, petrol full, minor scratch on door..."
                  value={form.remark}
                  onChange={handleChange}
                  rows={2}
                  style={{ resize: "vertical", minHeight: 60 }}
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Entry"}
              </button>
            </form>
          </div>

          {/* RENTAL RECORDS */}
          <div className="section-header">
            <span className="section-title">Rental Records</span>
            <span className="text-sm text-muted">{filteredEntries.length} records</span>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">🚗</span>
              <div className="empty-state__title">No rentals found</div>
              <div className="empty-state__desc">Add your first rental entry above</div>
            </div>
          ) : (
            <div className="list">
              {filteredEntries.map((e, index) => (
                <div className="entry-card" key={e._id} style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="entry-card__header">
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {e.customerName && (
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.4 }}>
                          👤 {e.customerName}
                        </span>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className="car-name">{e.carName}</span>
                        {e.plateNumber && <span className="car-plate">{e.plateNumber}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span className={getBadgeClass(e.status)}>{e.status}</span>
                      <button onClick={() => setDeleteConfirmId(e._id)}
                        style={{
                          background: "#fff", border: "1.5px solid #fecaca", borderRadius: 8,
                          color: "#dc2626", fontSize: 12, fontWeight: 800, padding: "4px 10px",
                          cursor: "pointer", letterSpacing: 0.2
                        }}>
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="entry-card__body">
                    <div className="row">
                      <span className="row__key">Start</span>
                      <span className="row__val">
                        {new Date(e.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {e.startTime && (
                          <span style={{ marginLeft: 6, color: "var(--text-muted)", fontSize: 12 }}>
                            {new Date(`1970-01-01T${e.startTime}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="row">
                      <span className="row__key">End</span>
                      <span className="row__val">{new Date(e.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <div className="row">
                      <span className="row__key">Amount</span>
                      <span className="row__val text-bold" style={{ color: "var(--brand-primary)" }}>₹{(e.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    {e.remark && (
                      <div className="row" style={{ alignItems: "flex-start" }}>
                        <span className="row__key">Remark</span>
                        <span className="row__val" style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.5 }}>{e.remark}</span>
                      </div>
                    )}
                  </div>

                  <div className="entry-card__footer">
                    <div className="actions" style={{ marginBottom: "10px" }}>
                      {(e.status === "Active" || e.status === "Overdue") && (
                        <button className="btn btn-success btn--sm" onClick={() => markComplete(e._id)}>Mark Complete</button>
                      )}
                      <button
                        className="btn btn--sm"
                        style={{ background: "#ede9fe", color: "#7c3aed", border: "1.5px solid #ddd6fe", fontWeight: 800 }}
                        onClick={() => openEdit(e)}
                      >
                        ✏️ Edit
                      </button>
                      <button className="btn btn-secondary btn--sm" disabled={uploadingId === e._id}
                        onClick={() => document.getElementById(`aadhar-${e._id}`).click()}>
                        {uploadingId === e._id ? "Uploading..." : "Upload Aadhar"}
                      </button>
                      <input type="file" id={`aadhar-${e._id}`} style={{ display: "none" }} accept="image/*,application/pdf" onChange={(ev) => handleUpload(ev, e._id, "aadhar")} />
                      <button className="btn btn-secondary btn--sm" disabled={uploadingId === e._id}
                        onClick={() => document.getElementById(`license-${e._id}`).click()}>
                        {uploadingId === e._id ? "Uploading..." : "Upload License"}
                      </button>
                      <input type="file" id={`license-${e._id}`} style={{ display: "none" }} accept="image/*,application/pdf" onChange={(ev) => handleUpload(ev, e._id, "license")} />
                    </div>
                    <div className="docs">
                      {e.aadhar ? (
                        <button className="btn btn--sm" onClick={() => openPreview(e.aadhar)}><span className="doc-icon">ID</span> View Aadhar</button>
                      ) : (
                        <span className="text-sm text-muted" style={{ padding: "4px 0" }}>No Aadhar uploaded</span>
                      )}
                      {e.license ? (
                        <button className="btn btn--sm" onClick={() => openPreview(e.license)}><span className="doc-icon">DL</span> View License</button>
                      ) : (
                        <span className="text-sm text-muted" style={{ padding: "4px 0" }}>No License uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EDIT ENTRY MODAL */}
      {editEntry && (
        <div className="modal-overlay" onClick={() => setEditEntry(null)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={(ev) => ev.stopPropagation()}>
            <span className="modal-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span className="modal-title">✏️ Edit Entry</span>
              <button className="modal-close" onClick={() => setEditEntry(null)}>✕</button>
            </div>

            <div className="form">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input type="text" value={editForm.customerName}
                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Car</label>
                <select value={editForm.carName} onChange={(e) => setEditForm({ ...editForm, carName: e.target.value })}>
                  <option value="">Select Car</option>
                  {cars.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    style={{ colorScheme: "light" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" value={editForm.startTime}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                    style={{ colorScheme: "light" }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input type="date" value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  style={{ colorScheme: "light" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Price Per Day (₹)</label>
                <input type="number" value={editForm.pricePerDay}
                  onChange={(e) => setEditForm({ ...editForm, pricePerDay: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Remark</label>
                <textarea
                  value={editForm.remark}
                  onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
                  rows={2}
                  placeholder="e.g. Advance paid ₹500, petrol full..."
                  style={{ resize: "vertical", minHeight: 60 }}
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditEntry(null)}>Cancel</button>
                <button className="btn" style={{ flex: 1, fontWeight: 800 }} onClick={saveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content" onClick={(ev) => ev.stopPropagation()}>
            <span className="modal-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span className="modal-title">Document Preview</span>
              <button className="modal-close" onClick={closePreview}>✕</button>
            </div>
            <div className="image-container">
              <img src={previewImage} alt="Document Preview" />
            </div>
            <a href={previewImage} download className="btn btn-primary"
              style={{ marginTop: "14px", display: "flex", justifyContent: "center", textDecoration: "none" }}>
              Download
            </a>
          </div>
        </div>
      )}
    </>
  );
}

export default App;