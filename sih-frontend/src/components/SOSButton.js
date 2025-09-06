import { useState } from "react";
import axios from "axios";

export default function SOSButton() {
  const [loading, setLoading] = useState(false);

  const handleSOS = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/incidents/report",
        { location: { lat: 26.8467, lng: 80.9462 }, description: "Tourist in danger" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("🚨 SOS Reported!");
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("Error sending SOS");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleSOS}
      disabled={loading}
      style={{
        backgroundColor: "#ff3b3b",
        color: "white",
        padding: "12px 25px",
        border: "none",
        borderRadius: "10px",
        fontWeight: "bold",
        cursor: "pointer"
      }}
    >
      {loading ? "Sending..." : "Send SOS"}
    </button>
  );
}
