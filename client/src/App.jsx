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

  const fetchEntries = async () => {
    try {
      const res = await axios.get("https://car-rental-app-sdp6.onrender.com/entries");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://car-rental-app-sdp6.onrender.com/entries", form);
      alert("Entry Added ✅");

      setForm({
        carName: "",
        startDate: "",
        endDate: "",
        pricePerDay: "",
      });

      fetchEntries();
    } catch (err) {
      alert("Error adding entry ❌");
    }
  };

  const markComplete = async (id) => {
    try {
      await axios.put(`https://car-rental-app-sdp6.onrender.com/entries/${id}`);
      fetchEntries();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (event, id) => {
    const files = event.target.files;
    const formData = new FormData();

    if (files[0]) formData.append("aadhar", files[0]);
    if (files[1]) formData.append("license", files[1]);

    try {
      await axios.put(
        `https://car-rental-app-sdp6.onrender.com/entries/upload/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert("Documents Uploaded ✅");
      fetchEntries();
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    }
  };

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

  return (
    <div className="container">
      <h1 className="title">
  🚗 Car Rental Dashboard
</h1>

      {/* FILTER */}
      <div className="card">
        <select
          value={filterCar}
          onChange={(e) => setFilterCar(e.target.value)}
        >
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
        <div className="card">💰 Total: ₹{totalEarnings}</div>
        <div className="card">🚗 Active: {activeCars}</div>
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

      {/* TABLE */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Car</th>
              <th>Start</th>
              <th>End</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
              <th>Docs</th>
            </tr>
          </thead>

          <tbody>
            {filteredEntries.map((e) => (
              <tr key={e._id}>
                <td>{e.carName}</td>
                <td>{new Date(e.startDate).toLocaleDateString()}</td>
                <td>{new Date(e.endDate).toLocaleDateString()}</td>
                <td>₹{e.totalAmount}</td>

                <td>{e.status}</td>

                {/* 🔥 MOBILE FRIENDLY ACTION */}
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {e.status === "Active" && (
                      <button
                        type="button"
                        style={{ width: "100%" }}
                        onClick={() => markComplete(e._id)}
                      >
                        Complete
                      </button>
                    )}

                    <input
                      type="file"
                      style={{ display: "none" }}
                      id={`file-${e._id}`}
                      onChange={(event) => handleUpload(event, e._id)}
                      multiple
                    />

                    <button
                      type="button"
                      style={{ width: "100%" }}
                      onClick={() =>
                        document.getElementById(`file-${e._id}`).click()
                      }
                    >
                      Upload Docs
                    </button>
                  </div>
                </td>

                {/* DOCS */}
                <td>
                  {e.aadhar ? (
                    <a href={`https://car-rental-app-sdp6.onrender.com/uploads/${e.aadhar}`} target="_blank">
                      📄 Aadhar
                    </a>
                  ) : (
                    "No Aadhar"
                  )}

                  <br />

                  {e.license ? (
                    <a href={`https://car-rental-app-sdp6.onrender.com/uploads/${e.license}`} target="_blank">
                      🚗 License
                    </a>
                  ) : (
                    "No License"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;