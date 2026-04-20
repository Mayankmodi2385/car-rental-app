import Login from "./Login";
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function App() {
  const [form, setForm] = useState({
    carName: "",
    startDate: "",
    startTime: "",
    endDate: "",
    pricePerDay: "",
  });

  const [entries, setEntries] = useState([]);
  const [filterCar, setFilterCar] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");

  const API = "https://car-rental-app-sdp6.onrender.com";

  // ✅ FIX 1: Always send "Bearer <token>" — raw token causes 401
  const authHeader = () => ({ Authorization: `Bearer ${token}` });

  const showMessage = (msg, msgType) => {
    setMessage(msg);
    setType(msgType);
    setTimeout(() => setMessage(""), 3000);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${API}/entries`, {
        headers: authHeader(),
      });
      setEntries(res.data);
    } catch {
      showMessage("Failed to load data", "error");
    }
  };

  useEffect(() => {
    if (token) fetchEntries();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.carName || !form.startDate || !form.endDate) {
      showMessage("Please fill all required fields", "error");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API}/entries`, form, {
        headers: authHeader(),
      });
      setForm({ carName: "", startDate: "", startTime: "", endDate: "", pricePerDay: "" });
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
      await axios.put(`${API}/entries/${id}`, {}, {
        headers: authHeader(),
      });
      showMessage("Marked as completed", "success");
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
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
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

  const filteredEntries = filterCar
    ? entries.filter((e) => e.carName === filterCar)
    : entries;

  const totalEarnings = filteredEntries.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  const activeCars = filteredEntries.filter((e) => e.status === "Active").length;
  const completedCars = filteredEntries.filter((e) => e.status !== "Active").length;

  const exportToExcel = () => {
    const data = filteredEntries.map((e) => ({
      Car: e.carName,
      Start: new Date(e.startDate).toLocaleDateString(),
      End: new Date(e.endDate).toLocaleDateString(),
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
      {/* HEADER */}
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
            <span className="logo-sub">Car Rental</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      {/* TOAST */}
      {message && (
        <div style={{
          position: "fixed", top: "calc(72px + 12px)", left: "50%",
          transform: "translateX(-50%)", zIndex: 300,
          background: type === "success" ? "#f0fdf4" : "#fef2f2",
          color: type === "success" ? "#166534" : "#b91c1c",
          border: `1.5px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
          borderRadius: "var(--radius-md)", padding: "12px 24px",
          fontSize: "14px", fontWeight: 700, boxShadow: "var(--shadow-md)", whiteSpace: "nowrap",
        }}>
          {message}
        </div>
      )}

      {/* PAGE BODY */}
      <div className="page-body">
        <div className="container">

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
              <div className="summary-card__value">{completedCars}</div>
              <div className="summary-card__label">Completed</div>
            </div>
            <div className="summary-card">
              <div className="summary-card__value">{filteredEntries.length}</div>
              <div className="summary-card__label">Total Rentals</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <select style={{ flex: 1, marginBottom: 0 }} value={filterCar} onChange={(e) => setFilterCar(e.target.value)}>
                <option value="">All Cars</option>
                <option>Baleno</option><option>Nexon</option><option>Altroz</option>
                <option>Swift Dzire</option><option>Swift Automatic</option><option>Creta</option>
              </select>
              <button className="btn btn-secondary" style={{ width: "auto", whiteSpace: "nowrap", padding: "9px 14px" }} onClick={exportToExcel}>
                Export Excel
              </button>
            </div>
          </div>

          <div className="section-header">
            <span className="section-title">New Rental Entry</span>
          </div>
          <div className="card" style={{ marginBottom: "20px" }}>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label className="form-label">Car</label>
                <select name="carName" value={form.carName} onChange={handleChange}>
                  <option value="">Select Car</option>
                  <option>Baleno</option><option>Nexon</option><option>Altroz</option>
                  <option>Swift Dzire</option><option>Swift Automatic</option><option>Creta</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" name="startTime" value={form.startTime} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Price Per Day (₹)</label>
                <input type="number" name="pricePerDay" placeholder="e.g. 1200" value={form.pricePerDay} onChange={handleChange} />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Entry"}
              </button>
            </form>
          </div>

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
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="car-name">{e.carName}</span>
                      {e.plateNumber && <span className="car-plate">{e.plateNumber}</span>}
                    </div>
                    <span className={getBadgeClass(e.status)}>{e.status}</span>
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
                      <span className="row__val">
                        {new Date(e.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="row">
                      <span className="row__key">Amount</span>
                      <span className="row__val text-bold" style={{ color: "var(--brand-primary)" }}>
                        ₹{(e.totalAmount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="entry-card__footer">
                    <div className="actions" style={{ marginBottom: "10px" }}>
                      {e.status === "Active" && (
                        <button className="btn btn-success btn--sm" onClick={() => markComplete(e._id)}>Mark Complete</button>
                      )}
                      <button className="btn btn-secondary btn--sm" disabled={uploadingId === e._id}
                        onClick={() => document.getElementById(`aadhar-${e._id}`).click()}>
                        {uploadingId === e._id ? "Uploading..." : "Upload Aadhar"}
                      </button>
                      <input type="file" id={`aadhar-${e._id}`} style={{ display: "none" }} accept="image/*,application/pdf" capture="environment" onChange={(ev) => handleUpload(ev, e._id, "aadhar")}/>
                      <button className="btn btn-secondary btn--sm" disabled={uploadingId === e._id}
                        onClick={() => document.getElementById(`license-${e._id}`).click()}>
                        {uploadingId === e._id ? "Uploading..." : "Upload License"}
                      </button>
                      <input type="file" id={`license-${e._id}`} style={{ display: "none" }}accept="image/*,application/pdf" capture="environment"onChange={(ev) => handleUpload(ev, e._id, "license")}/>
                    </div>
                    <div className="docs">
                      {e.aadhar ? (
                        <button className="btn btn--sm" onClick={() => openPreview(e.aadhar)}>
                          <span className="doc-icon">ID</span> View Aadhar
                        </button>
                      ) : (
                        <span className="text-sm text-muted" style={{ padding: "4px 0" }}>No Aadhar uploaded</span>
                      )}
                      {e.license ? (
                        <button className="btn btn--sm" onClick={() => openPreview(e.license)}>
                          <span className="doc-icon">DL</span> View License
                        </button>
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

      {/* MODAL */}
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
