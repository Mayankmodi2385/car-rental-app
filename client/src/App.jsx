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
    endDate: "",
    pricePerDay: "",
  });

  const [entries, setEntries] = useState([]);
  const [filterCar, setFilterCar] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));

  const [previewImage, setPreviewImage] = useState(null);

  // 🔥 NEW STATES
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const API = "https://car-rental-app-sdp6.onrender.com";

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${API}/entries`, {
        headers: { Authorization: token },
      });
      setEntries(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 UPDATED SUBMIT WITH LOADING
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.carName || !form.startDate || !form.endDate) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API}/entries`, form, {
        headers: { Authorization: token },
      });

      setForm({
        carName: "",
        startDate: "",
        endDate: "",
        pricePerDay: "",
      });

      fetchEntries();
    } catch (err) {
      console.error(err);
      alert("Error adding entry ❌");
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (id) => {
    try {
      await axios.put(`${API}/entries/${id}`, {}, {
        headers: { Authorization: token },
      });
      fetchEntries();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 UPDATED UPLOAD WITH STATE
  const handleUpload = async (event, id, type) => {
    const file = event.target.files[0];
    const formData = new FormData();

    if (file) {
      formData.append(type, file);
    }

    try {
      setUploadingId(id);

      await axios.put(`${API}/entries/upload/${id}`, formData, {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      });

      fetchEntries();
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    } finally {
      setUploadingId(null);
    }
  };

  const openPreview = (url) => setPreviewImage(url);
  const closePreview = () => setPreviewImage(null);

  const filteredEntries = filterCar
    ? entries.filter((e) => e.carName === filterCar)
    : entries;

  const totalEarnings = filteredEntries.reduce(
    (sum, e) => sum + (e.totalAmount || 0),
    0
  );

  const activeCars = filteredEntries.filter(
    (e) => e.status === "Active"
  ).length;

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

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <div className="container">

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="title">🚗 DriveKhata</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </div>

      {/* FILTER */}
      <div className="card">
        <select value={filterCar} onChange={(e) => setFilterCar(e.target.value)}>
          <option value="">All Cars</option>
          <option>Baleno</option>
          <option>Nexon</option>
          <option>Altroz</option>
          <option>Swift Dzire</option>
          <option>Swift Automatic</option>
          <option>Creta</option>
        </select>
      </div>

      <button onClick={exportToExcel}>📥 Export Excel</button>

      {/* SUMMARY */}
      <div className="summary">
        <div className="card">💰 ₹{totalEarnings}</div>
        <div className="card">🚗 {activeCars} Active</div>
      </div>

      {/* FORM */}
      <div className="card">
        <form onSubmit={handleSubmit} className="form">

          <select name="carName" value={form.carName} onChange={handleChange}>
            <option value="">Select Car</option>
            <option>Baleno</option>
            <option>Nexon</option>
            <option>Altroz</option>
            <option>Swift Dzire</option>
            <option>Swift Automatic</option>
            <option>Creta</option>
          </select>

          <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
          <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />

          <input
            type="number"
            name="pricePerDay"
            placeholder="Price"
            value={form.pricePerDay}
            onChange={handleChange}
          />

          {/* 🔥 LOADING BUTTON */}
          <button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Entry"}
          </button>

        </form>
      </div>

      {/* LIST */}
      <div className="list">
        {filteredEntries.map((e) => (
          <div className="entry-card" key={e._id}>

            <div className="row">
              <span className="car">{e.carName}</span>
              <span className="status">{e.status}</span>
            </div>

            <div className="row">
              <span>📅 {new Date(e.startDate).toLocaleDateString()}</span>
              <span>➡️ {new Date(e.endDate).toLocaleDateString()}</span>
            </div>

            <div className="row">
              <span>💰 ₹{e.totalAmount}</span>
            </div>

            <div className="actions">

              {e.status === "Active" && (
                <button onClick={() => markComplete(e._id)}>
                  Complete
                </button>
              )}

              {/* 🔥 AADHAR BUTTON */}
              <button
                disabled={uploadingId === e._id}
                onClick={() =>
                  document.getElementById(`aadhar-${e._id}`).click()
                }
              >
                {uploadingId === e._id ? "Uploading..." : "📄 Upload Aadhar"}
              </button>

              <input
                type="file"
                id={`aadhar-${e._id}`}
                style={{ display: "none" }}
                onChange={(event) => handleUpload(event, e._id, "aadhar")}
              />

              {/* 🔥 LICENSE BUTTON */}
              <button
                disabled={uploadingId === e._id}
                onClick={() =>
                  document.getElementById(`license-${e._id}`).click()
                }
              >
                {uploadingId === e._id ? "Uploading..." : "🚗 Upload License"}
              </button>

              <input
                type="file"
                id={`license-${e._id}`}
                style={{ display: "none" }}
                onChange={(event) => handleUpload(event, e._id, "license")}
              />

            </div>

            <div className="docs">
              {e.aadhar ? (
                <button onClick={() => openPreview(e.aadhar)}>
                  📄 View Aadhar
                </button>
              ) : <span>📄 No Aadhar</span>}

              <br />

              {e.license ? (
                <button onClick={() => openPreview(e.license)}>
                  🚗 View License
                </button>
              ) : <span>🚗 No License</span>}
            </div>

          </div>
        ))}
      </div>

      {/* MODAL */}
      {previewImage && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={closePreview}>✖</span>
            <a href={previewImage} download className="download-btn">
              ⬇ Download
            </a>
            <div className="image-container">
              <img src={previewImage} alt="Preview" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;