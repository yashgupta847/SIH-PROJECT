import { useEffect, useState } from "react";
import axios from "axios";
import SOSButton from "./SOSButton";
import { io } from "socket.io-client";

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/incidents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIncidents(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchIncidents();

    // Real-time alerts
    const socket = io("http://localhost:5000");
    socket.on("alert", (data) => {
      alert(`🚨 SOS Alert: ${data.message}`);
      console.log(data.incident);
    });

    return () => socket.disconnect();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // Inline CSS style object
  const styles = {
    container: {
      minHeight: "100vh",
      padding: "20px",
      background: "linear-gradient(135deg, #6a0dad, #000000, #333333)",
      color: "white",
      fontFamily: "Arial, sans-serif"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px"
    },
    button: {
      backgroundColor: "#ff3b3b",
      border: "none",
      padding: "10px 20px",
      borderRadius: "8px",
      color: "white",
      fontWeight: "bold",
      cursor: "pointer"
    },
    section: { marginBottom: "30px" },
    card: {
      backgroundColor: "#222222",
      padding: "15px",
      borderRadius: "10px",
      marginBottom: "10px"
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={{ fontSize: "28px" }}>Tourist Dashboard</h1>
        <button style={styles.button} onClick={handleLogout}>Logout</button>
      </header>

      <section style={styles.section}>
        <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>Send SOS</h2>
        <SOSButton />
      </section>

      <section>
        <h2 style={{ fontSize: "22px", marginBottom: "10px" }}>Your SOS History</h2>
        <ul>
          {incidents.length === 0 && <li>No incidents reported yet.</li>}
          {incidents.map((inc) => (
            <li key={inc._id} style={styles.card}>
              <p><strong>Description:</strong> {inc.description}</p>
              <p><strong>Status:</strong> {inc.status}</p>
              <p><strong>Time:</strong> {new Date(inc.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
