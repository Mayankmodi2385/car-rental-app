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

  const API = "https://car-rental-app-sdp6.onrender.com";

  // FETCH
  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${API}/entries`);
      setEntries(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // FORM
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/entries`, form);
      alert("Entry Added ✅");

      setForm({
        carName: "",
        startDate: "",
        endDate: "",
        pricePerDay: "",
      });

      fetchEntries();
    } catch {
      alert("Error adding entry ❌");
    }
  };

  // COMPLETE
  const markComplete = async (id) => {
    try {
      await axios.put(`${API}/entries/${id}`);
      fetchEntries();
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 UPDATED UPLOAD FUNCTION
  const handleUpload = async (event, id, type) => {
    const file = event.target.files[0];
    const formData = new FormData();

    if (file) {
      formData.append(type, file);
    }

    try {
      await axios.put(`${API}/entries/upload/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(`${type} uploaded ✅`);
      fetchEntries();
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    }
  };

  // FILTER
  const filteredEntries = filterCar
    ? entries.filter((e) => e.carName === filterCar)
    : entries;

  // SUMMARY
  const totalEarnings = filteredEntries.reduce(
    (sum, e) => sum + (e.totalAmount || 0),
    0
  );

  const activeCars = filteredEntries.filter(
    (e) => e.status === "Active"
  ).length;

  // EXPORT
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

  return (
    <div className="container">
      <h1 className="title">🚗 DriveKhata</h1>

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

          <button type="submit">Add Entry</button>
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

              {/* AADHAR */}
              <button onClick={() =>
                document.getElementById(`aadhar-${e._id}`).click()
              }>
                📄 Upload Aadhar
              </button>

              <input
                type="file"
                id={`aadhar-${e._id}`}
                style={{ display: "none" }}
                onChange={(event) => handleUpload(event, e._id, "aadhar")}
              />

              {/* LICENSE */}
              <button onClick={() =>
                document.getElementById(`license-${e._id}`).click()
              }>
                🚗 Upload License
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
                <a href={`${API}/uploads/${e.aadhar}`} target="_blank" rel="noreferrer">
                  📄 View Aadhar
                </a>
              ) : <span>📄 No Aadhar</span>}

              <br />

              {e.license ? (
                <a href={`${API}/uploads/${e.license}`} target="_blank" rel="noreferrer">
                  🚗 View License
                </a>
              ) : <span>🚗 No License</span>}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default App;